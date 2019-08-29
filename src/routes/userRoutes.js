'use strict'

var express = require("express");
var UserController = require('../controllers/userController');
var md_auth = require('../middleware/aunthenticated');

//SUBIR IMAGEN
var multiparty = require('connect-multiparty');
var md_subir = multiparty({uploadDir: './src/uploads/users'});

var api = express.Router();

api.post('/register', UserController.register);
api.post('/login', UserController.login);
api.post('/subir-image-usuario/:id', [md_auth.ensureAuth, md_subir] ,UserController.subirImagen)

api.get('/search-user/:id',md_auth.ensureAuth, UserController.getUser);
api.get('/user/:name',md_auth.ensureAuth, UserController.getUserName);
api.get('/users/:page?',md_auth.ensureAuth, UserController.getUsers);
api.get('/obtener-imagen-usuario/:imageFile', UserController.getImageFile);
api.get('/counters/:id?', md_auth.ensureAuth, UserController.getCounters);

api.put('/update-user/:id',md_auth.ensureAuth, UserController.updateUser);
api.delete('/delete-user/:id', md_auth.ensureAuth, UserController.deleteUser)

module.exports = api;