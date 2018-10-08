/*
 * @file:users.js
 * @description: This file defines the user schema for mongodb
 * @date: 29 march 2018
 * @author: Simran
 * */


var Mongoose = require('mongoose'),
    Schema = Mongoose.Schema;

var moment = require('moment')
var FileSchema = new Schema({
    user_id : { type: String },
    tmp_file : { type: Boolean, default:true },
    tmp_location : { type: String },
    file_original_name: { type: String },
    file_type: { type: String },
    file_extension: { type: String },
    uploaded_at: { type: Number },
    type : {type : Number}, // 1 - profile pic , 2 - documents
    title : {type : String},
    description : {type : String},
    is_deleted : {type : Boolean,default : false}
});

module.exports = Mongoose.model('Files', FileSchema);
