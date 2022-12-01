/* eslint-disable no-await-in-loop */
/* eslint-disable no-underscore-dangle */
/*
Main interface to act as cloud drive adapter and to perform database operations
*/
const winston = require('winston');
const { format, createLogger, transports } = require('winston');
const googledrive = require('./googledrive');
const onedrive = require('./onedrive');
const User = require('../model/user-model');
const File = require('../model/file-model');
const FileSnapshot = require('../model/file-snapshot-model');
const GroupSnapshot = require('../model/group-snapshot-model');
const AccessPolicy = require('../model/access-policy-model');
const SearchQuery = require('../model/search-query-model');
const Permission = require('../model/permission-model');

const {
  combine, timestamp, prettyPrint,
} = format;

const logger = createLogger({
  level: 'info',
  format: combine(
    timestamp({
      format: 'MMM-DD-YYYY HH:mm:ss',
    }),
    prettyPrint(),
  ),
  transports: [new winston.transports.File({ filename: 'changes.log' }), new winston.transports.File({ filename: 'debug.log', level: 'debug' })],
});

/*
Handling the aftermath of authentication for the specifc clouddrive
*/
async function auth(clouddrive, token, email) {
  if (clouddrive === 'google') {
    googledrive.googleAuth(token, email);
  } else if (clouddrive === 'microsoft') {
    onedrive.microsoftAuth(token, email);
  }
  logger.debug(`${clouddrive} account ${email} authenticated.`);
}

// saveSnapshot - take and save a file snapshot to the DB
async function takeFileSnapshot(clouddrive, token, email) {
  let snapshot = {};
  if (clouddrive === 'google') {
    snapshot = googledrive.saveSnapshot(token, email);
  } else if (clouddrive === 'microsoft') {
    snapshot = onedrive.saveSnapshot(token, email);
  }
  logger.debug(`file snapshot taken for ${clouddrive} account ${email}`);
  return snapshot;
}

async function findFileInSnapshot(id, fileSnapshotTime) {
  const file1 = await File
    .find({ id, createdAt: { $gte: fileSnapshotTime } })
    .sort({ createdAt: 1 })
    .limit(1);
  const file2 = await File
    .find({ id, createdAt: { $lte: fileSnapshotTime } })
    .sort({ createdAt: -1 })
    .limit(1);
  const a = fileSnapshotTime - file1.createdAt;
  const b = fileSnapshotTime - file2.createdAt;
  if (a < b) {
    return file1[0];
  }
  return file2[0];
}

async function getMostRecentFileSnapshot(email) {
  const user = await User.findOne({ email });
  const filesnapshotList = user?.fileSnapshots;
  if (filesnapshotList && filesnapshotList.length > 0) {
    const filesnapshotid = filesnapshotList[filesnapshotList.length - 1];
    const filesnapshot = await FileSnapshot.findOne({ _id: filesnapshotid });
    return filesnapshot;
  }
  console.log('no file snapshots available');
  return null;
}

// updatePermission of a file
async function updatePermission(clouddrive, token, fileid, permid, googledata, onedriveRole, driveid, email) {
  if (clouddrive === 'google') {
    googledrive.updatePermission(token, fileid, permid, googledata);
  } else if (clouddrive === 'microsoft') {
    onedrive.updatePermission(token, onedriveRole, fileid, permid, driveid);
  }
  const filesnapshot = await getMostRecentFileSnapshot(email);
  // console.log(filesnapshot);
  const filesnapshotTime = filesnapshot.createdAt;
  // console.log(filesnapshotTime);
  const updatedFile = await findFileInSnapshot(fileid, filesnapshotTime);
  // console.log(updatedFile);
  if (updatedFile?.permissions && updatedFile.permissions.length > 0) {
    const permList = [];
    let newPermId = null;
    let newRole = [];
    for (let i = 0; i < updatedFile.permissions.length; i += 1) {
      // console.log(updatedFile.permissions[i].id === permid);
      // console.log(updatedFile.permissions[i].id);
      // console.log(permid);
      // console.log(updatedFile._id);
      if (updatedFile.permissions[i].id === permid) {
        if (clouddrive === 'google') {
          newRole = [googledata?.role];
        } else {
          newRole = onedriveRole?.roles;
        }
        newPermId = updatedFile.permissions[i]._id;
      } else {
        permList.push(updatedFile.permissions[i]);
      }
    }
    await Permission.updateOne({ _id: newPermId }, { roles: newRole }).then(async () => {
      await Permission.findOne({ _id: newPermId }).then(async (newPerms) => {
        if (newPerms) {
          permList.push(newPerms);
        }
        await File.updateOne({ _id: updatedFile._id }, { permissions: permList }).then(() => {});
      });
    // console.log(newPerms);
    });
    logger.info(`Permission updated for ${clouddrive} file ${fileid} with permission ${permid}`);
  }
}

