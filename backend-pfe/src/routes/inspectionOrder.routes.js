const express = require('express');
const router = express.Router();
const {
  createOrder,
  getActiveAgents,
  getMyOrders,
  acknowledgeOrder,
  getAllOrders,
  reassignOrder,
  completeOrder
} = require('../controllers/inspectionOrder.controller');
const { protect, isAdmin } = require('../middlewares/auth.middleware');

// Admin routes
router.post('/', protect, isAdmin, createOrder);
router.get('/agents', protect, isAdmin, getActiveAgents);
router.get('/', protect, isAdmin, getAllOrders);
router.patch('/:id/reassign', protect, isAdmin, reassignOrder);

// Agent routes
router.get('/mine', protect, getMyOrders);
router.patch('/:id/acknowledge', protect, acknowledgeOrder);
router.put('/:id/complete', protect, completeOrder);

module.exports = router;
