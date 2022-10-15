/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

require('dotenv').config();

var path = require('path');
var express = require('express');
var session = require('express-session');
var createError = require('http-errors');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var authRouter = require('./routes/auth');
var googleRouter = require('./routes/googleauth');
var googleFileSnapshotRouter = require('./routes/googlefilesnapshot.js');
var googleGroupSnapshotRouter = require('./routes/googlegroupsnapshot.js');

// initialize express
var app = express();

/**
 * Using express-session middleware for persistent user session. Be sure to
 * familiarize yourself with available options. Visit: https://www.npmjs.com/package/express-session
 */
 app.use(session({
    secret: process.env.EXPRESS_SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // set this to true on production
    }
}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
//app.use(express.static("dist"));
app.use(express.static(path.join(__dirname, 'public')));

const db = require('./db/db')
db.on('error', console.error.bind(console, 'MongoDB connection error:'))
db.once("open", () => {})//console.log("MongoDB connected successfully")})

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/auth', authRouter);
app.use('/google', googleRouter);
app.use('/googlefilesnapshot', googleFileSnapshotRouter);
app.use('/googlegroupsnapshot', googleGroupSnapshotRouter);
// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;