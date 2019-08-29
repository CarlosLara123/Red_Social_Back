'use strict'

var express = require("express");
var FollowController = require('../controllers/followController');
var md_auth = require('../middleware/aunthenticated');

var api = express.Router();

api.get('/following/:id?/:page?', md_auth.ensureAuth, FollowController.getFollowingUsers);
api.get('/followed/:id?/:page?', md_auth.ensureAuth, FollowController.getFollowedUsers);
api.get('/my-follows/:followed?', md_auth.ensureAuth, FollowController.getMyFollows);
api.post('/follow', md_auth.ensureAuth, FollowController.saveFollow);
api.delete('/follow/delete/:id', md_auth.ensureAuth, FollowController.deleteFollow);

module.exports = api;