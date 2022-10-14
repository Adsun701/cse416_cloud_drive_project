var express = require('express');
const { OAuth2Client, auth } = require('google-auth-library');
const router = express.Router();
const { google } = require('googleapis');
const { token } = require('morgan');
const { redirect } = require('react-router-dom');
const oauth2 = google.oauth2('v2');
const User = require('../model/user-model');
const File = require('../model/file-model');
const Permission = require('../model/permission-model');
const AccessPolicy = require('../model/access-policy-model');
const SearchQuery = require('../model/search-query-model');

const Oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT, // this must match your google api settings
);

async function getUserDetails(auth) {
  const usr_info = await oauth2.userinfo.get({auth: auth});
  return usr_info;
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
        'https://www.googleapis.com/auth/drive.readonly'
    ]
  });
}


router.get('/auth', async function authorize(req,res,next) {
  const url = getConnectionUrl();
  res.redirect(url);
});

router.get('/authorize', async function (req, res, next) {
  let code = req.query.code;
  console.log(code);
  const {tokens} = await Oauth2Client.getToken(code)
  Oauth2Client.setCredentials(tokens);
  google.options({auth: Oauth2Client})
  req.session.googleToken = tokens.access_token;
  let user = await getUserDetails(Oauth2Client);
  let email = user.data.email;
  req.session.googleEmail = email;
  // let filesMap = await getFilesAndPerms(req.session.googleToken);
  let list_files = [];
  // for (const [key, value] of Object.entries(filesMap)) {
  //   let fileData = await getFileData(req.session.googleToken, key);
  //   fileData = fileData.data;
  //   let file = new File({
  //     id: fileData.id,
  //     name: fileData.name,
  //     createdTime: fileData.createdTime,
  //     modifiedTime: fileData.modifiedTime,
  //     permissions: value
  //   })
  //   file.save();
  //   list_files.push(file);
  // }
  let newUser = new User({
    name: user.data.name,
    email: email,
    files: list_files,
    accessPolicies: [],
    fileSnapshots: [],
    groupSnapshots: [],
    recentQueries: []
  })
  User.exists({ email: email }).then(exists => {
    if (exists) {
      User.update({email: email}, {$set: { files: list_files }}).then(() => console.log("user updated in db"));
    } else {
      newUser.save().then(() => console.log("user saved in db"));
    }
  })
  res.send(user.data);
});

router.get('/file', async function(req, res, next) {
  const drive = google.drive({version: 'v3'});
  const result = await drive.files.list({
    access_token: req.session.googleToken
  });
  res.render('google',{files:result.data.files});
});

router.get('/file/:id', async function(req,res,next) {
  let fileid = req.params.id;
  const drive = google.drive({version: 'v3'});
  const result = await drive.permissions.list({
    access_token: req.session.googleToken,
    fileId: fileid,
  });
  res.send(result.data);
});

router.get('/addperm', function(req, res, next) {
  res.render('googleperm');
})

router.post('/addfilepermission', async function(req, res, next) {
  let files = JSON.parse(req.body.files) // list of files with new ids
  let value = req.body.value // email address for new permission
  let type =  req.body.type // user, group, etc
  let role = req.body.role // new role for the new permissions
  let body = {
    'emailAddress': value,
    'type': type,
    'role': role
  };
  const drive = google.drive({version: 'v3'});
  let ret = []
  for (let i = 0; i < files.length; i++) {
    const result = await drive.permissions.create({
      access_token: req.session.googleToken,
      fileId: files[i],
      resource: body,
      emailMessage: "Hello!"
    });
    ret.push(result);
  }
  res.send(ret);
});

router.get('/addaccess', function(req, res, next) {
  res.render('googleaccesspolicy');
})

router.post('/addaccesspolicy', async function(req, res, next) {
  try {
    let user = await getUserDetails(Oauth2Client);
    let email = user.data.email;
  
    let requirement = req.body.requirement;
    let ar = req.body.ar.split(", "); 
    let dr =  req.body.dr.split(", "); 
    let aw = req.body.aw.split(", ");
    let dw =  req.body.dw.split(", ");
  
    let accessPolicy = new AccessPolicy({
      requirement: requirement,
      ar: ar,
      dr: dr,
      aw: aw,
      dw: dw
    })
    accessPolicy.save().then(() => console.log("access policy saved in db"));
    User.update(
      {email: email}, {$push: { accessPolicies: accessPolicy }})
      .then(() => console.log("user access policies updated in db"));
    res.send(accessPolicy);
  } catch(error) {
    next(error);
  }
});

