const express = require('express');

// const { OAuth2Client, auth } = require('google-auth-library');

const router = express.Router();
const { google } = require('googleapis');

const oauth2 = google.oauth2('v2');
const User = require('../model/user-model');
const File = require('../model/file-model');
const Permission = require('../model/permission-model');
const AccessPolicy = require('../model/access-policy-model');
const SearchQuery = require('../model/search-query-model');

const Oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT,
);

async function getUserDetails(oauth) {
  const userInfo = await oauth2.userinfo.get({ oauth });
  return userInfo;
}

function getConnectionUrl() {
  return Oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/drive.metadata.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/plus.me', 'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/drive.appdata',
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/drive.metadata',
      'https://www.googleapis.com/auth/drive.metadata.readonly',
      'https://www.googleapis.com/auth/drive.photos.readonly',
      'https://www.googleapis.com/auth/drive.readonly',
    ],
  });
}

async function getFilesAndPerms(token) {
  const drive = google.drive({ version: 'v3' });
  const files = {};
  let nextPage = null;
  const result = await drive.files.list({
    access_token: token,
    fields: 'files(id, name, permissions), nextPageToken',
  });
  nextPage = result.data.nextPageToken;
  // console.log(nextPage);
  let f = result.data.files;
  f.forEach((element) => {
    const newPermsList = [];
    if (element.permissions) {
      for (let i = 0; i < element.permissions.length; i += 1) {
        const newPermission = new Permission({
          id: element.permissions[i].id,
          email: element.permissions[i].emailAddress,
          displayName: element.permissions[i].displayName,
          roles: [element.permissions[i].role],
          inheritedFrom: null,
        });
        newPermission.save();
        newPermsList.push(newPermission);
      }
    }
    files[element.id] = newPermsList;
  });
  while (nextPage) {
    // eslint-disable-next-line no-await-in-loop
    const res = await drive.files.list({
      access_token: token,
      pageToken: nextPage,
      fields: 'files(id, name, permissions), nextPageToken',
    });
    // console.log(nextPage);
    nextPage = res.data.nextPageToken;
    f = res.data.files;
    f.forEach((element) => {
      const newPermsList = [];
      if (element.permissions) {
        for (let i = 0; i < element.permissions.length; i += 1) {
          const newPermission = new Permission({
            id: element.permissions[i].id,
            email: element.permissions[i].emailAddress,
            displayName: element.permissions[i].displayName,
            roles: [element.permissions[i].role],
            inheritedFrom: null,
          });
          newPermission.save();
          newPermsList.push(newPermission);
        }
      }
      files[element.id] = newPermsList;
    });
  }
  return files;
}

async function getFileData(token, fileid) {
  const drive = google.drive({ version: 'v3' });
  const fileData = await drive.files.get({
    access_token: token,
    fileId: fileid,
    fields: '*',
  });
  return fileData;
}

async function getAllFiles(token) {
  const drive = google.drive({ version: 'v3' });
  const files = [];
  let nextPage = null;
  const result = await drive.files.list({
    fields: `files(id,name,owners,mimeType,createdTime,modifiedTime,permissions)`,
    access_token: token,
  });
  nextPage = result.data.nextPageToken;
  // console.log(nextPage);
  let f = result.data.files;
  f.forEach((element) => {
    files.push(element);
  });
  // files.push(result.data.files);
  while (nextPage) {
    // eslint-disable-next-line no-await-in-loop
    const res = await drive.files.list({
      fields: `files(id,name,owners,mimeType,createdTime,modifiedTime,permissions)`,
      access_token: token,
      pageToken: nextPage,
    });
    // console.log(nextPage);
    nextPage = res.data.nextPageToken;
    f = res.data.files;
    f.forEach((element) => {
      files.push(element);
    });
    // files.push(result.data.files);
  }
  return files;
}

