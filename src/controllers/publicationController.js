'user strict'

var path = require('path');
var fs = require('fs');
var moment = require('moment')
var mongoosePaginate = require('mongoose-pagination');

//Modelos
var Publication = require('../models/publication');
var User = require('../models/user');
var Follow = require('../models/follow');


function savePublication(req,res){
    var params = req.body;
    var publication = new Publication();

    if(!params.text) return res.status(200).send("Debes enviar un texto");

    publication.text = params.text;
    publication.file = null;
    publication.user = req.user.sub;
    publication.created_at = moment().unix();

    publication.save((err, publicationStored)=>{
        if(err) return res.status(500).send({message: 'Error al guardar publicacion'});

        if(!publicationStored) return res.status(500).send({message: 'La publicacion no ha sido guardada'});
        return res.status(200).send({publication: publicationStored});
    })
}

function getPublications(req,res){
    var page = 1;
    var itemsPage = 5;

    if(req.params.page){
        page = req.params.page;
    }

    Follow.find({user: req.user.sub}).populate("followed").exec((err, follows)=>{
        if(err) return res.status(500).send({message: 'Error al devolver el seguimiento'});

        var follows_clean = [];

        follows.forEach((follow) => {
            follows_clean.push(follow.followed)
        });

        Publication.find({user: {$in: follows_clean}}).sort('-created_at').populate('user').paginate(page,itemsPage,(err,publications,total)=>{
            if(err) return res.status(500).send({message: 'Error al devolver publicaciones'});

            if(!publications) return res.status(404).send({message: 'No hay publicaciones'});
            return res.status(200).send({
                total_items: total,
                page: Math.ceil(total/itemsPage),
                page:page,
                publications
            });
        });

    })
}

function getPublication(req,res) {
    var publicationId = req.params.id;

    Publication.findById(publicationId,(err, publication)=>{
        if(err) return res.status(500).send({message: 'Error al devolver publicaciones'});

        if(!publication) return res.status(404).send({message: 'No existe la publicacion'});
        return res.status(200).send({publication});
    })
}

function deletePublication(req,res) {
    var publicationId = req.params.id;

    Publication.find({'user': req.user.sub, '_id':publicationId}).remove(err =>{
        if(err) return res.status(500).send({message: 'Error al eliminar publicaciones'});
        
        return res.status(200).send({message: 'Publicacion eliminada'});
    })
}

function subirImagen(req, res) {
    var publicationId = req.params.id;

    if(req.files){
        var file_path = req.files.image.path;
        console.log(file_path);

        var file_split = file_path.split('\\');
        console.log(file_split);

        var file_name = file_split[3];
        console.log(file_name);

        var ext_xplit = file_name.split('\.');
        console.log(ext_xplit);

        var file_ext = ext_xplit[1];
        console.log(file_ext);

        if(file_ext == 'png' || file_ext == 'jpg' || file_ext == 'jpeg' || file_ext == 'gif' || file_ext == 'jfif'){
            
            Publication.findOne({user: req.user.sub, _id: publicationId}).exec((err, publication)=>{
                if(err) return res.status(500).send({message: "Error en la peticion"});
                if(publication){
                    User.findByIdAndUpdate(publicationId, {file: file_name}, {new:true},(err, publicationUpdate)=>{
                        if(err) return res.status(500).send({message: 'Error en la peticion'})
                        
                        if(!publicationUpdate) return res.status(404).send({message: 'no se a podido actualizar el usuario'})
                        
                        return res.status(200).send({publication: publicationUpdate})
                    })
                }else{
                    return removeFilerOfUploads(res, file_path, 'No tienes permiso para actualizar esta publicacion')
                }
            });            
        }else{
            return removeFilerOfUploads(res, file_path, 'Extension no valida')
        }
    }
}

function removeFilerOfUploads(res, file_path, message) {
    fs.unlink(file_path, (err)=>{
        return res.status(200).send({message: message})
    })
}

function getImageFile(req, res) {
    var image_file = req.params.imageFile;
    var path_file = './src/uploads/publications/' + image_file;

    fs.exists(path_file, (exists) =>{
        if(exists){
            res.sendFile(path.resolve(path_file));
        }else{
            res.status(200).send({message: 'no existe la imagen'})
        }
    })
}


module.exports={
    savePublication,
    getPublications,
    getPublication,
    deletePublication,
    subirImagen,
    getImageFile,
}