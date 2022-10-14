const express = require('express');
const { route } = require('./users');
const router = express.Router();

router.get('/', function (req, res, next) {
    res.render('index', {
        title: 'Cloud Drive Manager',
        isAuthenticated: req.session.isAuthenticated,
        username: req.session.account?.username,
    });
});

router.get('/goog', function (req, res, next) {
    res.render('google');
});

module.exports = router;