async function getDriveID(driveName, token) {
  const drive = google.drive({ version: 'v3' });
  const drives = [];
  let nextPage = null;
  const result = await drive.drives.list({
    q: `name = '${driveName}'`,
    access_token: token,
  });
  nextPage = result.data.nextPageToken;
  // console.log(nextPage);
  let f = result.data.drives;
  f.forEach((element) => {
    drives.push(element);
  });
  // files.push(result.data.files);
  while (nextPage) {
    // eslint-disable-next-line no-await-in-loop
    const res = await drive.drives.list({
      q: `name = '${driveName}'`,
      access_token: token,
    });
    // console.log(nextPage);
    nextPage = res.data.nextPageToken;
    f = res.data.drives;
    f.forEach((element) => {
      drives.push(element);
    });
    // files.push(result.data.files);
  }
  for (let i = 0; i < drives.length; i++) {
    if (driveName == drives[i].name) return drives[i].id;
  }
  return "";
}

function sortQuery(query) {
  words = query.replace(/ +(?= )/g,'').split(' ');
  words.sort(function(a, b) {
    if (a.includes(":") && !b.includes(":")) return 1;
    else if (!a.includes(":") && b.includes(":")) return -1;
    else return 0;
  })
  s = ""
  i = 0
  while (i < words.length && !words[i].includes(":")) {
    if (i > 0) s = s + " ";
    s = s + words[i].trim();
    i++;
  }
  operators = []
  for (j = i; j < words.length; j++) {
    operators.push(words[j]);
  }
  return [s, operators];
}

async function getLast15ModifiedFiles(token) {
  const drive = google.drive({ version: 'v3' });
  const files = [];
  const result = await drive.files.list({
    orderBy: 'modifiedTime',
    pageSize: 15,
    access_token: token,
  });
  let f = result.data.files;
  f.forEach((element) => {
    files.push(element);
  });
  return files;
}

async function getFiles(searchQuery, token) {
  if (searchQuery == null || searchQuery.query == null) return [];

  /* extract default string and operators from query */
  queryArray = sortQuery(searchQuery.query);
  searchString = queryArray[0]; // string
  operators = queryArray[1]; // array of strings containing "operation:value"

  let fullString = `name contains '${searchString}'`;

  let owners = [];
  let ownerString = "";

  let readers = [];
  let readerString = "";

  let writers = [];
  let writerString = "";

  let drives = [];
  let driveID = "";
  let searchInSharedDrive = false;

  // iterate through operators
  for (let i = 0; i < operators.length; i++) {
    let opPair = operators[i];
    let op = opPair.substring(0, opPair.indexOf(":"))
    let val = opPair.substring(opPair.indexOf(":") + 1);

    // case: op is equal to 'drive'
    if (op == 'drive') {
      if (val.length > 0) drives.push(val);
    }

    // case: op is equal to 'creator' or 'owner'
    if (op == 'creator' || op == 'owner') {
      if (val.length > 0) owners.push(val);
    }

    // case: op is equal to 'reader'
    if (op == 'reader') {
      if (val.length > 0) readers.push(val);
    }

    // case: op is equal to 'writer'
    if (op == 'writer') {
      if (val.length > 0) writers.push(val);
    }
  }

  // check if any drives were specified
  if (drives.length > 0) {
    if (drives[0] != "MyDrive") {
      searchInSharedDrive = true;
      driveID = await getDriveID(drives[0], token);
      if (driveID == "") return [];
    }
  }
  
  // check if any owners or creators were specified
  for (let i = 0; i < owners.length; i++) {
    if (i == 0) ownerString = ownerString + "(";
    ownerString = ownerString + `'${owners[i]}' in owners`;
    if (i < owners.length - 1) ownerString = ownerString + " or ";
    else ownerString = ownerString + ")";
  }
  if (ownerString.length > 0) fullString = fullString + " and " + ownerString;

  // check if any readers were specified
  for (let i = 0; i < readers.length; i++) {
    if (i == 0) readerString = readerString + "(";
    readerString = readerString + `'${readers[i]}' in readers`;
    if (i < readers.length - 1) readerString = readerString + " or ";
    else readerString = readerString + ")";
  }
  if (readerString.length > 0) fullString = fullString + " and " + readerString;
  
  // check if any writers were specified
  for (let i = 0; i < writers.length; i++) {
    if (i == 0) writerString = writerString + "(";
    writerString = writerString + `'${writers[i]}' in writers`;
    if (i < writers.length - 1) writerString = writerString + " or ";
    else writerString = writerString + ")";
  }
  if (writerString.length > 0) fullString = fullString + " and " + writerString;

  console.log(fullString);

  const drive = google.drive({ version: 'v3' });
  const files = [];
  let nextPage = null;
  const result = await drive.files.list((searchInSharedDrive ?
    {
      driveId: driveID,
      fields: `files(id,name,owners,mimeType,createdTime,modifiedTime,permissions)`,
      q: fullString,
      access_token: token,
    } :
    {
      fields: `files(id,name,owners,mimeType,createdTime,modifiedTime,permissions)`,
      q: fullString,
      access_token: token,
    }));
  nextPage = result.data.nextPageToken;
  // console.log(nextPage);
  let f = result.data.files;
  f.forEach((element) => {
    files.push(element);
  });
  // files.push(result.data.files);
  while (nextPage) {
    // eslint-disable-next-line no-await-in-loop
    if (searchInSharedDrive) {}
    const res = await drive.files.list((searchInSharedDrive ?
      {
        driveId: driveID,
        fields: `files(id,name,owners,mimeType,createdTime,modifiedTime,permissions)`,
        q: fullString,
        access_token: token,
      } :
      {
        fields: `files(id,name,owners,mimeType,createdTime,modifiedTime,permissions)`,
        q: fullString,
        access_token: token,
      }));
    // console.log(nextPage);
    nextPage = res.data.nextPageToken;
    f = res.data.files;
    f.forEach((element) => {
      files.push(element);
    });
    // files.push(result.data.files);
  }
  return files;
}

