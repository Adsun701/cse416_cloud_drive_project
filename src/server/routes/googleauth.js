var express = require('express');
const { OAuth2Client, auth } = require('google-auth-library');
const router = express.Router();
const { google } = require('googleapis');
const { redirect } = require('react-router-dom');
const oauth2 = google.oauth2('v2');

const Oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT, // this must match your google api settings
);

async function getUserDetails(code) {
  const {tokens} = await Oauth2Client.getToken(code);
  Oauth2Client.setCredentials(tokens);
  const usr_info = await oauth2.userinfo.get({auth: Oauth2Client});
  return usr_info;
} 

function getConnectionUrl() {
  return Oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: ['https://www.googleapis.com/auth/drive.metadata.readonly',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/plus.me', 'https://www.googleapis.com/auth/drive'
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
  listFiles(OAuth2Client);
  res.send("HI");
});

router.get('/files', function (req, res, next) {
  let authClient = OAuth2Client;
  console.log("AUTH CLIENT");
  console.log(authClient);
  listFiles(authClient);
  res.send("files");
});

/**
 * Lists the names and IDs of up to 10 files.
 * @param {OAuth2Client} authClient An authorized OAuth2 client.
 */
async function listFiles(authClient) {
  const drive = google.drive({version: 'v3', auth: authClient});
  const res = await drive.files.list({
    key: "AIzaSyB_vwp4J8ASKdS7PSwgjOkJRDukxNSP9L4"
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