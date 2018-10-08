/*
 * @file:users.js
 * @description: This file defines the question answers schema for mongodb
 * @date: 29 March 2018
 * @author: Simran
 * */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var config = require('../../../configs');



const quesModel = new Schema({
    question: { type: String },
    answers: [{
        name: { type: String },
        isChecked: { type: Boolean, default: false }
    }],
    isDeleted: { type: Boolean, default: false },
});

module.exports = mongoose.model('QuesAns', quesModel);