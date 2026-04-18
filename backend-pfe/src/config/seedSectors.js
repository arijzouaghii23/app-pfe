const mongoose = require('mongoose');
const Sector = require('../models/Sector'); // Ajuster le chemin depuis config
const dotenv = require('dotenv');
const path = require('path');

// Charger les variables d'environnement depuis le dossier racine backend-pfe
dotenv.config({ path: path.join(__dirname, '../../.env') });

const SEED_URL = 'https://www.data.gouv.fr/api/1/datasets/r/390be454-e977-4419-a955-22f1ba358467';

const seedDB = async () => {
    try {
        console.log('Connexion à la base de données MongoDB...');
        // Remplacer par votre URI process.env.MONGO_URI ou MONGODB_URI
        const dbURI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pfe2026';
        await mongoose.connect(dbURI);
        console.log('Connecté avec succès !');

        console.log('Suppression des anciens secteurs...');
        await Sector.deleteMany({});
        console.log('Collection Sector vidée.');

        console.log(`Téléchargement des données GeoJSON depuis ${SEED_URL}...`);
        const response = await fetch(SEED_URL);
        if (!response.ok) {
            throw new Error(`Erreur HTTP lors du téléchargement : ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data || !data.features) {
            throw new Error('Format GeoJSON invalide reçu depuis l\'API.');
        }

        console.log(`${data.features.length} arrondissements (features) trouvés. Formatage des données...`);

        const sectorsToInsert = data.features.map(feature => {
            return {
                name: feature.properties.nom, // ex: 'Lyon 9e Arrondissement'
                city: 'Lyon',
                geometry: feature.geometry,   // le MultiPolygon avec ses coordonnées
                lastInspectionDate: new Date('2024-01-01') // Force la couleur Rouge/Périmée
            };
        });

        console.log('Insertion dans MongoDB...');
        await Sector.insertMany(sectorsToInsert);

        console.log('🚀 Succès ! La base de données a été initialisée avec les secteurs GeoJSON de Lyon.');
        
    } catch (error) {
        console.error('❌ Erreur lors du seed :', error);
    } finally {
        await mongoose.connection.close();
        console.log('Connexion MongoDB fermée. Ce script est terminé.');
        process.exit(0);
    }
};

seedDB();
