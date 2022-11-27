const mongoose = require('mongoose');

const { Schema } = mongoose;
const { ObjectId } = Schema.Types;
const Permission = require('./permission-model').schema;

const FileSchema = new Schema(
  {
    id: { type: String },
    name: { type: String },
    createdTime: { type: Date },
    modifiedTime: { type: Date },
    permissions: { type: [Permission] },
    owner: { name: { type: String }, email: { type: String } },
    sharingUser: { name: { type: String }, email: { type: String } },
    folder: { type: Boolean },
    children: { type: [{ type: ObjectId, ref: 'FileSchema' }] },
    drive: { type: String },
    parents: { type: [{ id: String, name: String }] },
  },
  { timestamps: true },
);

module.exports = mongoose.model('File', FileSchema);
