// const { authenticate } = require('@google-cloud/local-auth');
const express = require('express');

const fs = require('fs');
const router = express.Router();
const multer  = require('multer');
const { google } = require('googleapis');
const GroupSnapshot = require('../model/group-snapshot-model');
const upload = multer({ dest: '../../public/data/uploads/' });

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
  upload.single('memberpagehtml'),
  isAuthenticated, // check if user is authenticated
  async (req, res, next) => {
    const groupname = req.body.groupname;
    const groupaddress = req.body.groupaddress;
    const timestamp = req.body.timestamp;
    //console.log(req.file);
    let memberpagehtml = fs.createReadStream(req.file.path, 'utf8'); // use "Profile image for " as indexOf
    console.log("groupname is : " + groupname);
    console.log("groupaddress is : " + groupaddress);
    console.log("timestamp is : " + timestamp);
    console.log("memberpagehtml is : " + memberpagehtml);

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
