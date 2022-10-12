const mongoose = require('mongoose')
const Schema = mongoose.Schema
const File = require('./file-model').schema
const AccessPolicy = require('./access-policy-model').schema
const FileSnapshot = require('./file-snapshot-model').schema
const GroupSnapshot = require('./group-snapshot-model').schema
const SearchQuery = require('./search-query-model').schema

const UserSchema = new Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true },
        files: { type: [File], required: true },
        accessPolicies: { type: [AccessPolicy], required: true },
        fileSnapshots: { type: [FileSnapshot], required: true },
        groupSnapshots: { type: [GroupSnapshot], required: true },
        recentQueries: { type: [SearchQuery], required: true }
    },
    { timestamps: true },
)

module.exports = mongoose.model('User', UserSchema)
