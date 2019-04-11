/** Chat Service **/
const fs = require('fs')
const exec = require('child_process').exec
const path = require('path')

const fileService = require("../../files/service")

var ioS;

const setIo = function(io) { //to access the io object here in the chatService
    ioS = io;
}

const sendMessage = async (params) => {
    params.createdAt = moment().unix()
    const data = await db.chatRooms.findOne({
        $and: [{
                $or: [{ senderId: params.senderId }, { senderId: params.receiverId }]
            },
            { $or: [{ receiverId: params.senderId }, { receiverId: params.receiverId }] }
        ]
    })
    if (data == null) { //If chatting for first time create room
        const roomData = await db.chatRooms({ senderId: params.senderId, receiverId: params.receiverId }).save();
        params.chatRoomId = roomData._id
    } else {
        params.chatRoomId = data._id
    }

    const message = await db.chats(params).save()
    return message;
}

const getUnReadCount = async (params) => {
    const data = await db.chats.count({ chatRoomId: params.chatRoomId, receiverId: params.receiverId, isRead: false, isDeleted: false })
    return data;
}

const checkReceiver = async (params) => {
    const data = await db.users.findOne({ _id: params.receiverId })
    return data;
}

const checkSender = async (params) => {
    const data = await db.users.findOne({ _id: params.senderId })
    return data;
}

const fetchMessages = async (params) => {
    const criteria = {
        $and: [{
                $or: [{ senderId: params.senderId }, { senderId: params.receiverId }]
            },
            { $or: [{ receiverId: params.senderId }, { receiverId: params.receiverId }] }
        ],
        isDeleted: false
    }

    const allMessages = {}

    allMessages.totalCount = await db.chats.count(criteria)

    allMessages.data = await db.chats.find(criteria, { senderId: 1, receiverId: 1, message: 1, fileId: 1, createdAt: 1 }, { sort: { messageId: -1 }, skip: params.skip || 0, limit: params.limit || 10 })
        .populate({ path: "senderId", select: "firstName lastName profilePic" })
        .populate({ path: "receiverId", select: "firstName lastName profilePic" })

    //Done so that respective sender and receiver can be shown at frontend on LHS & RHS
    for (var i = 0; i < allMessages.length; i++) {
        if (allMessages[i].receiverId.toString() == params.senderId.toString()) { //senderId is user accessing messages
            allMessages[i].senderId = params.senderId
            allMessages[i].receiverId = allMessages[i].senderId
        }
    }


    //allMessages.totalCount = await db.chats.count(criteria)

    logger.start("Mark messages read that are sent to me")
    await db.chats.update({ senderId: params.receiverId, receiverId: params.senderId }, { isRead: true }, { multi: true, new: true })

    return allMessages
}

const fetchInbox = async (params) => {
    let finalData = [],
        obj = {}
    const criteria = { $or: [{ senderId: params.senderId }, { receiverId: params.senderId }] }

    const allRooms = await db.chatRooms.find(criteria, {}, { skip: params.skip || 0, limit: params.limit || 10 })
    const inboxLength = await db.chatRooms.count(criteria)

    for (const item in allRooms) {

        let messages = await db.chats.findOne({ chatRoomId: allRooms[item]._id, isDeleted: false }, { isDeleted: 0, isRead: 0, chatRoomId: 0, __v: 0 }, { sort: { messageId: -1 }, limit: 1 })
            .populate({ path: "senderId", select: "firstName lastName profilePic" })
            .populate({ path: "receiverId", select: "firstName lastName profilePic" })

        if (messages.receiverId.toString() == params.senderId.toString()) { //senderId is user accessing messages
            messages.senderId = params.senderId
            messages.receiverId = messages.senderId
        }

        let unReadCount = await db.chats.count({ chatRoomId: allRooms[item]._id, isDeleted: false, isRead: false, receiverId: params.senderId })

        finalData.push({ totalUnReadMessage: unReadCount, data: messages })
    }
    obj.inboxLength = inboxLength;
    obj.messages = finalData;
    return obj;

}

const uploadAttachment = async (params) => {
    params.type = 8;
    params.ext = await fileService.checkExtension(params)

    const folderPath = path.join(__dirname, "../../../assets/images/cdn/" + params.payload.userId._id);

    const receiverInfo = await checkReceiver(params.payload)

    const obj = {
        userId: params.payload.userId._id,
        tmpLocation: folderPath,
        fileOriginalName: params.payload.file.hapi.filename,
        fileType: params.payload.file.hapi.headers["content-type"],
        fileExtension: params.ext,
        type: 8,
        uploadedAt: moment().unix(),
        tmpFile: false
    }

    params.fileDetails = await db.files(obj).save()

    await fileService.createTempFolder(folderPath)
    params.path = folderPath
    await fileService.writeFile(params)

    params.senderId = params.payload.userId._id
    params.fileId = params.fileDetails._id
    params.receiverId = params.payload.receiverId

    const chatMessage = await sendMessage(params)

    params.chatRoomId = chatMessage.chatRoomId
    const count = await getUnReadCount(params)

    const dataToEmit = {
        senderId: {
            _id: params.payload.userId._id,
            firstName: params.payload.userId.firstName,
            lastName: params.payload.userId.lastName ? params.payload.userId.lastName : ""
        },
        receiverId: {
            _id: receiverInfo._id,
            firstName: receiverInfo.firstName,
            lastName: receiverInfo.lastName ? receiverInfo.lastName : ""
        },
        fileId: params.fileDetails._id,
        message: "",
        createdAt: chatMessage.createdAt,
        _id: chatMessage._id,
        chatRoomId: chatMessage.chatRoomId,
        unReadCount: count
    }

    if (receiverInfo.deviceDetails) {
        if (receiverInfo.deviceDetails.socketId) {
            ioS.to(receiverInfo.deviceDetails.socketId).emit("receiveMessageEvent", {
                data: dataToEmit
            });
        } else {
            console.log('send ntfcn===')
            //Send Notification to user
        }
    }
    return "Message send successfully"
}

exports.setIo = setIo
exports.sendMessage = sendMessage
exports.getUnReadCount = getUnReadCount
exports.checkSender = checkSender
exports.fetchMessages = fetchMessages
exports.fetchInbox = fetchInbox
exports.uploadAttachment = uploadAttachment
exports.checkReceiver = checkReceiver