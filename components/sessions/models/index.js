/* 
 * @file:users.js
 * @description: This file defines the sessions created by guru/rookie
 * @date: 5 April 2018
 * @author: Simran
 * */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var config = require('../../../configs');
var APP_CONSTANTS = config.constants;
var LESSON_TYPE = APP_CONSTANTS.LESSON_TYPE;
var SESSION_STATUS = APP_CONSTANTS.SESSION_STATUS;

//mongoose.set('debug',true)

const sessionsModel = new Schema({
    requestedTo: { type: Schema.Types.ObjectId, ref: "User" }, // requested to
    requestedBy: { type: Schema.Types.ObjectId, ref: "User" }, //reqested from
    startDateTime: { type: Number }, // session start date and time
    endDateTime: { type: Number }, //session end date time
    endDateLagTime: { type: Number }, //session end date lag time
    skillId: [{ type: Schema.Types.ObjectId, ref: "SubjectNSkill" }], // skills that will be taught under this session
    comments: [{
        created_by: { type: Schema.Types.ObjectId, ref: "User" },
        comment: { type: String }
    }],
    sessionType: { type: String, enum: [LESSON_TYPE.one, LESSON_TYPE.group] },
    endLagTime: { type: Number },
    ratePerRookie: { type: Number }, // in case of group lesson
    ratePerHour: { type: Number }, // in case of one to one lesson
    status: { type: String, enum: [SESSION_STATUS.complaint_raised, SESSION_STATUS.refunded, SESSION_STATUS.accepted, SESSION_STATUS.rejected, SESSION_STATUS.cancelled_by_guru, SESSION_STATUS.cancelled_by_rookie, SESSION_STATUS.pending, SESSION_STATUS.expired] },
    createdAt: { type: Date, default: Date.now() },
    totalSeats: { type: Number }, // only in case of group lesson
    isDeleted: { type: Boolean, default: false },
    title: { type: String },
    lessonDetails: { type: String },
    groupLessonNumber: { type: Number, default: 0 }, // value is same when group lesson is same but dates are different; Increments with fresh group lesson
    joinees: [{ type: Schema.Types.ObjectId, ref: "User" }],
    cancelledJoinees: [{ type: Schema.Types.ObjectId, ref: "User" }],   //joinees those have cancelled the lesson
    statusHistory: [{
        status: { type: String },
        updatedAt: { type: Number }
    }],
    ratingFeedbacks: [{
        userId: { type: Schema.Types.ObjectId, ref: "User" },
        feedback: { type: String },
        rating: { type: Number }
    }],
    complaints: [{
        ticketNumber: { type: Number },
        userId: { type: Schema.Types.ObjectId, ref: "User" },
        message: { type: String },
        reason: { type: String },
        createdAt: { type: Number },
        status: { type: Number }, //1-complaint raised ; 2- guru rejected , 3-admin rejected , 4- refunded
        rejectedUserId: { type: Schema.Types.ObjectId, ref: "User" }
    }],
    cancelReason: { type: String },
    cancelDescription: { type: String },
    callStatus: { type: String, default: "Make Call" }, //to show user to make/join call
    isCallInitiatedGuru: { type: Boolean, default: false }, //true when guru initiated call
    isCallInitiatedRookie: { type: Boolean, default: false }, //true when rookie joined / when guru initiated
    externalMeetingId: { type: String }, // meeting Id returned by big blue button for a session
    joinedUsersInSession: [{ type: String }], //users that have joined the session // Maintained so that no user can join the session multiple times
    is_cancelled_by_guru : {type : Boolean,default:false}
});

module.exports = mongoose.model('Sessions', sessionsModel);