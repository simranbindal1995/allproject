/*
 * @file:users.js
 * @description: This file defines the availability of gurus
 * @date: 3 April 2018
 * @author: Simran
 * */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var config = require('../../../configs');


const availabilityModel = new Schema({
    userId : {type : Schema.Types.ObjectId,ref :"User"},
    startDateTime : {type : Number}, // start time
    endDateTime : {type : Number}, // end time
    endDatelagTime : {type : Number}, // end time
    day : {type : String}, // day extracted from startdate
    isDeleted: { type: Boolean, default: false },
    isBooked : {type : Boolean,default:false},	// if booked at this time show true
    createdAt : {type : Date,default : Date.now()}
});

module.exports = mongoose.model('Availability', availabilityModel);