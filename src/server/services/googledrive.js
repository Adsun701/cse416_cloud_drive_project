const { google } = require('googleapis');

const User = require('../model/user-model');
const File = require('../model/file-model');
const Permission = require('../model/permission-model');
const FileSnapshot = require('../model/file-snapshot-model');

/*
Build and return a map of files with their list of permissions
*/
async function getFilesAndPerms(token) {
  const drive = google.drive({ version: 'v3' });
  const files = {};
  let nextPage = null;
  const result = await drive.files.list({
    access_token: token,
    corpora: 'allDrives',
    fields: 'files(id, name, permissions, permissionIds, shortcutDetails, driveId), nextPageToken',
    q: 'trashed = false',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });
  nextPage = result.data.nextPageToken;
  let f = result.data.files;
  // eslint-disable-next-line no-restricted-syntax
  for (const element of f) {
    const newPermsList = [];
    if (element.permissions) {
      for (let i = 0; i < element.permissions.length; i += 1) {
        const newPermission = new Permission({
          id: element.permissions[i].id,
          email: element.permissions[i].emailAddress,
          displayName: element.permissions[i].displayName ? element.permissions[i].displayName : element.permissions[i].id,
          roles: [element.permissions[i].role],
          inheritedFrom: null,
        });
        newPermission.save();
        newPermsList.push(newPermission);
      }
    } else if (element.shortcutDetails) {
      let permissions = await getPermissionListByFileId(token, element.shortcutDetails.targetId);
      permissions = permissions.data.permissions;
      for (let i = 0; i < permissions.length; i++) {
        const permissionData = await getPermissionData(token, element.shortcutDetails.targetId, permissions[i].id);
        const permission = permissionData.data;
        const newPermission = new Permission({
          id: permission.id,
          email: permission.emailAddress,
          displayName: permission.displayName ? permission.displayName : permission.id,
          roles: [permission.role],
          inheritedFrom: null,
        });
        newPermission.save();
        newPermsList.push(newPermission);
      }
    } else if (element.driveId) {
      let permissions = await getPermissionListByFileId(token, element.id);
      permissions = permissions.data.permissions;
      for (let i = 0; i < permissions.length; i++) {
        const permissionData = await getPermissionData(token, element.id, permissions[i].id);
        const permission = permissionData.data;
        // console.log(permission);
        const newPermission = new Permission({
          id: permission.id,
          email: permission.emailAddress,
          displayName: permission.displayName ? permission.displayName : permission.id,
          roles: [permission.permissionDetails[0].role],
          inheritedFrom: permission.permissionDetails[0].inheritedFrom ? permission.permissionDetails[0].inheritedFrom : null,
        });
        newPermission.save();
        newPermsList.push(newPermission);
      }
    }
    files[element.id] = newPermsList;
  }
  while (nextPage) {
    // eslint-disable-next-line no-await-in-loop
    const res = await drive.files.list({
      access_token: token,
      pageToken: nextPage,
      fields: 'files(id, name, permissions, permissionIds), nextPageToken',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });
    nextPage = res.data.nextPageToken;
    f = res.data.files;
    // eslint-disable-next-line no-restricted-syntax
    for (const element of f) {
      const newPermsList = [];
      if (element.permissions) {
        for (let i = 0; i < element.permissions.length; i += 1) {
          const newPermission = new Permission({
            id: element.permissions[i].id,
            email: element.permissions[i].emailAddress,
            displayName: element.permissions[i].displayName ? element.permissions[i].displayName : element.permissions[i].id,
            roles: [element.permissions[i].role],
            inheritedFrom: null,
          });
          newPermission.save();
          newPermsList.push(newPermission);
        }
      } else if (element.shortcutDetails) {
        let permissions = await getPermissionListByFileId(token, element.shortcutDetails.targetId);
        permissions = permissions.data.permissions;
        for (let i = 0; i < permissions.length; i++) {
          const permissionData = await getPermissionData(token, element.shortcutDetails.targetId, permissions[i].id);
          const permission = permissionData.data;
          // console.log(permission);
          const newPermission = new Permission({
            id: permission.id,
            email: permission.emailAddress,
            displayName: permission.displayName ? permission.displayName : permission.id,
            roles: [permission.role],
            inheritedFrom: null,
          });
          newPermission.save();
          newPermsList.push(newPermission);
        }
      } else if (element.driveId) {
        let permissions = await getPermissionListByFileId(token, element.id);
        permissions = permissions.data.permissions;
        for (let i = 0; i < permissions.length; i++) {
          const permissionData = await getPermissionData(token, element.id, permissions[i].id);
          const permission = permissionData.data;
          // console.log(permission);
          const newPermission = new Permission({
            id: permission.id,
            email: permission.emailAddress,
            displayName: permission.displayName ? permission.displayName : permission.id,
            roles: [permission.permissionDetails[0].role],
            inheritedFrom: permission.permissionDetails[0].inheritedFrom ? permission.permissionDetails[0].inheritedFrom : null,
          });
          newPermission.save();
          newPermsList.push(newPermission);
        }
      }
      files[element.id] = newPermsList;
    }
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
    supportsAllDrives: true,
  });
  // console.log(fileData.data);
  return fileData;
}

