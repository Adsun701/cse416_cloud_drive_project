const mongoose = require('mongoose');

const { Schema } = mongoose;

const GroupSnapshotSchema = new Schema(
  {
    groupName: String,
    groupAddress: String,
    groupMembers: [String],
  },
  { timestamps: true },
);

module.exports = mongoose.model('GroupSnapshot', GroupSnapshotSchema);
