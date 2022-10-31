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
Handling the aftermath of authenticating to microsoft
- Creates user profile in DB if it does not already exists
- Also adds starting list of files
*/
async function microsoftAuth(accessToken, email) {
  const graphResponse = await fetch(GRAPH_ME_ENDPOINT, accessToken);
  const files = graphResponse.value;
  const listFiles = [];
  for (let i = 0; i < files.length; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    const permissionResponse = await fetch(`${GRAPH_API_ENDPOINT}v1.0/me/drive/items/${files[i].id}/permissions/`, accessToken);
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
        Permission.exists({ id: permissions[j].id, roles: permissions[j].roles })
          .then((exists) => {
            if (!exists) {
              perm.save().then(() => {});
            }
          });
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
          Permission.exists({
            id: currentPermission.user ? currentPermission.user.id
              : currentPermission.siteUser.id,
            roles: permissions[j].roles,
          }).then((exists) => {
            if (!exists) {
              perm.save().then(() => {});
            }
          });
          permissionsList.push(perm);
        }
      }
    }
    const file = new File({
      id: files[i].id,
      name: files[i].name,
      createdTime: files[i].fileSystemInfo.createdDateTime,
      modifiedTime: files[i].fileSystemInfo.lastModifiedDateTime,
      permissions: permissionsList,
    });
    File.exists({ id: files[i].id }).then((exists) => {
      if (exists) {
        File.updateOne(
          { id: files[i].id },
          {
            $set: {
              name: files[i].name,
              modifiedTime: files[i].fileSystemInfo.lastModifiedDateTime,
              permissions: permissionsList,
            },
          },
        ).then(() => {});
      } else {
        file.save().then(() => {});
      }
    });
    listFiles.push(file);
  }
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
}

/*
Take a file snapshot for microsoft onedrive
(save to user's profile and to the filesnapshot collection)
*/
async function saveSnapshot(accessToken, email) {
  const graphResponse = await fetch(GRAPH_ME_ENDPOINT, accessToken);
  const files = graphResponse.value;
  const filesMap = {};
  for (let i = 0; i < files.length; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    const permissionResponse = await fetch(`${GRAPH_API_ENDPOINT}v1.0/me/drive/items/${files[i].id}/permissions/`, accessToken);
    const permissions = permissionResponse.value;
    const permissionsList = [];
    for (let j = 0; j < permissions.length; j += 1) {
      if (permissions[j].grantedToV2) {
        const perm = new Permission({
          id: permissions[j].id,
          email: permissions[j].grantedToV2.user ? permissions[j].grantedToV2.user.email
            : permissions[j].grantedToV2.siteUser.email,
          displayName: permissions[j].grantedToV2.user ? permissions[j].grantedToV2.user.displayName
            : permissions[j].grantedToV2.siteUser.displayName,
          roles: permissions[j].roles,
          inheritedFrom: permissions[j].inheritedFrom ? permissions[j].inheritedFrom.id : null,
        });
        perm.save().then(() => {});
        permissionsList.push(perm);
      }
      if (permissions[j].grantedToIdentitiesV2) {
        for (let k = 0; k < permissions[j].grantedToIdentitiesV2.length; k += 1) {
          const perm = new Permission({
            id: permissions[j].id,
            email: permissions[j].grantedToIdentitiesV2[k].user
              ? permissions[j].grantedToIdentitiesV2[k].user.email
              : permissions[j].grantedToIdentitiesV2[k].siteUser.email,
            displayName: permissions[j].grantedToIdentitiesV2[k].user
              ? permissions[j].grantedToIdentitiesV2[k].user.displayName
              : permissions[j].grantedToIdentitiesV2[k].siteUser.displayName,
            roles: permissions[j].roles,
            inheritedFrom: permissions[j].inheritedFrom ? permissions[j].inheritedFrom.id : null,
          });
          perm.save().then(() => {});
          permissionsList.push(perm);
        }
      }
    }
    filesMap[files[i].id] = permissionsList;
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
    // eslint-disable-next-line no-await-in-loop
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
