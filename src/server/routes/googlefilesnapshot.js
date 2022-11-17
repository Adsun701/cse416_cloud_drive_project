/*
  Contains the implementation of taking a snapshot function when authentication was in the backend.
  Currently in the process of refactoring and moving code
  to services/api.js, services/googledrive.js.
*/

// const { authenticate } = require('@google-cloud/local-auth');
const express = require('express');

const router = express.Router();
const { google } = require('googleapis');
const FileSnapshot = require('../model/file-snapshot-model');
const Permission = require('../model/permission-model');
const User = require('../model/user-model');

// custom middleware to check auth state
// eslint-disable-next-line consistent-return
function isAuthenticated(req, res, next) {
  if (!req.session.googleToken) {
    return res.redirect('/google/auth'); // redirect to sign-in route
  }
  next();
}

async function getSnapshot(token) {
  const drive = google.drive({ version: 'v3' });
  const files = {};
  let nextPage = null;
  const result = await drive.files.list({
    access_token: token,
    fields: 'files(id, name, permissions), nextPageToken',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true
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
      supportsAllDrives: true,
      includeItemsFromAllDrives: true
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

router.get(
  '/snapshot',
  isAuthenticated, // check if user is authenticated
  async (req, res) => {
    // console.log('test');
    // console.log(req);
    const result = await getSnapshot(req.session.googleToken);
    const fileSnapshot = new FileSnapshot({
      files: result,
    });
    fileSnapshot.save();
    User.update({ email: req.session.googleEmail }, { $push: { fileSnapshots: fileSnapshot } })
      .then(() => {});
    res.send(result);
  },
);

module.exports = router;
