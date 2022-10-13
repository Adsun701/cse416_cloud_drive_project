const { authenticate } = require('@google-cloud/local-auth');
const { google } = require('googleapis');
const Schema = mongoose.Schema
const FileSnapshot = require('../file-snapshot-model').schema

class GoogleGroupMembershipSnapshot {
    client = null;
	drive = null;

	GoogleGroupMembershipSnapshot(client) {
		this.drive = google.drive({version: 'v3', auth: client});
		this.client = client;
	}

    // gets file list, gets names of user emails in sharing group for each file, and returns file name along with each email for each line.
    takeSnapshot = () => {
		snapshotMap = new Map();
		drive.files.list({ }, (err, res) => {
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

}

export { GoogleGroupMembershipSnapshot };