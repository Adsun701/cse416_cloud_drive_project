require('@googleapis/drive');

class GoogleGroupMembershipSnapshot {
    client = null;
	drive = null;

	GoogleGroupMembershipSnapshot(client) {
		this.drive = google.drive({version: 'v3', auth: client});
		this.client = client;
	}

    // gets file list, gets names of user emails in sharing group for each file, and returns file name along with each email for each line.
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
					snapshot += file.name + ": ";
                    for (permission in file.permissions) {
                        if (permission != null && permission["emailAddress"] != null) snapshot += permission["emailAddress"] + " ";
                    }
                    snapshot += "\n";
				}
			}
		})
		snapshotTimeStamp = new Date().toLocaleString();
		return [snapshot, snapshotTimeStamp];
    }

}

export { GoogleGroupMembershipSnapshot };