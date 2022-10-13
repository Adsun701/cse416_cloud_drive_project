const fs = require('fs').promises;
const path = require('path');
const process = require('process');
const { authenticate } = require('@google-cloud/local-auth');
const { google } = require('googleapis');

class GoogleFileSharingSnapshot {
	client = null;
	drive = null;

	GoogleFileSharingSnapshot(client) {
		this.drive = google.drive({version: 'v3', auth: client});
		this.client = client;
	}

    
    takeSnapshot = () => {
		snapshot = "";
		drive.files.list({ }, (err, res) => {
			if (err) {
				console.error('The API returned an error.');
				throw err;
			}
			const files = res.data.files;
			if (files.length === 0) {
				console.log('No files found.');
				return null;
			} else {
				console.log('Files Found!');
				// stringify each file into json and add them to a compiled string.
				for (const file of files) {
					console.log(`${file.name} (${file.id})`);
					snapshot += JSON.stringify(file) + "\n";
				}
			}
		})
		snapshotTimeStamp = new Date().toLocaleString();
		return [snapshot, snapshotTimeStamp];
    }

}

export { GoogleFileSharingSnapshot };