const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  console.log(" [AUTH] Vérification du token...");
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        console.warn(" [AUTH] Token manquant dans les headers.");
        return res.status(401).json({ message: "Token manquant" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log(" [AUTH] Token valide. User ID:", decoded.id);
    req.user = decoded; // id + role
    next(); 
  } catch (error) {
    console.error(" [AUTH] Token invalide ou expiré :", error.message);
    return res.status(401).json({ message: "Token invalide" });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: "Accès refusé : Réservé aux administrateurs" });
  }
};

module.exports = { protect, isAdmin };
