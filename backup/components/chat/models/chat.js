/*
 * @file: chat
 * @description:  related to user
 * @date: 21 May 2018
 * @author: Simran
 * */


var Mongoose = require('mongoose'),
    Schema = Mongoose.Schema;
var AutoIncrement = require('mongoose-sequence')(Mongoose);


var ChatSchema = new Schema({
    from: { type: Schema.Types.ObjectId, ref: 'User' },
    to: { type: Schema.Types.ObjectId, ref: 'User' },
    message: { type: String }, 
    created_at: { type: Number },
    message_read: { type: Boolean, default: false },
    is_deleted: { type: Boolean, default: false },
    chat_room_id: { type: Schema.Types.ObjectId, ref: 'ChatRoom' },
    messageId: { type: Number, default: 1 },
    message_chat_id: { type: String },
    isDelivered: { type: Boolean, default: false },
    deleted_by: { type: Array }
});

ChatSchema.plugin(AutoIncrement, { inc_field: 'messageId' });
module.exports = Mongoose.model('Chat', ChatSchema);
