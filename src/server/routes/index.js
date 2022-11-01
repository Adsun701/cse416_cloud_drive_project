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
    .fileSnapshot(req.session.clouddrive, req.session.accessToken, req.session.email);
  res.send(snapshot);
});

router.get('/allfilesnapshots', async (req, res) => {
  const user = await User.find({ email: req.session.email });
  const { fileSnapshots } = user[0];
  const ids = [];
  fileSnapshots.forEach((element) => {
    // eslint-disable-next-line no-underscore-dangle
    ids.push(element._id);
  });
  const snapshotList = await FileSnapshot.find({ _id: { $in: ids } })
    .sort({ createdAt: -1 });
  res.send(JSON.stringify(snapshotList));
});

router.get('/allgroupsnapshots', async (req, res) => {
  const user = await User.find({ email: req.session.email });
  const { groupSnapshots } = user[0];
  const ids = [];
  groupSnapshots.forEach((element) => {
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

router.post('/deletePermission', isAuthenticated, async (req, res) => {
  const response = await cloudDriveAPI.deletePermission(
    req.session.clouddrive,
    req.session.accessToken,
    req.body.fileid,
    req.body.permid,
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
  );
  res.send(response);
});

router.post('/updatePermission', isAuthenticated, async (req, res) => {
  const response = await cloudDriveAPI.updatePermission(
    req.session.clouddrive,
    req.session.accessToken,
    req.body.fileid,
    req.body.permid,
    req.body.googledata,
    req.body.onedriveRole,
  );
  res.send(response);
});

router.post('/logout', isAuthenticated, async (req, res) => {
  req.session.destroy();
  res.status(200).send();
});

router.get('/getaccesscontrolpolicies', isAuthenticated, async (req, res) => {
  const response = await cloudDriveAPI.getAccessControlPolicies(req.session.email);
  // console.log(response);
  res.send(response);
});

<<<<<<< HEAD
router.post('/addnewaccesscontrolpolicies', isAuthenticated, async (req, res) => {
  const response = await cloudDriveAPI
    .addNewAccessPolicy(req.session.email, req.body.requirement, req.body.ar, req.body.dr, req.body.aw, req.body.dw);
  res.send(JSON.stringify(response));
  });

router.post('/updateaccesscontrolpolicy', isAuthenticated, async (req, res) => {
  await cloudDriveAPI.updateAccessPolicy(req.body.type, req.body.requirement, req.body.newValue);
  res.status(200).send();
});

router.post('/deleteaccesscontrolpolicy', isAuthenticated, async (req, res) => {
  await cloudDriveAPI.deletingAccessPolicyRequirement(req.session.email, req.body.requirement);
  res.status(200).send();
});

router.post("/searchquery", async (req, res, next) => {
=======
router.post('/searchquery', async (req, res, next) => {
>>>>>>> 02cbbf6f344f39008591dafe24c33e6c18773688
  if (!req.session.accessToken) {
    return res.send('nope');
  }

  try {
    const { email } = req.session;

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
      req.session.accessToken,
      req.session.email,
    );
    res.send(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
