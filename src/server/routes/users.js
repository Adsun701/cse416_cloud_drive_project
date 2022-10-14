var express = require('express');
var router = express.Router();

var fetch = require('./fetch');
var fetchpost = require('./post');
var { GRAPH_API_ENDPOINT, GRAPH_ME_ENDPOINT } = require('../authConfig');
const User = require('../model/user-model');
const File = require('../model/file-model');
const Permission = require('../model/permission-model');
const FileSnapshot = require('../model/file-snapshot-model');


// custom middleware to check auth state
function isAuthenticated(req, res, next) {
    if (!req.session.isAuthenticated) {
        return res.redirect('/auth/signin'); // redirect to sign-in route
    }

    next();
};

router.get('/id',
    isAuthenticated, // check if user is authenticated
    async function (req, res, next) {
        res.render('id', { idTokenClaims: req.session.account.idTokenClaims });
    }
);

router.get('/microsoft/filesnapshot', async function(req, res, next) {
    const graphResponse = await fetch(GRAPH_ME_ENDPOINT, req.session.accessToken);
    const emailResponse = await fetch(GRAPH_API_ENDPOINT+"v1.0/me", req.session.accessToken);
    const email = emailResponse.mail;
    const files = graphResponse.value;
    const filesMap = {};
    for (let i = 0; i < files.length; i++) {
        const permissionResponse = await fetch(GRAPH_API_ENDPOINT+"v1.0/me/drive/items/"+files[i].id+"/permissions/", req.session.accessToken);
        const permissions = permissionResponse.value;
        const permissions_list = [];
        for (let j = 0; j < permissions.length; j++) {
            if (permissions[j].grantedToV2) {
                let perm = new Permission({
                    id: permissions[j].id,
                    email: permissions[j].grantedToV2.user.email,
                    displayName: permissions[j].grantedToV2.user.displayName,
                    roles: permissions[j].roles,
                    inheritedFrom: permissions[j].inheritedFrom? permissions[j].inheritedFrom.id : null
                })
                perm.save().then(() => console.log("perm saved"));
                permissions_list.push(perm);
            }
            if (permissions[j].grantedToIdentitiesV2) {
                for (let k = 0; k < permissions[j].grantedToIdentitiesV2.length; k++) {
                    let perm = new Permission({
                        id: permissions[j].id,//permissions[j].grantedToIdentitiesV2[k].user? permissions[j].grantedToIdentitiesV2[k].user.id : permissions[j].grantedToIdentitiesV2[k].siteUser.id,
                        email: permissions[j].grantedToIdentitiesV2[k].user? permissions[j].grantedToIdentitiesV2[k].user.email : permissions[j].grantedToIdentitiesV2[k].siteUser.email,
                        displayName: permissions[j].grantedToIdentitiesV2[k].user? permissions[j].grantedToIdentitiesV2[k].user.displayName : permissions[j].grantedToIdentitiesV2[k].siteUser.displayName,
                        roles: permissions[j].roles,
                        inheritedFrom: permissions[j].inheritedFrom? permissions[j].inheritedFrom.id : null
                    })
                    perm.save().then(() => console.log("perm saved"));
                    permissions_list.push(perm);
                }
            }
        }
        filesMap[files[i].id] = permissions_list;
    }
    let fileSnapshot = new FileSnapshot({
        files: filesMap
    });
    fileSnapshot.save();
    User.update(
        {email: email}, {$push: { fileSnapshots: fileSnapshot }})
        .then(() => console.log("user file snapshot updated in db"));
    res.send(filesMap);
});

router.get('/microsoft/addperm', function(req, res, next) {
    res.render('microsoftperm');
});

router.post('/microsoft/addpermission', isAuthenticated, async function(req, res, next) {
    try {
        // post request sends files, value, and role
        let files = JSON.parse(req.body.files);
        let body = {
            "recipients": [
                {"email": req.body.value}
            ],
            "message": "Hello!",
            "requireSignIn": true,
            "sendInvitation": true,
            "roles": [req.body.role]
        }
        let ans = []
        for (let i = 0; i < files.length; i++) {
            const update = await fetchpost(GRAPH_API_ENDPOINT+"v1.0/me/drive/items/"+files[i]+"/invite", req.session.accessToken, body);
            ans.push(update.data);
        }
        console.log(ans);
        res.send("SUCCCESS");
    } catch(error) {
        next(error);
    }
});

