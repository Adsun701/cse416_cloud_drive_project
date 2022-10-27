const express = require('express');
const cloudDriveAPI = require('../services/api');

const router = express.Router();

router.post('/', async (req, res) => {
  if (req.session.isAuthenticated) {
    res.send('Already Authenticated');
  } else {
    const { clouddrive } = req.body;
    const { accessToken } = req.body;
    const { name } = req.body;
    const { email } = req.body;
    req.session.clouddrive = clouddrive;
    req.session.accessToken = accessToken;
    req.session.name = name;
    req.session.email = email;
    req.session.isAuthenticated = true;
    cloudDriveAPI.auth(clouddrive, accessToken, email);
  }
});

module.exports = router;
