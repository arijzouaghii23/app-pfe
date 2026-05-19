const Report = require('../models/Report');
const Sector = require('../models/Sector');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const { analyzeImageWithGemini, analyzeImageWithYolo } = require('../services/aiService');
const { generateReportPDF } = require('../services/pdfService');
const { sendMissionEmail } = require('../services/mailer');
const axios = require('axios'); // For Nominatim requests if fetch is not available

async function fetchAddressFromCoords(lat, lon) {
    try {
        // We use axios but fallback to internal fetch if preferred. Axios is standard.
        const response = await axios.get(`https://nominatim.openstreetmap.org/reverse`, {
            params: { lat, lon, format: 'json', addressdetails: 1 },
            headers: { 'User-Agent': 'SIGRoutier/1.0' }
        });
        const data = response.data;
        if (data && data.address) {
            const addr = data.address;
            const street = addr.road || addr.pedestrian || addr.footway || addr.residential || '';
            const city = addr.city || addr.town || addr.village || addr.county || '';
            return [street, city, addr.country].filter(Boolean).join(', ');
        }
        return 'Adresse non disponible';
    } catch (err) {
        console.error('[Nominatim] Erreur géocodage inverse:', err.message);
        return 'Adresse non disponible';
    }
}

console.log(" [SYSTEM] Contrôleur des signalements chargé.");

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuration de Multer pour le stockage local
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
}).array('images', 3); // max 3 images