router.get('/auth', async (req, res) => {
  const url = getConnectionUrl();
  res.redirect(url);
});

router.get('/adduserfiles', async (req, res) => {
  const filesMap = await getFilesAndPerms(req.session.googleToken);
  const listFiles = [];
  // eslint-disable-next-line no-restricted-syntax
  for (const [key, value] of Object.entries(filesMap)) {
    // eslint-disable-next-line no-await-in-loop
    let fileData = await getFileData(req.session.googleToken, key);
    fileData = fileData.data;
    const file = new File({
      id: fileData.id,
      name: fileData.name,
      createdTime: fileData.createdTime,
      modifiedTime: fileData.modifiedTime,
      permissions: value,
    });
    file.save();
    listFiles.push(file);
  }
  User.update({ email: req.session.googleEmail }, { $set: { files: listFiles } }).then(() => {});
  res.send('Successfully updated files in user db');
});

router.get('/authorize', async (req, res) => {
  const { code } = req.query;
  // console.log(code);
  const { tokens } = await Oauth2Client.getToken(code);
  Oauth2Client.setCredentials(tokens);
  google.options({ auth: Oauth2Client });
  req.session.googleToken = tokens.access_token;
  const user = await getUserDetails(Oauth2Client);
  const { email } = user.data;
  req.session.googleEmail = email;
  const newUser = new User({
    email,
    files: [],
    accessPolicies: [],
    fileSnapshots: [],
    groupSnapshots: [],
    recentQueries: [],
  });
  User.exists({ email }).then((exists) => {
    if (exists) {
      User.update({ email }, { $set: { files: [] } }).then(() => {});
    } else {
      newUser.save().then(() => {});
    }
  });
  res.render('googleindex', { email });
});

router.get('/file', async (req, res) => {
  const drive = google.drive({ version: 'v3' });
  const result = await drive.files.list({
    access_token: req.session.googleToken,
  });
  res.render('google', { files: result.data.files });
});

