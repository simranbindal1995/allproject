/*
 * @file: chatRoom
 * @description:  related to user
 * @date: 10-August-17
 * @author: Simran
 * */


var Mongoose = require('mongoose'),
    Schema = Mongoose.Schema;

var ChatRoomSchema = new Schema({
    from: { type: Schema.Types.ObjectId, ref: 'User' },
    to: { type: Schema.Types.ObjectId, ref: 'User' },
    created_at: { type: Number }
});

module.exports = Mongoose.model('ChatRoom', ChatRoomSchema);