exports.createReport = (req, res) => {
    console.log(" [REQUEST] Requête reçue sur POST /api/reports");

    upload(req, res, async (err) => {
        if (err) {
            console.error(" [UPLOAD ERROR]", err.message);
            return res.status(400).json({ message: "Erreur upload", error: err.message });
        }

        try {
            // ── Étape 1 : Extraire les données de la requête ──
            const { longitude, latitude, description, address } = req.body;

            if (!req.files || req.files.length === 0) {
                return res.status(400).json({ message: "Au moins une image est requise." });
            }
            if (!longitude || !latitude) {
                // Nettoyage en cas d'erreur de validation
                req.files.forEach(f => { try { fs.unlinkSync(f.path); } catch (e) { console.error("Erreur nettoyage fichier: ", e.message); } });
                return res.status(400).json({ message: "Les coordonnées GPS (longitude, latitude) sont requises." });
            }

            const lon = parseFloat(longitude);
            const lat = parseFloat(latitude);

            if (isNaN(lon) || isNaN(lat)) {
                req.files.forEach(f => { try { fs.unlinkSync(f.path); } catch (e) { console.error("Erreur nettoyage fichier: ", e.message); } });
                return res.status(400).json({ message: "Format de coordonnées GPS invalide." });
            }

            // ── Étape 2 : Détecter la source (anonyme, citizen, ou agent) ──
            const source = req.user?.role === 'agent' ? 'agent' : 'citizen';
            const ownerId = req.user?._id || req.user?.id || null;
            console.log(`[SOURCE] Rôle détecté : "${source}" | owner : ${ownerId || 'anonyme'}`);

            // ── Étape 3 : CALCUL SPATIAL — Trouver le secteur GeoJSON ──
            console.log(`[GEO] Recherche du secteur pour [${lon}, ${lat}]...`);
            const sector = await Sector.findOne({
                geometry: {
                    $geoIntersects: {
                        $geometry: {
                            type: 'Point',
                            coordinates: [lon, lat]  // MongoDB : [longitude, latitude]
                        }
                    }
                }
            });

            if (!sector) {
                console.warn(`[GEO] Aucun secteur trouvé pour [${lon}, ${lat}]. Zone non couverte.`);
                // Nettoyer les fichiers uploadés
                req.files.forEach(f => { try { fs.unlinkSync(f.path); } catch (_) { } });
                return res.status(400).json({
                    message: "Zone non couverte : les coordonnées ne correspondent à aucun secteur surveillé."
                });
            }

            console.log(`[GEO] Secteur trouvé : "${sector.name}" (${sector._id})`);

            // ── Étape 4 : VALIDATION IA (STP) pour les citoyens ──
            let status = 'PENDING_EXPERT';
            let aiResult = null;

            if (source === 'citizen') {
                console.log("[AI] Analyse Gemini en cours...");
                try {
                    const absolutePath = path.resolve(req.files[0].path);
                    aiResult = await analyzeImageWithGemini(absolutePath);
                    console.log("[AI RESULT]", aiResult);

                    const valid = aiResult?.estUneRoute && aiResult?.estDegradee && (aiResult?.scoreConfiance ?? 0) >= 60;
                    if (valid) {
                        status = 'PENDING_EXPERT';
                        console.log(`[STP] Validé par Gemini (score: ${aiResult.scoreConfiance}). Route directe → Expert.`);
                    } else {
                        status = 'REJECTED';
                        console.log(`[STP] Refusé par Gemini (score: ${aiResult?.scoreConfiance ?? 'N/A'}). Signalement écarté.`);
                    }
                } catch (aiError) {
                    // Fallback de sécurité : Gemini indisponible, on passe quand même le rapport
                    console.error("[AI ERROR] Gemini indisponible, fallback PENDING_EXPERT :", aiError.message);
                    status = 'PENDING_EXPERT';
                }
            } else {
                // Agent : expertise terrain confirmée, aucune analyse IA nécessaire
                console.log("[AGENT] Soumission directe de l'agent → PENDING_EXPERT automatique.");
            }

            // ── Étape 4.5 : ANALYSE YOLOv8 (Métier) ──
            let finalAiResult = aiResult;

            // Si le rapport est valide (agent ou citoyen validé par Gemini), on fait l'analyse métier YOLO
            if (status === 'PENDING_EXPERT') {
                console.log("[YOLO] Appel au microservice Python pour la classification métier...");
                const absolutePath = path.resolve(req.files[0].path);
                try {
                    const yoloData = await analyzeImageWithYolo(absolutePath);

                    let annotatedImagePath = null;
                    if (yoloData.annotatedImageBase64) {
                        // RÈGLE ARCHITECTURALE : Sauvegarder en tant que fichier, pas en Base64 dans la DB
                        const annotatedDir = path.join(__dirname, '../../uploads/annotated');
                        if (!fs.existsSync(annotatedDir)) {
                            fs.mkdirSync(annotatedDir, { recursive: true });
                        }
                        const fileName = `annotated-${Date.now()}-${Math.round(Math.random() * 1E9)}.jpg`;
                        const filePath = path.join(annotatedDir, fileName);
                        fs.writeFileSync(filePath, yoloData.annotatedImageBase64, 'base64');
                        annotatedImagePath = `/uploads/annotated/${fileName}`;
                    }

                    // Fusionner les résultats
                    finalAiResult = {
                        ...(aiResult || {}),
                        yoloClassId: yoloData.yoloClassId,
                        yoloClassName: yoloData.yoloClassName,
                        yoloConfidence: yoloData.yoloConfidence,
                        businessRecommendation: yoloData.businessRecommendation,
                        annotatedImagePath: annotatedImagePath
                    };

                } catch (yoloError) {
                    console.error("[YOLO ERROR] Impossible d'analyser l'image avec YOLO :", yoloError.message);
                }
            }

            // ── Étape 5 : SAUVEGARDE — avec sectorId et assignedCity ──
            const imagePaths = req.files.map(f => `/uploads/${f.filename}`);

            // ── Résolution de l'adresse textuelle via OSM ──
            let finalAddress = address;
            if (!finalAddress || source === 'citizen') {
                console.log(`[GEOCODING] Récupération de l'adresse pour [${lat}, ${lon}]...`);
                finalAddress = await fetchAddressFromCoords(lat, lon);
            }

            const newReport = await Report.create({
                images: imagePaths,
                location: {
                    type: 'Point',
                    coordinates: [lon, lat]
                },
                city: sector.city || sector.name,
                assignedCity: sector.city || sector.name,
                sectorId: sector._id,
                description: description || '',
                address: finalAddress,
                status,
                source,
                owner: ownerId,
                aiResult: finalAiResult
            });

            console.log(`[SUCCESS] Rapport créé. ID: ${newReport._id} | Statut: ${status} | Secteur: ${sector.name}`);

            res.status(201).json({
                message: status === 'PENDING_EXPERT'
                    ? "Signalement validé et transmis à l'expert."
                    : "Signalement refusé : image non conforme ou zone non dégradée.",
                report: {
                    _id: newReport._id,
                    status: newReport.status,
                    sectorId: newReport.sectorId,
                    assignedCity: newReport.assignedCity
                }
            });

        } catch (error) {
            console.error("[CRITICAL ERROR]", error);
            res.status(500).json({ message: "Erreur serveur interne.", error: error.message });
        }
    });
};



// Récupérer les inspections de l'agent connecté
exports.getMyReports = async (req, res) => {
    try {
        const reports = await Report.find({ owner: req.user.id }).sort({ createdAt: -1 });
        res.status(200).json(reports);
    } catch (error) {
        res.status(500).json({ message: "Erreur récupération inspections." });
    }
};

