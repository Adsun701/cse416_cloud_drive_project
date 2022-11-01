/*
Main interface to act as cloud drive adapter and to perform database operations
*/
const googledrive = require('./googledrive');
const onedrive = require('./onedrive');
const User = require('../model/user-model');
const File = require('../model/file-model');
const FileSnapshot = require('../model/file-snapshot-model');
const AccessPolicy = require('../model/access-policy-model');
const SearchQuery = require('../model/search-query-model');

/*
Handling the aftermath of authentication for the specifc clouddrive
*/
async function auth(clouddrive, token, email) {
  if (clouddrive === 'google') {
    googledrive.googleAuth(token, email);
  } else if (clouddrive === 'microsoft') {
    onedrive.microsoftAuth(token, email);
  }
}

// saveSnapshot - take and save a file snapshot to the DB
async function fileSnapshot(clouddrive, token, email) {
  let snapshot = {};
  if (clouddrive === 'google') {
    snapshot = googledrive.saveSnapshot(token, email);
  } else if (clouddrive === 'microsoft') {
    snapshot = onedrive.saveSnapshot(token, email);
  }
  return snapshot;
}

// updatePermission of a file
async function updatePermission(clouddrive, token, fileid, permid, googledata, onedriveRole) {
  if (clouddrive === 'google') {
    googledrive.updatePermission(token, fileid, permid, googledata);
  } else if (clouddrive === 'microsoft') {
    onedrive.updatePermission(token, onedriveRole, fileid, permid);
  }
}

// addPermissions for a singular file or multiple files
async function addPermissions(clouddrive, token, files, value, role, type = '') {
  if (clouddrive === 'google') {
    googledrive.addPermissions(token, files, value, type, role);
  } else if (clouddrive === 'microsoft') {
    onedrive.addPermissions(token, files, value, role);
  }
}

/*
Delete permissions for a file using file id and permission id
*/
async function deletePermission(clouddrive, token, fileid, permid) {
  if (clouddrive === 'google') {
    googledrive.removePermission(token, fileid, permid);
  } else if (clouddrive === 'microsoft') {
    onedrive.removePermission(token, fileid, permid);
  }
}

/*
Updating access policy in the DB
(requirement is the search query associated with the access policy)
*/
// eslint-disable-next-line consistent-return
async function updateAccessPolicy(type, requirement, newValue) {
  if (type === 'ar') {
    AccessPolicy.updateOne({ requirement }, { $push: { ar: newValue } })
      .then(() => requirement);
  } else if (type === 'dr') {
    AccessPolicy.updateOne({ requirement }, { $push: { dr: newValue } })
      .then(() => requirement);
  } else if (type === 'aw') {
    AccessPolicy.updateOne({ requirement }, { $push: { aw: newValue } })
      .then(() => requirement);
  } else if (type === 'dw') {
    AccessPolicy.updateOne({ requirement }, { $push: { dw: newValue } })
      .then(() => requirement);
  } else {
    return null;
  }
}

async function deletingAccessPolicyRequirement(email, requirement) {
  const removedAccessPolicy = await AccessPolicy.find({requirement: requirement})[0];
  await AccessPolicy.remove({ requirement: requirement });
  const user = await User.find({email: email});
  let accessControls = user[0].accessPolicies;
  let newControls = accessControls.filter((policy) => policy !== removedAccessPolicy);
  await User.updateOne({ email: email }, { accessPolicy: newControls });
  return newControls;
}

async function deletingAccessControlsInRequirement(requirement, type, str) {
  const accessPolicy = await AccessPolicy.find({ requirement: requirement });

}
/*
Add a new access policy with the default values
ar, dr, aw, and dw are strings with the values split by ', '
*/
async function addNewAccessPolicy(email, requirement, arStr, drStr, awStr, dwStr) {
  const ar = arStr.split(', ');
  const dr = drStr.split(', ');
  const aw = awStr.split(', ');
  const dw = dwStr.split(', ');
  const accessPolicy = new AccessPolicy({
    requirement,
    ar,
    dr,
    aw,
    dw,
  });
  accessPolicy.save().then(() => {});
  User.updateOne({ email }, { $push: { accessPolicies: accessPolicy } })
    .then(() => {});
  return accessPolicy;
}

async function getAccessControlPolicies(email) {
  const user = await User.find({ email });
  const accessControls = user[0].accessPolicies;
  const ids = [];
  accessControls.forEach((element) => {
    // eslint-disable-next-line no-underscore-dangle
    ids.push(element._id);
  });
  const allPolicies = await AccessPolicy.find({ _id: { $in: ids } });
  return allPolicies;
}

