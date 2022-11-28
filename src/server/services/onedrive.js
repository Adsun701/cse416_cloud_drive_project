/* eslint-disable no-await-in-loop */
const fetch = require('../utils/fetch');
const fetchpost = require('../utils/post');
const fetchpatch = require('../utils/patch');
const fetchdelete = require('../utils/delete');
const { GRAPH_API_ENDPOINT, GRAPH_ME_ENDPOINT } = require('../authConfig');

const User = require('../model/user-model');
const File = require('../model/file-model');
const Permission = require('../model/permission-model');
const FileSnapshot = require('../model/file-snapshot-model');

/*
  Builds and returns permissions list associated with fileId
*/
async function getPermissionData(permissionResponse) {
  const permissions = permissionResponse.value;
  const permissionsList = [];
  for (let j = 0; j < permissions.length; j += 1) {
    if (permissions[j].grantedToV2) {
      const perm = new Permission({
        id: permissions[j].id,
        email: permissions[j].grantedToV2.user ? permissions[j].grantedToV2.user.email
          : permissions[j].grantedToV2.siteUser.email,
        displayName: permissions[j].grantedToV2.user
          ? permissions[j].grantedToV2.user.displayName
          : permissions[j].grantedToV2.siteUser.displayName,
        roles: permissions[j].roles,
        inheritedFrom: permissions[j].inheritedFrom ? permissions[j].inheritedFrom.id : null,
      });
      // Permission.exists({ id: permissions[j].id, roles: permissions[j].roles })
      //   .then((exists) => {
      //     if (!exists) {
      //       perm.save().then(() => {});
      //     }
      //   });
      perm.save();
      permissionsList.push(perm);
    }
    if (permissions[j].grantedToIdentitiesV2) {
      for (let k = 0; k < permissions[j].grantedToIdentitiesV2.length; k += 1) {
        const currentPermission = permissions[j].grantedToIdentitiesV2[k];
        const perm = new Permission({
          id: permissions[j].id,
          email: currentPermission.user ? currentPermission.user.email
            : currentPermission.siteUser.email,
          displayName: currentPermission.user ? currentPermission.user.displayName
            : currentPermission.siteUser.displayName,
          roles: permissions[j].roles,
          inheritedFrom: permissions[j].inheritedFrom ? permissions[j].inheritedFrom.id
            : null,
        });
        // Permission.exists({
        //   id: currentPermission.user ? currentPermission.user.id
        //     : currentPermission.siteUser.id,
        //   roles: permissions[j].roles,
        // }).then((exists) => {
        //   if (!exists) {
        //     perm.save().then(() => {});
        //   }
        // });
        perm.save();
        permissionsList.push(perm);
      }
    }
  }
  return permissionsList;
}

/*
  Creates and saves file object to DB, returns file object
*/
async function createAndSaveFile(fileObject, permissionsList, isFolder, childrenFiles) {
  const file = new File({
    id: fileObject.id,
    name: fileObject.name,
    createdTime: fileObject.fileSystemInfo.createdDateTime,
    modifiedTime: fileObject.fileSystemInfo.lastModifiedDateTime,
    permissions: permissionsList,
    owner: { name: fileObject.createdBy.user.displayName, email: fileObject.createdBy.user.email },
    folder: isFolder,
    children: childrenFiles,
  });
  // File.exists({ id: fileObject.id }).then((exists) => {
  //   if (exists) {
  //     File.updateOne(
  //       { id: fileObject.id },
  //       {
  //         $set: {
  //           name: fileObject.name,
  //           modifiedTime: fileObject.fileSystemInfo.lastModifiedDateTime,
  //           permissions: permissionsList,
  //         },
  //       },
  //     ).then(() => {});
  //   } else {
  //     file.save().then(() => {});
  //   }
  // });
  file.save();
  return file;
}

