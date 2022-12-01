/*
  Contains backend routes that will call functions
  in our cloud drive adapter interface, services/api.js
*/
const express = require('express');
const cloudDriveAPI = require('../services/api');

const router = express.Router();

const User = require('../model/user-model');
const FileSnapshot = require('../model/file-snapshot-model');
const GroupSnapshot = require('../model/group-snapshot-model');
const SearchQuery = require('../model/search-query-model');

function isAuthenticated(req, res, next) {
  if (!req.session.isAuthenticated) {
    res.send({ error: 'Not Authenticated' });
  }
  next();
}

router.get('/filesnapshot', isAuthenticated, async (req, res) => {
  const snapshot = await cloudDriveAPI
    .takeFileSnapshot(req.session.clouddrive, req.session.accessToken, req.session.email);
  res.send(snapshot);
});

router.get('/allfilesnapshots', async (req, res) => {
  const user = await User.find({ email: req.session.email });
  const { fileSnapshots } = (user && user.length > 0 && user[0]) ? user[0] : [];
  const ids = [];
  // eslint-disable-next-line no-unused-expressions
  (fileSnapshots != null) && fileSnapshots.forEach((element) => {
    // eslint-disable-next-line no-underscore-dangle
    ids.push(element._id);
  });
  const snapshotList = await FileSnapshot.find({ _id: { $in: ids } })
    .sort({ createdAt: -1 });
  res.send(JSON.stringify(snapshotList));
});

router.get('/allgroupsnapshots', async (req, res) => {
  const user = await User.find({ email: req.session.email });
  const { groupSnapshots } = (user && user.length > 0 && user[0]) ? user[0] : [];
  const ids = [];
  // eslint-disable-next-line no-unused-expressions
  (groupSnapshots != null) && groupSnapshots.forEach((element) => {
    // eslint-disable-next-line no-underscore-dangle
    ids.push(element._id);
  });
  const snapshotList = await GroupSnapshot.find({ _id: { $in: ids } })
    .sort({ createdAt: -1 });
  res.send(JSON.stringify(snapshotList));
});

router.get('/allfiles', isAuthenticated, async (req, res) => {
  // console.log(req.session);
  const files = await cloudDriveAPI.getAllFiles(req.session.email);
  res.send(JSON.stringify(files));
});

router.post('/deviant', async (req, res) => {
  const differences = await cloudDriveAPI.getDeviantSharing(req.session.email, req.body.snapshot, req.body.useRecentSnapshot, req.body.threshold);
  console.log("post call");
  console.log(differences);
  res.send(JSON.stringify(differences));
});

router.post('/folderfile', async (req, res) => {
  const differences = await cloudDriveAPI.getFolderFileDiff(req.session.email, req.body.snapshot);
  res.send(JSON.stringify(differences));
});

router.post('/sharingchanges', async (req, res) => {
  const differences = await cloudDriveAPI.getSharingChanges(
    req.session.email,
    req.body.snapshot1,
    req.body.snapshot2,
  );
  res.send(JSON.stringify(differences));
});

router.post('/deletePermission', isAuthenticated, async (req, res) => {
  const response = await cloudDriveAPI.deletePermission(
    req.session.clouddrive,
    req.session.accessToken,
    req.body.fileid,
    req.body.permid,
    req.body.driveid,
    req.session.email,
  );
  res.send(response);
});

router.post('/addPermission', isAuthenticated, async (req, res) => {
  const response = await cloudDriveAPI.addPermissions(
    req.session.clouddrive,
    req.session.accessToken,
    req.body.fileList,
    req.body.value,
    req.body.role,
    req.body.type,
    req.body.driveList,
    req.session.email,
  );
  res.send(response);
});

router.post('/updatePermission', isAuthenticated, async (req, res) => {
  // console.log("testing updating perms");
  // console.log(req.body);
  const response = await cloudDriveAPI.updatePermission(
    req.session.clouddrive,
    req.session.accessToken,
    req.body.fileid,
    req.body.permid,
    req.body.googledata,
    req.body.onedriveRole,
    req.body.driveid,
    req.session.email,
  );
  res.send(response);
});

router.post('/logout', isAuthenticated, async (req, res) => {
  req.session.destroy();
  res.status(200).send();
});

router.get('/getaccesscontrolpolicies', isAuthenticated, async (req, res) => {
  const response = await cloudDriveAPI.getAccessControlPolicies(req.session.email);
  res.send(response);
});

router.post('/addnewaccesscontrolpolicies', isAuthenticated, async (req, res) => {
  const response = await cloudDriveAPI.addNewAccessPolicy(
    req.session.email,
    req.body.requirement,
    req.body.ar,
    req.body.dr,
    req.body.aw,
    req.body.dw,
  );
  res.send(JSON.stringify(response));
});

router.post('/updateaccesscontrolpolicy', isAuthenticated, async (req, res) => {
  await cloudDriveAPI.updateAccessPolicy(
    req.body.type,
    req.body.requirement,
    req.body.newValue,
    req.session.email,
  );
  res.status(200).send();
});

router.post('/deleteaccesscontrolpolicy', isAuthenticated, async (req, res) => {
  await cloudDriveAPI.deletingAccessPolicyRequirement(req.body.requirement, req.session.email);
  res.status(200).send();
});

router.post('/deleteoneaccesscontrolpolicy', isAuthenticated, async (req, res) => {
  await cloudDriveAPI.deletingAccessControlsInRequirement(
    req.body.requirement,
    req.body.type,
    req.body.prevControl,
    req.session.email,
  );
  res.status(200).send();
});

router.post('/editaccesscontrol', isAuthenticated, async (req, res) => {
  await cloudDriveAPI.editAccessControl(
    req.body.requirement,
    req.body.type,
    req.body.prevControl,
    req.body.newControl,
    req.session.email,
  );
  res.status(200).send();
});

router.post('/checkaccesscontrol', isAuthenticated, async (req, res) => {
  cloudDriveAPI.checkAgainstAccessPolicy(
    req.session.email,
    req.body.files,
    req.body.value,
    req.body.role,
  ).then((response) => {
    res.status(200).send({ allowed: response });
  }).catch();
});

// eslint-disable-next-line consistent-return
router.post('/searchquery', isAuthenticated, async (req, res, next) => {
  try {
    const { email } = req.session;

    let fileSnapshot = null;
    if (req.body.snapshot !== '') {
      const timestamp = new Date(req.body.snapshot);

      fileSnapshot = await FileSnapshot.find({ createdAt: timestamp })
        .sort({ createdAt: -1 })
        .limit(1);
    }

    const { query } = req.body;
    const searchQuery = new SearchQuery({
      query,
    });
    searchQuery.save().then(() => {});
    User.updateOne(
      { email },
      { $push: { recentQueries: searchQuery } },
    ).then(() => {});
    const result = await cloudDriveAPI.getSearchResults(
      searchQuery,
      fileSnapshot,
      req.session.email,
    );
    res.send(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
