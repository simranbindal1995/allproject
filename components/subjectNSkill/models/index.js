/*
 * @file:users.js
 * @description: This file defines the user schema for mongodb
 * @date: 23 March 2018
 * @author: NIdhi
 * */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var config = require('../../../configs');
var APP_CONSTANTS = config.constants;
var USER_TYPE = APP_CONSTANTS.USER_TYPE;


// Database saved entries example //
/*
    1.Academics
        1.1 Maths
            1.1.1 Trignometry
            1.1.2 Algebra
        1.2 English
            1.2.1 Literature
            1.2.2 Language
    2. Music
        2.1 Maths
            2.1.1 Trignometry
            2.1.2 Algebra
        2.2 English
            2.2.1 Literature
            2.2.2 Language

*/

const subjectNSkillModel = new Schema({
    name: { type: String }, // subject or category or sub skill
    parent: { type: Schema.Types.ObjectId, ref: 'SubjectNSkill' },
    level: { type: Number },
    is_approved: { type: Boolean, default: true },
    description: { type: String },
    created_at: { type: Date },
    requestedBy: { type: Schema.Types.ObjectId, ref: "User" }
});

module.exports = mongoose.model('SubjectNSkill', subjectNSkillModel);