router.get('/search', function(req, res, next) {
  res.render('googlesearch');
});

router.post('/searchquery', async function(req, res, next) {
  try {
      let user = await getUserDetails(Oauth2Client);
      let email = user.data.email;

      let query = req.body.query;
    
      let searchQuery = new SearchQuery({
        query: query
      })
      searchQuery.save().then(() => console.log("search query saved in db"));
      User.update(
        {email: email}, {$push: { recentQueries: searchQuery }})
        .then(() => console.log("user recent queries updated in db"));
      res.send(searchQuery);
  } catch(error) {
      next(error);
  }
});

router.get('/allfiles', async function (req, res, next) {
  if (req.session.googleToken) {
    const result = await getAllFiles(req.session.googleToken);
    res.send(result);
  } else {
    res.send("nope");
  }
});

router.get('/f/updateperm', function (req, res, next) {
  res.render('googleupdateperm');    
}); 

router.post('/f/updatepermission', async function (req, res, next) {
  const drive = google.drive({version: 'v3'});
  let data = JSON.parse(req.body.data);
  const result = await drive.permissions.update({
    access_token: req.session.googleToken,
    fileId: req.body.fileid,
    permissionId: req.body.permid,
    requestBody: data,
  });
  res.send(result.data);
});

router.get('/file/:fileid/permission/:permid', async function (req, res, next) {
  const drive = google.drive({version: 'v3'});
  const result = await drive.permissions.get({
    access_token: req.session.googleToken,
    fileId: req.params.fileid,
    permissionId: req.params.permid,
    fields:"*",
  });
  res.send(result.data);
});

router.post('/file', async function (req, res, next) {
  const drive = google.drive({version: 'v3'});
  const result = await drive.permissions.update({
    access_token: req.session.googleToken,
    
  });
  res.send(result.data);
});

async function getAllFiles(token) {
  const drive = google.drive({version: 'v3'});
  let files = [];
  let nextPage = null;
  const result = await drive.files.list({
    access_token: token
  });
  nextPage = result.data.nextPageToken;
  console.log(nextPage);
  let f = result.data.files;
  f.forEach(element => {
    files.push(element);
  });
  //files.push(result.data.files);
  while(nextPage) {
    const result = await drive.files.list({
      access_token: token,
      pageToken: nextPage, 
    });
    //console.log(nextPage);
    nextPage = result.data.nextPageToken;
    f = result.data.files;
    f.forEach(element => {
      files.push(element);
    });
    //files.push(result.data.files);
  }
  return files;
}



async function getFilesAndPerms(token) {
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
				let newPermission = new Permission({
					"id": element.permissions[i].id,
					"email": element.permissions[i].emailAddress,
					"displayName": element.permissions[i].displayName,
					"roles": [element.permissions[i].role],
					"inheritedFrom": null
				});
				newPermission.save();
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
				let newPermission = new Permission({
					"id": element.permissions[i].id,
					"email": element.permissions[i].emailAddress,
					"displayName": element.permissions[i].displayName,
					"roles": [element.permissions[i].role],
					"inheritedFrom": null
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

async function getAllPermissions(fileId, token) {
  const drive = google.drive({version: 'v3'});
  const result = await drive.permissions.list({
    access_token: token,
    fileId: fileId,
  });
  return result.data;
};

router.get('/filedata/:id', async function(req,res,next) {
  let fileid = req.params.id;
  const result = await getFileData(req.session.googleToken, fileid);
  res.send(result.data);
});

async function getFileData(token, fileid) {
  const drive = google.drive({version: 'v3'});
  const fileData = await drive.files.get({
    access_token: token,
    fileId: fileid,
    fields: "*",
  });
  return fileData;
}

async function getFilePermData(token, fileid, permid) {
  const drive = google.drive({version: 'v3'});
  const result = await drive.permissions.get({
    access_token: token,
    fileId: fileid,
    permissionId: permid,
    fields:"*",
  });
  res.send(result.data);
}

/**
 * Lists the names and IDs of up to 10 files.
 * @param {OAuth2Client} authClient An authorized OAuth2 client.
 */
async function listFiles(authClient, tokens) {
  const drive = google.drive({version: 'v3', auth: authClient});
  const res = await drive.files.list({
    access_token: tokens
  });
  const files = res.data.files;
  if (files.length === 0) {
    console.log('No files found.');
    return;
  }

  console.log('Files:');
  files.map((file) => {
    console.log(`${file.name} (${file.id})`);
  });
}

module.exports = router;