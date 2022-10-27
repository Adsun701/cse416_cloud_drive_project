/*
Main interface to act as cloud drive adapter and to perform database operations
*/
const googledrive = require('./googledrive');
const onedrive = require('./onedrive')

/*
Handling the aftermath of authentication for the specifc clouddrive
*/
async function auth(clouddrive, token, email) {
    if (clouddrive == "google") {
        googledrive.googleAuth(token, email);
    } else if (clouddrive == "microsoft") {
        onedrive.microsoftAuth(token, email);
    }
    return;
}

// saveSnapshot - take and save a file snapshot to the DB
async function fileSnapshot(clouddrive, token, email) {
    let snapshot = {}
    if (clouddrive == "google") {
        snapshot = googledrive.saveSnapshot(token, email);
    } else if (clouddrive == "microsoft") {
        snapshot = onedrive.saveSnapshot(token);
    }
    return snapshot;
}

// updatePermission of a file
async function updatePermission(clouddrive, token, fileid, permid, googledata, onedriveRole) {
    if (clouddrive == "google") {
        googledrive.updatePermission(token, fileid, permid, googledata);
    } else if (clouddrive == "microsoft") {
        onedrive.updatePermission(token, onedriveRole, fileid, permid);
    }
    return;
}

// addPermissions for a singular file or multiple files
async function addPermissions(clouddrive, token, files, value, role, type="") {
    if (clouddrive == "google") {
        googledrive.addPermissions(token, files, value, type, role);
    } else if (clouddrive == "microsoft") {
        onedrive.addPermissions(token, files, value, role);
    }
}

/*
Updating access policy in the DB 
(requirement is the search query associated with the access policy)
*/
async function updateAccessPolicy(type, requirement, newValue) {
    if (type === "ar") {
        AccessPolicy.updateOne({ requirement }, { $push: { ar: newValue } })
        .then(() => {
            return requirement;
        });
    } else if (type === "dr") {
        AccessPolicy.updateOne({ requirement }, { $push: { dr: newValue } })
        .then(() => {
            return requirement;
        });
    } else if (type === "aw") {
        AccessPolicy.updateOne({ requirement }, { $push: { aw: newValue } })
        .then(() => {
          return requirement;
        });
    } else if (type === "dw") {
        AccessPolicy.updateOne({ requirement }, { $push: { dw: newValue } })
        .then(() => {
            return requirement;
        });
    } else {
        return null;
    }
}

/*
Add a new access policy with the default values
ar, dr, aw, and dw are strings with the values split by ', '
*/
async function addNewAccessPolicy(email, requirement, arStr, drStr, awStr, dwStr) {
    const ar = arStr.split(', ');
    const dr = drStr.split(', ');
    const aw = awStr.split(', ');
    const dw = dwStr.split(', ');
    const accessPolicy = new AccessPolicy({
      requirement,
      ar,
      dr,
      aw,
      dw,
    });
    accessPolicy.save().then(() => {});
    User.update({ email }, { $push: { accessPolicies: accessPolicy } })
      .then(() => {});
    return accessPolicy;
}

/*
Add a new recent search query to the database for the user
- Add to user's profile and to the searchqueries collection
*/
async function addQuery(email, query) {
    const searchQuery = new SearchQuery({
      query,
    });
    searchQuery.save().then(() => {});
    User.update({ email }, { $push: { recentQueries: searchQuery } })
      .then(() => {});
    return searchQuery;
}

/*
Retrieve a user's recent search queries
*/
async function getRecentQueries(email) {
    const user = await User.find({ email });
    const queries = user[0].recentQueries;
    const ids = [];
    queries.forEach((element) => {
        // eslint-disable-next-line no-underscore-dangle
        ids.push(element._id);
    });
    const recentQueries = await SearchQuery.find({ _id: { $in: ids } })
        .sort({ createdAt: -1 }).limit(5);
    return recentQueries;
}

module.exports = {
    auth, 
    fileSnapshot,
    addPermissions,
    updatePermission,
    updateAccessPolicy,
    addNewAccessPolicy,
    addQuery,
    getRecentQueries
}