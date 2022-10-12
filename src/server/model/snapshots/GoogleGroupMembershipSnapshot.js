require('@googleapis/drive');

class GoogleGroupMembershipSnapshot {
    client = null;
	drive = null;

	GoogleGroupMembershipSnapshot(client) {
		this.drive = google.drive({version: 'v3', auth: client});
		this.client = client;
	}


}

export { GoogleGroupMembershipSnapshot };