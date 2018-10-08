/* 
 * @file:users.js
 * @description: This file defines the ticket numbers for complaints
 * @date: 19 July 2018
 * @author: Simran
 * */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var config = require('../../../configs');

const reasonsModel = new Schema({
    reason: { type: String },
    type: { type: Number }, // 1-complaint , 2-cancel
    isDeleted: { type: Boolean, default: false }
});

module.exports = mongoose.model('cancellationReasons', reasonsModel);