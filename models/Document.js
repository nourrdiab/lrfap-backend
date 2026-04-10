const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
    },
    type: {
      type: String,
      enum: ['transcript', 'cv', 'recommendation_letter', 'id_document', 'medical_license', 'usmle_score', 'other'],
      required: true,
    },
    r2Key: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

documentSchema.index({ owner: 1, type: 1 });

module.exports = mongoose.model('Document', documentSchema);