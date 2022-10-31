const express = require('express');
const cloudDriveAPI = require('../services/api');

const router = express.Router();

function isAuthenticated(req, res, next) {
  if (!req.session.isAuthenticated) {
    res.send({"error": "Not Authenticated"});
  }
  next();
}

router.get('/filesnapshot', isAuthenticated, async (req, res) => {
  const snapshot = await cloudDriveAPI
    .fileSnapshot(req.session.clouddrive, req.session.accessToken, req.session.email);
  res.send(snapshot);
});

router.get('/allfiles', isAuthenticated, async (req, res) => {
  console.log(req.session);
  const files = await cloudDriveAPI
  .getAllFiles(req.session.email);
  res.send(JSON.stringify(files));
})

module.exports = router;
