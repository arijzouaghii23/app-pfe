const ejs = require('ejs');
const path = require('path');
const fs = require('fs');
const htmlPdf = require('html-pdf-node');

/**
 * Lit une image locale et la convertit en Data URI Base64 pour l'intégration HTML.
 * @param {string} relativePath Le chemin relatif depuis la racine du projet (ex: /uploads/img.jpg)
 * @returns {string|null} Le Data URI ou null si introuvable
 */
const getImageAsBase64 = (relativePath) => {
    if (!relativePath) return null;
    try {
        const absolutePath = path.join(__dirname, '../../', relativePath);
        if (fs.existsSync(absolutePath)) {
            const ext = path.extname(absolutePath).toLowerCase();
            let mimeType = 'image/jpeg';
            if (ext === '.png') mimeType = 'image/png';
            
            const imageBuffer = fs.readFileSync(absolutePath);
            return `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
        }
    } catch (error) {
        console.error("Erreur lecture image locale pour PDF:", error.message);
    }
    return null;
};

/**
 * Génère un buffer PDF officiel pour un rapport d'inspection.
 * @param {Object} report Les données du rapport (MongoDB)
 * @returns {Promise<Buffer>} Le PDF sous forme de Buffer
 */
const generateReportPDF = async (report) => {
    try {
        // Chemin vers le template EJS
        const templatePath = path.join(__dirname, '../templates/report.ejs');
        const templateHtml = fs.readFileSync(templatePath, 'utf8');

        // Récupérer la première image originale
        let originalImageBase64 = null;
        if (report.images && report.images.length > 0) {
            originalImageBase64 = getImageAsBase64(report.images[0]);
        }

        // Récupérer l'image annotée par YOLO si disponible
        let annotatedImageBase64 = null;
        if (report.aiResult && report.aiResult.annotatedImagePath) {
            annotatedImageBase64 = getImageAsBase64(report.aiResult.annotatedImagePath);
        }

        // Convertir les images de l'historique de mission
        let historyWithBase64Images = [];
        if (report.mission && report.mission.history && report.mission.history.length > 0) {
            historyWithBase64Images = report.mission.history.map(item => {
                return {
                    date: item.date,
                    comment: item.comment,
                    imageBase64: getImageAsBase64(item.imagePath)
                };
            });
        }

        // Compiler le template EJS avec les données
        const compiledHtml = ejs.render(templateHtml, {
            report,
            originalImageBase64,
            annotatedImageBase64,
            history: historyWithBase64Images
        });

        // Options pour html-pdf-node
        const options = { 
            format: 'A4',
            printBackground: true,
            margin: {
                top: "20px",
                bottom: "40px",
                right: "20px",
                left: "20px"
            }
        };

        const file = { content: compiledHtml };

        // Génération du PDF
        const pdfBuffer = await htmlPdf.generatePdf(file, options);
        return pdfBuffer;

    } catch (error) {
        console.error("[PDF SERVICE ERROR]", error);
        throw new Error("Erreur lors de la génération du rapport PDF");
    }
};

module.exports = {
    generateReportPDF
};
