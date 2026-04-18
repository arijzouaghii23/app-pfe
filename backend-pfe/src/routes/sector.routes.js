const express = require('express');
const router = express.Router();
const { getAllSectors } = require('../controllers/sector.controller');
const { protect, isAdmin } = require('../middlewares/auth.middleware');

// GET "/api/sectors" protégé par 'protect', puis 'isAdmin'
router.get('/', protect, isAdmin, getAllSectors);

module.exports = router;