// Récupérer les missions affectées à l'agent connecté
exports.getMyMissions = async (req, res) => {
    try {
        const missions = await Report.find({ assignedTo: req.user.id })
            .populate('sectorId', 'name city')
            .sort({ updatedAt: -1 });
        res.status(200).json(missions);
    } catch (error) {
        res.status(500).json({ message: "Erreur récupération missions." });
    }
};

// Récupérer TOUTES les missions (pour Expert/Admin)
exports.getAllMissions = async (req, res) => {
    try {
        // Les missions sont les rapports qui ont un agent assigné
        const missions = await Report.find({ assignedTo: { $exists: true, $ne: null } })
            .populate('assignedTo', 'name firstName email')
            .populate('sectorId', 'name city')
            .sort({ updatedAt: -1 });
        res.status(200).json(missions);
    } catch (error) {
        res.status(500).json({ message: "Erreur récupération de toutes les missions." });
    }
};

// Mettre à jour le statut d'un rapport/mission
exports.updateReportStatus = async (req, res) => {
    try {
        const { status, agentObservations } = req.body;

        const report = await Report.findById(req.params.id);
        if (!report) {
            return res.status(404).json({ message: "Rapport introuvable." });
        }

        if (status) {
            report.status = status;
        }

        if (agentObservations) {
            report.description = report.description
                ? `${report.description}\n\nObs Agent: ${agentObservations}`
                : `Obs Agent: ${agentObservations}`;
        }

        const updatedReport = await report.save();
        res.status(200).json(updatedReport);
    } catch (error) {
        console.error('[updateReportStatus] Erreur :', error);
        res.status(500).json({ message: "Erreur mise à jour du statut." });
    }
};

// Lister les rapports avec filtres (sectorId, source, owner) — pour historique patrouille
exports.getReports = async (req, res) => {
    try {
        const { sectorId, source, owner, status } = req.query;
        const filter = {};
        if (sectorId) filter.sectorId = sectorId;
        if (source) filter.source = source;
        if (owner) filter.owner = owner;
        if (status) filter.status = status;

        const reports = await Report.find(filter)
            .sort({ createdAt: -1 })
            .populate('sectorId', 'name city')
            .populate('owner', 'name firstName email')
            .populate('assignedTo', 'name firstName email');

        res.status(200).json(reports);
    } catch (error) {
        console.error('[getReports] Erreur :', error);
        res.status(500).json({ message: "Erreur récupération des rapports." });
    }
};

