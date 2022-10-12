const mongoose = require('mongoose')
const Schema = mongoose.Schema

const AccessPolicySchema = new Schema(
    {
        requirement: { type: String, required: true },
        ar: { type: [String], required: true },
        dr: {type: [String], required: true},
        aw: { type: [String], required: true },
        dw: { type: [String], required: true }
    },
    { timestamps: true },
)

module.exports = mongoose.model('AccessPolicy', AccessPolicySchema)
