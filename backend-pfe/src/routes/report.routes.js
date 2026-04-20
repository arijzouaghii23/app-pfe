const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { protect, isAdmin, optionalAuth } = require('../middlewares/auth.middleware');

// Route publique/semi-privée — les citoyens peuvent signaler sans compte, les agents avec compte
router.post('/', optionalAuth, reportController.createReport);

// Lister les rapports (avec filtres : ?sectorId=, ?source=, ?owner=)
router.get('/', protect, reportController.getReports);

// Agent specific routes
router.get('/mine', protect, reportController.getMyReports);
router.get('/agent/missions', protect, reportController.getMyMissions);
router.patch('/:id/status', protect, reportController.updateReportStatus);

module.exports = router;
