const mongoose = require('mongoose')
const Schema = mongoose.Schema

const GroupSnapshotSchema = new Schema(
    {
        files: { type: String, of: [String], required: true }
    },
    { timestamps: true },
)

module.exports = mongoose.model('GroupSnapshot', GroupSnapshotSchema)