/*
Add a new recent search query to the database for the user
- Add to user's profile and to the searchqueries collection
*/
async function addQuery(email, query) {
  const searchQuery = new SearchQuery({
    query,
  });
  searchQuery.save().then(() => {});
  User.updateOne({ email }, { $push: { recentQueries: searchQuery } })
    .then(() => {});
  return searchQuery;
}

/*
Retrieve a user's recent search queries
*/
async function getRecentQueries(email) {
  const user = await User.find({ email });
  const queries = user[0].recentQueries;
  const ids = [];
  queries.forEach((element) => {
    // eslint-disable-next-line no-underscore-dangle
    ids.push(element._id);
  });
  const recentQueries = await SearchQuery.find({ _id: { $in: ids } })
    .sort({ createdAt: -1 }).limit(5);
  return recentQueries;
}

/*
Retrieve all of the user's files
*/
async function getAllFiles(email) {
  const user = await User.find({ email });
  console.log(user);
  const { files } = user[0];
  const ids = [];
  files.forEach((element) => {
    // eslint-disable-next-line no-underscore-dangle
    ids.push(element._id);
  });
  const allFiles = await File.find({ _id: { $in: ids } });
  console.log('ALL FILES');
  console.log(allFiles);
  return allFiles;
}

// Get search results from file snapshots given search query
async function getSearchResults(searchQuery, token, email) {
  if (searchQuery == null || searchQuery.query == null) return [];

  /* extract default string and operators from query */
  queryArray = sortQuery(searchQuery.query);
  searchString = queryArray[0]; // string
  operators = queryArray[1]; // array of strings containing "operation:value"

  const files = [];
  const user = await User.find({ email });
  const { fileSnapshots } = user[0];
  const ids = [];
  fileSnapshots.forEach((element) => {
    // eslint-disable-next-line no-underscore-dangle
    ids.push(element._id);
  });
  const recentFileSnapshot = await FileSnapshot.find({ _id: { $in: ids } })
    .sort({ createdAt: -1 })
    .limit(1);

  const snapshotFiles = recentFileSnapshot[0].files;

  // iterate through operators
  for (let i = 0; i < operators.length; i++) {
    const opPair = operators[i];
    const op = opPair.substring(0, opPair.indexOf(':'));
    const val = opPair.substring(opPair.indexOf(':') + 1);

    const searchFiles = await searchFilter(op, val, snapshotFiles);
    for (let j = 0; j < searchFiles.length; j++) {
      files.push(searchFiles[j]);
    }
  }
  return files;
}

// Filter list of files based on given operator and value
async function searchFilter(op, value, snapshotFiles) {
  const files = [];
  const ids = [];
  switch (op) {
    case 'drive':
      break;
    case 'creator':
      op = 'owner';
    case 'owner':
    case 'reader':
    case 'writer':
      snapshotFiles.forEach((val, fileId) => {
        const perms = val;
        for (let i = 0; i < perms.length; i++) {
          if (perms[i].roles[0] == op && perms[i].email == value) {
            ids.push(fileId);
          }
        }
      });
      for (let i = 0; i < ids.length; i++) {
        const file = await File.findOne({ id: ids[i] }).sort({ createdAt: -1 });
        files.push(file);
      }
      break;
    case 'name':
      break;
  }
  return files;
}

function sortQuery(query) {
  words = query.replace(/ +(?= )/g, '').split(' ');
  words.sort((a, b) => {
    if (a.includes(':') && !b.includes(':')) return 1;
    if (!a.includes(':') && b.includes(':')) return -1;
    return 0;
  });
  s = '';
  i = 0;
  while (i < words.length && !words[i].includes(':')) {
    if (i > 0) s += ' ';
    s += words[i].trim();
    i++;
  }
  operators = [];
  for (j = i; j < words.length; j++) {
    operators.push(words[j]);
  }
  return [s, operators];
}

module.exports = {
  auth,
  fileSnapshot,
  addPermissions,
  updatePermission,
  updateAccessPolicy,
  addNewAccessPolicy,
  addQuery,
  getRecentQueries,
  getAllFiles,
  deletePermission,
  getSearchResults,
  getAccessControlPolicies,
  deletingAccessPolicyRequirement,
  deletingAccessControlsInRequirement,
};
