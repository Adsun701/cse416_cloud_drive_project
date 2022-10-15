const mongoose = require('mongoose');

const { Schema } = mongoose;

const PermissionSchema = new Schema(
  {
    id: { type: String },
    email: { type: String },
    displayName: { type: String },
    roles: { type: [String] },
    inheritedFrom: { type: String },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Permission', PermissionSchema);
