const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { protect, isAdmin } = require('../middlewares/auth.middleware');

// Route publique — les citoyens peuvent signaler sans compte (le contrôleur gère req.user = null)
router.post('/', reportController.createReport);

// Agent specific routes
router.get('/mine', protect, reportController.getMyReports);
router.get('/agent/missions', protect, reportController.getMyMissions);
router.patch('/:id/status', protect, reportController.updateReportStatus);

// Admin Routes for Flow Management
router.get('/waiting-list', protect, isAdmin, reportController.getWaitingReports);
router.patch('/push-to-system', protect, isAdmin, reportController.confirmBatch);

module.exports = router;
