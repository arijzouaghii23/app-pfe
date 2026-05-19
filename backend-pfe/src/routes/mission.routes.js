const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { protect } = require('../middlewares/auth.middleware');

router.get('/', protect, reportController.getMyMissions);
router.get('/all', protect, reportController.getAllMissions);
router.post('/', protect, reportController.createMission);

// Ajout d'un avancement (garde le statut IN_PROGRESS)
router.post('/:id/progress', protect, reportController.addMissionProgress);

// Clôture de la mission (passe le statut à COMPLETED)
router.post('/:id/complete', protect, reportController.completeMission);

module.exports = router;
