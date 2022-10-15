const express = require('express');
// const { route } = require('./users');

const router = express.Router();

router.get('/', (req, res) => {
  res.render('index', {
    title: 'Cloud Drive Manager',
    isAuthenticated: req.session.isAuthenticated,
    username: req.session.account?.username,
  });
});

router.get('/goog', (req, res) => {
  res.render('google');
});

module.exports = router;
