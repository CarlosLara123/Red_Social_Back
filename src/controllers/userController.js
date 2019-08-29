'user strict'

var User = require('../models/user');
var Follow = require('../models/follow');
var Publication = require('../models/publication');
var bcrypt = require('bcrypt-nodejs');
var jwt = require('../services/jwt');
var mongoosePaginate = require('mongoose-pagination');
var path = require('path');
var fs = require('fs');

function register(req,res) {
    var user = new User
    var params = req.body;

    if(params.name && params.nick && params.email && params.password){
        user.name = params.name;
        user.surname = params.surname;
        user.nick = params.nick;
        user.email = params.email;
        user.password = params.password;
        user.role = 'ROLE_USER';
        user.image = null;

        User.find({$or:[
            {nick: user.nick},            
        ]}).exec((err,users)=>{
            if(err) res.status(500).send({message: 'Error en la peticion'});

            if(users && users.length >= 1){
                return res.status(500).send({message: 'El usuario ya existe'})
            }else{
                bcrypt.hash(params.password, null, null, (err,hash)=>{
                    user.password = hash;

                    user.save((err, userStored)=>{
                        if(err) res.status(500).send({message: 'Error en la peticion'});

                        if(!userStored) return res.status(404).send({message: 'Error al registrar usuario'});

                        return res.status(200).send({user: userStored});
                    })
                })
            }
        })

    }else{
        return res.status(200).send({
            message: 'Rellene los datos necesarios'
        })
    }
}

function login(req, res) {
    var params = req.body;
    var email = params.email;
    var password = params.password;

    User.findOne({email: email}, (err, user)=>{
        if(err) return res.status(500).send({message: 'error en la peticion'})
        
        if (user) {
            bcrypt.compare(password, user.password, (err, check)=>{
                if (check) {
                    if (params.gettoken) {
                        return res.status(200).send({
                            token: jwt.createToken(user)
                        });
                    }else{
                        user.password = undefined;
                        return res.status(200).send({user})
                    }
                }else{
                    return res.status(404).send({message: 'el usuario no a podido identificarse'})
                }   
            })
        }else{
            return res.status(404).send({message: 'el usuario no a podido logearse'})
        }
    
    });
}

function getUserName(req,res){    
    var userName = req.params.name;

    User.find({name: {$regex:userName, $options: 'i'}||{nick:{$regex:userName, $options: 'i'}}}).exec((err,user)=>{        
        if(err) return res.status(500).send({message: 'Error en la peticion'});

        if(!user) return res.status(404).send({message: 'No hay ningun usuario con ese nombre'});
        return res.status(200).send({user: user});
    });    
}

function getUser(req,res){   
    var userId = req.params.id;
    var identity_user_id = req.user.sub;

    User.findById(userId,(err,user)=>{        
        if(err) return res.status(500).send({message: 'Error en la peticion'});

        if(!user) return res.status(404).send({message: 'No hay ningun usuario con ese nombre'});

        followThisUser(identity_user_id, userId).then((value)=>{            
            return res.status(200).send({
                user, 
                following: value.following,
                followed: value.followed
            });
        }) 
    });    
}

async function followThisUser(identity_user_id, user_id) {
    //Comprobar si sigo al usuario
     var following = await Follow.findOne({"user": identity_user_id, "followed": user_id},(err, following)=>{
        if(err) return handleError(err);        
        return following;
    });
    //Comprobar si el usuario me sigue
    var followed = await Follow.findOne({"user": user_id, "followed": identity_user_id},(err, followed)=>{
        if(err) return handleError(err);        
        return followed;
    });
    
    return {following,followed};
}

function getUsers(req,res){
    var identity_user_id = req.user.sub;
    var page = 1;
    var itemsPage = 5;

    if(req.params.page){
        page = req.params.page;
    }    

    User.find().sort('_id').paginate(page, itemsPage,(err,users,total)=>{
        if(err) return res.status(500).send({message: 'Error en la peticion'});
        
        if(!users) return res.status(404).send({message: 'No existen usuarios'});
        followUserIds(identity_user_id).then((value)=>{            
            return res.status(200).send({
                users: users, 
                users_following: value.following,
                user_follow_me: value.followed,
                total: total,
                page: Math.ceil(total/itemsPage),            
            });
        })
    })    
}

