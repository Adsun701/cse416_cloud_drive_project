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
  let snapshot = cloudDriveAPI.fileSnapshot(req.session.clouddrive, req.session.accessToken, req.session.email);
  res.send(snapshot);
}); 

module.exports = router;
