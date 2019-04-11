/**
ChatRoom model
CreatedBy - Simran
Date- 10 Jan 2019
**/


'use strict'

const chatRooms = new mongoose.Schema({
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
    createdAt: { type: Number }
})



module.exports = chatRooms