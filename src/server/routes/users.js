const express = require('express');

const router = express.Router();
const fetch = require('../utils/fetch');
const fetchpost = require('../utils/post');
const fetchpatch = require('../utils/patch');
const { GRAPH_API_ENDPOINT, GRAPH_ME_ENDPOINT } = require('../authConfig');
const User = require('../model/user-model');
const File = require('../model/file-model');
const Permission = require('../model/permission-model');
const FileSnapshot = require('../model/file-snapshot-model');
const AccessPolicy = require('../model/access-policy-model');
const SearchQuery = require('../model/search-query-model');

// custom middleware to check auth state
// eslint-disable-next-line consistent-return
function isAuthenticated(req, res, next) {
  if (!req.session.isAuthenticated) {
    return res.redirect('/auth/signin'); // redirect to sign-in route
  }

  next();
}

router.get(
  '/id',
  isAuthenticated, // check if user is authenticated
  async (req, res) => {
    res.render('id', { idTokenClaims: req.session.account.idTokenClaims });
  },
);

router.get('/microsoftupdateperm', (req, res) => {
  res.render('microsoftupdateperm');
});

router.post('/microsoft/updateaccesspolicy/:requirement/ar', (req, res) => {
  const { requirement } = req.params;
  const newar = req.body.ar;
  AccessPolicy.update({ requirement }, { $push: { ar: newar } })
    .then(() => {
      const redirecturl = `/users/microsoft/viewaccesspolicy?requirement=${requirement}`;
      res.redirect(redirecturl);
    });
});

router.post('/microsoft/updateaccesspolicy/:requirement/dr', (req, res) => {
  const { requirement } = req.params;
  const newdr = req.body.dr;
  AccessPolicy.update({ requirement }, { $push: { dr: newdr } })
    .then(() => {
      const redirecturl = `/users/microsoft/viewaccesspolicy?requirement=${requirement}`;
      res.redirect(redirecturl);
    });
});

router.post('/microsoft/updateaccesspolicy/:requirement/aw', (req, res) => {
  const { requirement } = req.params;
  const newaw = req.body.aw;
  AccessPolicy.update({ requirement }, { $push: { aw: newaw } })
    .then(() => {
      const redirecturl = `/users/microsoft/viewaccesspolicy?requirement=${requirement}`;
      res.redirect(redirecturl);
    });
});

router.post('/microsoft/updateaccesspolicy/:requirement/dw', (req, res) => {
  const { requirement } = req.params;
  const newdw = req.body.dw;
  AccessPolicy.update({ requirement }, { $push: { dw: newdw } })
    .then(() => {
      const redirecturl = `/users/microsoft/viewaccesspolicy?requirement=${requirement}`;
      res.redirect(redirecturl);
    });
});

router.get('/microsoft/viewaccesspolicy', (req, res) => {
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
    res.render('existingaccesspolicy', { requirement, accessdata });
  });
});

router.post('/microsoft/updatepermission', async (req, res) => {
  const body = {
    roles: [req.body.role],
  };
  const update = await fetchpatch(`${GRAPH_API_ENDPOINT}v1.0/me/drive/items/${req.body.fileid}/permissions/${req.body.permid}`, req.session.accessToken, body);
  res.send(update);
});

