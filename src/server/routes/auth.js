const express = require('express');

const { google } = require('googleapis');

const fetch = require('./fetch');
const fetchpost = require('./post');
const fetchpatch = require('./patch');
const { GRAPH_API_ENDPOINT, GRAPH_ME_ENDPOINT } = require('../authConfig');

const User = require('../model/user-model');
const File = require('../model/file-model');
const Permission = require('../model/permission-model');
const AccessPolicy = require('../model/access-policy-model');
const SearchQuery = require('../model/search-query-model');

const router = express.Router();

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
      // console.log(nextPage);
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
  
  async function getFileData(token, fileid) {
    const drive = google.drive({ version: 'v3' });
    const fileData = await drive.files.get({
      access_token: token,
      fileId: fileid,
      fields: '*',
    });
    return fileData;
  }

let getGoogleFiles = async (token, email) => {
    const filesMap = await getFilesAndPerms(token);
    const listFiles = [];
    for (const [key, value] of Object.entries(filesMap)) {
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
    User.update({ email: email }, { $set: { files: listFiles } }).then(() => {});
    return true
}

let googleAuth = async (accessToken, email) => {
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
      User.update({ email }, { $set: { files: [] } }).then(() => {});
    } else {
      newUser.save().then(() => {});
    }
  });
  getGoogleFiles(accessToken, email);
} 

let microsoftAuth = async (accessToken) => {
    const graphResponse = await fetch(GRAPH_ME_ENDPOINT, accessToken);
    const emailResponse = await fetch(`${GRAPH_API_ENDPOINT}v1.0/me`, accessToken);
    const email = emailResponse.mail;
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
          File.update(
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
        User.update({ email }, { $set: { files: listFiles } }).then(() => {});
      } else {
        newUser.save().then(() => {});
      }
    });
}


/*
{'clouddrive': "", accessToken, name, email}

  // accessToken, account.name, mail(email) (microsoft)

// accessToken, profileObj.name, profileObj.email (google)
  
*/
router.post('/', async (req, res) => {
    if (req.session.isAuthenticated) {
        res.send("Already Authenticated");
        return;
    } else {
        let clouddrive = req.body.clouddrive;
        let accessToken = req.body.accessToken;
        let name = req.body.name;
        let email = req.body.email;
        req.session.clouddrive = clouddrive;
        req.session.accessToken = accessToken;
        req.session.name = name;
        req.session.email = email;
        req.session.isAuthenticated = true;
        if (clouddrive === "google") {
            googleAuth(req.session.accessToken, req.session.email);
            res.send({"status": "Success"})
            return;
        } else if (clouddrive === "microsoft") {
            microsoftAuth(req.session.accessToken);

        }
    } 
});

module.exports = router;
