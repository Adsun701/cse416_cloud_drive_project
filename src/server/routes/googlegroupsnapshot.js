const { authenticate } = require('@google-cloud/local-auth');
const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const GroupSnapshot = require('../model/group-snapshot-model')

const fetch = require('./fetch');
const { GRAPH_ME_ENDPOINT } = require('../authConfig');

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
				fields: 'files(id, name, permissions)' }, (err, res) => {
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
						permissionAddresses = new Array();
						for (j = 0; files[i].permissions != null && j < files[i].permissions.length; j++) {
							if (files[i].permissions[j].type == "group") {
								permissionAddresses.push(files[i].permissions[j].emailAddress);
							}
						}
						snapshotMap.set(files[i].id, permissionAddresses);
					}
				}
			})
			groupSnapshot = new GroupSnapshot({groupMembers: snapshotMap});
			groupSnapshot.save();
		}
		catch (error) {
			next(error);
		}
    }
);

module.exports = router;