router.get('/microsoft/filesnapshot', async (req, res) => {
  const graphResponse = await fetch(GRAPH_ME_ENDPOINT, req.session.accessToken);
  const emailResponse = await fetch(`${GRAPH_API_ENDPOINT}v1.0/me`, req.session.accessToken);
  const email = emailResponse.mail;
  const files = graphResponse.value;
  const filesMap = {};
  for (let i = 0; i < files.length; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    const permissionResponse = await fetch(`${GRAPH_API_ENDPOINT}v1.0/me/drive/items/${files[i].id}/permissions/`, req.session.accessToken);
    const permissions = permissionResponse.value;
    const permissionsList = [];
    for (let j = 0; j < permissions.length; j += 1) {
      if (permissions[j].grantedToV2) {
        const perm = new Permission({
          id: permissions[j].id,
          email: permissions[j].grantedToV2.user ? permissions[j].grantedToV2.user.email
            : permissions[j].grantedToV2.siteUser.email,
          displayName: permissions[j].grantedToV2.user ? permissions[j].grantedToV2.user.displayName
            : permissions[j].grantedToV2.siteUser.displayName,
          roles: permissions[j].roles,
          inheritedFrom: permissions[j].inheritedFrom ? permissions[j].inheritedFrom.id : null,
        });
        perm.save().then(() => {});
        permissionsList.push(perm);
      }
      if (permissions[j].grantedToIdentitiesV2) {
        for (let k = 0; k < permissions[j].grantedToIdentitiesV2.length; k += 1) {
          const perm = new Permission({
            id: permissions[j].id,
            email: permissions[j].grantedToIdentitiesV2[k].user
              ? permissions[j].grantedToIdentitiesV2[k].user.email
              : permissions[j].grantedToIdentitiesV2[k].siteUser.email,
            displayName: permissions[j].grantedToIdentitiesV2[k].user
              ? permissions[j].grantedToIdentitiesV2[k].user.displayName
              : permissions[j].grantedToIdentitiesV2[k].siteUser.displayName,
            roles: permissions[j].roles,
            inheritedFrom: permissions[j].inheritedFrom ? permissions[j].inheritedFrom.id : null,
          });
          perm.save().then(() => {});
          permissionsList.push(perm);
        }
      }
    }
    filesMap[files[i].id] = permissionsList;
  }
  const fileSnapshot = new FileSnapshot({
    files: filesMap,
  });
  fileSnapshot.save();
  User.update({ email }, { $push: { fileSnapshots: fileSnapshot } })
    .then(() => {});
  res.send(filesMap);
});

router.get('/microsoft/addperm', (req, res) => {
  res.render('microsoftperm');
});

router.post('/microsoft/addpermission', isAuthenticated, async (req, res, next) => {
  try {
    // post request sends files, value, and role
    const files = JSON.parse(req.body.files);
    const body = {
      recipients: [
        { email: req.body.value },
      ],
      message: 'Hello!',
      requireSignIn: true,
      sendInvitation: true,
      roles: [req.body.role],
    };
    const ans = [];
    for (let i = 0; i < files.length; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      const update = await fetchpost(`${GRAPH_API_ENDPOINT}v1.0/me/drive/items/${files[i]}/invite`, req.session.accessToken, body);
      ans.push(update.data);
    }
    res.send('SUCCCESS');
  } catch (error) {
    next(error);
  }
});

router.get('/microsoft/addaccess', (req, res) => {
  res.render('microsoftaccesspolicy');
});

