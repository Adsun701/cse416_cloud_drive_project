const mongoose = require('mongoose')
const Schema = mongoose.Schema
const Permission = require('./permission-model').schema

const FileSnapshotSchema = new Schema(
    {
        files: { type: Map, of: [Permission] }
    },
    { timestamps: true },
)

module.exports = mongoose.model('FileSnapshot', FileSnapshotSchema)
