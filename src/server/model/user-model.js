const mongoose = require('mongoose');

const { Schema } = mongoose;
const { ObjectId } = Schema.Types;
const File = require('./file-model');
const AccessPolicy = require('./access-policy-model');
const FileSnapshot = require('./file-snapshot-model');
const GroupSnapshot = require('./group-snapshot-model');
const SearchQuery = require('./search-query-model');

const UserSchema = new Schema(
  {
    email: { type: String },
    files: [{ type: ObjectId, ref: File }],
    accessPolicies: [{ type: ObjectId, ref: AccessPolicy }],
    fileSnapshots: [{ type: ObjectId, ref: FileSnapshot }],
    groupSnapshots: [{ type: ObjectId, ref: GroupSnapshot }],
    recentQueries: [{ type: ObjectId, ref: SearchQuery }],
  },
  { timestamps: true },
);

module.exports = mongoose.model('User', UserSchema);
