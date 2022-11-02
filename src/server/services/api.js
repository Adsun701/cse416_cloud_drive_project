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
  const removedAccessPolicy = await AccessPolicy.findOne({ requirement });
  await AccessPolicy.remove({ requirement });
  const user = await User.find({ email });
  const accessControls = user[0].accessPolicies;
  // console.log(removedAccessPolicy);
  const newControls = accessControls.filter((policy) => policy !== removedAccessPolicy._id);
  // console.log(newControls);
  await User.updateOne({ email }, { accessPolicies: newControls });
  return newControls;
}

async function editAccessControl(requirement, type, prevControl, newControl) {
  const accessPolicy = await AccessPolicy.findOne({ requirement });
  const newControls = accessPolicy[type].filter((old) => old !== prevControl);
  newControls.push(newControl);
  switch (type) {
    case 'ar':
      await AccessPolicy.updateOne({ requirement }, { ar: newControls });
      break;
    case 'aw':
      await AccessPolicy.updateOne({ requirement }, { aw: newControls });
      break;
    case 'dw':
      await AccessPolicy.updateOne({ requirement }, { dw: newControls });
      break;
    case 'dr':
      await AccessPolicy.updateOne({ requirement }, { dr: newControls });
      break;
    default:
      break;
  }
  return newControls;
}

