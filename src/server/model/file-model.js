const mongoose = require('mongoose')
const Schema = mongoose.Schema
const Permission = require('./permission-model').schema

const FileSchema = new Schema(
    {
        id: { type: String },
        name: { type: String },
        createdTime: {type: Date },
        modifiedTime: { type: Date },
        permissions: { type: [Permission] }
    },
    { timestamps: true },
)

module.exports = mongoose.model('File', FileSchema)
