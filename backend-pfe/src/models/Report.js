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
    enum: ['PENDING_EXPERT', 'VALIDATED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED']
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
      scoreConfiance: Number,
      // Nouveaux champs pour YOLOv8 et le Dictionnaire Métier
      yoloClassId: Number,
      yoloClassName: String,
      yoloConfidence: Number,
      businessRecommendation: String,
      annotatedImagePath: String // Stockage du chemin, pas de Base64
    },
    default: null
  },
  expertValidation: {
    type: {
      correctedDegradationType: String,
      correctedRecommendation: String,
      correctionExpertDateAt: Date,
      signatureBase64: String,
      validatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      validatedAt: Date
    },
    default: null
  },
  address: {
    type: String,
    default: ''
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  mission: {
    type: {
      startDate: Date,
      estimatedEndDate: Date,
      priority: {
        type: String,
        enum: ['Normale', 'Haute', 'Urgente'],
        default: 'Normale'
      },
      history: [{
        date: { type: Date, default: Date.now },
        comment: String,
        imagePath: String
      }]
    },
    default: null
  }
}, {
  timestamps: true
});

// Index géospatial 2dsphere
reportSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Report', reportSchema);