// Générer et télécharger le rapport PDF
exports.downloadReportPdf = async (req, res) => {
    try {
        const { id } = req.params;
        const report = await Report.findById(id).populate('sectorId', 'name city').populate('owner', 'name firstName email').populate('assignedTo', 'name firstName email');

        if (!report) {
            return res.status(404).json({ message: "Rapport introuvable." });
        }

        const { generateReportPDF } = require('../services/pdfService');
        const pdfBuffer = await generateReportPDF(report);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=rapport-inspection-${id}.pdf`);
        res.setHeader('Content-Length', pdfBuffer.length);

        res.end(pdfBuffer);

    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la génération du PDF." });
    }
};

// ── CORRECTION DU RAPPORT PAR L'EXPERT ──
exports.expertCorrectReport = async (req, res) => {
    console.log("🔥 ROUTE CORRECTION ATTEINTE POUR L'ID :", req.params.id);
    console.log("Contenu du body :", req.body);

    try {
        const { correctedDegradationType, correctedRecommendation } = req.body;
        const report = await Report.findById(req.params.id);

        if (!report) {
            return res.status(404).json({ message: "Rapport introuvable." });
        }

        if (!report.expertValidation) {
            report.expertValidation = {};
        }

        report.expertValidation.correctedDegradationType = correctedDegradationType;
        report.expertValidation.correctedRecommendation = correctedRecommendation;
        report.expertValidation.correctionExpertDateAt = new Date();

        await report.save();
        res.status(200).json({ message: "Données du rapport corrigées avec succès.", report });
    } catch (error) {
        console.error('[expertCorrectReport] Erreur :', error);
        res.status(500).json({ message: "Erreur lors de la correction du rapport." });
    }
};

// ── VALIDATION DU RAPPORT AVEC SIGNATURE ──
exports.expertValidateReport = async (req, res) => {
    try {
        const { signatureBase64 } = req.body;
        const report = await Report.findById(req.params.id);

        if (!report) {
            return res.status(404).json({ message: "Rapport introuvable." });
        }

        if (!report.expertValidation) {
            report.expertValidation = {};
        }

        report.expertValidation.signatureBase64 = signatureBase64;
        report.expertValidation.validatedBy = req.user.id;
        report.expertValidation.validatedAt = new Date();
        report.status = 'VALIDATED';

        await report.save();
        res.status(200).json({ message: "Rapport officiellement validé et signé.", report });
    } catch (error) {
        console.error('🔥 Erreur Backend Validation :', error);
        res.status(500).json({ message: error.message || "Erreur lors de la validation du rapport." });
    }
};

// ── CREATION DE MISSION ──
exports.createMission = async (req, res) => {
    console.log("🔥 ROUTE POST /api/missions ATTEINTE");
    console.log("Payload reçu:", req.body);
    try {
        const { reportId, agentId, priority, startDate, estimatedEndDate } = req.body;

        if (!reportId || !agentId) {
            return res.status(400).json({ message: "Champs requis manquants (reportId, agentId)." });
        }

        const report = await Report.findById(reportId).populate('sectorId', 'name city');
        if (!report) {
            return res.status(404).json({ message: "Rapport introuvable." });
        }

        const agent = await User.findById(agentId);
        if (!agent) {
            return res.status(404).json({ message: "Agent introuvable." });
        }

        // Mise à jour du rapport
        report.assignedTo = agentId;
        report.status = 'IN_PROGRESS';
        report.mission = {
            startDate: startDate ? new Date(startDate) : undefined,
            estimatedEndDate: estimatedEndDate ? new Date(estimatedEndDate) : undefined,
            priority: priority || 'Normale'
        };

        await report.save();

        // Générer le PDF
        const pdfBuffer = await generateReportPDF(report);

        // Envoyer l'email
        try {
            await sendMissionEmail(agent, report, pdfBuffer);
        } catch (mailErr) {
            console.error('[MAIL] Erreur envoi email de mission :', mailErr.message);
        }

        res.status(201).json({ message: "Mission créée et assignée avec succès.", report });
    } catch (error) {
        console.error('[createMission] Erreur :', error);
        res.status(500).json({ message: "Erreur lors de la création de la mission.", error: error.message });
    }
};

// ── AJOUTER UN AVANCEMENT DE MISSION (Statut IN_PROGRESS) ──
exports.addMissionProgress = (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ message: "Erreur d'upload", error: err.message });
        }
        try {
            const reportId = req.params.id;
            const { comment } = req.body;

            const report = await Report.findById(reportId);
            if (!report) return res.status(404).json({ message: "Mission introuvable." });

            // On s'assure que mission et history existent
            if (!report.mission) report.mission = {};
            if (!report.mission.history) report.mission.history = [];

            let imagePath = null;
            if (req.files && req.files.length > 0) {
                imagePath = `/uploads/${req.files[0].filename}`;
            }

            report.mission.history.push({
                date: new Date(),
                comment: comment || '',
                imagePath: imagePath
            });

            await report.save();
            res.status(200).json({ message: "Avancement ajouté avec succès.", report });
        } catch (error) {
            console.error("[addMissionProgress] Erreur :", error);
            res.status(500).json({ message: "Erreur serveur.", error: error.message });
        }
    });
};

// ── CLOTURER LA MISSION (Statut COMPLETED) ──
exports.completeMission = (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ message: "Erreur d'upload", error: err.message });
        }
        try {
            const reportId = req.params.id;
            const { comment } = req.body;

            const report = await Report.findById(reportId).populate('sectorId', 'name city').populate('assignedTo', 'name email');
            if (!report) return res.status(404).json({ message: "Mission introuvable." });

            if (!report.mission) report.mission = {};
            if (!report.mission.history) report.mission.history = [];

            let imagePath = null;
            if (req.files && req.files.length > 0) {
                imagePath = `/uploads/${req.files[0].filename}`;
            }

            // Ajouter le dernier rapport de clôture
            report.mission.history.push({
                date: new Date(),
                comment: comment || 'Clôture de la mission',
                imagePath: imagePath
            });

            // Mettre à jour le statut
            report.status = 'COMPLETED';

            await report.save();

            // Mettre à jour la date de dernière inspection du secteur (logique métier SIG)
            if (report.sectorId) {
                await Sector.findByIdAndUpdate(report.sectorId._id, {
                    lastInspectionDate: new Date()
                });
            }

            // Regénérer le PDF final avec l'historique
            try {
                // generateReportPDF doit être mis à jour pour supporter l'historique
                await generateReportPDF(report);
            } catch (pdfErr) {
                console.error("[PDF] Erreur lors de la régénération du PDF :", pdfErr.message);
            }

            res.status(200).json({ message: "Mission clôturée avec succès.", report });
        } catch (error) {
            console.error("[completeMission] Erreur :", error);
            res.status(500).json({ message: "Erreur serveur.", error: error.message });
        }
    });
};