/*
Get drive metadata for a specific drive using its drive id
*/
async function getDriveData(token, driveid) {
  const drive = google.drive({ version: 'v3' });
  const driveData = await drive.drives.get({
    access_token: token,
    driveId: driveid,
  });
  return driveData;
}

/*
Get list of children files for a folder
*/
async function getChildren(token, folderid) {
  const drive = google.drive({ version: 'v3' });
  const childrenList = await drive.files.list({
    access_token: token,
    q: `'${folderid}' in parents`,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });
  return childrenList;
}

/*
  Check if folder contains folder using Graph API. Different fetch routes
  depending on if its a folder in own drive or shared.
*/
async function checkForNestedChildren(nestedFile, token, filesMap) {
  const mimeType = nestedFile.mimeType.split('.');
  const isFolder = mimeType[mimeType.length - 1] === 'folder';
  const childrenFiles = [];
  if (isFolder) {
    const children = await getChildren(token, nestedFile.id);
    for (let i = 0; i < children.data.files.length; i += 1) {
      const nested = await checkForNestedChildren(children.data.files[i], token, filesMap);
      const childIsFolder = nested.isFolder;
      const nestedChildren = nested.childrenFiles;
      for (const [key, value] of Object.entries(filesMap)) {
        if (children.data.files[i].id === key) {
          let childrenData = await getFileData(token, key);
          childrenData = childrenData.data;
          const childFile = await createAndSaveFile(childrenData, value, childIsFolder, nestedChildren, token);
          childrenFiles.push(childFile);
          break;
        }
      }
    }
  }
  return { isFolder, childrenFiles };
}

/*
  Creates and saves file object to DB, returns file object
*/
async function createAndSaveFile(fileData, permissionsList, isFolder, childrenFiles, token) {
  // get all parents of a file
  const parents = [];
  if (fileData.parents) {
    let parentId = fileData.parents[0];
    while (parentId) {
      const parentData = await getFileData(token, parentId);
      const parent = {
        id: parentData.data.id,
        name: parentData.data.name,
      };
      parents.push(parent);
      if (parentData.data.parents) {
        parentId = parentData.data.parents[0];
      } else {
        break;
      }
    }
  }

  let owner;
  if (fileData.owners) {
    owner = {
      name: fileData.owners[0].displayName,
      email: fileData.owners[0].emailAddress,
    };
  } else {
    owner = {
      name: '',
      email: '',
    };
  }

  let sharingUser;
  if (fileData.sharingUser) {
    sharingUser = {
      name: fileData.sharingUser.displayName,
      email: fileData.sharingUser.emailAddress,
    };
  }

  let drive = 'My Drive';
  if (fileData.driveId) {
    driveData = await getDriveData(token, fileData.driveId);
    drive = driveData.data.name;
  }

  const file = new File({
    id: fileData.id,
    name: fileData.name,
    createdTime: fileData.createdTime,
    modifiedTime: fileData.modifiedTime,
    permissions: permissionsList,
    owner,
    sharingUser,
    folder: isFolder,
    drive,
    parents,
    children: childrenFiles,
  });
  file.save();
  return file;
}

