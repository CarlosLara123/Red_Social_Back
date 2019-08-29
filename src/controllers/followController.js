'use strict'

var mongoosePaginate = require('mongoose-pagination');
var path = require('path');
var fs = require('fs');

//MODELOS
var User = require('../models/user');
var Follow = require('../models/follow');

//Seguir a un usuario
function saveFollow(req, res){
    var follow = new Follow();
    var params = req.body;

    follow.user = req.user.sub;
    follow.followed = params.followed;

    follow.save((err, followStored)=>{
        if(err) return res.status(500).send({message: 'Error al guardar el seguimiento'});

        if(!followStored) return res.status(404).send({message: 'El seguimiento no se ha guardado'});
        return res.status(200).send({follow : followStored});
    })
}
//Dejar de seguir usuario
function deleteFollow(req,res) {
    var userId = req.user.sub;
    var followId = req.params.id;

    Follow.findOneAndDelete({user: userId, followed: followId},(err=>{
        if(err) return res.status(500).send({message: 'Error al dejar de seguir usuario'});

        return res.status(200).send({message: 'El follow se a eliminado!!'});
    }))
}
//Usuarios que sigo
function  getFollowingUsers(req,res){
    var userId = req.user.sub;
    var page = 1;
    var itemsPage = 5;
    if(req.params.id && req.params.page){
        userId = req.params.id;
    }
    if(req.params.page){
        page = req = params.page;
    }else{
        page = req.params.id;
    }

    Follow.find({user: userId}).populate({path: 'followed'}).paginate(page,itemsPage,(err, follows, total)=>{
        if(err) return res.status(500).send({message: 'Error en el servidor'});

        if(!follows) return res.status(404).send({message: 'No sigues a ningun usuario'});

        return res.status(200).send({
            total: total,
            pages: Math.ceil(total/itemsPage),
            follows: follows
        });
    })
}
//Usuarios que me siguen
function getFollowedUsers(req,res){
    var userId = req.user.sub;
    var page = 1;
    var itemsPage = 5;

    if(req.params.id && req.params.page){
        userId = req.params.id;
    }
    if(req.params.page){
        page = req = params.page;
    }else{
        page = req.params.id;
    }

    Follow.find({followed: userId}).populate({path: 'user'}).paginate(page,itemsPage,(err, follows, total)=>{
        if(err) return res.status(500).send({message: 'Error en el servidor'});

        if(!follows) return res.status(404).send({message: 'No te sigue ningun usuario'});

        return res.status(200).send({
            total: total,
            pages: Math.ceil(total/itemsPage),
            follows: follows
        });
    })
}

//Devolver listado de Usuarios
function getMyFollows(req,res) {
    var userId = req.user.sub;
    var find = Follow.find({user: userId});
    
    if(req.params.followed){
        find = Follow.find({followed: userId});
    }
    find.populate('user followed').exec((err,follows)=>{
        if(err) return res.status(500).send({message: 'Error en el servidor'});

        if(!follows) return res.status(404).send({message: 'No sigues a ningun usuario'});

        return res.status(200).send({follows: follows});
    })
}

module.exports = {
    saveFollow,
    deleteFollow,
    getFollowingUsers,
    getFollowedUsers,
    getMyFollows
}