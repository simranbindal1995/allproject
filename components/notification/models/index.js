/*
 * @file:notificationStatus.js
 * @description: This file defines the notificationStatus schema for mongodb
 *
 * */


var Mongoose = require('mongoose'),
    Schema = Mongoose.Schema;

var env = require('../../../env');
var Configs = require('../../../configs')


var NotificationStatusSchema = new Schema({
    senderId: { type: Schema.Types.ObjectId, ref: 'User' },
    receiverId: { type: Schema.Types.ObjectId, ref: 'User' },
    sessionId: [{ type: Schema.Types.ObjectId, ref: 'Sessions' }],
    groupLessoNumber: { type: Number },
    message: { type: String },
    notificationEventType: {
        type: String
    },
    createdAt: { type: Number },
    isRead: { type: Boolean,default:false },
    saveInDb : {type : Boolean,default : true}  // false when sending notification of message
});

module.exports = Mongoose.model('Notifications', NotificationStatusSchema);