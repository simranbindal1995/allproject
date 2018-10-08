/*
 * @file:users.js
 * @description: This file defines the sessions that will create place whose payment have been done
 * @date: 11 July 2018
 * @author: Simran
 * */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var config = require('../../../configs');

const eventsModel = new Schema({
    details: { type: Object },
    sessionId: { type: Schema.Types.ObjectId },
    groupLessonNumber: { type: Number, ref: "sessions" }
});

module.exports = mongoose.model('bigBlueButtonEventsHistory', eventsModel);