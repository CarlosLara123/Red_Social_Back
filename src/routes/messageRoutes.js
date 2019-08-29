'use strict'

var express = require("express");
var MessageController = require('../controllers/messageController');
var md_auth = require('../middleware/aunthenticated');

var api = express.Router();

api.post('/message', md_auth.ensureAuth, MessageController.saveMessage);

api.get('/my-messages/:page?', md_auth.ensureAuth,MessageController.getReceivedMessages)
api.get('/messages/:page?', md_auth.ensureAuth,MessageController.getEmmitMessages)
api.get('/unviwed-messages/', md_auth.ensureAuth,MessageController.getUnviwedMessages)

api.get('/set-unviwed-messages/', md_auth.ensureAuth,MessageController.setViewedMessages)
module.exports = api;