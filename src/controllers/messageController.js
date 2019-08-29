'use strict'

var moment = require('moment');
var mongoosePaginate = require('mongoose-pagination');

//Models
var Message = require('../models/message');
var User = require('../models/user');
var Follow = require('../models/follow');


function saveMessage(req, res){
    var params = req.body;
    var message = new Message();

    if(!params.text || !params.receiver) return res.status(200).send({message: 'Envía los datos necesarios'})

    message.emitter = req.user.sub;
    message.receiver = params.receiver;
    message.text = params.text;
    message.created_at = moment().unix()
    message.viwed = false;

    message.save((err, messageStored)=>{
        if(err) return res.status(500).send({message: 'Error en la peticion'})

        if(!messageStored) return res.status(404).send({message: 'Error al enviar mensaje'})
        return res.status(200).send({message: messageStored});
    })
}

function getReceivedMessages(req,res) {
    var userId = req.user.sub;
    var page = 1;
    var itemsPage = 5;

    if(req.params.page){
        page = req.params.page
    }

    Message.find({receiver: userId}).populate('emitter', 'name surname nick image _id').paginate(page,itemsPage,(err, messages,total)=>{
        if(err) return res.status(500).send({message: 'Error en la peticion'})

        if(!messages) return res.status(404).send({message: 'No hay mensajes'})
        return res.status(200).send({
            total: total,
            pages: Math.ceil(total/itemsPage),
            messages
        });
    })
}

function getEmmitMessages(req,res) {
    var userId = req.user.sub;
    var page = 1;
    var itemsPage = 5;

    if(req.params.page){
        page = req.params.page
    }

    Message.find({emitter: userId}).populate('receiver emitter', 'name surname nick image _id').paginate(page,itemsPage,(err, messages,total)=>{
        if(err) return res.status(500).send({message: 'Error en la peticion'})

        if(!messages) return res.status(404).send({message: 'No hay mensajes'})
        return res.status(200).send({
            total: total,
            pages: Math.ceil(total/itemsPage),
            messages
        });
    })
}

function getUnviwedMessages(req,res) {
    var userId = req.user.sub;
    
    Message.count({receiver: userId, viwed: false},(err, count)=>{
        if(err) return res.status(500).send({message: 'Error en la peticion'})        

        return res.status(200).send({
            Unviwed: count,            
        });
    })
}

function setViewedMessages(req,res) {
    var userId = req.user.sub;

    Message.update({receiver: userId, viwed: false}, {viwed: true}, {multi: true},(err, messagesUpdate)=>{
        if(err) return res.status(500).send({message: 'Error en la peticion'})        
        
        return res.status(200).send({
            messagesUpdate
        });
    })
}

module.exports = {
    saveMessage,
    getReceivedMessages,
    getEmmitMessages,
    getUnviwedMessages,
    setViewedMessages
}