// addPermissions for a singular file or multiple files
async function addPermissions(clouddrive, token, files, value, role, type = '', driveid, email) {
  // let newPerms = new Set();
  const filesnapshot = await getMostRecentFileSnapshot(email);
  const filesnapshotTime = filesnapshot.createdAt;
  const fileids = [];
  // console.log(files);
  for (let i = 0; i < files.length; i += 1) {
    await findFileInSnapshot(files[i], filesnapshotTime).then(async (updatedFile) => {
      fileids.push(updatedFile._id);
    });
  }
  console.log(fileids);
  if (clouddrive === 'google') {
    googledrive.addPermissions(token, files, value, type, role, fileids);
  } else if (clouddrive === 'microsoft') {
    onedrive.addPermissions(token, files, value, role, driveid, fileids);
  }
  // console.log(newPerms);
  // let filesnapshot = await getMostRecentFileSnapshot(email);
  // let filesnapshotTime = filesnapshot.createdAt;
  // files.forEach(async (fileid) => {
  //   await findFileInSnapshot(fileid, filesnapshotTime). then (async (updatedFile) => {
  //     // const newPermission = new Permission({
  //     //   id: element.permissions[i].id,
  //     //   email: element.permissions[i].emailAddress,
  //     //   displayName: element.permissions[i].displayName ? element.permissions[i].displayName : element.permissions[i].id,
  //     //   roles: [element.permissions[i].role],
  //     //   inheritedFrom: null,
  //     // });
  //     // newPermission.save();
  //   });
  // })
  logger.info(`Permissions (with type ${type} and role ${role}) for user ${value} added for ${clouddrive} files ${files.join(',')}`);
}

/*
Delete permissions for a file using file id and permission id
*/
async function deletePermission(clouddrive, token, fileid, permid, driveid, email) {
  if (clouddrive === 'google') {
    googledrive.removePermission(token, fileid, permid);
  } else if (clouddrive === 'microsoft') {
    onedrive.removePermission(token, fileid, permid, driveid);
  }
  const filesnapshot = await getMostRecentFileSnapshot(email);
  const filesnapshotTime = filesnapshot.createdAt;
  const updatedFile = await findFileInSnapshot(fileid, filesnapshotTime);
  if (updatedFile?.permissions && updatedFile.permissions.length > 0) {
    const permList = [];
    let deletePermId = null;
    for (let i = 0; i < updatedFile.permissions.length; i += 1) {
      if (updatedFile.permissions[i].id === permid) {
        deletePermId = updatedFile.permissions[i]._id;
      } else {
        permList.push(updatedFile.permissions[i]);
      }
    }
    await Permission.deleteOne({ _id: deletePermId }).then(async () => {
      await File.updateOne({ _id: updatedFile._id }, { permissions: permList }).then(() => {});
    });
  }
  logger.info(`Permission ${permid} for ${clouddrive} file ${fileid} deleted`);
}

// get all the user's access control policies
async function getAccessControlPolicies(email) {
  const user = await User.findOne({ email });
  const accessControls = user?.accessPolicies;
  const ids = [];
  accessControls.forEach((element) => {
    ids.push(element._id);
  });
  const allPolicies = await AccessPolicy.find({ _id: { $in: ids } });
  logger.debug(`Obtained access control policies for account ${email}.`);
  return allPolicies;
}

