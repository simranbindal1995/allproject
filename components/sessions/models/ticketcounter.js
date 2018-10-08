/* 
 * @file:users.js
 * @description: This file defines the ticket numbers for complaints
 * @date: 13 June 2018
 * @author: Simran
 * */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var config = require('../../../configs');

const counterModel = new Schema({
    ticketCounter: { type: Number,default : 100 }
});

module.exports = mongoose.model('TicketCounter', counterModel);