async function followUserIds(user_Id) {
    var following = await Follow.find({user: user_Id},{_id:0,__v:0,user:0},(err, follows)=>{
        return follows;
    });

    var followed = await Follow.find({followed: user_Id},{_id:0,__v:0,followed:0},(err, follows)=>{
        return follows;
    });

    //Procesar following ids
    var following_clean = [];
    
    following.forEach((follow)=>{
        following_clean.push(follow.followed);
    })    

    //Procesar followed ids
    var followed_clean = [];

    followed.forEach((follow)=>{
        followed_clean.push(follow.user);
    })    

    return {
        following: following_clean,
        followed: followed_clean
    }
}

function getCounters(req, res) {
    var userId=req.user.sub;

    if(req.params.id){
        getCountFollow(req.params.id).then((value)=>{
            return res.status(200).send(value);
        });
    }else{
        getCountFollow(userId).then((value)=>{
            return res.status(200).send(value);
        });
    }
}

async function getCountFollow(user_id) {
    var following = await Follow.count({user: user_id}, (err,count)=>{
        if (err) return handleError(err)
        return count;
    });

    var followed = await Follow.count({followed: user_id}, (err,count)=>{
        if (err) return handleError(err)
        return count;
    });

    var publications = await Publication.count({user: user_id},(err,count)=>{
        if (err) return handleError(err)
        return count;
    });

    return {
        following: following,
        followed: followed,
        publications: publications
    }
}

function updateUser(req, res) {
    var userId = req.params.id;
    var params = req.body;

    //BORRAR LA PROPIEDAD DE PASSWORD
    delete params.password;

    //COMPROBAR SI EL USUARIO ESTÁ LOGUEADO
    if(userId != req.user.sub){
        return res.status(500).send({message: 'no tiene los permisos para editar este usuario'});
    }

    User.findOne({$or:[
        {email: params.email},
        {nick: params.nick},            
    ]}).exec((err,users)=>{
        var user_issets = false
        users.forEach((user)=>{
            if(user && user._id != userId) user_issets = true        
        })        

        if(user_issets) return res.status(404).send({ message: 'Los datos ya estan en uso' });
        
        User.findByIdAndUpdate(userId, params, { new: true }, (err, userUpdate) => {
            if (err) return res.status(500).send({ message: 'error en la peticion' });
    
            if (!userUpdate) return res.status(404).send({ message: 'no se a podido actualizar al usuario' });
    
            return res.status(200).send({ user: userUpdate });
        })
    })    
}

function deleteUser(req,res){
    var userId = req.user.id;

    if (userId != req.user.sub) {
        return res.status(500).send({ message: 'No tiene los permisos para realizar esta acción (token)' });
    }

    User.findByIdAndDelete(userId, (err, userDelete)=>{
        if(err) return res.status(500).send({message: 'error en la peticion'});

        if(!userDelete) return res.status(404).send({message: 'no se a podido eliminar el usuario'});

        return res.status(200).send({message: 'El usuario a sido eliminado'});
    });
}

function subirImagen(req, res) {
    var userId = req.params.id;

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

        if(userId = req.user.sub){
            return removeFilerOfUploads(res, file_path, 'No tienes los permisos para actualizar los datos de este usuario')
        }

        //Actualizar documento de usuario logueado
        if(file_ext == 'png' || file_ext == 'jpg' || file_ext == 'jpeg' || file_ext == 'gif' || file_ext == 'jfif'){
            User.findByIdAndUpdate(userId, {image: file_name}, {new:true},(err, userUpdate)=>{
                if(err) return res.status(500).send({message: 'Error en la peticion'})
                
                if(!userUpdate) return res.status(404).send({message: 'no se a podido actualizar el usuario'})
                
                return res.status(200).send({user: userUpdate})
            })
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
    var path_file = './src/uploads/users/' + image_file;

    fs.exists(path_file, (exists) =>{
        if(exists){
            res.sendFile(path.resolve(path_file));
        }else{
            res.status(200).send({message: 'no existe la imagen'})
        }
    })
}

module.exports = {
    register,
    login,
    getUserName,
    getUser,
    getUsers,
    getCounters,
    updateUser,
    deleteUser,
    subirImagen,
    getImageFile,
}