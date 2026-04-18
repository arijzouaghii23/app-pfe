const mongoose = require("mongoose");
const User = require("../models/User");
const bcrypt = require("bcryptjs");

const seedAdmin = async () => {
  try {
    const adminExists = await User.findOne({ email: "admin@sigroutier.tn" });
    
    if (!adminExists) {
      console.log(" Création du compte Admin par défaut...");
      
      const admin = new User({
        name: "Administrateur",
        firstName: "Super",
        cin: "12121212",
        email: "admin@sigroutier.tn",
        password: "admin", // Le hook pre-save de mongoose va le hacher
        role: "admin",
        isVerified: true,
        status: "active"
      });
      
      await admin.save();
      console.log(" Compte Admin créé avec succès ! (admin@sigroutier.tn / admin)");
    } else {
      console.log(" Compte Admin déjà existant.");
    }
  } catch (error) {
    console.error(" Erreur lors de la création de l'admin:", error);
  }
};

module.exports = seedAdmin;
