const { authenticate } = require('@google-cloud/local-auth');
var express = require('express');
var router = express.Router();
const { google } = require('googleapis');
const FileSnapshot = require('../model/file-snapshot-model')

var fetch = require('./fetch');
var { GRAPH_ME_ENDPOINT } = require('../authConfig');

// custom middleware to check auth state
function isAuthenticated(req, res, next) {
    if (!req.session.googleToken) {
        return res.redirect('/google/auth'); // redirect to sign-in route
    }
    next();
};

router.get('/snapshot',
	isAuthenticated, // check if user is authenticated
    async function (req, res, next) {
        try {
			snapshotMap = new Map();
			const drive = google.drive({version: 'v3'});
			drive.files.list({ access_token: req.session.googleToken,
				fields: 'files(id, name, permissions)'
			}, (err, res) => {
				if (err) {
					//console.error('The API returned an error.');
					throw err;
				}
				const files = res.data.files;
				if (files.length === 0) {
					//console.log('No files found.');
					return null;
				} else {
					//console.log('Files Found! File length: ' + files.length);
					for (i = 0; i < files.length; i++) {
						snapshotMap.set(files[i].id, files[i].permissions);
					}
				}
			})
			fileSnapshot = new FileSnapshot({files: snapshotMap});
			fileSnapshot.save();
		}
		catch (error) {
			next(error);
		}
    }
);

module.exports = router;