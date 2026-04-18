const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  firstName: { type: String },
  phone: { type: String },
  cin: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ["citizen", "agent", "expert", "admin"],
    default: "citizen",
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ["active", "pending"],
    default: "pending",
  },
  verificationToken: String,
  assignedCity: {
    type: String,
    default: null
  },
  mustChangePassword: {
    type: Boolean,
    default: false
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  createdAt: { type: Date, default: Date.now },
});

userSchema.pre("save", async function () {
  // On ne hache que si le mot de passe a été modifié (ou créé)
  if (!this.isModified("password")) return;

  // Hachage du mot de passe
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.matchPassword = function (password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("User", userSchema);