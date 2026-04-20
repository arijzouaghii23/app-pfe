const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const Report = require('../models/Report');

// Supprime les fichiers physiques d'un signalement
const deleteReportImages = (imagePaths) => {
    imagePaths.forEach((imgPath) => {
        // imgPath est généralement stocké comme '/uploads/filename.jpg'
        const fileName = path.basename(imgPath);
        const fullPath = path.join(__dirname, '../../uploads', fileName);
        
        if (fs.existsSync(fullPath)) {
            try {
                fs.unlinkSync(fullPath);
                console.log(`Fichier supprimé: ${fullPath}`);
            } catch (err) {
                console.error(`Erreur lors de la suppression de ${fullPath}:`, err.message);
            }
        }
    });
};

// Fonction de nettoyage: Supprime les signalements refusés vieux de plus de 7 jours
const cleanupReports = async () => {
    try {
        console.log("Démarrage du job de nettoyage des signalements...");
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // Trouver les signalements refusés et datant de plus de 7 jours
        const oldRejectedReports = await Report.find({
            status: 'REJECTED',
            updatedAt: { $lt: sevenDaysAgo }
        });

        if (oldRejectedReports.length === 0) {
            console.log("Aucun signalement obsolète à nettoyer.");
            return;
        }

        console.log(`${oldRejectedReports.length} signalement(s) obsolète(s) trouvé(s). Suppression en cours...`);

        for (const report of oldRejectedReports) {
            // 1. Supprimer les fichiers images physiques
            deleteReportImages(report.images);
            
            // 2. Supprimer l'entrée dans la base de données
            await Report.findByIdAndDelete(report._id);
            console.log(`Signalement ${report._id} supprimé de la base de données.`);
        }

        console.log("Job de nettoyage terminé avec succès.");

    } catch (error) {
        console.error("Erreur durant l'exécution du job de nettoyage:", error.message);
    }
};

// Planifie l'exécution du job tous les jours à 2h00 du matin
const startCleanupCron = () => {
    cron.schedule('0 2 * * *', cleanupReports);
    console.log("Cron job de nettoyage planifié (tous les jours à 02:00).");
};

module.exports = { startCleanupCron };
