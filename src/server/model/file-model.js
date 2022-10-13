const mongoose = require('mongoose')
const Schema = mongoose.Schema
const Permission = require('./permission-model').schema

const FileSchema = new Schema(
    {
        id: { type: String, required: true },
        name: { type: String, required: true },
        createdTime: {type: Date, required: true},
        modifiedTime: { type: Date, required: true },
        permissions: { type: [Permission], required: true }
    },
    { timestamps: true },
)

module.exports = mongoose.model('File', FileSchema)
