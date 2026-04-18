const express = require("express");
const router = express.Router();
const {
  register,
  verifyEmail,
  login,
  getMe,
  changePassword,
  forgotPassword,
  resetPassword,
  getAgents,
  getPendingAgents,
  approveAgent,
  getStatus
} = require("../controllers/auth.controller");
const { protect, isAdmin } = require("../middlewares/auth.middleware");

// Routes publiques
router.post("/register", register);
router.get("/verify/:token", verifyEmail);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

// Route protégée
router.get("/me", protect, getMe);
router.patch("/change-password", protect, changePassword);
router.get("/agents", protect, getAgents);
router.get("/status", protect, getStatus);

// Routes Admin
router.get("/pending-agents", protect, isAdmin, getPendingAgents);
router.put("/approve-agent/:id", protect, isAdmin, approveAgent);

module.exports = router;