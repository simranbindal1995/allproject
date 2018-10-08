/*
 * @file:users.js
 * @description: This file defines the sessions that will create place whose payment have been done
 * @date: 8 june 2018
 * @author: Simran
 * */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var config = require('../../../configs');
var TRANSACTION_TYPE = config.constants.TRANSACTION_TYPES
var REQUEST_STATUS = config.constants.REQUEST_STATUS


const transactionModel = new Schema({
    sessionId: { type: Schema.Types.ObjectId ,ref :"sessions"},
    groupLessonNumber : {type : Number},
    stripeCustomerID: { type: String },
    cardID: { type: String },
    chargeID:{type:String},
    transactionID: { type: String },
    transactionStatus: { type: String },
    currency: { type: String },
    amount: { type: Number },
    transactionDate: { type: Number },
    transactionType : {type : Number,enum :[TRANSACTION_TYPE.cardToStripe,TRANSACTION_TYPE.stripeToBank,TRANSACTION_TYPE.refund]},
    metaData: {},
    requestStatus : {type : String,enum:[REQUEST_STATUS.ongoing,REQUEST_STATUS.readyForPayment,REQUEST_STATUS.completed]}, // status for maintaining payments
    finalAmountToTransfer : {type : Number}, //amount to transfer to guru after 10% commision of admin
    paymentDoneBy : {type : Schema.Types.ObjectId,ref :"User"},
    paymentDoneTo : {type : Schema.Types.ObjectId,ref :"User"},
});

module.exports = mongoose.model('Transactions', transactionModel); 