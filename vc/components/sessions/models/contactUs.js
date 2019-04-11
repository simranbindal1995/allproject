/* 
 * @file:users.js
 * @description: This file defines the ticket numbers for complaints
 * @date: 20 July 2018
 * @author: Simran
 * */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var config = require('../../../configs');

const contactUsModel = new Schema({
    name: { type: String },
    email: { type: String },
    message: { type: String },
    createdAt: { type: Number }
});

module.exports = mongoose.model('contactUs', contactUsModel);