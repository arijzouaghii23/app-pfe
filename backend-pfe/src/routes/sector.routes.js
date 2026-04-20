const express = require('express');
const router = express.Router();
const { getAllSectors } = require('../controllers/sector.controller');
const { protect, isAdmin } = require('../middlewares/auth.middleware');

// GET "/api/sectors" protégé par 'protect', accessible par l'agent et l'admin
router.get('/', protect, getAllSectors);

module.exports = router;
