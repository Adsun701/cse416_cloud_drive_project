const mongoose = require('mongoose');

const { Schema } = mongoose;

const AccessPolicySchema = new Schema(
  {
    requirement: { type: String },
    ar: { type: [String] },
    dr: { type: [String] },
    aw: { type: [String] },
    dw: { type: [String] },
  },
  { timestamps: true },
);

module.exports = mongoose.model('AccessPolicy', AccessPolicySchema);
