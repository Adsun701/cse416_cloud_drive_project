// const { authenticate } = require('@google-cloud/local-auth');
const express = require('express');

const router = express.Router();
const { google } = require('googleapis');
const GroupSnapshot = require('../model/group-snapshot-model');

// custom middleware to check auth state
// eslint-disable-next-line consistent-return
function isAuthenticated(req, res, next) {
  if (!req.session.googleToken) {
    return res.redirect('/google/auth'); // redirect to sign-in route
  }
  next();
}

router.get(
  '/snapshot',
  isAuthenticated, // check if user is authenticated
  async (req, res, next) => {
    try {
      const snapshotMap = new Map();
      const drive = google.drive({ version: 'v3' });
      drive.files.list({
        access_token: req.session.googleToken,
        fields: 'files(id, name, permissions)',
      // eslint-disable-next-line consistent-return
      }, (err, response) => {
        if (err) {
          // console.error('The API returned an error.');
          throw err;
        }
        const { files } = response.data;
        if (files.length === 0) {
          // console.log('No files found.');
          return null;
        }
        // console.log('Files Found! File length: ' + files.length);
        for (let i = 0; i < files.length; i += 1) {
          const permissionAddresses = [];
          for (let j = 0; files[i].permissions != null && j < files[i].permissions.length; j += 1) {
            if (files[i].permissions[j].type === 'group') {
              permissionAddresses.push(files[i].permissions[j].emailAddress);
            }
          }
          snapshotMap.set(files[i].id, permissionAddresses);
        }
      });
      const groupSnapshot = new GroupSnapshot({ groupMembers: snapshotMap });
      groupSnapshot.save();
    } catch (error) {
      next(error);
    }
  },
);

module.exports = router;
