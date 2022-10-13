

var express = require('express');
const { route } = require('./users');
var router = express.Router();

router.get('/', function (req, res, next) {
    res.render('index', {
        title: 'MSAL Node & Express Web App',
        isAuthenticated: req.session.isAuthenticated,
        username: req.session.account?.username,
    });
});

router.get('/goog', function (req, res, next) {
    res.render('google');
});

module.exports = router;