router.get('/file/:id', async (req, res) => {
  const fileid = req.params.id;
  const drive = google.drive({ version: 'v3' });
  const result = await drive.permissions.list({
    access_token: req.session.accessToken,
    fileId: fileid,
    fields: '*',
  });
  res.send(result.data);
});

router.get('/addperm', (req, res) => {
  res.render('googleperm');
});

router.post('/addfilepermission', async (req, res) => {
  const files = JSON.parse(req.body.files); // list of files with new ids
  const { value } = req.body; // email address for new permission
  const { type } = req.body; // user, group, etc
  const { role } = req.body; // new role for the new permissions
  const body = {
    emailAddress: value,
    type,
    role,
  };
  const drive = google.drive({ version: 'v3' });
  const ret = [];
  for (let i = 0; i < files.length; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    const result = await drive.permissions.create({
      access_token: req.session.accessToken,
      fileId: files[i],
      resource: body,
      emailMessage: 'Hello!',
    });
    ret.push(result);
  }
  res.send(ret);
});

router.get('/addaccess', (req, res) => {
  res.render('googleaccesspolicy');
});

router.post('/addaccesspolicy', async (req, res, next) => {
  try {
    const user = await getUserDetails(Oauth2Client);
    const { email } = user.data;

    const { requirement } = req.body;
    const ar = req.body.ar.split(', ');
    const dr = req.body.dr.split(', ');
    const aw = req.body.aw.split(', ');
    const dw = req.body.dw.split(', ');

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
    res.send(accessPolicy);
  } catch (error) {
    next(error);
  }
});

router.get('/search', async (req, res) => {
  const userDetails = await getUserDetails(Oauth2Client);
  const { email } = userDetails.data;

  const user = await User.find({ email });
  const queries = user[0].recentQueries;
  const ids = [];
  queries.forEach((element) => {
    // eslint-disable-next-line no-underscore-dangle
    ids.push(element._id);
  });
  const recentQueries = await SearchQuery.find({ _id: { $in: ids } })
    .sort({ createdAt: -1 }).limit(5);
  res.render('googlesearch', {
    recentQuery1: recentQueries[0] ? recentQueries[0].query : null,
    recentQuery2: recentQueries[1] ? recentQueries[1].query : null,
    recentQuery3: recentQueries[2] ? recentQueries[2].query : null,
    recentQuery4: recentQueries[3] ? recentQueries[3].query : null,
    recentQuery5: recentQueries[4] ? recentQueries[4].query : null,
  });
});

router.post('/searchquery', async (req, res, next) => {
  if (!req.session.accessToken) {
    return res.send('nope');
  }

  try {
    const email = req.session.email;

    const { query } = req.body;

    const searchQuery = new SearchQuery({
      query,
    });
    searchQuery.save().then(() => {});
    User.update({ email }, { $push: { recentQueries: searchQuery } })
      .then(() => {});
      const result = await getFiles(searchQuery, req.session.accessToken);
    res.send(result);
  } catch (error) {
    next(error);
  }
});

router.get('/allfiles', async (req, res) => {
  if (req.session.googleToken) {
    const result = await getAllFiles(req.session.googleToken);
    res.send(result);
  } else {
    res.send('nope');
  }
});

router.get('/last15modifiedfiles', async (req, res) => {
  if (req.session.googleToken) {
    const result = await getLast15ModifiedFiles(req.session.googleToken);
    res.send(result);
  } else {
    res.send('nope');
  }
});

router.get('/f/updateperm', (req, res) => {
  res.render('googleupdateperm');
});

router.post('/f/updatepermission', async (req, res) => {
  const drive = google.drive({ version: 'v3' });
  const data = JSON.parse(req.body.data);
  const result = await drive.permissions.update({
    access_token: req.session.googleToken,
    fileId: req.body.fileid,
    permissionId: req.body.permid,
    requestBody: data,
  });
  res.send(result.data);
});