/*
  Check if folder contains folder using Graph API. Different fetch routes
  depending on if its a folder in own drive or shared.
*/
async function checkForNestedChildren(nestedFile, accessToken, myDrive, driveId) {
  let isFolder = false;
  isFolder = nestedFile.folder !== undefined;
  const childrenFiles = [];
  const childrenResponse = await fetch(myDrive ? `${GRAPH_API_ENDPOINT}v1.0/me/drive/items/${nestedFile.id}/children/` : `${GRAPH_API_ENDPOINT}v1.0/drives/${driveId}/items/${nestedFile.id}/children/`, accessToken);
  const children = childrenResponse.value;
  if (children.length !== 0) {
    isFolder = true;
    for (let m = 0; m < children.length; m += 1) {
      const nested = await checkForNestedChildren(children[m], accessToken, myDrive, driveId);
      const childIsFolder = nested.isFolder;
      const nestedChildren = nested.childrenFiles;
      const childPermissionResponse = await fetch(myDrive ? `${GRAPH_API_ENDPOINT}v1.0/me/drive/items/${children[m].id}/permissions/` : `${GRAPH_API_ENDPOINT}v1.0/drives/${driveId}/items/${children[m].id}/permissions/`, accessToken);
      const childPermissionsList = await getPermissionData(childPermissionResponse);
      const childFile = await createAndSaveFile(
        children[m],
        childPermissionsList,
        childIsFolder,
        nestedChildren,
      );
      childrenFiles.push(childFile);
    }
  }
  return { isFolder, childrenFiles };
}

/*
  Builds the file and permission objects associated with the files and folders
  owned and shared with OneDrive user.
*/
async function getFilesAndPerms(accessToken) {
  const graphResponse = await fetch(GRAPH_ME_ENDPOINT, accessToken);
  const files = graphResponse.value;
  const sharedResponse = await fetch(`${GRAPH_API_ENDPOINT}v1.0/me/drive/sharedWithMe/`, accessToken);
  const sharedFiles = sharedResponse.value;
  const listFiles = [];
  for (let i = 0; i < files.length; i += 1) {
    const permissionResponse = await fetch(`${GRAPH_API_ENDPOINT}v1.0/me/drive/items/${files[i].id}/permissions/`, accessToken);
    const permissionsList = await getPermissionData(permissionResponse);

    let isFolder = false;
    isFolder = files[i].folder !== undefined;
    const childrenFiles = [];
    const childrenResponse = await fetch(`${GRAPH_API_ENDPOINT}v1.0/me/drive/items/${files[i].id}/children/`, accessToken);
    const children = childrenResponse.value;
    if (children.length !== 0) {
      isFolder = true;
      for (let m = 0; m < children.length; m += 1) {
        const myDrive = true;
        const nested = await checkForNestedChildren(children[m], accessToken, myDrive, null);
        const childIsFolder = nested.isFolder;
        const nestedChildren = nested.childrenFiles;
        const childPermissionResponse = await fetch(`${GRAPH_API_ENDPOINT}v1.0/me/drive/items/${children[m].id}/permissions/`, accessToken);
        const childPermissionsList = await getPermissionData(childPermissionResponse);
        const childFile = await createAndSaveFile(
          children[m],
          childPermissionsList,
          childIsFolder,
          nestedChildren,
        );
        childrenFiles.push(childFile);
      }
    }

    const file = await createAndSaveFile(files[i], permissionsList, isFolder, childrenFiles);
    listFiles.push(file);
  }
  for (let i = 0; i < sharedFiles.length; i += 1) {
    try {
      const permissionResponse = await fetch(`${GRAPH_API_ENDPOINT}v1.0/drives/${sharedFiles[i].remoteItem.parentReference.driveId}/items/${sharedFiles[i].id}/permissions/`, accessToken);
      const permissionsList = await getPermissionData(permissionResponse);

      let isFolder = false;
      const childrenFiles = [];
      const childrenResponse = await fetch(`${GRAPH_API_ENDPOINT}v1.0/drives/${sharedFiles[i].remoteItem.parentReference.driveId}/items/${sharedFiles[i].id}/children/`, accessToken);
      const children = childrenResponse.value;
      if (children.length !== 0) {
        isFolder = true;
        for (let m = 0; m < children.length; m += 1) {
          const myDrive = false;
          const nested = await checkForNestedChildren(
            children[m],
            accessToken,
            myDrive,
            sharedFiles[i].remoteItem.parentReference.driveId,
          );
          const childIsFolder = nested.isFolder;
          const nestedChildren = nested.childrenFiles;
          const childPermissionResponse = await fetch(`${GRAPH_API_ENDPOINT}v1.0/drives/${sharedFiles[i].remoteItem.parentReference.driveId}/items/${children[m].id}/permissions/`, accessToken);
          const childPermissionsList = await getPermissionData(childPermissionResponse);
          const childFile = await createAndSaveFile(
            children[m],
            childPermissionsList,
            childIsFolder,
            nestedChildren,
          );
          childrenFiles.push(childFile);
        }
      }

      const file = await createAndSaveFile(sharedFiles[i], permissionsList, isFolder, childrenFiles);
      listFiles.push(file);
    } catch {
      continue;
    }
  }
  return listFiles;
}