router.post('/microsoft/addaccesspolicy', isAuthenticated, async (req, res, next) => {
  try {
    const emailResponse = await fetch(`${GRAPH_API_ENDPOINT}v1.0/me`, req.session.accessToken);
    const email = emailResponse.mail;

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

router.get('/microsoft/search', async (req, res) => {
  const emailResponse = await fetch(`${GRAPH_API_ENDPOINT}v1.0/me`, req.session.accessToken);
  const email = emailResponse.mail;

  const user = await User.find({ email });
  const queries = user[0].recentQueries;
  const ids = [];
  queries.forEach((element) => {
    // eslint-disable-next-line no-underscore-dangle
    ids.push(element._id);
  });
  const recentQueries = await SearchQuery.find({ _id: { $in: ids } })
    .sort({ createdAt: -1 }).limit(5);
  res.render('microsoftsearch', {
    recentQuery1: recentQueries[0] ? recentQueries[0].query : null,
    recentQuery2: recentQueries[1] ? recentQueries[1].query : null,
    recentQuery3: recentQueries[2] ? recentQueries[2].query : null,
    recentQuery4: recentQueries[3] ? recentQueries[3].query : null,
    recentQuery5: recentQueries[4] ? recentQueries[4].query : null,
  });
});

router.post('/microsoft/searchquery', isAuthenticated, async (req, res, next) => {
  try {
    const emailResponse = await fetch(`${GRAPH_API_ENDPOINT}v1.0/me`, req.session.accessToken);
    const email = emailResponse.mail;

    const { query } = req.body;

    const searchQuery = new SearchQuery({
      query,
    });
    searchQuery.save().then(() => {});
    User.update({ email }, { $push: { recentQueries: searchQuery } })
      .then(() => {});
    res.send(searchQuery);
  } catch (error) {
    next(error);
  }
});

router.get(
  '/profile',
  isAuthenticated, // check if user is authenticated
  async (req, res, next) => {
    try {
      const graphResponse = await fetch(GRAPH_ME_ENDPOINT, req.session.accessToken);
      const emailResponse = await fetch(`${GRAPH_API_ENDPOINT}v1.0/me`, req.session.accessToken);
      const email = emailResponse.mail;
      const files = graphResponse.value;
      const listFiles = [];
      for (let i = 0; i < files.length; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        const permissionResponse = await fetch(`${GRAPH_API_ENDPOINT}v1.0/me/drive/items/${files[i].id}/permissions/`, req.session.accessToken);
        const permissions = permissionResponse.value;
        const permissionsList = [];
        for (let j = 0; j < permissions.length; j += 1) {
          if (permissions[j].grantedToV2) {
            const perm = new Permission({
              id: permissions[j].id,
              email: permissions[j].grantedToV2.user ? permissions[j].grantedToV2.user.email
                : permissions[j].grantedToV2.siteUser.email,
              displayName: permissions[j].grantedToV2.user
                ? permissions[j].grantedToV2.user.displayName
                : permissions[j].grantedToV2.siteUser.displayName,
              roles: permissions[j].roles,
              inheritedFrom: permissions[j].inheritedFrom ? permissions[j].inheritedFrom.id : null,
            });
            Permission.exists({ id: permissions[j].id, roles: permissions[j].roles })
              .then((exists) => {
                if (!exists) {
                  perm.save().then(() => {});
                }
              });
            permissionsList.push(perm);
          }
          if (permissions[j].grantedToIdentitiesV2) {
            for (let k = 0; k < permissions[j].grantedToIdentitiesV2.length; k += 1) {
              const currentPermission = permissions[j].grantedToIdentitiesV2[k];
              const perm = new Permission({
                id: permissions[j].id,
                email: currentPermission.user ? currentPermission.user.email
                  : currentPermission.siteUser.email,
                displayName: currentPermission.user ? currentPermission.user.displayName
                  : currentPermission.siteUser.displayName,
                roles: permissions[j].roles,
                inheritedFrom: permissions[j].inheritedFrom ? permissions[j].inheritedFrom.id
                  : null,
              });
              Permission.exists({
                id: currentPermission.user ? currentPermission.user.id
                  : currentPermission.siteUser.id,
                roles: permissions[j].roles,
              }).then((exists) => {
                if (!exists) {
                  perm.save().then(() => {});
                }
              });
              permissionsList.push(perm);
            }
          }
        }
        const file = new File({
          id: files[i].id,
          name: files[i].name,
          createdTime: files[i].fileSystemInfo.createdDateTime,
          modifiedTime: files[i].fileSystemInfo.lastModifiedDateTime,
          permissions: permissionsList,
        });
        File.exists({ id: files[i].id }).then((exists) => {
          if (exists) {
            File.update(
              { id: files[i].id },
              {
                $set: {
                  name: files[i].name,
                  modifiedTime: files[i].fileSystemInfo.lastModifiedDateTime,
                  permissions: permissionsList,
                },
              },
            ).then(() => {});
          } else {
            file.save().then(() => {});
          }
        });
        listFiles.push(file);
      }
      const newUser = new User({
        email,
        files: listFiles,
        accessPolicies: [],
        fileSnapshots: [],
        groupSnapshots: [],
        recentQueries: [],
      });
      User.exists({ email }).then((exists) => {
        if (exists) {
          User.update({ email }, { $set: { files: listFiles } }).then(() => {});
        } else {
          newUser.save().then(() => {});
        }
      });
      res.render('profile', { profile: graphResponse });
    } catch (error) {
      next(error);
    }
  },
);

module.exports = router;
