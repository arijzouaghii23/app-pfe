const Report = require('../models/Report');
const Sector = require('../models/Sector');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { analyzeImageWithGemini } = require('../services/aiService');

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
                return res.status(400).json({ message: "Les coordonnées GPS (longitude, latitude) sont requises." });
            }

            const lon = parseFloat(longitude);
            const lat = parseFloat(latitude);

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
                req.files.forEach(f => { try { fs.unlinkSync(f.path); } catch (_) {} });
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
                        status = 'refuse';
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

            // ── Étape 5 : SAUVEGARDE — avec sectorId et assignedCity ──
            const imagePaths = req.files.map(f => `/uploads/${f.filename}`);

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
                address: address || '',
                status,
                source,
                owner: ownerId,
                aiResult,
                sentToSystem: status === 'PENDING_EXPERT'
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


// Récupérer les rapports en attente de propulsion (ADMIN SEULEMENT)
exports.getWaitingReports = async (req, res) => {
    try {
        const reports = await Report.find({
            status: "accepte",
            ownerRole: "citizen",
            sentToSystem: false
        }).sort({ createdAt: -1 });

        res.status(200).json(reports);
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la récupération de la file d'attente." });
    }
};

// Propulsion massive vers le système (ADMIN SEULEMENT)
exports.confirmBatch = async (req, res) => {
    try {
        const result = await Report.updateMany(
            { status: "accepte", ownerRole: "citizen", sentToSystem: false },
            { $set: { sentToSystem: true, status: "PENDING_EXPERT" } }
        );

        res.status(200).json({
            message: "Propulsion réussie !",
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la propulsion des données." });
    }
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
        const missions = await Report.find({ assignedTo: req.user.id }).sort({ updatedAt: -1 });
        res.status(200).json(missions);
    } catch (error) {
        res.status(500).json({ message: "Erreur récupération missions." });
    }
};

// Mettre à jour le statut d'un rapport/mission
exports.updateReportStatus = async (req, res) => {
    try {
        const { status, agentObservations } = req.body;
        const report = await Report.findByIdAndUpdate(
            req.params.id,
            { status, description: agentObservations ? `${report.description}\n\nObs Agent: ${agentObservations}` : report.description },
            { new: true }
        );
        res.status(200).json(report);
    } catch (error) {
        res.status(500).json({ message: "Erreur mise à jour." });
    }
};