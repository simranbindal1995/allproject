/*
 * @file:languages.js
 * @description: This file defines the languages schema for mongodb
 * @date: 17 April 2018
 * @author: SImran
 * */


var Mongoose = require('mongoose'),
    Schema = Mongoose.Schema

var languages = new Schema({
    name: { type: String },
    createdAt: { type: Date }
});

module.exports = Mongoose.model('Languages', languages);