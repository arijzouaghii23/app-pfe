const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { protect, isAdmin, optionalAuth } = require('../middlewares/auth.middleware');

// Route publique/semi-privée — les citoyens peuvent signaler sans compte, les agents avec compte
router.post('/', optionalAuth, reportController.createReport);

// Lister les rapports (avec filtres : ?sectorId=, ?source=, ?owner=)
router.get('/', protect, reportController.getReports);

// Routes Expert
router.patch('/:id/expert/correct', protect, reportController.expertCorrectReport);
router.post('/:id/expert/validate', protect, reportController.expertValidateReport);

// Agent specific routes
router.get('/mine', protect, reportController.getMyReports);
router.patch('/:id/status', protect, reportController.updateReportStatus);

// Générer le rapport PDF (accès protégé)
router.get('/:id/pdf', protect, reportController.downloadReportPdf);

module.exports = router;
