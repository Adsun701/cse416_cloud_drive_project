const express = require('express');
const cloudDriveAPI = require('../services/api')
const router = express.Router();

router.post('/', async (req, res) => {
    if (req.session.isAuthenticated) {
        res.send("Already Authenticated");
        return;
    } else {
        let clouddrive = req.body.clouddrive;
        let accessToken = req.body.accessToken;
        let name = req.body.name;
        let email = req.body.email;
        req.session.clouddrive = clouddrive;
        req.session.accessToken = accessToken;
        req.session.name = name;
        req.session.email = email;
        req.session.isAuthenticated = true;
        cloudDriveAPI.auth(clouddrive, accessToken, email);
    } 
});

module.exports = router;
