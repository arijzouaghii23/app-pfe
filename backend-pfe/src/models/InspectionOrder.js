const mongoose = require('mongoose');

const inspectionOrderSchema = new mongoose.Schema({
  agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sentBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sectorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sector',
    required: true
  },
  instructions: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'acknowledged', 'done'],
    default: 'pending'
  },
  dueDate: {
    type: Date,
    required: true
  },
  previousAgent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('InspectionOrder', inspectionOrderSchema);
