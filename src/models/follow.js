'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var followSchema = Schema({
    user: {type: Schema.ObjectId, ref: 'User'},//usuario que sigue
    followed: {type: Schema.ObjectId, ref: 'User'},//usuario seguido
})

module.exports = mongoose.model('Follow', followSchema)