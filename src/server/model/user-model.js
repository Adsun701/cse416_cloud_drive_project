const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId
const File = require('./file-model').schema
const AccessPolicy = require('./access-policy-model')
const FileSnapshot = require('./file-snapshot-model')
const GroupSnapshot = require('./group-snapshot-model')
const SearchQuery = require('./search-query-model')

const UserSchema = new Schema(
    {
        name: { type: String },
        email: { type: String },
        files: { type: [File] },
        accessPolicies: [{ type: ObjectId, ref: AccessPolicy }],
        fileSnapshots: [{ type: ObjectId, ref: FileSnapshot }],
        groupSnapshots: [{ type: ObjectId, ref: GroupSnapshot }],
        recentQueries: [{ type: ObjectId, ref: SearchQuery }]
    },
    { timestamps: true },
)

module.exports = mongoose.model('User', UserSchema)
