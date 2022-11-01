const express = require('express');
const cloudDriveAPI = require('../services/api');

const router = express.Router();

const User = require("../model/user-model");
const SearchQuery = require("../model/search-query-model");

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

router.post("/searchquery", async (req, res, next) => {
  if (!req.session.accessToken) {
    return res.send("nope");
  }

  try {
    const email = req.session.email;

    const { query } = req.body;

    const searchQuery = new SearchQuery({
      query,
    });
    searchQuery.save().then(() => {});
    User.update(
      { email },
      { $push: { recentQueries: searchQuery } }
    ).then(() => {});
    const result = await cloudDriveAPI.getSearchResults(
      searchQuery,
      req.session.accessToken, 
      req.session.email
    );
    res.send(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
