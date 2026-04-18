const Sector = require('../models/Sector');

// @desc    Obtenir tous les secteurs avec leur code couleur dynamique
// @route   GET /api/sectors
// @access  Private (Admin)
exports.getAllSectors = async (req, res) => {
    try {
        // lean() permet de récupérer des objets JS classiques au lieu de documents Mongoose (plus rapide)
        const sectors = await Sector.find().lean();
        
        const now = Date.now();
        const threeMonthsMs = 90 * 24 * 60 * 60 * 1000; // ~3 mois en millisecondes
        const sixMonthsMs = 180 * 24 * 60 * 60 * 1000;  // ~6 mois en millisecondes

        const enrichedSectors = sectors.map(sector => {
            let statusColor = 'RED'; // Par défaut (si null ou erreur)
            
            if (sector.lastInspectionDate) {
                const diffTime = now - new Date(sector.lastInspectionDate).getTime();
                
                if (diffTime > sixMonthsMs) {
                    statusColor = 'RED';     // Plus de 6 mois
                } else if (diffTime > threeMonthsMs) {
                    statusColor = 'ORANGE';  // Entre 3 et 6 mois
                } else {
                    statusColor = 'GREEN';   // Moins de 3 mois
                }
            }
            
            return {
                ...sector,
                statusColor
            };
        });

        res.status(200).json(enrichedSectors);
    } catch (error) {
        console.error(" [SECTOR ERROR] Erreur getSectors: ", error);
        res.status(500).json({ message: "Erreur lors de la récupération des secteurs.", error: error.message });
    }
};
