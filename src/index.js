'use strict'

var mongoose = require("mongoose");
var app = require('./app');

//CONECCION A LA BASE DE DATOS
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/Red_Social_JS', { useNewUrlParser: true }).then(() => {
    console.log('la base de datos esta corriendo correctamente')

    //CREAR SERVIDOR
    app.set('port', process.env.PORT || 3000);
    app.listen(app.get('port'),()=>{
        console.log(`El servidor esta corriendo en el puerto: '${app.get('port')}'`);
    })
}).catch(err => console.log(err));