/*
 * @file:users.js
 * @description: This file defines the sessions that will create place whose payment have been done
 * @date: 5 April 2018
 * @author: Simran
 * */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var config = require('../../../configs');
var APP_CONSTANTS = config.constants;
var SESSION_STATUS = APP_CONSTANTS.SESSION_STATUS;



const sessionBookingsModel = new Schema({
    sessionId: { type: Schema.Types.ObjectId, ref: "Sessions" },
    paymentStatus: {
        type: String,
        enum: [SESSION_STATUS.payment_done, SESSION_STATUS.cancelled_by_guru, SESSION_STATUS.cancelled_by_rookie, SESSION_STATUS.refunded]
    },
    isDeleted: { type: Boolean, default: false },
    paymentDoneBy: { type: Schema.Types.ObjectId, ref: "User" },
    paymentDoneTo: { type: Schema.Types.ObjectId, ref: "User" },
    groupLessonNumber: { type: Number, default: 0 }, // value is same when group lesson is same but dates are different; Increments with fresh group lesson
    statusHistory: [{
        status: { type: String },
        updatedAt: { type: Number }
    }],
    complaints: [{
        userId: { type: Schema.Types.ObjectId, ref: "User" },
        message: { type: String },
        reason: { type: String },
        createdAt: { type: Number },
        ticketNumber: { type: Number },
        status: { type: Number }, //1-complaint raised ; 2- guru rejected , 3-admin rejected , 4- refunded
    }],
    reason: { type: String },
    description: { type: String },
    transactionDetails: [{
        transactionId: { type: Schema.Types.ObjectId, ref: "Transactions" },
        message: { type: String }
    }],
    attendeePW: { type: String },
    moderatorPW: { type: String }
});

module.exports = mongoose.model('SessionBookings', sessionBookingsModel);