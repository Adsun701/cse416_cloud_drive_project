const fs = require('fs').promises;
const path = require('path');
const process = require('process');
const { authenticate } = require('@google-cloud/local-auth');
const { google } = require('googleapis');

class GoogleFileSharingSnapshot {
	client = null;
	service = null;

	GoogleFileSharingSnapshot(client) {
		this.service = google.drive('v3');
		this.client = client;
	}

    
    takeSnapshot = () => {
		service.files.list({
			auth: client,
			resource: { parents: [ "root" ] },
			fields: 'nextPageToken, files(id, name, webContentLink, webViewLink, mimeType, parents)'
			}, (err, res) => {
				if (err) {
					console.error('The API returned an error.');
					throw err;
				}
				const files = res.data.files;
				if (files.length === 0) {
					console.log('No files found.');
				} else {
					console.log('Files Found!');
					for (const file of files) {
						console.log(`${file.name} (${file.id})`);
					}
				}
			})
    }

}

export { GoogleFileSharingSnapshot };