router.get('/profile',
    isAuthenticated, // check if user is authenticated
    async function (req, res, next) {
        try {
            const graphResponse = await fetch(GRAPH_ME_ENDPOINT, req.session.accessToken);
            const emailResponse = await fetch(GRAPH_API_ENDPOINT+"v1.0/me", req.session.accessToken);
            const email = emailResponse.mail;
            const files = graphResponse.value;
            const list_files = [];
            for (let i = 0; i < files.length; i++) {
                const permissionResponse = await fetch(GRAPH_API_ENDPOINT+"v1.0/me/drive/items/"+files[i].id+"/permissions/", req.session.accessToken);
                const permissions = permissionResponse.value;
                const permissions_list = [];
                for (let j = 0; j < permissions.length; j++) {
                    if (permissions[j].grantedToV2) {
                        let perm = new Permission({
                            id: permissions[j].id,
                            email: permissions[j].grantedToV2.user.email,
                            displayName: permissions[j].grantedToV2.user.displayName,
                            roles: permissions[j].roles,
                            inheritedFrom: permissions[j].inheritedFrom? permissions[j].inheritedFrom.id : null
                        })
                        Permission.exists({ id: permissions[j].id, roles: permissions[j].roles }).then(exists => {
                            if (!exists) {
                                perm.save().then(() => console.log("perm saved"));
                            }
                        })
                        permissions_list.push(perm);
                    }
                    if (permissions[j].grantedToIdentitiesV2) {
                        for (let k = 0; k < permissions[j].grantedToIdentitiesV2.length; k++) {
                            let currentPermission = permissions[j].grantedToIdentitiesV2[k];
                            let perm = new Permission({
                                id: permissions[j].id,//currentPermission.user? currentPermission.user.id : currentPermission.siteUser.id,
                                email: currentPermission.user? currentPermission.user.email : currentPermission.siteUser.email,
                                displayName: currentPermission.user? currentPermission.user.displayName : currentPermission.siteUser.displayName,
                                roles: permissions[j].roles,
                                inheritedFrom: permissions[j].inheritedFrom? permissions[j].inheritedFrom.id : null
                            })
                            Permission.exists({ id: currentPermission.user? currentPermission.user.id : currentPermission.siteUser.id, roles: permissions[j].roles }).then(exists => {
                                if (!exists) {
                                    perm.save().then(() => console.log("perm saved"));
                                }
                            })
                            permissions_list.push(perm);
                        }
                    }
                }
                let file = new File({
                    id: files[i].id,
                    name: files[i].name,
                    createdTime: files[i].fileSystemInfo.createdDateTime,
                    modifiedTime: files[i].fileSystemInfo.lastModifiedDateTime,
                    permissions: permissions_list
                })
                File.exists({ id: files[i].id }).then(exists => {
                    if (exists) {
                      File.update(
                        {id: files[i].id}, 
                        {$set: {
                            name: files[i].name, 
                            modifiedTime: files[i].fileSystemInfo.lastModifiedDateTime,
                            permissions: permissions_list
                          } 
                        }).then(() => console.log("file updated in db"));
                    } else {
                        file.save().then(() => console.log("file saved in db"));
                    }
                })
                list_files.push(file);
            }
            const newUser = new User ({
                name: req.session.account?.username,
                email: email,
                files: list_files,
                accessPolicies: [],
                fileSnapshots: [],
                groupSnapshots: [],
                recentQueries: []
            })
            User.exists({ email: email }).then(exists => {
                if (exists) {
                  User.update({email: email}, {$set: { files: list_files}}).then(() => console.log("user updated in db"));
                } else {
                  newUser.save().then(() => console.log("user saved in db"));
                }
            })
            res.render('profile', { profile: graphResponse });
        } catch (error) {
            next(error);
        }
    }
);

module.exports = router;