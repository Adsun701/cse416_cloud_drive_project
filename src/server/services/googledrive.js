const { google } = require('googleapis');

const User = require('../model/user-model');
const File = require('../model/file-model');
const Permission = require('../model/permission-model');
const FileSnapshot = require('../model/file-snapshot-model');

/*
Helper function for saving a file snapshot to the user database
*/
async function getSnapshot(token) {
  const drive = google.drive({ version: 'v3' });
  const files = {};
  let nextPage = null;
  const result = await drive.files.list({
    access_token: token,
    fields: 'files(id, name, permissions), nextPageToken',
  });
  nextPage = result.data.nextPageToken;
  let f = result.data.files;
  f.forEach((element) => {
    const newPermsList = [];
    if (element.permissions) {
      for (let i = 0; i < element.permissions.length; i += 1) {
        const newPermission = new Permission({
          id: element.permissions[i].id,
          email: element.permissions[i].emailAddress,
          displayName: element.permissions[i].displayName,
          roles: [element.permissions[i].role],
          inheritedFrom: null,
        });
        newPermission.save();
        newPermsList.push(newPermission);
      }
    }
    files[element.id] = newPermsList;
  });
  while (nextPage) {
    // eslint-disable-next-line no-await-in-loop
    const res = await drive.files.list({
      access_token: token,
      pageToken: nextPage,
      fields: 'files(id, name, permissions), nextPageToken',
    });
    nextPage = res.data.nextPageToken;
    f = res.data.files;
    f.forEach((element) => {
      const newPermsList = [];
      if (element.permissions) {
        for (let i = 0; i < element.permissions.length; i += 1) {
          const newPermission = new Permission({
            id: element.permissions[i].id,
            email: element.permissions[i].emailAddress,
            displayName: element.permissions[i].displayName,
            roles: [element.permissions[i].role],
            inheritedFrom: null,
          });
          newPermission.save();
          newPermsList.push(newPermission);
        }
      }
      files[element.id] = newPermsList;
    });
  }
  return files;
}

/*
Save a File Snapshot to the User DB (profile)
*/
async function saveSnapshot(token, email) {
  const result = await getSnapshot(token);
  const fileSnapshot = new FileSnapshot({
    files: result,
  });
  fileSnapshot.save();
  User.updateOne({ email }, { $push: { fileSnapshots: fileSnapshot } })
    .then(() => {});
  return result;
}

/*
Build and return a map of files with their list of permissions
*/
async function getFilesAndPerms(token) {
  const drive = google.drive({ version: 'v3' });
  const files = {};
  let nextPage = null;
  const result = await drive.files.list({
    access_token: token,
    fields: 'files(id, name, permissions), nextPageToken',
  });
  nextPage = result.data.nextPageToken;
  // console.log(nextPage);
  let f = result.data.files;
  f.forEach((element) => {
    const newPermsList = [];
    if (element.permissions) {
      for (let i = 0; i < element.permissions.length; i += 1) {
        const newPermission = new Permission({
          id: element.permissions[i].id,
          email: element.permissions[i].emailAddress,
          displayName: element.permissions[i].displayName,
          roles: [element.permissions[i].role],
          inheritedFrom: null,
        });
        newPermission.save();
        newPermsList.push(newPermission);
      }
    }
    files[element.id] = newPermsList;
  });
  while (nextPage) {
    // eslint-disable-next-line no-await-in-loop
    const res = await drive.files.list({
      access_token: token,
      pageToken: nextPage,
      fields: 'files(id, name, permissions), nextPageToken',
    });
    nextPage = res.data.nextPageToken;
    f = res.data.files;
    f.forEach((element) => {
      const newPermsList = [];
      if (element.permissions) {
        for (let i = 0; i < element.permissions.length; i += 1) {
          const newPermission = new Permission({
            id: element.permissions[i].id,
            email: element.permissions[i].emailAddress,
            displayName: element.permissions[i].displayName,
            roles: [element.permissions[i].role],
            inheritedFrom: null,
          });
          newPermission.save();
          newPermsList.push(newPermission);
        }
      }
      files[element.id] = newPermsList;
    });
  }
  return files;
}

/*
Get file metadata for a specific file using its file id
*/
async function getFileData(token, fileid) {
  const drive = google.drive({ version: 'v3' });
  const fileData = await drive.files.get({
    access_token: token,
    fileId: fileid,
    fields: '*',
  });
  return fileData;
}

/*
Get a list of all google drive files and add to the user's profile
*/
async function getGoogleFiles(token, email) {
  const filesMap = await getFilesAndPerms(token);
  const listFiles = [];
  // eslint-disable-next-line no-restricted-syntax
  for (const [key, value] of Object.entries(filesMap)) {
    // eslint-disable-next-line no-await-in-loop
    let fileData = await getFileData(token, key);
    fileData = fileData.data;
    const file = new File({
      id: fileData.id,
      name: fileData.name,
      createdTime: fileData.createdTime,
      modifiedTime: fileData.modifiedTime,
      permissions: value,
    });
    file.save();
    listFiles.push(file);
  }
  User.updateOne({ email }, { $set: { files: listFiles } }).then(() => {});
  return true;
}

/*
Handling the aftermath of google authentication
- Creating a User document if it does not already exist in the collection
- Also adds the starting list of files to the user's profile (DB)
*/
async function googleAuth(accessToken, email) {
  const newUser = new User({
    email,
    files: [],
    accessPolicies: [],
    fileSnapshots: [],
    groupSnapshots: [],
    recentQueries: [],
  });
  User.exists({ email }).then((exists) => {
    if (exists) {
      User.updateOne({ email }, { $set: { files: [] } }).then(() => {});
    } else {
      newUser.save().then(() => {});
    }
  });
  getGoogleFiles(accessToken, email);
}

/*
Retrieve the list of permissons for a file
*/
// async function getPermissionListByFileId(accessToken, fileid) {
//   const drive = google.drive({ version: 'v3' });
//   const result = await drive.permissions.list({
//     access_token: accessToken, // req.session.googleToken,
//     fileId: fileid,
//   });
//   return result;
// }

/*
Add a new permission for a single file or multiple files
@files = list of files with new ids
@value = email address for new permission
@type = user, group, etc
@role = new role for the new permissions
*/
async function addPermissions(accessToken, files, value, type, role) {
  const body = {
    emailAddress: value,
    type,
    role,
  };
  const drive = google.drive({ version: 'v3' });
  const ret = [];
  for (let i = 0; i < files.length; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    const result = await drive.permissions.create({
      access_token: accessToken,
      fileId: files[i],
      resource: body,
      emailMessage: 'Hello!',
    });
    ret.push(result);
  }
  return ret;
}

/*
Update a role for a specific permission for a specific file
Basically, updating permissions for a file
@data = JSON format to include role, etc
*/
async function updatePermission(accessToken, fileid, permid, data) {
  const drive = google.drive({ version: 'v3' });
  const result = await drive.permissions.update({
    access_token: accessToken,
    fileId: fileid,
    permissionId: permid,
    requestBody: data,
  });
  return result;
}

module.exports = {
  googleAuth,
  saveSnapshot,
  addPermissions,
  updatePermission,
};
