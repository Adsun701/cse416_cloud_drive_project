const express = require('express');
const { google } = require('googleapis');

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
        googleAuth(req.session.accessToken, req.session.email);
        res.send({"status": "Success"})
        return;
    } 
});

module.exports = router;
