const express = require('express');
const cloudDriveAPI = require('../services/api');

const router = express.Router();

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

router.get('/allfiles', isAuthenticated, async (req, res) => {
  // console.log(req.session);
  const files = await cloudDriveAPI.getAllFiles(req.session.email);
  res.send(JSON.stringify(files));
});

router.post('/deletePermission', isAuthenticated, async (req, res) => {
  const response = await cloudDriveAPI
    .deletePermission(req.session.clouddrive, req.session.accessToken, req.body.fileid, req.body.permid);
  res.send(response);
});

router.post('/addPermission', isAuthenticated, async (req, res) => {
  const response = await cloudDriveAPI
  .addPermissions(req.session.clouddrive, req.session.accessToken, req.body.fileList, req.body.value, req.body.role, req.body.type);
  res.send(response);
});

router.post('/updatePermission', isAuthenticated, async (req, res) => {
  const response = await cloudDriveAPI
    .updatePermission(req.session.clouddrive, req.session.accessToken, req.body.fileid, req.body.permid, req.body.googledata, req.body.onedriveRole);
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

module.exports = router;
