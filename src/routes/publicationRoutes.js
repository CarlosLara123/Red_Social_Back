'use strict'

var express = require('express');
var PublicationController = require('../controllers/publicationController');
var md_auth = require('../middleware/aunthenticated');

//SUBIR IMAGEN
var multiparty = require('connect-multiparty');
var md_subir = multiparty({uploadDir: './src/uploads/publications'});

var api = express.Router();
api.post('/publication',md_auth.ensureAuth,PublicationController.savePublication);
api.post('/upload-image-publication/:id', [md_auth.ensureAuth, md_subir], PublicationController.subirImagen);

api.get('/publications/:page?',md_auth.ensureAuth,PublicationController.getPublications);
api.get('/publication/:id',md_auth.ensureAuth,PublicationController.getPublication);
api.get('/get-image-publication/:imagefile', PublicationController.getImageFile);

api.delete('/delete-publication/:id',md_auth.ensureAuth,PublicationController.deletePublication);

module.exports = api;