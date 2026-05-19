const mongoose = require("mongoose");
const User = require("../models/User");
const Sector = require("../models/Sector");
const bcrypt = require("bcryptjs");

const seedGestionnaire = async () => {
  try {
    // Utilisation d'un email professionnel lié au nouveau titre
    const gestExists = await User.findOne({ email: "gestionnaire@sigroutier.tn" });

    if (!gestExists) {
      console.log(" Création du compte Gestionnaire d'Exploitation par défaut...");

      const firstSector = await Sector.findOne({}).select('city');
      const operationalCity = firstSector?.city || 'Non définie';

      const gestionnaire = new User({
        name: "Lefebvre",
        firstName: "Julien",
        cin: "12345678",
        email: "gestionnaire@sigroutier.tn",
        password: "admin", // Haché automatiquement par le hook pre-save du modèle User
        role: "admin", // Identifiant technique conservé pour ne pas casser les middlewares
        phone: "+216 71 000 000",
        assignedCity: operationalCity,
        isVerified: true,
        status: "active"
      });

      await gestionnaire.save();
      console.log(" Compte Gestionnaire créé ! (gestionnaire@sigroutier.tn / admin)");
    } else {
      console.log(" Le compte Gestionnaire d'Exploitation existe déjà.");
    }
  } catch (error) {
    console.error(" Erreur lors de l'initialisation du gestionnaire :", error);
  }
};

module.exports = seedGestionnaire;