async function deletingAccessControlsInRequirement(requirement, type, prevControl) {
  const accessPolicy = await AccessPolicy.findOne({ requirement });
  const newControls = accessPolicy[type].filter((old) => old !== prevControl);
  switch (type) {
    case 'ar':
      await AccessPolicy.updateOne({ requirement }, { ar: newControls });
      break;
    case 'aw':
      await AccessPolicy.updateOne({ requirement }, { aw: newControls });
      break;
    case 'dw':
      await AccessPolicy.updateOne({ requirement }, { dw: newControls });
      break;
    case 'dr':
      await AccessPolicy.updateOne({ requirement }, { dr: newControls });
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

async function getAccessControlPolicies(email) {
  const user = await User.findOne({ email });
  const accessControls = user.accessPolicies;
  const ids = [];
  accessControls.forEach((element) => {
    // eslint-disable-next-line no-underscore-dangle
    ids.push(element._id);
  });
  const allPolicies = await AccessPolicy.find({ _id: { $in: ids } });
  // console.log(allPolicies);
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
  const { files } = user[0];
  const ids = [];
  files.forEach((element) => {
    // eslint-disable-next-line no-underscore-dangle
    ids.push(element._id);
  });
  const allFiles = await File.find({ _id: { $in: ids } });
  console.log(allFiles);
  return allFiles;
}

function removeDuplicates(filelist) {
  const fileIdSet = new Set(filelist.map((file) => file.id));
  const files = [...fileIdSet].map(id => filelist.find(file => file.id === id)).filter(Boolean);
  return files;
}

function findIntersection(filelist, searchFiles) {
  const files = searchFiles.filter((file) => filelist.some((otherFile) => file.id === otherFile.id));
  return files;
}

// Get search results from file snapshots given search query
async function getSearchResults(searchQuery, snapshot, email) {
  if (searchQuery == null || searchQuery.query == null) return [];

  /* extract default string and operators from query */
  queryArray = sortQuery(searchQuery.query);
  booleans = queryArray[0]; // string
  operators = queryArray[1]; // array of strings containing "operation:value"
  console.log("booleans");
  console.log(booleans);

  let files = [];

  let fileSnapshot;
  let snapshotFiles;
  // console.log("BEFORE THE !");
  // get the most recent file snapshot from the user if snapshot not specified
  if (!snapshot) {
    // console.log("INSIDE");
    const user = await User.find({ email });
    const { fileSnapshots } = user[0];
    const ids = [];
    fileSnapshots.forEach((element) => {
      // eslint-disable-next-line no-underscore-dangle
      ids.push(element._id);
    });
    fileSnapshot = await FileSnapshot.find({ _id: { $in: ids } })
      .sort({ createdAt: -1 })
      .limit(1);
    // console.log(fileSnapshot);
    // get all files from snapshot
    snapshotFiles = fileSnapshot[0].files;
  } else {
    // use file snapshot selected by the user
    snapshotFiles = snapshot[0].files;
  }
  // console.log(snapshotFiles);
  // iterate through operators
  if (operators.length > 0) {
    let groupOff = false;
    if (operators.includes('groups:off')) {
      groupOff = true;
      let index = operators.indexOf('groups:off');
      operators.splice(index, 1);
    }
    
    let counter = 0;
    for (let i = 0; i < operators.length; i++) {
      const opPair = operators[i];
      const op = opPair.substring(0, opPair.indexOf(':'));
      let val = opPair.substring(opPair.indexOf(':') + 1);

      if (val == 'me') {
        val = email;
      }

      // get search results for the operator
      // eslint-disable-next-line no-await-in-loop
      const searchFiles = await searchFilter(op, val, snapshotFiles, groupOff, email);
      console.log("got here");
      console.log(booleans[counter]);
      if (searchFiles === 'Incorrect op') {
        return 'Incorrect op';
      }
      if (booleans[counter] === "or" && i > 0) { 
        console.log("OR");
        for (let j = 0; j < searchFiles.length; j++) {
          files.push(searchFiles[j]);
          counter += 1;
        }
        files = removeDuplicates(files);
      } else if (booleans[counter] === "and" && i > 0) {
          console.log("AND");
          files = findIntersection(files, searchFiles);
          counter += 1;
      } else {
        for (let j = 0; j < searchFiles.length; j++) {
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
    for (let i = 0; i < ids.length; i++) {
      const file = await File.findOne({ id: ids[i] }).sort({ createdAt: -1 });
      fileList.push(file);
    }
    for (let i = 0; i < fileList.length; i++) {
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
    let policy = policies[x];
    const query = { query: policy.requirement };
    let res = await getSearchResults(query, false, email);
    for (let i = 0; i < res.length; i += 1) {
      for (let j = 0; j < files.length; j += 1) {
        let fileid = files[j];
        if (fileid === res[i].id) { // file is part of the query, so check the access controls
          if (reader) { // check reader roles
            const { ar } = policy;
            const { dr } = policy;
            if (ar.length > 0) {
              const ans = ar.filter((allowed) => allowed === value);
              console.log(ans);
              if (ans.length !== 0) {
                console.log("ret true");
                return true;
              }
            }
            if (dr.length > 0) {
              const ans = dr.filter((allowed) => allowed === value);
              console.log(ans);
              if (ans.length !== 0) {
                return false;
              }
            } // passed all reader checks
          }
          const { aw } = policy;
          const { dw } = policy;
          if (aw.length > 0) {
            const ans = aw.filter((allowed) => allowed === value);
            console.log(ans);
            if (ans.length !== 0) {
              return true;
            }
          }
          if (dw.length > 0) {
            const ans = dw.filter((allowed) => allowed === value);
            console.log(ans);
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

// Filter list of files based on given operator and value
async function searchFilter(op, value, snapshotFiles, groupOff, email) {
  let files = [];
  const ids = [];
  const user = await User.find({ email: email });
  const { groupSnapshots } = user[0];
  const groupIds = [];
  groupSnapshots.forEach((element) => {
    // eslint-disable-next-line no-underscore-dangle
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
  console.log(snapshotFiles);
  switch (op) {
    case 'drive':
      break;
    case 'creator':
      op = 'owner';
    case 'owner':
      snapshotFiles.forEach((val, fileId) => {
        ids.push(fileId);
      });
      for (let i = 0; i < ids.length; i++) {
        const file = await File.findOne({ id: ids[i] }).sort({ createdAt: -1 });
        fileList.push(file);
      }
      for (let i = 0; i < fileList.length; i++) {
        if (fileList[i].owner.email == value) {
          files.push(fileList[i]);
        }
      }
      break;
    case 'from':
      snapshotFiles.forEach((val, fileId) => {
        ids.push(fileId);
      });
      for (let i = 0; i < ids.length; i++) {
        const file = await File.findOne({ id: ids[i] }).sort({ createdAt: -1 });
        fileList.push(file);
      }
      for (let i = 0; i < fileList.length; i++) {
        if (fileList[i].sharingUser) {
          if (fileList[i].sharingUser.email == value) {
            files.push(fileList[i]);
          }
        }
      }
      break;
    case 'to':
      snapshotFiles.forEach((val, fileId) => {
        const perms = val;
        for (let i = 0; i < perms.length; i++) {
          if (perms[i].inheritedFrom == null && perms[i].email == value) {
            ids.push(fileId);
          }
        }
      });
      for (let i = 0; i < ids.length; i++) {
        const file = await File.findOne({ id: ids[i] }).sort({ createdAt: -1 });
        files.push(file);
      }
      break;
    case 'readable':
      if (groupOff) {
        snapshotFiles.forEach((val, fileId) => {
          let perms = val;
          for(let i = 0; i < perms.length; i++) {
            if(perms[i].roles[0] == 'reader' && perms[i].email == value) {
              ids.push(fileId);
            }
          }
        });
        for (let i = 0; i < ids.length; i++) {
          let file = await File.findOne({ id: ids[i] }).sort({ createdAt: -1 });
          files.push(file);
        }
      } else {
        snapshotFiles.forEach((val, fileId) => {
          let perms = val;
          for(let i = 0; i < perms.length; i++) {
            if(perms[i].roles[0] == 'reader' && perms[i].email == value) {
              ids.push(fileId);
            } else if (perms[i].roles[0] == 'reader' && groupNames.includes(perms[i].displayName)) {
              ids.push(fileId);
            }
          }
        });
        for (let i = 0; i < ids.length; i++) {
          let file = await File.findOne({ id: ids[i] }).sort({ createdAt: -1 });
          files.push(file);
        }
      }
      break;
    case 'writable':
      if (groupOff) {
        snapshotFiles.forEach((val, fileId) => {
          const perms = val;
          for (let i = 0; i < perms.length; i++) {
            if (perms[i].roles[0] == 'writer' && perms[i].email == value) {
              ids.push(fileId);
            }
          }
        });
      } else {
        snapshotFiles.forEach((val, fileId) => {
          const perms = val;
          for (let i = 0; i < perms.length; i++) {
            if (perms[i].roles[0] == 'writer' && perms[i].email == value) {
              ids.push(fileId);
            } else if (perms[i].roles[0] == 'writer' && groupNames.includes(perms[i].displayName)) {
              ids.push(fileId);
            }
          }
        });
      }
      for (let i = 0; i < ids.length; i++) {
        const file = await File.findOne({ id: ids[i] }).sort({ createdAt: -1 });
        files.push(file);
      }
      break;
    case 'sharable':
      break;
    case 'name':
      snapshotFiles.forEach((val, fileId) => {
        ids.push(fileId);
      });
      for (let i = 0; i < ids.length; i++) {
        const file = await File.findOne({ id: ids[i] }).sort({ createdAt: -1 });
        fileList.push(file);
      }
      for (let i = 0; i < fileList.length; i++) {
        const { name } = fileList[i];
        const reg = new RegExp(value, 'gi');
        if (name.match(reg)) {
          files.push(fileList[i]);
        }
      }
      break;
    case 'inFolder':
      break;
    case 'folder':
      snapshotFiles.forEach((val, fileId) => {
        ids.push(fileId);
      });
      for (let i = 0; i < ids.length; i++) {
        let file = await File.findOne({ id: ids[i] }).sort({ createdAt: -1 });
        fileList.push(file);
      }
      for (let i = 0; i < fileList.length; i++) {
        let name = fileList[i].name;
        const reg = new RegExp(value, "gi");
        if (name.match(reg) && fileList[i].folder) {
          files.push(fileList[i])
        }
      }
      break;
    case 'path':
      break;
    case 'sharing':
      if (value == 'none') {
        snapshotFiles.forEach((val, fileId) => {
          const perms = val;
          if (perms.length == 1 && perms[0].roles[0] == 'owner') {
            ids.push(fileId);
          }
        });
        for (let i = 0; i < ids.length; i++) {
          const file = await File.findOne({ id: ids[i] }).sort({ createdAt: -1 });
          files.push(file);
        }
      } else if (value == 'anyone') {
        snapshotFiles.forEach((val, fileId) => {
          const perms = val;
          for (let i = 0; i < perms.length; i++) {
            if (perms[i].id == 'anyoneWithLink') {
              ids.push(fileId);
            }
          }
        });
        for (let i = 0; i < ids.length; i++) {
          const file = await File.findOne({ id: ids[i] }).sort({ createdAt: -1 });
          files.push(file);
        }
      } else if (value == 'domain') {
        let domain = email.split('@')[1];
        snapshotFiles.forEach((val, fileId) => {
          const perms = val;
          for (let i = 0; i < perms.length; i++) {
            if (perms[i].email?.split('@')[1] == domain) {
              ids.push(fileId);
            }
          }
        });
        for (let i = 0; i < ids.length; i++) {
          const file = await File.findOne({ id: ids[i] }).sort({ createdAt: -1 });
          files.push(file);
        }
      }
      break;
    case 'foldersonly':
      if (value == 'true') {
        snapshotFiles.forEach((val, fileId) => {
          ids.push(fileId);
        });
        for (let i = 0; i < ids.length; i++) {
          let file = await File.findOne({ id: ids[i] }).sort({ createdAt: -1 });
          fileList.push(file);
        }
        for (let i = 0; i < fileList.length; i++) {
          if (fileList[i].folder) {
            files.push(fileList[i])
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
  // words = query.replace(/ +(?= )/g, '').split(' ');

  words = query.split(/ +(?=(?:(?:[^"]*"){2})*[^"]*$)/g);
  console.log(words);
  words.sort((a, b) => {
    if (a.includes(':') && !b.includes(':')) return 1;
    if (!a.includes(':') && b.includes(':')) return -1;
    return 0;
  });
  s = '';
  i = 0;
  let booleans = []
  while (i < words.length && !words[i].includes(':')) {
    if (words[i] == "or" || words[i] == "and" || words[i] == "not") {
      booleans.push(words[i]);
    }
    if (i > 0) s += ' ';
    s += words[i].trim();
    i++;
  }
  operators = [];
  for (j = i; j < words.length; j++) {
    const word = words[j].replace(/['"]+/g, '');
    operators.push(word);
  }
  console.log(booleans);
  console.log(operators);
  return [booleans, operators];
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
  editAccessControl,
  checkAgainstAccessPolicy,
};