/*
Handling the aftermath of authenticating to microsoft
- Creates user profile in DB if it does not already exists
- Also adds starting list of files
*/
async function microsoftAuth(accessToken, email) {
  const listFiles = await getFilesAndPerms(accessToken);
  const newUser = new User({
    email,
    files: listFiles,
    accessPolicies: [],
    fileSnapshots: [],
    groupSnapshots: [],
    recentQueries: [],
  });
  User.exists({ email }).then((exists) => {
    if (exists) {
      User.updateOne({ email }, { $set: { files: listFiles } }).then(() => {});
    } else {
      newUser.save().then(() => {});
    }
  });
  return listFiles;
}

/*
  Finds and adds file-perm mapping for nested files
*/
async function addNestedFilesToSnapshot(nestedFile, accessToken, myDrive, driveId, filesMap) {
  const childrenResponse = await fetch(myDrive ? `${GRAPH_API_ENDPOINT}v1.0/me/drive/items/${nestedFile.id}/children/` : `${GRAPH_API_ENDPOINT}v1.0/drives/${driveId}/items/${nestedFile.id}/children/`, accessToken);
  const children = childrenResponse.value;
  if (children.length !== 0) {
    for (let m = 0; m < children.length; m += 1) {
      // eslint-disable-next-line no-unused-vars
      const added = await addNestedFilesToSnapshot(
        children[m],
        accessToken,
        myDrive,
        driveId,
        filesMap,
      );
      const childPermissionResponse = await fetch(myDrive ? `${GRAPH_API_ENDPOINT}v1.0/me/drive/items/${children[m].id}/permissions/` : `${GRAPH_API_ENDPOINT}v1.0/drives/${driveId}/items/${children[m].id}/permissions/`, accessToken);
      const childPermissionsList = await getPermissionData(childPermissionResponse);
      // eslint-disable-next-line no-param-reassign
      filesMap[children[m].id] = childPermissionsList;
    }
  }
}

