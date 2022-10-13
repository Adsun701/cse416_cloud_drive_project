const { authenticate } = require('@google-cloud/local-auth');
var express = require('express');
var router = express.Router();
const { google } = require('googleapis');
const GroupSnapshot = require('../model/group-snapshot-model')

var fetch = require('./fetch');
var { GRAPH_ME_ENDPOINT } = require('../authConfig');

// custom middleware to check auth state
function isAuthenticated(req, res, next) {
    if (!req.session.isAuthenticated) {
        return res.redirect('/auth/signin'); // redirect to sign-in route
    }
    next();
};

router.get('/snapshot',
	isAuthenticated, // check if user is authenticated
    async function (req, res, next) {
        try {
			snapshotMap = new Map();
			google.drive.files.list({ access_token: req.session.googleToken }, (err, res) => {
				if (err) {
					//console.error('The API returned an error.');
					throw err;
				}
				const files = res.data.files;
				if (files.length === 0) {
					//console.log('No files found.');
					return null;
				} else {
					//console.log('Files Found!');
					for (const file of files) {
						permissions = file.permissions;
						permissionAddresses = new Array();
						for (permission in permissions) {
							if (permission.type == "group") {
								permissionAddresses.push(permission.emailAddress);
							}
						}
						snapshotMap.set(file.id, permissionAddresses);
					}
				}
			})
			groupSnapshot = new GroupSnapshot({files: snapshotMap});
			groupSnapshot.save();
		}
		catch (error) {
			next(error);
		}
    }
);

module.exports = router;