/*
Get a list of all google drive files and add to the user's profile
*/
async function getGoogleFiles(token, email) {
  const filesMap = await getFilesAndPerms(token);
  const listFiles = [];
  const childrenArr = [];
  // eslint-disable-next-line no-restricted-syntax
  for (const [key, value] of Object.entries(filesMap)) {
    // eslint-disable-next-line no-await-in-loop
    let fileData = await getFileData(token, key);
    fileData = fileData.data;

    const mimeType = fileData.mimeType.split('.');
    const isFolder = mimeType[mimeType.length - 1] === 'folder';

    const childrenFiles = [];
    if (isFolder) {
      const children = await getChildren(token, fileData.id);
      for (let i = 0; i < children.data.files.length; i += 1) {
        const nested = await checkForNestedChildren(children.data.files[i], token, filesMap);
        const childIsFolder = nested.isFolder;
        const nestedChildren = nested.childrenFiles;
        for (const [key, value] of Object.entries(filesMap)) {
          if (children.data.files[i].id === key) {
            let childrenData = await getFileData(token, key);
            childrenData = childrenData.data;
            const childFile = await createAndSaveFile(childrenData, value, childIsFolder, nestedChildren, token);
            childrenFiles.push(childFile);
            childrenArr.push(childFile);
            break;
          }
        }
      }
    }
    const file = await createAndSaveFile(fileData, value, isFolder, childrenFiles, token);
    listFiles.push(file);
  }
  // Remove files that are children from the list
  const fileIdSet = new Set(childrenArr.map((file) => file.id));
  const files = listFiles.filter((file) => !fileIdSet.has(file.id));
  User.updateOne({ email }, { $set: { files } }).then(() => {});
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
Save a File Snapshot to the User DB (profile)
*/
async function saveSnapshot(token, email) {
  const result = await getFilesAndPerms(token);
  const fileSnapshot = new FileSnapshot({
    files: result,
  });
  fileSnapshot.save();
  User.updateOne({ email }, { $push: { fileSnapshots: fileSnapshot } })
    .then(() => {});
  return result;
}

/*
Retrieve the list of permissons for a file
*/
async function getPermissionListByFileId(accessToken, fileid) {
  const drive = google.drive({ version: 'v3' });
  const result = await drive.permissions.list({
    access_token: accessToken, // req.session.googleToken,
    fileId: fileid,
    supportsAllDrives: true,
  });
  return result;
}

/*
Retrieve the data for a permission of a file
*/
async function getPermissionData(accessToken, fileid, permissionid) {
  const drive = google.drive({ version: 'v3' });
  const result = await drive.permissions.get({
    access_token: accessToken, // req.session.googleToken,
    fileId: fileid,
    permissionId: permissionid,
    fields: '*',
    supportsAllDrives: true,
  });
  return result;
}

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

/*
Delete a permission for a google file
*/
async function removePermission(accessToken, fileid, permid) {
  console.log("deleting perm for a google file");
  const drive = google.drive({ version: 'v3' });
  console.log(accessToken);
  console.log(fileid);
  console.log(permid);
  const result = await drive.permissions.delete({
    access_token: accessToken,
    fileId: fileid,
    permissionId: permid,
  });
  return result;
}

module.exports = {
  googleAuth,
  saveSnapshot,
  addPermissions,
  updatePermission,
  removePermission,
};
