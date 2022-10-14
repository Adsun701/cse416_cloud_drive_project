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

async function getAllFiles(token) {
	const drive = google.drive({version: 'v3'});
	let files = [];
	let nextPage = null;
	const result = await drive.files.list({
	  access_token: token,
	  fields: "files(id, name, permissions), nextPageToken"
	});
	console.log("RESULT");
	console.log(result);
	nextPage = result.data.nextPageToken;
	console.log(nextPage);
	files.push(result.data.files);
	while(nextPage) {
	  const result = await drive.files.list({
		access_token: token,
		pageToken: nextPage
	  });
	  console.log(nextPage);
	  nextPage = result.data.nextPageToken;
	  files.push(result.data.files);
	}
	return files;
  }

async function getSnapshot(token) {
	const drive = google.drive({version: 'v3'});
	let files = {};
	let nextPage = null;
	const result = await drive.files.list({
	  access_token: token,
	  fields: "files(id, name, permissions), nextPageToken"
	});
	nextPage = result.data.nextPageToken;
	console.log(nextPage);
	let f = result.data.files;
	f.forEach(element => {
		let newPermsList = [];
		if (element.permissions) {
			for (let i = 0; i < element.permissions.length; i++) {
				let newPermission = {
					"id": element.permissions[i].id,
					"email": element.permissions[i].emailAddress,
					"displayName": element.permissions[i].displayName,
					"roles": [element.permissions[i].role],
					"inheritedFrom": null
				}
				newPermsList.push(newPermission);
			}
		}
		files[element.id] = newPermsList;
	});
	while(nextPage) {
	  const result = await drive.files.list({
		access_token: token,
		pageToken: nextPage, 
		fields: "files(id, name, permissions), nextPageToken"
	  });
	  console.log(nextPage);
	  nextPage = result.data.nextPageToken;
	  f = result.data.files;
	  f.forEach(element => {
		let newPermsList = [];
		if (element.permissions) {
			for (let i = 0; i < element.permissions.length; i++) {
				let newPermission = {
					"id": element.permissions[i].id,
					"email": element.permissions[i].emailAddress,
					"displayName": element.permissions[i].displayName,
					"roles": [element.permissions[i].role],
					"inheritedFrom": null
				}
				newPermsList.push(newPermission);
			}
		}
		files[element.id] = newPermsList;
	  });
	}
	return files;
  }


router.get('/snapshot',
	isAuthenticated, // check if user is authenticated
    async function (req, res, next) {
			const result = await getSnapshot(req.session.googleToken);
			res.send(result);
		});

module.exports = router;