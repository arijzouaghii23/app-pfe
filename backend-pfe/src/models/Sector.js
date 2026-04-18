const mongoose = require('mongoose');

const sectorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  geometry: {
    type: {
      type: String,
      enum: ['Polygon', 'MultiPolygon'],
      required: true
    },
    coordinates: {
      type: mongoose.Schema.Types.Mixed, // Permet les tableaux de dimension variable selon Polygon/MultiPolygon
      required: true
    }
  },
  lastInspectionDate: {
    type: Date,
    default: null
  }
}, { timestamps: true });

// Index géospatial 2dsphere INDISPENSABLE pour Leaflet / MongoDB Geo queries
sectorSchema.index({ geometry: '2dsphere' });

module.exports = mongoose.model('Sector', sectorSchema);
