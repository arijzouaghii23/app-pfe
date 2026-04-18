require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");
const seedAdmin = require("./config/seed");
const { startCleanupCron } = require('./utils/cleanup');

// Connexion à la base de données
connectDB().then(() => {
    seedAdmin(); // Se lance une fois la DB connectée
});

// Démarrer la tâche cron de nettoyage
startCleanupCron();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(` Serveur backend démarré sur le port ${PORT}`);
});