// get the id of the user's access control policy for the specific requirement/query
async function getOneAccessControlPolicy(email, requirement) {
  const accessControls = await getAccessControlPolicies(email);
  console.log(accessControls);
  console.log(requirement);
  let id = null;
  for (let i = 0; i < accessControls.length; i += 1) {
    console.log(accessControls[i].requirement);
    if (accessControls[i].requirement === requirement) {
      id = accessControls[i]._id;
    }
  }
  console.log('getting one access control policy');
  console.log(id);
  logger.debug(`Obtained access control policy for account ${email} and requirement ${requirement}: ${id}.`);
  return id;
}

/*
Updating access policy in the DB
(requirement is the search query associated with the access policy)
*/
// eslint-disable-next-line consistent-return
async function updateAccessPolicy(type, requirement, newValue, email) {
  logger.debug(`Updating access policy of type ${type}, with requirement ${requirement}, a new value of ${newValue}, for account ${email}.`);
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
  logger.debug(`Deleting access policy requirement ${requirement} for account ${email}.`);
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
  logger.debug(`Edited access control with requirement ${requirement}, type ${type}, changed from ${prevControl} to ${newControl}, for account ${email}.`);
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
  logger.debug(`Deleted access controls in requirement ${requirement} of type ${type} for account ${email}.`);
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
  logger.debug(`Added new access policy for account ${email} with requirement ${requirement}, with arStr ${arStr}, drStr ${drStr}, awStr ${awStr}, and dwStr ${dwStr}.`);
  return accessPolicy;
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
  logger.debug(`Added query ${query} for account ${email}.`);
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
  logger.debug(`Retrieved ${email}'s recent queries.`);
  return recentQueries;
}

/*
Retrieve all of the user's files
*/
async function getAllFiles(email) {
  const user = await User.find({ email });
  if (user.length === 0) {
    return [];
  }
  const { files } = user[0];
  const ids = [];
  files.forEach((element) => {
    ids.push(element._id);
  });
  const allFiles = await File.find({ _id: { $in: ids } });
  logger.debug(`Retrieved all files for account ${email}.`);
  return allFiles;
}

function removeDuplicates(filelist) {
  logger.debug(`Removing duplicates for filelist ${filelist}.`);
  const fileIdSet = new Set(filelist.map((file) => file.id));
  const files = [...fileIdSet].map((id) => filelist.find((file) => file.id === id)).filter(Boolean);
  return files;
}

function findIntersection(filelist, searchFiles) {
  logger.debug(`Finding intersection for filelist ${filelist} with search files ${searchFiles}.`);
  const files = searchFiles
    .filter((file) => filelist.some((otherFile) => file.id === otherFile.id));
  return files;
}

function removeNegatedFiles(filelist, searchFiles) {
  logger.debug(`Removing negated files for filelist ${filelist} with search files ${searchFiles}.`);
  const fileIdSet = new Set(searchFiles.map((file) => file.id));
  const files = filelist.filter((file) => !fileIdSet.has(file.id));
  return files;
}

async function findParentFileInSnapshot(name, fileSnapshotTime) {
  const file1 = await File
    .find({ name, createdAt: { $gte: fileSnapshotTime } })
    .sort({ createdAt: 1 })
    .limit(1);
  const file2 = await File
    .find({ name, createdAt: { $lte: fileSnapshotTime } })
    .sort({ createdAt: -1 })
    .limit(1);
  const a = fileSnapshotTime - file1[0].createdAt;
  const b = fileSnapshotTime - file2[0].createdAt;
  if (a < b) {
    return file1[0];
  }
  return file2[0];
}

/*
  Recurse through path to find folder
*/
function findFolder(file, folders, level) {
  if (folders.length === level) {
    return file;
  }
  if (file.folder) {
    for (let i = 0; i < file.children.length; i++) {
      const subfolder = file.children[i];
      if (subfolder.name === folders[level]) {
        return findFolder(subfolder, folders, level + 1);
      }
    }
  }
}

