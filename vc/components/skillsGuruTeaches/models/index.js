/*
 * @file:users.js
 * @description: This file defines the user schema for mongodb
 * @date: 23 March 2018
 * @author: Simran
 * */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const skillsModel = new Schema({
    userId : {type : Schema.Types.ObjectId,ref : 'User'},
    startAge : {type : Number,default : 18},
    endAge : {type : Number,default :99},
    skillId : {type : Schema.Types.ObjectId,ref : "SubjectNSkill"},
    isDeleted : {type : Boolean,default : false},
    type : {type : Number}, // type - 1 if skill that guru teaches ; 2 - example course
    description : {type : String},
    duration : {type : String}
});

module.exports = mongoose.model('SkillsGuruTeaches', skillsModel);