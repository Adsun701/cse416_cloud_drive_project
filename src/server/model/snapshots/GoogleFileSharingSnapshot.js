const { authenticate } = require('@google-cloud/local-auth');
const { google } = require('googleapis');
const Schema = mongoose.Schema
const FileSnapshot = require('../file-snapshot-model').schema

class GoogleFileSharingSnapshot {
	client = null;
	drive = null;

	GoogleFileSharingSnapshot(client) {
		this.drive = google.drive({version: 'v3', auth: client});
		this.client = client;
	}
    
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
					snapshotMap.set(file.id, file.permissions);
				}
			}
		})
		fileSnapshot = new FileSnapshot({files: snapshotMap});
		return fileSnapshot;
    }
}

export { GoogleFileSharingSnapshot };