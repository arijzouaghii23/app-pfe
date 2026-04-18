const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  images: [{
    type: String,
    required: true
  }],
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  city: {
    type: String,
    required: true
  },
  sectorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sector',
    default: null
  },
  description: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    default: 'PENDING_EXPERT',
    enum: ['PENDING_EXPERT', 'VALIDATED', 'EN_COURS', 'COMPLETED', 'refuse']
  },
  // owner est optionnel pour supporter les rapports anonymes
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  source: {
    type: String,
    enum: ['citizen', 'agent'],
    default: 'citizen'
  },
  assignedCity: {
    type: String,
    default: ''
  },
  aiResult: {
    type: {
      estUneRoute: Boolean,
      estDegradee: Boolean,
      scoreConfiance: Number
    },
    default: null
  },
  sentToSystem: {
    type: Boolean,
    default: false
  },
  address: {
    type: String,
    default: ''
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

// Index géospatial 2dsphere
reportSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Report', reportSchema);
