const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { sendVerificationEmail, sendResetPasswordEmail } = require("../services/mailer");

// REGISTER
exports.register = async (req, res) => {
  try {
    const { name, firstName, phone, cin, email, password, role } = req.body;

    const userExist = await User.findOne({ email });
    if (userExist) return res.status(400).json({ message: "Email déjà utilisé" });

    const token = crypto.randomBytes(32).toString("hex");
    const userRole = role || "citizen";

    const user = await User.create({
      name,
      firstName,
      phone,
      cin,
      email,
      password,
      role: userRole,
      assignedCity: null,
      mustChangePassword: userRole === "expert",
      verificationToken: token,
      isVerified: false,
      status: "pending"
    });

    await sendVerificationEmail(email, token, password, userRole);

    res.status(201).json({ message: "Compte créé. Vérifiez votre email." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// VERIFY EMAIL
exports.verifyEmail = async (req, res) => {
  const user = await User.findOne({ verificationToken: req.params.token });
  if (!user) return res.redirect("http://localhost:3000/login?verified=false");

  user.isVerified = true;
  user.verificationToken = undefined;
  
  // Le rôle citizen passe automatiquement en statut "active"
  if (user.role === "citizen") {
    user.status = "active";
  }
  // L'agent (ou autres) reste en "pending" pour validation par l'admin

  await user.save();

  res.redirect("http://localhost:3000/login?verified=true");
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Email ou mot de passe invalide" });

    if (!user.isVerified) return res.status(400).json({ message: "Veuillez vérifier votre email" });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(400).json({ message: "Email ou mot de passe invalide" });

    const token = jwt.sign({
      id: user._id,
      role: user.role,
      assignedCity: user.assignedCity,
      status: user.status,
      mustChangePassword: user.mustChangePassword
    }, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.json({ token, user: { id: user._id, name: user.name, firstName: user.firstName, role: user.role, status: user.status, mustChangePassword: user.mustChangePassword } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ROUTE PROTÉGÉE EXEMPLE
exports.getMe = async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  res.json(user);
};

// CHANGER LE MOT DE PASSE ET COMPLÉTER LE PROFIL (Pour Expert/Admin au premier login)
exports.changePassword = async (req, res) => {
  try {
    const { newPassword, phone, cin } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

    // Mise à jour des informations de profil
    if (newPassword) {
      user.password = newPassword;
      user.mustChangePassword = false;
    }
    
    if (phone) user.phone = phone;
    if (cin) user.cin = cin;
    
    // Une fois qu'il a rempli ses infos et changé son mdp, il devient actif
    user.status = "active";


    await user.save(); // Le hook 'pre save' va hacher le mot de passe si modifié

    res.json({ 
      message: "Profil activé et mis à jour avec succès", 
      user: { 
        id: user._id, 
        role: user.role, 
        status: user.status, 
        mustChangePassword: user.mustChangePassword 
      } 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// MOT DE PASSE OUBLIÉ
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "Aucun utilisateur trouvé avec cet e-mail" });

    const token = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 heure

    await user.save();

    await sendResetPasswordEmail(email, token);

    res.json({ message: "E-mail de réinitialisation envoyé" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// RÉINITIALISER LE MOT DE PASSE
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ message: "Le lien est invalide ou a expiré" });

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.json({ message: "Mot de passe réinitialisé avec succès" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Obtenir la liste des agents (Pour l'expert - Général)
exports.getAgents = async (req, res) => {
  try {
    const agents = await User.find({ role: 'agent' }).select('name firstName email zone status');
    res.json(agents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Obtenir les agents en attente (Pour l'admin)
exports.getPendingAgents = async (req, res) => {
  try {
    const agents = await User.find({ role: 'agent', status: 'pending' }).select('-password');
    res.json(agents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Approuver un agent et lui attribuer sa ville (Pour l'admin)
exports.approveAgent = async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedCity } = req.body;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "Agent introuvable" });
    if (user.role !== 'agent') return res.status(400).json({ message: "Cet utilisateur n'est pas un agent." });

    user.status = "active";
    if (assignedCity) {
      user.assignedCity = assignedCity;
    }

    await user.save();

    // Envoi de l'email de confirmation
    try {
      const { sendApprovalEmail } = require("../services/mailer");
      await sendApprovalEmail(user);
    } catch (mailErr) {
      console.warn('[MAIL] Erreur envoi email approbation :', mailErr.message);
    }

    res.json({
      message: `Agent ${user.firstName || user.name} approuvé et affecté à la ville "${user.assignedCity || 'non définie'}".`,
      user: { _id: user._id, name: user.name, firstName: user.firstName, status: user.status, assignedCity: user.assignedCity }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// Vérifier le statut actuel (Pour le polling du frontend)
exports.getStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('status role');
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });
    res.json({ status: user.status, role: user.role });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
