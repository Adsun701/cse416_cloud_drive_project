/*
  Current Implementaion of taking a Group Snapshot for Google Drive
*/

// const { authenticate } = require('@google-cloud/local-auth');
const express = require('express');

const fs = require('fs');

const router = express.Router();
const multer = require('multer');
const User = require('../model/user-model');
const GroupSnapshot = require('../model/group-snapshot-model');

const upload = multer({ dest: '../../public/data/uploads/' });

// custom middleware to check auth state
// eslint-disable-next-line consistent-return
function isAuthenticated(req, res, next) {
  if (!req.session.accessToken) {
    return res.redirect('/google/auth'); // redirect to sign-in route
  }
  next();
}

router.post(
  '/snapshot',
  upload.single('memberpagehtml'),
  isAuthenticated, // check if user is authenticated
  async (req, res) => {
    const { email } = req.session;
    const { groupname } = req.body;
    const { groupaddress } = req.body;
    const { timestamp } = req.body;
    const memberarray = [];
    let start = 0;
    const profileprefix = 'Profile image for ';
    const prefixlength = profileprefix.length;
    let user = '';

    const data = fs.readFileSync(req.file.path).toString('utf-8');
    while (data.indexOf(profileprefix, start) > -1) {
      start = data.indexOf(profileprefix, start) + prefixlength;
      // eslint-disable-next-line no-useless-escape
      user = data.substring(start, data.indexOf('\"', start));
      memberarray.push(user);
    }

    const groupSnapshot = new GroupSnapshot({
      groupName: groupname, groupAddress: groupaddress, groupMembers: memberarray, timestamp,
    });
    groupSnapshot.save();
    User.updateOne({ email }, { $push: { groupSnapshots: groupSnapshot } })
      .then(() => {});
    res.send(memberarray);
  },
);

module.exports = router;
