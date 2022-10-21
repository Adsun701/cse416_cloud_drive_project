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

router.post(
  '/snapshot',
  isAuthenticated, // check if user is authenticated
  async (req, res, next) => {
    const groupname = req.body.groupname;
    const groupaddress = req.body.groupaddress;
    const timestamp = req.body.timestamp;
    const memberpagehtml = req.body.memberpagehtml; // use "Profile image for " as indexOf

    const memberarray = new Array();
    let start = 0;
    const profileprefix = "Profile image for ";
    const prefixlength = profileprefix.length;
    let user = "";
    while (start = memberpagehtml.indexOf(profileprefix, start) > -1) {
      start = start + prefixlength;
      user = memberpagehtml.substring(start, memberpagehtml.indexOf('\"', start));
      memberarray.push(user);
    }
    const groupSnapshot = new GroupSnapshot({ groupName: groupname, groupAddress: groupaddress, groupMembers: memberarray, timestamp: timestamp });
    groupSnapshot.save();
  }
);

module.exports = router;
