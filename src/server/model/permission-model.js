const mongoose = require('mongoose')
const Schema = mongoose.Schema
const File = require('./file-model')

const PermissionSchema = new Schema(
    {
        id: { type: String },
        //type: { type: String },
        email: {type: String },
        displayName: { type: String },
        roles: { type: [String] },
        inheritedFrom: { type: File }
    },
    { timestamps: true },
)

module.exports = mongoose.model('Permission', PermissionSchema)