// Filter list of files based on given operator and value
async function searchFilter(op, value, snapshotFiles, fileSnapshotTime, groupOff, email) {
  logger.debug(`Doing search filtering with op ${op}, value ${value}, snapshotFiles ${snapshotFiles}, groupOff ${groupOff}, and email ${email}.`);
  const files = [];
  const ids = [];
  const user = await User.find({ email });
  const { groupSnapshots } = user[0];
  const groupIds = [];
  groupSnapshots.forEach((element) => {
    groupIds.push(element._id);
  });
  const groups = await GroupSnapshot.find({ _id: { $in: groupIds } });
  const uniqueGroups = [];
  let groupNames = [];

  groups.forEach((e) => {
    if (!groupNames.includes(e.groupName)) {
      groupNames.push(e.groupName.trim());
      uniqueGroups.push(e);
    } else {
      const index = groupNames.indexOf(e.groupName);
      const a = Math.abs(fileSnapshotTime - e.createdAt);
      const b = Math.abs(fileSnapshotTime - uniqueGroups[index].createdAt);
      if (a < b) {
        uniqueGroups[index] = e;
      }
    }
  });
  groupNames = [];
  uniqueGroups.forEach((e) => {
    if (e.groupMembers.includes(value)) {
      groupNames.push(e.groupName.trim());
    }
  });

  // Check all ops that take user as input
  const userValues = ['creator', 'owner', 'from', 'to', 'readable', 'writable', 'sharable'];
  if (userValues.includes(op)) {
    // Default to the same domain as current user if omitted
    if (!value.includes('@')) {
      const domain = email.split('@')[1];
      value = `${value}@${domain}`;
    }
  }

  const fileList = [];
  switch (op) {
    case 'drive':
      snapshotFiles.forEach((val, fileId) => {
        ids.push(fileId);
      });
      for (let i = 0; i < ids.length; i += 1) {
        const file = await findFileInSnapshot(ids[i], fileSnapshotTime);
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
        const file = await findFileInSnapshot(ids[i], fileSnapshotTime);
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
        const file = await findFileInSnapshot(ids[i], fileSnapshotTime);
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
        const file = await findFileInSnapshot(ids[i], fileSnapshotTime);
        files.push(file);
      }
      break;
    case 'readable':
      if (groupOff) {
        snapshotFiles.forEach((val, fileId) => {
          const perms = val;
          for (let i = 0; i < perms.length; i += 1) {
            if ((perms[i].roles[0] === 'reader' || perms[i].roles[0] === 'writer' || perms[i].roles[0] === 'write' || perms[i].roles[0] === 'read') && perms[i].email === value) {
              ids.push(fileId);
            }
          }
        });
        for (let i = 0; i < ids.length; i += 1) {
          const file = await findFileInSnapshot(ids[i], fileSnapshotTime);
          files.push(file);
        }
      } else {
        snapshotFiles.forEach((val, fileId) => {
          const perms = val;
          for (let i = 0; i < perms.length; i += 1) {
            if ((perms[i].roles[0] === 'reader' || perms[i].roles[0] === 'writer' || perms[i].roles[0] === 'write' || perms[i].roles[0] === 'read') && perms[i].email === value) {
              ids.push(fileId);
            } else if ((perms[i].roles[0] === 'reader' || perms[i].roles[0] === 'writer' || perms[i].roles[0] === 'write' || perms[i].roles[0] === 'read') && groupNames.includes(perms[i].displayName)) {
              ids.push(fileId);
            }
          }
        });
        for (let i = 0; i < ids.length; i += 1) {
          const file = await findFileInSnapshot(ids[i], fileSnapshotTime);
          files.push(file);
        }
      }
      break;
    case 'writable':
      if (groupOff) {
        snapshotFiles.forEach((val, fileId) => {
          const perms = val;
          for (let i = 0; i < perms.length; i += 1) {
            if ((perms[i].roles[0] === 'writer' || perms[i].roles[0] === 'write' || perms[i].roles[0] === 'owner') && perms[i].email === value) {
              ids.push(fileId);
            }
          }
        });
      } else {
        snapshotFiles.forEach((val, fileId) => {
          const perms = val;
          for (let i = 0; i < perms.length; i += 1) {
            if ((perms[i].roles[0] === 'writer' || perms[i].roles[0] === 'write' || perms[i].roles[0] === 'owner') && perms[i].email === value) {
              ids.push(fileId);
            } else if ((perms[i].roles[0] === 'writer' || perms[i].roles[0] === 'write' || perms[i].roles[0] === 'owner') && groupNames.includes(perms[i].displayName)) {
              ids.push(fileId);
            }
          }
        });
      }
      for (let i = 0; i < ids.length; i += 1) {
        const file = await findFileInSnapshot(ids[i], fileSnapshotTime);
        files.push(file);
      }
      break;
    case 'sharable':
      // only owners, organizers, fileOrganizers, and writers can share files
      if (groupOff) {
        snapshotFiles.forEach((val, fileId) => {
          const perms = val;
          for (let i = 0; i < perms.length; i += 1) {
            const role = perms[i].roles[0];
            if (perms[i].email === value && (role === 'writer' || role === 'fileOrganizer' || role === 'organizer' || role === 'owner' || role === 'write')) {
              ids.push(fileId);
            }
          }
        });
      } else {
        snapshotFiles.forEach((val, fileId) => {
          const perms = val;
          for (let i = 0; i < perms.length; i += 1) {
            const role = perms[i].roles[0];
            if (perms[i].email === value && (role === 'writer' || role === 'fileOrganizer' || role === 'organizer' || role === 'owner' || role === 'write')) {
              ids.push(fileId);
            } else if (groupNames.includes(perms[i].displayName) && (role === 'writer' || role === 'fileOrganizer' || role === 'organizer' || role === 'owner' || role === 'write')) {
              ids.push(fileId);
            }
          }
        });
      }
      for (let i = 0; i < ids.length; i += 1) {
        const file = await findFileInSnapshot(ids[i], fileSnapshotTime);
        files.push(file);
      }
      break;
    case 'name':
      snapshotFiles.forEach((val, fileId) => {
        ids.push(fileId);
      });
      for (let i = 0; i < ids.length; i += 1) {
        const file = await findFileInSnapshot(ids[i], fileSnapshotTime);
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
        const file = await findFileInSnapshot(ids[i], fileSnapshotTime);
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
        const file = await findFileInSnapshot(ids[i], fileSnapshotTime);
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
        const file = await findFileInSnapshot(ids[i], fileSnapshotTime);
        fileList.push(file);
      }
      // Get folders in path
      const folders = value.split('/');

      let folder;
      for (const file of fileList) {
        if (file.name === folders[0] && file.folder) {
          folder = findFolder(file, folders, 1);
          break;
        }
      }
      if (folder) {
        for (let i = 0; i < folder.children.length; i += 1) {
          files.push(folder.children[i]);
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
          const file = await findFileInSnapshot(ids[i], fileSnapshotTime);
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
          const file = await findFileInSnapshot(ids[i], fileSnapshotTime);
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
          const file = await findFileInSnapshot(ids[i], fileSnapshotTime);
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
          const file = await findFileInSnapshot(ids[i], fileSnapshotTime);
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
  logger.debug(`Sorting query ${query}.`);
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
  logger.debug(`Getting search results for searchQuery ${searchQuery} with snapshot ${snapshot} and email ${email}.`);
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
    if (fileSnapshots.length === 0) {
      return 'No Snapshots';
    }
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
    fileSnapshot = snapshot;
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

    // check if path is used in conjunction with drive
    let ops = [];
    for (let i = 0; i < operators.length; i += 1) {
      const opPair = operators[i];
      let op = opPair.substring(0, opPair.indexOf(':'));
      ops.push(op);
    }
    if (ops.includes('path')) {
      if (!ops.includes('drive')) {
        return 'Path error';
      }
    }

    let counter = 0;
    let negate = false;
    let searchFiles = [];
    for (let i = 0; i < operators.length; i += 1) {
      const opPair = operators[i];
      let op = opPair.substring(0, opPair.indexOf(':'));
      let val = opPair.substring(opPair.indexOf(':') + 1);

      // check if operator is negated
      negate = false;
      if (op.charAt(0) === '-') {
        op = op.split('-')[1];
        negate = true;
      }

      if (val === 'me') {
        val = email;
      }

      // get search results for the operator
      searchFiles = await searchFilter(
        op,
        val,
        snapshotFiles,
        fileSnapshot[0].createdAt,
        groupOff,
        email,
      );
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
        if (negate) {
          files = removeNegatedFiles(files, searchFiles);
        } else {
          files = findIntersection(files, searchFiles);
          counter += 1;
        }
      } else {
        for (let j = 0; j < searchFiles.length; j += 1) {
          files.push(searchFiles[j]);
        }
        files = removeDuplicates(files);
      }
    }
    // remove negated files from default file name search
    if (operators.length === 1 && negate) {
      const fileList = [];
      const ids = [];
      snapshotFiles.forEach((val, fileId) => {
        ids.push(fileId);
      });
      for (let i = 0; i < ids.length; i += 1) {
        const file = await findFileInSnapshot(ids[i], fileSnapshot[0].createdAt);
        fileList.push(file);
      }
      for (let i = 0; i < fileList.length; i += 1) {
        const { name } = fileList[i];
        const reg = new RegExp(searchString, 'gi');
        if (name.match(reg)) {
          files.push(fileList[i]);
        }
      }
      files = removeNegatedFiles(files, searchFiles);
    }
  } else {
    // default file name search if no operators
    const fileList = [];
    const ids = [];
    snapshotFiles.forEach((val, fileId) => {
      ids.push(fileId);
    });
    for (let i = 0; i < ids.length; i += 1) {
      const file = await findFileInSnapshot(ids[i], fileSnapshot[0].createdAt);
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
  logger.debug(`Checking against access policy with email ${email}, files ${files}, value ${value}, and role ${role}.`);
  const policies = await getAccessControlPolicies(email);
  let reader; // true for reader and false for writer
  switch (role) {
    case 'read':
      reader = true;
      break;
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


// get all files including nested children from a folder
function getAllFilesInFolder(folder) {
  for (let i = 0; i < folder?.children?.length; i+=1) {
    let file = folder.children[i];
    if (file?.folder) {
      return [...folder.children, getAllFilesInFolder(file.children)];
    }
  }
  return folder.children;
}

// building permission map with count based on list of files
function getPermMapCount(fileList) {
  let permMap = {} // permission
  let fileMap = {}
  let totalCount = fileList.length;
  fileList.forEach((file) => {
    if (file && file.permissions) {
      let permList = file.permissions.map((p) => [p.email +"*"+p.roles[0]+"|"]).sort();
      if (permMap[permList]) {
        permMap[permList] = permMap[permList] + 1;
        fileMap[permList] = [...fileMap[permList], file];
      } else {
        permMap[permList] = 1;
        fileMap[permList] = [file];
      }
    }
  });
  console.log(permMap);
  return [permMap, fileMap, totalCount];
} 

// return list of files and their differences
function checkDeviantPermDiff(file, fileList) {
  let checkPerms = file.permissions.map((p) => [p.email ? p.email : p.id, p.roles]);
  emailMap = {};
  checkPerms.forEach(([email, role]) => {
    emailMap[email] = role[0];
  });
  let emails = checkPerms.map((p) => p[0]);
  let deviationsNotHave = [];
  let deviationsAdded = [];
  let deviationsDiffRole = [];
  fileList.forEach((f) => {
    let perms = f.permissions.map((p) => [p.email ? p.email : p.id, p.roles]);
    const deviantEmails = perms.map((p) => p[0]);
    emails.forEach((e) => {
      if (!deviantEmails.includes(e)) {
        deviationsNotHave.push([f.id, f.name,...checkPerms[emails.indexOf(e)]]);
      }
    });
    deviantEmails.forEach((e) => {
      if (!emails.includes(e)) {
        deviationsAdded.push([f.id, f.name,...perms[deviantEmails.indexOf(e)]]);
      } else {
        if (perms[deviantEmails.indexOf(e)][1] != emailMap[e]) {
          deviationsDiffRole.push([f.id, f.name,...perms[deviantEmails.indexOf(e)]]);
        }
      }
    });
  });
  return [deviationsNotHave, deviationsAdded, deviationsDiffRole];
}

// perform a deviant sharing analysis for a snapshot and a threshold
async function getDeviantSharing(email, snapshotTime, useRecentSnapshot, threshold) {
  let snapshot = null;
  if (useRecentSnapshot) { // get the most recent file snapshot to use for analysis
    snapshot = await getMostRecentFileSnapshot(email);
  } else { // get the selected file snapshot to use for analysis
    const user = await User.findOne({ email });
    const filesnapshotList = user?.fileSnapshots;
    // console.log(filesnapshotList);
    if (filesnapshotList && filesnapshotList.length > 0) {
      for (let i = 0; i < filesnapshotList.length; i += 1) {
        // console.log(filesnapshotList[i]);
        const filesnapshot = await FileSnapshot.findOne({ _id: filesnapshotList[i] });
        // console.log(filesnapshot);
        if (!filesnapshot) {
          continue;
        }
        if (filesnapshot.createdAt.getTime() === new Date(snapshotTime.toLocaleString()).getTime()) {
          snapshot = filesnapshot;
        }
      }
    }
  }
  let folderMap = new Map; // map of folders and all their children (including nested)
  let fileList = [];
  if (snapshot && snapshot.files) { // go through the file map to build folderList
    const fileIdList = Array.from(snapshot.files.keys());
    for (let i = 0; i < fileIdList.length; i++) {
      let file = await findFileInSnapshot(fileIdList[i], snapshotTime);
      fileList.push(file);
      if (file?.folder) {
        folderMap.set(file, getAllFilesInFolder(file));
      }
    }
  }
  let permDiffs = {};
  [...folderMap.entries()].map(([folder, files]) => {
    console.log("FOLDER");
    console.log(folder.name);
    if (folder.name === "deviant1") {
      console.log(folder);
    }
    console.log(files);
    if (files.length > 0) {
      let deviantMap = getPermMapCount(files);
      let permissionDifferences = deviantMap[0];
      let deviantFiles = deviantMap[1];
      let deviantCount = deviantMap[2];
      let deviants = [];
      let thresholdPerms = [];
      // console.log(deviantFiles);
      Object.entries(permissionDifferences).map(([perms, count]) => {
        if ((count / deviantCount)*100 > threshold) {
          thresholdPerms = deviantFiles[perms];
        } else {
          if (deviantFiles[perms]) {
            // console.log(deviantFiles[perms]);
            deviants = [...deviants, ...deviantFiles[perms]];
          }
        }
      })
      if (thresholdPerms.length === 0) {
        deviants = [];
        thresholdPerms = [];
      } else {
        let diffs = checkDeviantPermDiff(thresholdPerms[0], deviants);
        if (!(diffs[0].length === 0 && diffs[1].length === 0 && diffs[2].length === 0)) {
          permDiffs[[folder.name, folder.owner.name]] = diffs;
        }
      }
    }
  });
  console.log("RETURNING");
  //console.log(permDiffs);
  return permDiffs;
}

async function getFolderFileDiff(email, snapshotCreatedAt) {
  const user = await User.findOne({ email });
  const filesnapshotList = user?.fileSnapshots;
  let snapshot = null;
  if (filesnapshotList && filesnapshotList.length > 0) {
    for (let i = 0; i < filesnapshotList.length; i += 1) {
      const filesnapshot = await FileSnapshot.findOne({ _id: filesnapshotList[i] });
      if (filesnapshot.createdAt.getTime() === new Date(snapshotCreatedAt.toLocaleString()).getTime()) {
        snapshot = filesnapshot;
      }
    }
  }
  const differences = [];
  if (snapshot && snapshot.files) {
    const files = Array.from(snapshot.files.keys());
    for (let i = 0; i < files.length; i += 1) {
      const file = await findFileInSnapshot(files[i], snapshot.createdAt);
      if (file.permissions.length > 0) {
        console.log(file.name);
        for (let j = 0; j < file.children.length; j += 1) {
          const d = await checkFolderFilePermission(file, file.children[j]);
          if (d !== null) {
            if (d.diff) {
              differences.push({
                folder: file, file: file.children[j], onlyInFolder: d.onlyInFolder, onlyInFile: d.onlyInFile,
              });
            }
          }
        }
      }
    }
  }
  return { folderFileDiff: differences };
}

async function checkFolderFilePermission(folder, file) {
  const folderPerms = folder.permissions;
  const filePerms = file.permissions;

  // Find perms that are in folder but not in file
  const permsOnlyInFolder = folderPerms.filter((folderPerm) => !filePerms.some((filePerm) => folderPerm.id == filePerm.id));
  // Find perms that are in file but not in folder
  const permsOnlyInFile = filePerms.filter((filePerm) => !folderPerms.some((folderPerm) => filePerm.id == folderPerm.id));

  const diff = (permsOnlyInFile.length > 0 || permsOnlyInFolder.length > 0);

  return { onlyInFolder: permsOnlyInFolder, onlyInFile: permsOnlyInFile, diff };
}

async function checkPermissionDifferences(fileid, fileSnapshot1, fileSnapshot2) {
  const perms1 = fileSnapshot1.get(fileid).map((p) => [p.id, p.roles, p.displayName]);
  const perms2 = fileSnapshot2.get(fileid).map((p) => [p.id, p.roles, p.displayName]);
  const deletedPerms = [];
  const addedPerms = [];
  const updatedPerms = [];

  const ids1 = perms1.map((p) => p[0]);
  const ids2 = perms2.map((p) => p[0]);
  const leftOverIds = new Set();
  ids1.forEach((id) => {
    if (!ids2.includes(id)) {
      deletedPerms.push(perms1[ids1.indexOf(id)]);
    } else {
      leftOverIds.add(id);
    }
  });
  ids2.forEach((id) => {
    if (!ids1.includes(id)) {
      addedPerms.push(perms2[ids2.indexOf(id)]);
    } else {
      leftOverIds.add(id);
    }
  });
  leftOverIds.forEach((id) => {
    const p1 = perms1[ids1.indexOf(id)][1];
    const p2 = perms2[ids2.indexOf(id)][1];
    if (p1.length !== p2.length) {
      for (let i = 0; i < ((p1.length < p2.length) ? p1.length : p2.length); i += 1) {
        if (p1[i] !== p2[i]) {
          updatedPerms.push([perms1[ids1.indexOf(id)], perms2[ids2.indexOf(id)]]);
        }
      }
    } else {
      for (let i = 0; i < p1.length; i += 1) {
        if (p1[i] !== p2[i]) {
          updatedPerms.push([perms1[ids1.indexOf(id)], perms2[ids2.indexOf(id)]]);
        }
      }
    }
  });
  if (deletedPerms.length === 0 && addedPerms.length === 0 && updatedPerms.length === 0) {
    return null;
  }
  return { deleted: deletedPerms, added: addedPerms, updated: updatedPerms };
}

async function getSharingChanges(email, snapshot1, snapshot2) {
  console.log(snapshot1);
  console.log('snap 1');
  const user = await User.findOne({ email });
  const filesnapshotList = user?.fileSnapshots;
  const snapshotList = [];
  if (filesnapshotList && filesnapshotList.length > 0) {
    for (let i = 0; i < filesnapshotList.length; i += 1) {
      const filesnapshot = await FileSnapshot.findOne({ _id: filesnapshotList[i] });
      if (filesnapshot.createdAt.getTime() === new Date(snapshot1.toLocaleString()).getTime()) {
        snapshotList.push(filesnapshot);
      } else if (filesnapshot.createdAt.getTime()
         === new Date(snapshot2.toLocaleString()).getTime()) {
        snapshotList.push(filesnapshot);
      }
    }
  }
  const earlier = snapshotList[0] < snapshotList[1];
  const fileSnapshot1 = earlier ? snapshotList[0] : snapshotList[1];
  const fileSnapshot2 = earlier ? snapshotList[1] : snapshotList[1];
  const files1 = Array.from(fileSnapshot1.files.keys());
  const files2 = Array.from(fileSnapshot2.files.keys());
  const newFiles = [];
  const differences = [];
  for (let i = 0; i < files2.length; i += 1) {
    if (!files1.includes(files2[i])) {
      const f = await findFileInSnapshot(files2[i], fileSnapshot2.createdAt);
      newFiles.push(f);
    } else {
      const d = await checkPermissionDifferences(
        files2[i],
        fileSnapshot1.files,
        fileSnapshot2.files,
      );
      if (d !== null) {
        const f = await findFileInSnapshot(files2[i], fileSnapshot2.createdAt);
        differences.push({ file: f, diff: d });
      }
    }
  }
  return { newFiles, differences };
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
  getDeviantSharing,
  getFolderFileDiff,
  getSharingChanges,
};
