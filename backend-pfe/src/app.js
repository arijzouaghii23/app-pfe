const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");

const app = express();

app.use(cors()); // Autorise le frontend à appeler le backend
app.use(morgan("dev")); // Logue toutes les requêtes (ex: GET /api/auth 200)
app.use(express.json()); // Pour parser le JSON
app.use('/uploads', express.static(path.join(__dirname, '../uploads'))); // Serve static images

// Routes
const reportController = require("./controllers/report.controller");
const { protect } = require("./middlewares/auth.middleware");

app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/admin", require("./routes/auth.routes")); // Redirection sémantique pour les routes admin
app.use("/api/reports", require("./routes/report.routes")); // Routes des signalements
app.use("/api/inspection-orders", require("./routes/inspectionOrder.routes")); // Ordres d'inspection
app.use("/api/sectors", require("./routes/sector.routes")); // Route des secteurs géographiques

// Endpoint direct pour les missions de l'agent
app.get("/api/missions", protect, reportController.getMyMissions);

module.exports = app;
