const mongoose = require('mongoose')
const Schema = mongoose.Schema

const GroupSnapshotSchema = new Schema(
    {
        files: { type: Map, of: [String] }
    },
    { timestamps: true },
)

module.exports = mongoose.model('GroupSnapshot', GroupSnapshotSchema)
