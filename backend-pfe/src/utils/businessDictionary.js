// src/utils/businessDictionary.js

const businessDictionary = {
    0: {
        name: "Nid-de-poule (Pothole)",
        definition: "Désintégration localisée du revêtement créant une cavité de profondeur variable.",
        recommendation: "Intervention urgente requise. Procéder au nettoyage de la cavité, application d'une couche d'accrochage et comblement avec un enrobé à froid ou à chaud selon l'étendue et la saison."
    },
    1: {
        name: "Fissure simple (Crack)",
        definition: "Rupture linéaire (longitudinale ou transversale) de la couche de roulement sans ramification complexe.",
        recommendation: "Nettoyage et soufflage de la fissure, suivi d'un colmatage avec un mastic bitumineux coulé à chaud pour empêcher l'infiltration d'eau."
    },
    2: {
        name: "Faïençage (Alligator Crack)",
        definition: "Série de fissures interconnectées formant un motif rappelant la peau d'un alligator, indiquant une fatigue structurelle.",
        recommendation: "Dégradation structurelle avancée. Une simple réparation de surface est insuffisante. Prévoir un fraisage de la zone dégradée et une réfection complète de la couche de roulement (et potentiellement de la couche de base)."
    },
    3: {
        name: "Anomalie de surface",
        definition: "Déformation mineure de la surface (ex: orniérage léger, affaissement) ou problème de marquage au sol.",
        recommendation: "Évaluation sur site nécessaire. Selon le cas : reprofilage localisé de la chaussée ou renouvellement de la signalisation horizontale (peinture/résine)."
    }
};

/**
 * Traduit un class_id retourné par YOLOv8 en données métier.
 * @param {number} classId L'identifiant de la classe (0 à 3)
 * @returns {object} Les données métier associées ou une valeur par défaut.
 */
const getBusinessData = (classId) => {
    if (businessDictionary.hasOwnProperty(classId)) {
        return businessDictionary[classId];
    }
    return {
        name: "Anomalie Inconnue",
        definition: "La classe détectée n'est pas reconnue par le système.",
        recommendation: "Une inspection manuelle approfondie est requise par l'expert."
    };
};

module.exports = {
    businessDictionary,
    getBusinessData
};
