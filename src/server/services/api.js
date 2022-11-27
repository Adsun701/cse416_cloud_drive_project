/* eslint-disable no-await-in-loop */
/* eslint-disable no-underscore-dangle */
/*
Main interface to act as cloud drive adapter and to perform database operations
*/
const googledrive = require('./googledrive');
const onedrive = require('./onedrive');
const User = require('../model/user-model');
const File = require('../model/file-model');
const FileSnapshot = require('../model/file-snapshot-model');
const GroupSnapshot = require('../model/group-snapshot-model');
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
async function takeFileSnapshot(clouddrive, token, email) {
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

// get the id of the user's access control policy for the specific requirement/query
async function getOneAccessControlPolicy(email, requirement) {
  const user = await User.findOne({ email });
  const accessControls = user.accessPolicies;
  let id = null;
  accessControls.forEach((element) => {
    if (element.requirement === requirement) {
      id = element._id;
    }
  });
  return id;
}

/*
Updating access policy in the DB
(requirement is the search query associated with the access policy)
*/
// eslint-disable-next-line consistent-return
async function updateAccessPolicy(type, requirement, newValue, email) {
  const id = await getOneAccessControlPolicy(email, requirement);
  if (type === 'ar') {
    AccessPolicy.updateOne({ _id: id }, { $push: { ar: newValue } })
      .then(() => requirement);
  } else if (type === 'dr') {
    AccessPolicy.updateOne({ _id: id }, { $push: { dr: newValue } })
      .then(() => requirement);
  } else if (type === 'aw') {
    AccessPolicy.updateOne({ _id: id }, { $push: { aw: newValue } })
      .then(() => requirement);
  } else if (type === 'dw') {
    AccessPolicy.updateOne({ _id: id }, { $push: { dw: newValue } })
      .then(() => requirement);
  } else {
    return null;
  }
}

async function deletingAccessPolicyRequirement(requirement, email) {
  const id = await getOneAccessControlPolicy(email, requirement);
  await AccessPolicy.remove({ _id: id });
  const user = await User.find({ email });
  const accessControls = user[0].accessPolicies;
  const newControls = accessControls.filter((policy) => policy._id !== id);
  await User.updateOne({ email }, { accessPolicies: newControls });
  return newControls;
}

async function editAccessControl(requirement, type, prevControl, newControl, email) {
  const id = await getOneAccessControlPolicy(email, requirement);
  const accessPolicy = await AccessPolicy.findOne({ _id: id });
  const newControls = accessPolicy[type].filter((old) => old !== prevControl);
  newControls.push(newControl);
  switch (type) {
    case 'ar':
      await AccessPolicy.updateOne({ _id: id }, { ar: newControls });
      break;
    case 'aw':
      await AccessPolicy.updateOne({ _id: id }, { aw: newControls });
      break;
    case 'dw':
      await AccessPolicy.updateOne({ _id: id }, { dw: newControls });
      break;
    case 'dr':
      await AccessPolicy.updateOne({ _id: id }, { dr: newControls });
      break;
    default:
      break;
  }
  return newControls;
}

async function deletingAccessControlsInRequirement(requirement, type, prevControl, email) {
  const id = await getOneAccessControlPolicy(email, requirement);
  const accessPolicy = await AccessPolicy.findOne({ _id: id });
  const newControls = accessPolicy[type].filter((old) => old !== prevControl);
  switch (type) {
    case 'ar':
      await AccessPolicy.updateOne({ _id: id }, { ar: newControls });
      break;
    case 'aw':
      await AccessPolicy.updateOne({ _id: id }, { aw: newControls });
      break;
    case 'dw':
      await AccessPolicy.updateOne({ _id: id }, { dw: newControls });
      break;
    case 'dr':
      await AccessPolicy.updateOne({ _id: id }, { dr: newControls });
      break;
    default:
      break;
  }
  return newControls;
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

// get all the user's access control policies
async function getAccessControlPolicies(email) {
  const user = await User.findOne({ email });
  const accessControls = user.accessPolicies;
  const ids = [];
  accessControls.forEach((element) => {
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
  const { files } = user[0];
  const ids = [];
  files.forEach((element) => {
    ids.push(element._id);
  });
  const allFiles = await File.find({ _id: { $in: ids } });
  console.log(allFiles);
  return allFiles;
}

function removeDuplicates(filelist) {
  const fileIdSet = new Set(filelist.map((file) => file.id));
  const files = [...fileIdSet].map((id) => filelist.find((file) => file.id === id)).filter(Boolean);
  return files;
}

function findIntersection(filelist, searchFiles) {
  const files = searchFiles
    .filter((file) => filelist.some((otherFile) => file.id === otherFile.id));
  return files;
}

// Filter list of files based on given operator and value
async function searchFilter(op, value, snapshotFiles, groupOff, email) {
  const files = [];
  const ids = [];
  const user = await User.find({ email });
  const { groupSnapshots } = user[0];
  const groupIds = [];
  groupSnapshots.forEach((element) => {
    groupIds.push(element._id);
  });
  const groups = await GroupSnapshot.find({ _id: { $in: groupIds } });
  const groupNames = [];
  groups.forEach((e) => {
    if (e.groupMembers.includes(value)) {
      if (!groupNames.includes(e.groupName)) {
        groupNames.push(e.groupName.trim());
      }
    }
  });
  const fileList = [];
  switch (op) {
    case 'drive':
      snapshotFiles.forEach((val, fileId) => {
        ids.push(fileId);
      });
      for (let i = 0; i < ids.length; i += 1) {
        const file = await File.findOne({ id: ids[i] }).sort({ createdAt: -1 });
        fileList.push(file);
      }
      for (let i = 0; i < fileList.length; i += 1) {
        const { drive } = fileList[i];
        const reg = new RegExp(value, 'gi');
        if (drive.match(reg)) {
          files.push(fileList[i]);
        }
      }
      break;
    case 'creator':
    case 'owner':
      snapshotFiles.forEach((val, fileId) => {
        ids.push(fileId);
      });
      for (let i = 0; i < ids.length; i += 1) {
        const file = await File.findOne({ id: ids[i] }).sort({ createdAt: -1 });
        fileList.push(file);
      }
      for (let i = 0; i < fileList.length; i += 1) {
        if (fileList[i].owner.email === value) {
          files.push(fileList[i]);
        }
      }
      break;
    case 'from':
      snapshotFiles.forEach((val, fileId) => {
        ids.push(fileId);
      });
      for (let i = 0; i < ids.length; i += 1) {
        const file = await File.findOne({ id: ids[i] }).sort({ createdAt: -1 });
        fileList.push(file);
      }
      for (let i = 0; i < fileList.length; i += 1) {
        if (fileList[i].sharingUser) {
          if (fileList[i].sharingUser.email === value) {
            files.push(fileList[i]);
          }
        }
      }
      break;
    case 'to':
      snapshotFiles.forEach((val, fileId) => {
        const perms = val;
        for (let i = 0; i < perms.length; i += 1) {
          if (perms[i].inheritedFrom == null && perms[i].email === value) {
            ids.push(fileId);
          }
        }
      });
      for (let i = 0; i < ids.length; i += 1) {
        const file = await File.findOne({ id: ids[i] }).sort({ createdAt: -1 });
        files.push(file);
      }
      break;
    case 'readable':
      if (groupOff) {
        snapshotFiles.forEach((val, fileId) => {
          const perms = val;
          for (let i = 0; i < perms.length; i += 1) {
            if ((perms[i].roles[0] === 'reader' || perms[i].roles[0] === 'writer') && perms[i].email === value) {
              ids.push(fileId);
            }
          }
        });
        for (let i = 0; i < ids.length; i += 1) {
          const file = await File.findOne({ id: ids[i] }).sort({ createdAt: -1 });
          files.push(file);
        }
      } else {
        snapshotFiles.forEach((val, fileId) => {
          const perms = val;
          for (let i = 0; i < perms.length; i += 1) {
            if ((perms[i].roles[0] === 'reader' || perms[i].roles[0] === 'writer') && perms[i].email === value) {
              ids.push(fileId);
            } else if ((perms[i].roles[0] === 'reader' || perms[i].roles[0] === 'writer') && groupNames.includes(perms[i].displayName)) {
              ids.push(fileId);
            }
          }
        });
        for (let i = 0; i < ids.length; i += 1) {
          const file = await File.findOne({ id: ids[i] }).sort({ createdAt: -1 });
          files.push(file);
        }
      }
      break;
    case 'writable':
      if (groupOff) {
        snapshotFiles.forEach((val, fileId) => {
          const perms = val;
          for (let i = 0; i < perms.length; i += 1) {
            if (perms[i].roles[0] === 'writer' && perms[i].email === value) {
              ids.push(fileId);
            }
          }
        });
      } else {
        snapshotFiles.forEach((val, fileId) => {
          const perms = val;
          for (let i = 0; i < perms.length; i += 1) {
            if (perms[i].roles[0] === 'writer' && perms[i].email === value) {
              ids.push(fileId);
            } else if (perms[i].roles[0] === 'writer' && groupNames.includes(perms[i].displayName)) {
              ids.push(fileId);
            }
          }
        });
      }
      for (let i = 0; i < ids.length; i += 1) {
        const file = await File.findOne({ id: ids[i] }).sort({ createdAt: -1 });
        files.push(file);
      }
      break;
    case 'sharable':
      // only owners, organizers, fileOrganizers, and writers can share files
      if (groupOff) {
        snapshotFiles.forEach((val, fileId) => {
          const perms = val;
          for (let i = 0; i < perms.length; i += 1) {
            let role = perms[i].roles[0];
            if (perms[i].email === value && (role === 'writer' || role === 'fileOrganizer' || role === 'organizer' || role === 'owner')) {
              ids.push(fileId);
            }
          }
        });
      } else {
        snapshotFiles.forEach((val, fileId) => {
          const perms = val;
          for (let i = 0; i < perms.length; i += 1) {
            let role = perms[i].roles[0];
            if (perms[i].email === value && (role === 'writer' || role === 'fileOrganizer' || role === 'organizer' || role === 'owner')) {
              ids.push(fileId);
            } else if (groupNames.includes(perms[i].displayName) && (role === 'writer' || role === 'fileOrganizer' || role === 'organizer' || role === 'owner')) {
              ids.push(fileId);
            }
          }
        });
      }
      for (let i = 0; i < ids.length; i += 1) {
        const file = await File.findOne({ id: ids[i] }).sort({ createdAt: -1 });
        files.push(file);
      }
      break;
    case 'name':
      snapshotFiles.forEach((val, fileId) => {
        ids.push(fileId);
      });
      for (let i = 0; i < ids.length; i += 1) {
        const file = await File.findOne({ id: ids[i] }).sort({ createdAt: -1 });
        fileList.push(file);
      }
      for (let i = 0; i < fileList.length; i += 1) {
        const { name } = fileList[i];
        const reg = new RegExp(value, 'gi');
        if (name.match(reg)) {
          files.push(fileList[i]);
        }
      }
      break;
    case 'inFolder':
      snapshotFiles.forEach((val, fileId) => {
        ids.push(fileId);
      });
      for (let i = 0; i < ids.length; i += 1) {
        const file = await File.findOne({ id: ids[i] }).sort({ createdAt: -1 });
        fileList.push(file);
      }
      // Get files with direct parent that matches query value 
      for (let i = 0; i < fileList.length; i += 1) {
        if (fileList[i].parents[0]) {
          const { name } = fileList[i].parents[0];
          const reg = new RegExp(value, 'gi');
          if (name.match(reg)) {
            files.push(fileList[i]);
          }
        }
      }
      break;
    case 'folder':
      snapshotFiles.forEach((val, fileId) => {
        ids.push(fileId);
      });
      for (let i = 0; i < ids.length; i += 1) {
        const file = await File.findOne({ id: ids[i] }).sort({ createdAt: -1 });
        fileList.push(file);
      }
      // Get files with any parent (including subfolders) that matches query value 
      for (let i = 0; i < fileList.length; i += 1) {
        if (fileList[i].parents) {
          for (let j = 0; j < fileList[i].parents.length; j += 1) {
            const { name } = fileList[i].parents[j];
            const reg = new RegExp(value, 'gi');
            if (name.match(reg)) {
              files.push(fileList[i]);
              break;
            } 
          }
        }
      }
      break;
    case 'path':
      snapshotFiles.forEach((val, fileId) => {
        ids.push(fileId);
      });
      for (let i = 0; i < ids.length; i += 1) {
        const file = await File.findOne({ id: ids[i] }).sort({ createdAt: -1 });
        fileList.push(file);
      }
      let folders = value.split('/').reverse();
      let pathMatches = false;
      // Get files with direct parent that matches query value 
      for (let i = 0; i < fileList.length; i += 1) {
        if (fileList[i].parents[0]) {
          let parent = fileList[i].parents[0];
          pathMatches = true;
          // check if parents[0] is equal to first entry in folders.
          for (let j = 0; j < folders.length; j++) {

            let folder = folders[j];
            if (folder !== parent) {
              pathMatches = false;
              break;
            }
            const parentFile = await File.findOne({ name: parent }).sort({ createdAt: -1 });
            parent = parentFile.name;
          }

          if (pathMatches === true) {
            files.push(fileList[i]);
          }
        }
      }
      break;
    case 'sharing':
      if (value === 'none') {
        snapshotFiles.forEach((val, fileId) => {
          const perms = val;
          if (perms.length === 1 && perms[0].roles[0] === 'owner') {
            ids.push(fileId);
          }
        });
        for (let i = 0; i < ids.length; i += 1) {
          const file = await File.findOne({ id: ids[i] }).sort({ createdAt: -1 });
          files.push(file);
        }
      } else if (value === 'anyone') {
        snapshotFiles.forEach((val, fileId) => {
          const perms = val;
          for (let i = 0; i < perms.length; i += 1) {
            if (perms[i].id === 'anyoneWithLink') {
              ids.push(fileId);
            }
          }
        });
        for (let i = 0; i < ids.length; i += 1) {
          const file = await File.findOne({ id: ids[i] }).sort({ createdAt: -1 });
          files.push(file);
        }
      } else if (value === 'domain') {
        const domain = email.split('@')[1];
        snapshotFiles.forEach((val, fileId) => {
          const perms = val;
          for (let i = 0; i < perms.length; i += 1) {
            if (perms[i].email?.split('@')[1] === domain) {
              ids.push(fileId);
            }
          }
        });
        for (let i = 0; i < ids.length; i += 1) {
          const file = await File.findOne({ id: ids[i] }).sort({ createdAt: -1 });
          files.push(file);
        }
      }
      break;
    case 'foldersonly':
      if (value === 'true') {
        snapshotFiles.forEach((val, fileId) => {
          ids.push(fileId);
        });
        for (let i = 0; i < ids.length; i += 1) {
          const file = await File.findOne({ id: ids[i] }).sort({ createdAt: -1 });
          fileList.push(file);
        }
        for (let i = 0; i < fileList.length; i += 1) {
          if (fileList[i].folder) {
            files.push(fileList[i]);
          }
        }
      }
      break;
    default:
      return 'Incorrect op';
  }
  return files;
}

function sortQuery(query) {
  const words = query.split(/ +(?=(?:(?:[^"]*"){2})*[^"]*$)/g);
  words.sort((a, b) => {
    if (a.includes(':') && !b.includes(':')) return 1;
    if (!a.includes(':') && b.includes(':')) return -1;
    return 0;
  });
  let s = '';
  let i = 0;
  const booleans = [];
  while (i < words.length && !words[i].includes(':')) {
    if (words[i] === 'or' || words[i] === 'and' || words[i] === 'not') {
      booleans.push(words[i]);
    }
    if (i > 0) s += ' ';
    s += words[i].trim();
    i += 1;
  }
  const operators = [];
  for (let j = i; j < words.length; j += 1) {
    const word = words[j].replace(/['"]+/g, '');
    operators.push(word);
  }
  return [booleans, operators, s];
}

// Get search results from file snapshots given search query
async function getSearchResults(searchQuery, snapshot, email) {
  if (searchQuery == null || searchQuery.query == null) return [];

  /* extract default string and operators from query */
  const queryArray = sortQuery(searchQuery.query);
  const booleans = queryArray[0]; // string
  const operators = queryArray[1]; // array of strings containing "operation:value"
  const searchString = queryArray[2];

  let files = [];

  let fileSnapshot;
  let snapshotFiles;
  // get the most recent file snapshot from the user if snapshot not specified
  if (!snapshot) {
    const user = await User.find({ email });
    const { fileSnapshots } = user[0];
    const ids = [];
    fileSnapshots.forEach((element) => {
      ids.push(element._id);
    });
    fileSnapshot = await FileSnapshot.find({ _id: { $in: ids } })
      .sort({ createdAt: -1 })
      .limit(1);
    // get all files from snapshot
    snapshotFiles = fileSnapshot[0].files;
  } else {
    // use file snapshot selected by the user
    snapshotFiles = snapshot[0].files;
  }
  // iterate through operators
  if (operators.length > 0) {
    let groupOff = false;
    if (operators.includes('groups:off')) {
      groupOff = true;
      const index = operators.indexOf('groups:off');
      operators.splice(index, 1);
    }

    let counter = 0;
    for (let i = 0; i < operators.length; i += 1) {
      const opPair = operators[i];
      const op = opPair.substring(0, opPair.indexOf(':'));
      let val = opPair.substring(opPair.indexOf(':') + 1);

      if (val === 'me') {
        val = email;
      }

      // get search results for the operator
      const searchFiles = await searchFilter(op, val, snapshotFiles, groupOff, email);
      if (searchFiles === 'Incorrect op') {
        return 'Incorrect op';
      }
      if (booleans[counter] === 'or' && i > 0) {
        for (let j = 0; j < searchFiles.length; j += 1) {
          files.push(searchFiles[j]);
          counter += 1;
        }
        files = removeDuplicates(files);
      } else if (booleans[counter] === 'and' && i > 0) {
        files = findIntersection(files, searchFiles);
        counter += 1;
      } else {
        for (let j = 0; j < searchFiles.length; j += 1) {
          files.push(searchFiles[j]);
        }
        files = removeDuplicates(files);
      }
    }
  } else {
    // default file name search if no operators
    const fileList = [];
    const ids = [];
    snapshotFiles.forEach((val, fileId) => {
      ids.push(fileId);
    });
    for (let i = 0; i < ids.length; i += 1) {
      const file = await File.findOne({ id: ids[i] }).sort({ createdAt: -1 });
      fileList.push(file);
    }
    for (let i = 0; i < fileList.length; i += 1) {
      const { name } = fileList[i];
      const reg = new RegExp(searchString, 'gi');
      if (name.match(reg)) {
        files.push(fileList[i]);
      }
    }
  }
  return files;
}

/*
Check if the list of files along with the value and role
are allowed via the user's access control policies
*/
// eslint-disable-next-line consistent-return
async function checkAgainstAccessPolicy(email, files, value, role) {
  const policies = await getAccessControlPolicies(email);
  let reader; // true for reader and false for writer
  switch (role) {
    case 'reader':
      reader = true;
      break;
    case 'commenter':
      reader = true;
      break;
    default:
      reader = false;
      break;
  }
  for (let x = 0; x < policies.length; x += 1) {
    const policy = policies[x];
    const query = { query: policy.requirement };
    const res = await getSearchResults(query, false, email);
    for (let i = 0; i < res.length; i += 1) {
      for (let j = 0; j < files.length; j += 1) {
        const fileid = files[j];
        if (fileid === res[i].id) { // file is part of the query, so check the access controls
          if (reader) { // check reader roles
            const { ar } = policy;
            const { dr } = policy;
            if (ar.length > 0) {
              const ans = ar.filter((allowed) => allowed === value);
              if (ans.length !== 0) {
                return true;
              }
            }
            if (dr.length > 0) {
              const ans = dr.filter((allowed) => allowed === value);
              if (ans.length !== 0) {
                return false;
              }
            } // passed all reader checks
          }
          const { aw } = policy;
          const { dw } = policy;
          if (aw.length > 0) {
            const ans = aw.filter((allowed) => allowed === value);
            if (ans.length !== 0) {
              return true;
            }
          }
          if (dw.length > 0) {
            const ans = dw.filter((allowed) => allowed === value);
            if (ans.length !== 0) {
              return false;
            }
          }
          return false;
        }
      }
    }
  }
}

module.exports = {
  auth,
  takeFileSnapshot,
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
  editAccessControl,
  checkAgainstAccessPolicy,
};