router.get('/file/:fileid/permission/:permid', async (req, res) => {
  const drive = google.drive({ version: 'v3' });
  const result = await drive.permissions.get({
    access_token: req.session.googleToken,
    fileId: req.params.fileid,
    permissionId: req.params.permid,
    fields: '*',
  });
  res.send(result.data);
});

router.post('/file', async (req, res) => {
  const drive = google.drive({ version: 'v3' });
  const result = await drive.permissions.update({
    access_token: req.session.googleToken,

  });
  res.send(result.data);
});

// async function getAllPermissions(fileId, token) {
//   const drive = google.drive({ version: 'v3' });
//   const result = await drive.permissions.list({
//     access_token: token,
//     fileId,
//   });
//   return result.data;
// }

router.get('/filedata/:id', async (req, res) => {
  const fileid = req.params.id;
  const result = await getFileData(req.session.googleToken, fileid);
  res.send(result.data);
});

// async function getFilePermData(token, fileid, permid) {
//   const drive = google.drive({ version: 'v3' });
//   const result = await drive.permissions.get({
//     access_token: token,
//     fileId: fileid,
//     permissionId: permid,
//     fields: '*',
//   });
//   return result.data;
// }

router.get('/signout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

// async function listFiles(authClient, tokens) {
//   const drive = google.drive({ version: 'v3', auth: authClient });
//   const res = await drive.files.list({
//     access_token: tokens,
//   });
//   const { files } = res.data;
//   if (files.length === 0) {
//     console.log('No files found.');
//     return;
//   }

//   console.log('Files:');
//   files.map((file) => {
//     console.log(`${file.name} (${file.id})`);
//   });
// }

router.post('/updateaccesspolicy/:requirement/ar', (req, res) => {
  const { requirement } = req.params;
  const newar = req.body.ar;
  AccessPolicy.update({ requirement }, { $push: { ar: newar } })
    .then(() => {
      const redirecturl = `/google/viewaccesspolicy?requirement=${requirement}`;
      res.redirect(redirecturl);
    });
});

router.post('/updateaccesspolicy/:requirement/dr', (req, res) => {
  const { requirement } = req.params;
  const newdr = req.body.dr;
  AccessPolicy.update({ requirement }, { $push: { dr: newdr } })
    .then(() => {
      const redirecturl = `/google/viewaccesspolicy?requirement=${requirement}`;
      res.redirect(redirecturl);
    });
});

router.post('/updateaccesspolicy/:requirement/aw', (req, res) => {
  const { requirement } = req.params;
  const newaw = req.body.aw;
  AccessPolicy.update({ requirement }, { $push: { aw: newaw } })
    .then(() => {
      const redirecturl = `/google/viewaccesspolicy?requirement=${requirement}`;
      res.redirect(redirecturl);
    });
});

router.post('/updateaccesspolicy/:requirement/dw', (req, res) => {
  const { requirement } = req.params;
  const newdw = req.body.dw;
  AccessPolicy.update({ requirement }, { $push: { dw: newdw } })
    .then(() => {
      const redirecturl = `/google/viewaccesspolicy?requirement=${requirement}`;
      res.redirect(redirecturl);
    });
});

router.get('/viewaccesspolicy', (req, res) => {
  const { requirement } = req.query;
  AccessPolicy.findOne({ requirement }).then((data) => {
    const { ar } = data;
    const { dr } = data;
    const { aw } = data;
    const { dw } = data;
    const maxlength = Math.max(Math.max(Math.max(ar.length, dr.length), aw.length), dw.length);
    const accessdata = [];
    for (let i = 0; i < maxlength; i += 1) {
      accessdata.push([ar[i], dr[i], aw[i], dw[i]]);
    }
    res.render('googleexistingaccesspolicy', { requirement, accessdata });
  });
});

router.get('/googlegroupsnapshot', (req, res) => {
  res.render('googlegroupsnapshot');
});

module.exports = router;