/*
Take a file snapshot for microsoft onedrive
(save to user's profile and to the filesnapshot collection)
*/
async function saveSnapshot(accessToken, email) {
  const graphResponse = await fetch(GRAPH_ME_ENDPOINT, accessToken);
  const files = graphResponse.value;
  const sharedResponse = await fetch(`${GRAPH_API_ENDPOINT}v1.0/me/drive/sharedWithMe/`, accessToken);
  const sharedFiles = sharedResponse.value;
  const filesMap = {};
  for (let i = 0; i < files.length; i += 1) {
    const permissionResponse = await fetch(`${GRAPH_API_ENDPOINT}v1.0/me/drive/items/${files[i].id}/permissions/`, accessToken);
    const permissionsList = await getPermissionData(permissionResponse);
    filesMap[files[i].id] = permissionsList;

    const childrenResponse = await fetch(`${GRAPH_API_ENDPOINT}v1.0/me/drive/items/${files[i].id}/children/`, accessToken);
    const children = childrenResponse.value;
    if (children.length !== 0) {
      for (let m = 0; m < children.length; m += 1) {
        const myDrive = true;
        // eslint-disable-next-line no-unused-vars
        const added = addNestedFilesToSnapshot(children[m], accessToken, myDrive, null, filesMap);
        const childPermissionResponse = await fetch(`${GRAPH_API_ENDPOINT}v1.0/me/drive/items/${children[m].id}/permissions/`, accessToken);
        const childPermissionsList = await getPermissionData(childPermissionResponse);
        filesMap[children[m].id] = childPermissionsList;
      }
    }
  }
  for (let i = 0; i < sharedFiles.length; i += 1) {
    const permissionResponse = await fetch(`${GRAPH_API_ENDPOINT}v1.0/drives/${sharedFiles[i].remoteItem.parentReference.driveId}/items/${sharedFiles[i].id}/permissions/`, accessToken);
    const permissionsList = await getPermissionData(permissionResponse);
    filesMap[sharedFiles[i].id] = permissionsList;

    const childrenResponse = await fetch(`${GRAPH_API_ENDPOINT}v1.0/drives/${sharedFiles[i].remoteItem.parentReference.driveId}/items/${sharedFiles[i].id}/children/`, accessToken);
    const children = childrenResponse.value;
    if (children.length !== 0) {
      for (let m = 0; m < children.length; m += 1) {
        const myDrive = false;
        // eslint-disable-next-line no-unused-vars
        const added = addNestedFilesToSnapshot(
          children[m],
          accessToken,
          myDrive,
          sharedFiles[i].remoteItem.parentReference.driveId,
          filesMap,
        );
        const childPermissionResponse = await fetch(`${GRAPH_API_ENDPOINT}v1.0/drives/${sharedFiles[i].remoteItem.parentReference.driveId}/items/${sharedFiles[i].id}/permissions/`, accessToken);
        const childPermissionsList = await getPermissionData(childPermissionResponse);
        filesMap[children[m].id] = childPermissionsList;
      }
    }
  }
  const fileSnapshot = new FileSnapshot({
    files: filesMap,
  });
  fileSnapshot.save();
  User.updateOne({ email }, { $push: { fileSnapshots: fileSnapshot } })
    .then(() => {});
  return filesMap;
}

/*
Update a specific file's permission (updating role)
*/
async function updatePermission(accessToken, role, fileid, permid) {
  const body = {
    roles: [role],
  };
  const update = await fetchpatch(`${GRAPH_API_ENDPOINT}v1.0/me/drive/items/${fileid}/permissions/${permid}`, accessToken, body);
  return update;
}

/*
Delete the specified file's permissions
*/
async function removePermission(accessToken, fileid, permid) {
  const update = await fetchdelete(`${GRAPH_API_ENDPOINT}v1.0/me/drive/items/${fileid}/permissions/${permid}`, accessToken);
  return update;
}

/*
Adding new permissions for a single file or multiple files
@files = list of files with new ids
@value = email address for new permission
@role = new role for the new permissions
*/
async function addPermissions(accessToken, files, value, role) {
  const body = {
    recipients: [
      { email: value },
    ],
    message: 'Hello!',
    requireSignIn: true,
    sendInvitation: true,
    roles: [role],
  };
  const ans = [];
  for (let i = 0; i < files.length; i += 1) {
    const update = await fetchpost(`${GRAPH_API_ENDPOINT}v1.0/me/drive/items/${files[i]}/invite`, accessToken, body);
    ans.push(update.data);
  }
  return ans;
}

module.exports = {
  microsoftAuth,
  saveSnapshot,
  updatePermission,
  addPermissions,
  removePermission,
};
