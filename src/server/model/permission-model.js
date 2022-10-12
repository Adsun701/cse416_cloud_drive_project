const mongoose = require('mongoose')
const Schema = mongoose.Schema
const File = require('./file-model').schema

const PermissionSchema = new Schema(
    {
        id: { type: String, required: true },
        type: { type: String, required: true },
        email: {type: String, required: true},
        displayName: { type: String, required: true },
        role: { type: String, required: true },
        inheritedFrom: { type: File, required: true }
    },
    { timestamps: true },
)

module.exports = mongoose.model('Permission', PermissionSchema)
