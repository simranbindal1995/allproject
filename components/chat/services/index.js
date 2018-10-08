/*
 * @description: This file defines chat(socket) related functions
 * @date: 13-april-2018
 * @author: Himanshi
 * */

// include Utils module

var jwt = require('jsonwebtoken');
var Utils = require('../../../utils/index');
var universalFunctions = require('../../../utils/universalFunctions')
var env = require('../../../env');
var configs = require('../../../configs');

// include all the internal modules
var userModel = require('../../user/models/index');
var sessionsModel = require('../../sessions/models/index');
var chatModel = require('../../chat/models/chat');
var chatRoomModel = require('../../chat/models/chatRoom');

var APP_CONSTANTS = configs.constants;
var NOTIFICATION_TYPE = APP_CONSTANTS.NOTIFICATION_TYPE


var ioS;

//set io to global var
var setIo = function(data) {
    ioS = data
}

// function to check token validation, updating connected user token in db & send undelivered messsages
var validate_token = function(request, callback) {
    Utils.async.auto({
        checkTokenValidation: function(cb) {
            var criteria = {
                "deviceDetails": {
                    "$elemMatch": {
                        "accessToken": request.token
                    }
                },
            }
            var dataToSet = {
                "deviceDetails.$.socketId": request.socket_id
            }
            userModel.findOneAndUpdate(criteria, dataToSet, { new: true }, function(err, res) {
                // verifying token & update token in db 
                userDetails = res;
                err ? cb(err) : res == null ? cb({ status: 'warning', statusCode: 324, message: "Your session is expired. Please login again to continue." }) : cb(null, res)
            })
        },
        sendUndeliveredMessages: ['checkTokenValidation', function(data, cb) { //send undelivered messages

            var socketsIds = Utils._.pluck(userDetails.deviceDetails, 'socket_id')
            var query = { to: userDetails._id, isDelivered: false }
            var projection = {}

            chatModel.find(query, { _v: 0 }, projection).exec(function(err, res) {
                err ? cb(err) : cb(null, res)
            });
        }]
    }, function(err, res) {
        err ? callback(err) : callback(null, res.sendUndeliveredMessages)
    });
}

var updateUserSocket = function(request, callback) {
    var userDetails;
    Utils.async.auto({
            checkTokenValidation: function(cb) {
                var criteria = {
                    "deviceDetails": {
                        "$elemMatch": {
                            "accessToken": request.token
                        }
                    },
                }
                var dataToSet = {
                    "deviceDetails.$.socketId": params.socket_id
                }
                userModel.findOneAndUpdate(criteria, dataToSet, { new: true }, function(err, res) { // verifying and update token
                    err ? cb(err) : !res ? cb({ status: 'warning', statusCode: 324, message: "Your session is expired. Please login again to continue." }) : userDetails = res;
                    cb(null, res)
                })
            },
            sendUndeliveredMessages: ['checkTokenValidation', function(data, cb) {
                var socketsIds = Utils._.pluck(userDetails.deviceDetails, 'socketId')
                var query = { to: userDetails._id, isDelivered: false }
                chatModel.Chat.find(query, { _v: 0 }, projection).exec(function(err, res) {
                    err ? cb(err) : cb(null, res)
                });
            }]
        },
        //  function (err, res) {
        //     err ? callback(err) : callback(null, res)
        // }
        callback);
}

//function to send message 
var sendMessage = function(request, callback) {
    var deviceDetails, isChatInitiated, chat_information, chatRoomId, dataToEmit, count = 0;
    Utils.async.auto({
        checkSender: [function(cb) {

            userModel.findOne({ _id: request.from }, {}, {}, function(err, res) { // check if sender(from) contain valid User id
                err ? cb(err) : res == null ? cb({ status: 'warning', statusCode: 320, message: "Invalid sender(from) Id." }) : cb(null, res)
            })
        }],
        checkReceiver: ['checkSender', function(data, cb) {

            userModel.findOne({ _id: request.to }, {}, {}, function(err, res) { // check if receiver(to) contain valid User id
                deviceDetails = res.deviceDetails;
                err ? cb(err) : res == null ? cb({ status: 'warning', statusCode: 320, message: "Invalid receiver(to) Id." }) : cb(null, res)
            })
        }],
        checkifChatInitiated: ['checkReceiver', function(data, cb) { //check if chat is intiated or not ? 

            var query = { $and: [{ from: { $in: [request.from, request.to] } }, { to: { $in: [request.from, request.to] } }] }
            chatRoomModel.find(query, { _v: 0 }, {}).exec(function(err, res) {
                res.length > 0 ? chatRoomId = res[0]._id : chatRoomId = ''
                res.length > 0 ? isChatInitiated = true : isChatInitiated = false
                err ? cb(err) : cb(null, res)
            });
        }],
        createChatRoom: ['checkifChatInitiated', function(data, cb) { //create chat room if new user 

            if (isChatInitiated == false) {
                var objToSave = { from: request.from, to: request.to, created_at: request.sent_time }
                chatRoomModel(objToSave).save(function(err, res) {
                    chatRoomId = res._id
                    err ? cb(err) : cb(null, chatRoomId)
                })
            } else {
                cb(null, chatRoomId)
            }
        }],
        saveMessageInDb: ['createChatRoom', function(data, cb) { //save message in db

            var objToSave = {
                from: request.from,
                to: request.to,
                chat_room_id: chatRoomId,
                created_at: request.sent_time,
                message: request.message
            }

            chatModel(objToSave).save(function(err, res) {
                if (err) cb(err)
                else {
                    ChatId = res._id;
                    chatModel.findOne({ _id: res._id }, {
                        __v: 0,
                        is_deleted: 0,
                        message_read: 0
                    }, { lean: true }, function(err, res) {
                        dataToEmit = res
                        dataToEmit.receiver = request.from
                        userModel.findOne({ _id: request.from }, { firstName: 1, lastName: 1, profilePic: 1 }, { lean: true }, function(err, data) {
                            dataToEmit.from = data
                            cb(null, dataToEmit)
                        })
                    })
                }
            })
        }],
        getUnreadMessages: ["saveMessageInDb", function(data, cb) {

            var query = {
                chat_room_id: chatRoomId,
                to: data.checkReceiver._id,
            };
            chatModel.find(query, {}, { lean: true }, function(err, res) {
                if (err) { cb(err); }

                res.forEach(function(result) {
                    if (result.message_read == false) {
                        count = count + 1
                    }
                })
                cb(null, data)
            });
        }],
        emitSocket: ["getUnreadMessages", function(data, cb) {

            var dataToEmitOtherUser = {
                from: dataToEmit.from,
                to: {
                    _id: data.checkReceiver._id,
                    firstName: data.checkReceiver.firstName || "",
                    lastName: data.checkReceiver.lastName || "",
                    profilePic: data.checkReceiver.profilePic || ""
                },
                message: request.message,
                created_at: request.sent_time,
                "_id": ChatId,
                "chat_room_id": chatRoomId,
                "messageId": dataToEmit.messageId,
                chatted_with: dataToEmit.from,
                count: count
            }

            for (var i = 0; i < deviceDetails.length; i++) {
                if (deviceDetails[i].socketId) {
                    ioS.to(deviceDetails[i].socketId).emit("get_message_event", {
                        data: dataToEmitOtherUser
                    });
                }
            }

            cb(null, null)


        }],
        sendNotification: ["emitSocket", function(data, cb) {
            var x = dataToEmit.from.firstName
            dataToEmit.from.firstName = x.charAt(0).toUpperCase() + x.slice(1)

            var obj = {
                senderId: dataToEmit.from,
                receiverId: data.checkReceiver,
                notificationEventType: NOTIFICATION_TYPE.send_message,
                createdAt: Utils.moment().unix(),
                saveInDb: false,
                message: "You got a new message from " + dataToEmit.from.firstName
            }


            Utils.universalFunctions.sendNotification(obj, "notification", function(err, res) {
                cb(err, data)
            })
        }]

    }, function(err, res) {
        err ? callback(err) : callback(null, { status: 'success', statusCode: 200, message: 'Message send successfully.' })
    });
}

//function to mark all messages read in a conversation
var markMessagesRead = function(request, callback) {
    chatModel.update({ chat_room_id: request.chat_room_id }, { message_read: true }, { multi: true, new: true }).exec(function(err, res) {
        err ? callback(err) : res == null ? callback({ statusCode: 320, status: 'success', message: 'Action performed successfully.' }) : callback(null, res)
    })
}

//function to fetch message between two users
var fetchMessages = function(request, callback) {
    var isBlocked = false
    Utils.async.auto({

        checkIfBlocked: [function(cb) {

            userModel.findOne({ _id: request.user_id }, function(err, res) {
                if (err) cb(err)
                else {
                    if (res &&res.blockedList && res.blockedList.length > 0) {
                        for (var i = 0; i < res.blockedList.length; i++) {
                            res.blockedList[i] = res.blockedList[i].toString()
                        }
                        isBlocked = Utils._.contains(res.blockedList, request.logged_in_user_id.toString());
                    }
                    cb(null, null)
                }

            })
        }],
        getMesssages: ["checkIfBlocked", function(data, cb) {
            Utils.universalFunctions.logger('\n\n\n Step 1 of fetch Messages, query to get messages')

            var query = {
                $and: [
                    { $or: [{ to: request.user_id }, { from: request.user_id }] },
                    {
                        $or: [{ to: request.logged_in_user_id }, { from: request.logged_in_user_id }]
                    },
                    { deleted_by: { $nin: [Utils.Mongoose.Types.ObjectId(request.logged_in_user_id)] } }
                ],
            }

            chatModel.find(query, { is_deleted: 0, __v: 0, deleted_by: 0 }, {sort: { messageId: -1 }, skip: request.skip || 0, limit: request.limit || 10, lean: true }).populate({ path: 'from', select: 'firstName lastName profilePic' }).populate({ path: 'to', select: 'firstName lastName profilePic' }).exec(function(err, res) {
                if (res.length > 0) {
                    for (var i in res) {

                        if (res[i].to._id.toString() == request.logged_in_user_id.toString()) {
                            res[i].chatted_with = res[i].from;
                            res[i].logged_in_user_id = res[i].to;
                        } else {
                            res[i].logged_in_user_id = res[i].from;
                            res[i].chatted_with = res[i].to;
                        }
                        if (!res[i].to.profilePic) {
                            res[i].to.profilePic = ''
                        }
                        if (!res[i].chatted_with.profilePic) {
                            res[i].chatted_with.profilePic = ''
                        }
                        if (!res[i].to.lastName) {
                            res[i].to.lastName = ''
                        }
                        if (!res[i].chatted_with.lastName) {
                            res[i].chatted_with.lastName = ''
                        }

                        if (!res[i].from.lastName) {
                            res[i].from.lastName = ''
                        }
                        if (!res[i].logged_in_user_id.lastName) {
                            res[i].logged_in_user_id.lastName = ''
                        }
                        if (!res[i].logged_in_user_id.profilePic) {
                            res[i].logged_in_user_id.profilePic = ''
                        }
                        if (!res[i].from.profilePic) {
                            res[i].from.profilePic = ''
                        }
                        // if (!res[i].to.lastName) {
                        //     res[i].chatted_with.lastName = ''
                        // }
                        // if (!res[i].from.lastName) {
                        //     res[i].logged_in_user_id.lastName = ''
                        // }

                        // delete res[i].to, delete res[i].from
                    }
                }
                err ? cb(err) : cb(null, res)
            })
        }],
        getMesssagesCount: ['getMesssages', function(data, cb) {
            Utils.universalFunctions.logger('\n Step 2 of fetch Messages, query to get count of messages')

            var query = {
                $and: [{ $or: [{ to: request.user_id }, { from: request.user_id }] }, { $or: [{ to: request.logged_in_user_id }, { from: request.logged_in_user_id }] },
                    { deleted_by: { $nin: [Utils.Mongoose.Types.ObjectId(request.logged_in_user_id)] } }
                ],
            }
            chatModel.find(query, { is_deleted: 0 }, {}, function(err, res) {

                err ? cb(err) : cb(null, res.length)
            })
        }],
        markMessagesRead: ['getMesssagesCount', function(data, cb) {
            Utils.universalFunctions.logger('\n Step 3 of fetch Messages, mark messages read of open chat')

            Utils.async.eachSeries(data.getMesssages, function(item, asyncCallback) {

                if (request.logged_in_user_id.toString() == item.to._id.toString()) {
                    var query = { to: request.logged_in_user_id, _id: item._id },
                        dataToSet = { message_read: true },
                        options = { new: true }
                    chatModel.findOneAndUpdate(query, dataToSet, options, function(err, data) {

                        err ? cb(err) : asyncCallback();

                    });
                } else {
                    asyncCallback();
                }
            }, function(err, result) {
                err ? cb(err) : cb(null, result)
            });
        }],
        makeChanges: ["getMesssages", function(data, cb) {

            if (data.getMesssages.length == 0) {
                var arr = []

                userModel.find({ _id: { $in: [request.logged_in_user_id, request.user_id] } }, { firstName: 1, lastName: 1, profilePic: 1 }, function(err, res) {

                    if (res[0]._id.toString() == request.logged_in_user_id.toString()) {
                        arr.push({
                            from: res[0],
                            to: res[1],
                            message: '',
                            created_at: ''
                        })
                    } else {
                        arr.push({
                            from: res[1],
                            to: res[0],
                            message: '',
                            created_at: ''
                        })
                    }
                    data.getMesssages = arr
                    cb(null, data)

                })



            } else {
                cb(null, data)
            }




        }]

    }, function(err, res) {
        err ? callback(err) : callback(null, { status: 'success', statusCode: 200, message: 'Messages fetched successfully.', totalRecords: res.getMesssagesCount, data: res.getMesssages, isBlocked: isBlocked })
    });
}

//function to get inbox details of logged in user
var fetchInbox = function(request, callback) {

    var userDetails, chatRoomDetails, records, finalArray = [],
        finalData = [],
        isBlocked = false;
    Utils.async.auto({
        checkTokenValidation: [function(cb) { // function to valid user tokena and check if user exist 
            Utils.universalFunctions.logger('\n\n\nIn step 1 of fetch inbox, check user validation')

            if (request['x-logintoken']) {
                var criteria = {
                    "deviceDetails": {
                        "$elemMatch": {
                            "accessToken": request['x-logintoken']
                        }
                    }
                }
                userModel.findOne(criteria, {}, {}, function(err, res) { // verifying token 
                    userDetails = res;
                    err ? cb(err) : res == null ? cb({ status: 'warning', statusCode: 324, message: "Your session is expired. Please login again to continue." }) : cb(null, res)
                })
            } else {
                userModel.findOne({ _id: request.userId }, {}, {}, function(err, res) {
                    if (err) cb(err)
                    else {
                        userDetails = res
                        cb(null, request)
                    }
                });

            }
        }],
        checkifChatInitiated: ["checkTokenValidation", function(data, cb) { //check if chat is intiated or not ? 
            Utils.universalFunctions.logger('\nIn step 2 of fetch inbox, get chatRoom id if chat is intiated')

            var query = { $or: [{ from: userDetails._id }, { to: userDetails._id }] }
            chatRoomModel.find(query, { _v: 0 }, { lean: true }).exec(function(err, res) {
                chatRoomDetails = res;

                err ? cb(err) : res.length == 0 ? cb(null, { statusCode: 200, status: 'success', message: 'Details fetched successfully.' }) : cb(null, res)
            });
        }],
        getChats: ['checkifChatInitiated', function(data, cb) { //query to get chat of logged in user  
            Utils.universalFunctions.logger('\nIn step 3 of fetch inbox, get chats of logged in user')

            Utils.async.eachSeries(chatRoomDetails, function(item, asyncCallback) {

                var query = { chat_room_id: item._id, deleted_by: { $nin: [userDetails._id] } };

                chatModel.find(query, { message_read: 0, is_deleted: 0 }, { new: true, lean: true, sort: { messageId: -1 }, limit: 1, }).populate({
                    path: "chat_room_id",
                    select: "from to",
                    populate: [{
                        'path': 'from',
                        'select': 'firstName lastName profilePic blockedList',
                        options: { lean: true }
                    }, {
                        'path': 'to',
                        'select': 'firstName lastName profilePic',
                        options: { lean: true }
                    }]
                }).exec(function(err, res) {

                    if (err) {
                        cb(err)
                    } else {
                        var to, from, obj = {}
                        if (res.length > 0) {
                            if (res[0].chat_room_id.to._id.toString() == userDetails._id.toString()) {
                                to = res[0].chat_room_id.from;
                                from = res[0].chat_room_id.to;
                            } else {
                                from = res[0].chat_room_id.from;
                                to = res[0].chat_room_id.to;
                            }
                            if (!to.profilePic) {
                                to.profilePic = ''
                            }
                            if (!to.lastName) {
                                to.lastName = ''
                            }
                            if (!from.lastName) {
                                from.lastName = ''
                            }

                            if (res[0].chat_room_id.from.blockedList) {
                                for (var i = 0; i < res[0].chat_room_id.from.blockedList.length; i++) {
                                    res[0].chat_room_id.from.blockedList[i] = res[0].chat_room_id.from.blockedList[i].toString()
                                }
                            }


                            if (res[0].chat_room_id.from.blockedList && res[0].chat_room_id.from.blockedList.length > 0)
                                isBlocked = Utils._.contains(res[0].chat_room_id.from.blockedList, userDetails._id.toString());

                            obj.chatted_with = to;
                            obj.loggedInUser = from;
                            obj.chat_id = res[0]._id;
                            obj.message = res[0].message;
                            obj.chat_room_id = res[0].chat_room_id._id;
                            obj.message_chat_id = res[0].message_chat_id ? res[0].message_chat_id : '';
                            obj.isBlocked = isBlocked

                            obj.created_at = res[0].created_at;

                            finalData.push(obj);
                            asyncCallback()
                        } else
                            asyncCallback()
                    }
                })

            }, function(err, result) {
                records = finalData.length
                err ? cb(err) : cb(null, finalData)
            });
        }],
        getUnreadMessagesCount: ['getChats', function(data, cb) { // query to get unread messages
            Utils.universalFunctions.logger('\nIn step 4 of fetch inbox, query to get unread messages count')

            var i = 0;
            Utils.async.eachSeries(finalData, function(item, asyncCallback) {
                var count = 0;
                var query = {
                    chat_room_id: item.chat_room_id,
                    to: userDetails._id,
                };
                chatModel.find(query, {}, { lean: true }, function(err, res) {
                    if (err) { cb(err); }

                    res.forEach(function(result) {
                        if (result.message_read == false) {
                            count = count + 1
                        }
                    })

                    item['count'] = count
                    i++;
                    count = 0;
                    asyncCallback();
                });
            }, function(err, result) {
                err ? cb(err) : cb(null, finalData)
            });
        }],
        searchUser: ['getUnreadMessagesCount', function(data, cb) { //search user 
            Utils.universalFunctions.logger('\nIn step 5 of fetch inbox, search user based on full_name')
            // Utils.universalFunctions.updateResetNotificationCount({ receiver: request.userDetails._id })

            if (request.search) {
                for (var i = 0; i < finalData.length; i++) {
                    var str = finalData[i].chatted_with.full_name.toString()
                    var searchKey = str.search(new RegExp(request.search))
                    if (searchKey != -1) {
                        finalArray.push(finalData[i])
                    }

                }
                cb(null, finalArray)
            } else {
                cb(null, finalData)
            }

        }],
        paginationNsorting: ['searchUser', function(data, cb) { // sorting data

            Utils.universalFunctions.logger('\nIn step 6 of fetch inbox, sorting and pagination')

            var array = Utils._.sortBy(data.searchUser, 'created_at').reverse();
            records = array.length

            var sorted_data = Utils._.chain(array)
                .rest(request.skip || 0)
                .first(request.limit || 10)
            sorted_data = sorted_data._wrapped;

            cb(null, sorted_data)
        }]
    }, function(err, res) {

        err ? callback(err) : callback({ status: 'success', statusCode: 200, message: 'Inbox details fetched successfully.', totalRecords: records, data: res.paginationNsorting })
    });
}

//function to mark msg delivered 
var msg_acknowledgement = function(request, callback) {
    Utils.universalFunctions.logger('\n\n function mark delivered messages read')

    chatModel.findOneAndUpdate({ _id: Utils.Mongoose.Types.ObjectId(request.chat_id) }, { isDelivered: true }, {}, function(err, res) {
        err ? callback(err) : res == null ? callback({ statusCode: 320, status: 'warning', message: 'Invalid chat id.' }) : callback(null, {
            statusCode: 200,
            status: 'success',
            message: 'Data delivered successfully',
        })
    })
}

//funtion to send is typing status
var sending_is_typing_Status = function(request, callback) {
    var deviceDetails, newUser, chatRoomId;
    Utils.async.auto({
        checkReceiver: [function(cb) {

            Utils.universalFunctions.logger('In step 1 of is typing event, query to get device details of receiver')
            userModel.findOne({ _id: request.to }, {}, {}, function(err, res) { // check if receiver(to) contain valid User id
                deviceDetails = res.deviceDetails;
                err ? cb(err) : res == null ? cb({ status: 'warning', statusCode: 320, message: "Invalid receiver(to) Id." }) : cb(null, res)
            })
        }],
        fetchChatRoomID: ['checkReceiver', function(data, cb) {
            // var criteria = {
            //     "deviceDetails": {
            //         "$elemMatch": {
            //             "accessToken": params['x-logintoken']
            //         }
            //     },
            // },
            //     dataToSet = { $unset: { "deviceDetails.$.socketId": 1 }, last_seen: Utils.moment().unix() }

            // userModel.findOneAndUpdate(criteria, dataToSet, { new: true }, function (err, res) {
            //     if (err) cb(err)
            //     else {
            //         cb(null, null)
            //     }
            // })
            Utils.universalFunctions.logger('In step 2 of is typing event, query to finf chatroom id of users')

            var query = {
                $and: [{ $or: [{ from: request.from }, { to: request.from }] },
                    {
                        $or: [{ to: request.to }, { from: request.to }]
                    }
                ]
            }
            chatRoomModel.findOne(query, {}, { lean: true }, function(err, data) {
                err ? cb(err) : data = null ? cb(null, newUser = true) : cb(null, chatRoomId = data._id)
            });
        }],
        createChatRoom: ['fetchChatRoomID', function(data, cb) {
            Utils.universalFunctions.logger('In step 3 of is typing event, create chat for new user')

            if (newUser == true) {
                var objToSave = { from: request.from, to: request.to, currentDate: Utils.moment().unix() }
                chatRoomModel(objToSave).save(function(err, res) {
                    if (err)
                        cb(err)
                    else {
                        chatRoomId = res._id
                        cb(null, null)
                    }
                })
            } else {
                cb(null, null)
            }
        }],
        // emitSocket: ['createChatRoom', function (data, cb) { //calling common function to emit socket
        //     Utils.universalFunctions.logger('In step 4 of is typing event, Emit socket')

        //     var dataToEmit = {
        //         show_event_to: request.to,
        //         typing_user: request.from,
        //         chat_room_id: chatRoomId,
        //         is_typing: request.isTyping,
        //         receiver: request.from,
        //         notification_event_type: CONSTANTS.NOTIFICATION_EVENT_TYPE.MESSAGE_TYPE,
        //     }

        //     if (deviceDetails.length > 0) {
        //         emitData(deviceDetails, dataToEmit, 'is_Typing', function (err, res) {
        //             err ? cb(err) : cb(null, dataToEmit)
        //         })
        //     } else {
        //         cb(null, dataToEmit)
        //     }
        // }]
    }, function(err, res) {
        err ? callback(err) : callback(null, { status: 'success', statusCode: 200, message: 'Event emitted successfully.', data: { is_typing: request.isTyping } })
    });
}

var disconnect_socket = function(request, callback) {
    var query = {
            "deviceDetails": {
                "$elemMatch": {
                    "accessToken": request['x-logintoken']
                }
            }
        },
        dataToSet = { $unset: { "deviceDetails.$.socketId": 1 }, last_seen: Utils.moment().unix() }

    userModel.findOneAndUpdate(query, dataToSet, { new: true }, function(err, res) {
        err ? callback(err) : res == null ? callback({ statusCode: 324, status: 'warning', message: "Your session is expired. Please login again to continue." }) : callback(null, ({ statusCode: 200, status: 'success', message: 'Socket disconnected successfully.' }))
    })
}

var disconnect_socketId = function(request, callback) {
    var query = {
            "deviceDetails": {
                "$elemMatch": {
                    "socketId": request['socketId']
                }
            },
            status: 1
        },
        dataToSet = { $unset: { "deviceDetails.$.socketId": 1 }, last_seen: Utils.moment().unix() }

    userModel.findOneAndUpdate(query, dataToSet, { new: true }, function(err, res) {
        err ? callback(err) : res == null ? callback({ statusCode: 324, status: 'warning', message: "Your session is expired. Please login again to continue." }) : callback(null, ({ statusCode: 200, status: 'success', message: 'Socket disconnected successfully.' }))
    })
}

var block_event = function(params, callback) {

    Utils.async.waterfall([
        function(cb) {
            userModel.findOneAndUpdate({ _id: params.to }, { $push: { blockedList: params.from } }, { new: true }, function(err, res) {
                err ? callback(err) : res == null ? callback({ statusCode: 324, status: 'warning', message: "Invalid to Id." }) : cb(null, null)
            })
        },
        function(data, cb) {
            userModel.findOneAndUpdate({ _id: params.from }, { $push: { blockedList: params.to } }, { new: true }, function(err, res) {
                err ? callback(err) : res == null ? callback({ statusCode: 324, status: 'warning', message: "Invalid to Id." }) : callback(null, { statusCode: 200, status: "success", message: "Blocked successfully" })
            })
        }
    ], function(err, result) {
        if (err) callback(err);
        callback(null, result);
    })

}

var deleteChat = function(params, callback) {

    Utils.async.auto({
        updateDb: [function(cb) {

            chatModel.update({ chat_room_id: params.chatRoomId }, { $push: { deleted_by: params.userId } }, { new: true, multi: true }, function(err, res) {
                cb(err ? err : null, null)
            })
        }],
    }, function(err, result) {
        callback(err ? err : null, { statusCode: 200, status: 'success', message: "Deleted successfully" });
    });


}

var deleteMessage = function(params, callback) {

    Utils.async.auto({
        updateDb: [function(cb) {

            chatModel.findOneAndUpdate({ _id: params.messageId }, { $push: { deleted_by: params.userId } }, { new: true, multi: true }, function(err, res) {
                cb(err ? err : null, null)
            })
        }],
    }, function(err, result) {
        callback(err ? err : null, { statusCode: 200, status: 'success', message: "Deleted successfully" });
    });


}

var sendGroupMessage = function(request, callback) {
    var joinees, lessonDetails, deviceDetails, isChatInitiated, chat_information, chatRoomId, dataToEmit;
    Utils.async.auto({

        getLessonDetails: [function(cb) {

            sessionsModel.findOne({ groupLessonNumber: request.groupLessonNumber }, function(err, res) {
                if (err) cb(err)
                else if (res == null) callback({ statusCode: 401, status: 'warning', message: "Group lesson number not found" })
                else if (res.joinees && res.joinees.length > 0) {
                    lessonDetails = res
                    joinees = res.joinees
                    cb(null, null)
                } else {
                    callback({ statusCode: 401, status: "warning", message: "Message can't be sent because of no joinees" })
                }
            })
        }],
        sendMessage: ["getLessonDetails", function(data, cb) {

            Utils.async.eachSeries(joinees, function(item, Incb) {
                    var deviceDetails, count = 0;
                    request.from = lessonDetails.requestedTo
                    request.to = item

                    Utils.async.auto({

                        checkIfUserBlocked: [function(cb) {

                            userModel.findOne({ _id: request.from }, function(err, res) {
                                if (err) cb(err)
                                else {
                                    if (res.blockedList && res.blockedList.length > 0) {

                                        for (var i = 0; i < res.blockedList.length; i++) {
                                            res.blockedList[i] = res.blockedList[i].toString()
                                        }
                                        var isBlocked = Utils._.contains(res.blockedList, item.toString());
                                        isBlocked == true ? Incb() : cb(null, null)
                                    } else {
                                        cb(null, null)
                                    }
                                }
                            })
                        }],
                        checkifChatInitiated: ["checkIfUserBlocked", function(data, cb) { //check if chat is intiated or not ? 

                            var query = { $and: [{ from: { $in: [request.from, request.to] } }, { to: { $in: [request.from, request.to] } }] }
                            chatRoomModel.find(query, { _v: 0 }, {}).exec(function(err, res) {
                                res.length > 0 ? chatRoomId = res[0]._id : chatRoomId = ''
                                res.length > 0 ? isChatInitiated = true : isChatInitiated = false
                                err ? cb(err) : cb(null, res)
                            });
                        }],
                        createChatRoom: ['checkifChatInitiated', function(data, cb) { //create chat room if new user 

                            if (isChatInitiated == false) {
                                var objToSave = { from: request.from, to: request.to, created_at: request.sent_time }
                                chatRoomModel(objToSave).save(function(err, res) {
                                    chatRoomId = res._id
                                    err ? cb(err) : cb(null, chatRoomId)
                                })
                            } else {
                                cb(null, chatRoomId)
                            }
                        }],
                        saveMessageInDb: ['createChatRoom', function(data, cb) { //save message in db

                            var objToSave = {
                                from: request.from,
                                to: request.to,
                                chat_room_id: chatRoomId,
                                created_at: request.sent_time,
                                message: request.message
                            }

                            chatModel(objToSave).save(function(err, res) {
                                if (err) cb(err)
                                else {
                                    ChatId = res._id;
                                    chatModel.findOne({ _id: res._id }, {
                                        __v: 0,
                                        is_deleted: 0,
                                        message_read: 0
                                    }, { lean: true }, function(err, res) {
                                        dataToEmit = res
                                        dataToEmit.receiver = request.from
                                        userModel.findOne({ _id: request.from }, { lastName: 1, firstName: 1, profilePic: 1 }, { lean: true }, function(err, data) {
                                            dataToEmit.from = data
                                            cb(null, dataToEmit)
                                        })
                                    })
                                }
                            })
                        }],
                        checkReceiver: ['saveMessageInDb', function(data, cb) {

                            userModel.findOne({ _id: request.to }, {}, {}, function(err, res) { // check if receiver(to) contain valid User id
                                deviceDetails = res.deviceDetails;
                                err ? cb(err) : res == null ? cb({ status: 'warning', statusCode: 320, message: "Invalid receiver(to) Id." }) : cb(null, res)
                            })
                        }],
                        getUnreadMessages: ["checkReceiver", function(data, cb) {

                            var query = {
                                chat_room_id: chatRoomId,
                                to: data.checkReceiver._id,
                            };
                            chatModel.find(query, {}, { lean: true }, function(err, res) {
                                if (err) { cb(err); }

                                res.forEach(function(result) {
                                    if (result.message_read == false) {
                                        count = count + 1
                                    }
                                })
                                cb(null, data)
                            });
                        }],
                        emitSocket: ["getUnreadMessages", function(data, cb) {

                            var dataToEmitOtherUser = {
                                from: dataToEmit.from,
                                to: {
                                    _id: data.checkReceiver._id,
                                    firstName: data.checkReceiver.firstName || "",
                                    lastName: data.checkReceiver.lastName || "",
                                    profilePic: data.checkReceiver.profilePic || ""
                                },
                                message: request.message,
                                created_at: request.sent_time,
                                "_id": ChatId,
                                "chat_room_id": chatRoomId,
                                "messageId": dataToEmit.messageId,
                                chatted_with: dataToEmit.from,
                                count: count
                            }

                            //  console.log('------------',dataToEmitOtherUser)

                            for (var i = 0; i < deviceDetails.length; i++) {
                                if (deviceDetails[i].socketId) {
                                    ioS.to(deviceDetails[i].socketId).emit("get_message_event", {
                                        data: dataToEmitOtherUser
                                    });
                                }
                            }

                            cb(null, null)

                        }],
                        sendNotification: ["emitSocket", function(data, cb) {
                            var x = dataToEmit.from.firstName
                            dataToEmit.from.firstName = x.charAt(0).toUpperCase() + x.slice(1)

                            var obj = {
                                senderId: dataToEmit.from,
                                receiverId: data.checkReceiver,
                                notificationEventType: NOTIFICATION_TYPE.send_message,
                                createdAt: Utils.moment().unix(),
                                saveInDb: false,
                                message: "You got a new message from " + dataToEmit.from.firstName
                            }


                            Utils.universalFunctions.sendNotification(obj, "notification", function(err, res) {
                                cb(err, data)
                            })
                        }]
                    }, function(err, result) {
                        Incb(err ? err : null, true)
                    })
                },
                function(err, result) {
                    cb(err ? err : null, result)
                });

        }],
        // emitSocket: ['addImage', function (data, cb) { //calling common function to save notification
        //     console.log("\nstep 7===========")
        //     var saveNotification = {
        //         sender: request.from,
        //         receiver: request.to,
        //         notification_event_type: CONSTANTS.NOTIFICATION_EVENT_TYPE.MESSAGE_TYPE,
        //         chat_id: dataToEmit._id,
        //         created_at: Utils.moment().unix(),
        //         message:data.checkSender.full_name+" sent you a message."
        //     }
        //     universalFunctions.saveNotification(saveNotification, function (err, res) {
        //         if (err) {
        //             cb(err)
        //         } else {
        //             universalFunctions.emitData(deviceDetails, dataToEmit, 'get_message_event')
        //             cb(null, null)
        //         }

        //     }) // save notification in db
        // }],

    }, function(err, res) {
        err ? callback(err) : callback(null, { status: 'success', statusCode: 200, message: 'Message send successfully.' })
    });
}

var markMessagesRead = function(params, callback) {
    Utils.async.auto({
        updateDb: [function(cb) {

            chatModel.update({ chat_room_id: params.chat_room_id }, { message_read: true }, { new: true, multi: true }, function(err, res) {
                cb(err ? err : null, null)
            })
        }],
    }, function(err, result) {
        callback(err ? err : null, { statusCode: 200, status: 'success', message: "Message marked as read successfully" });
    });
}



module.exports = {
    validate_token: validate_token,
    sendMessage: sendMessage,
    setIo: setIo,
    fetchInbox: fetchInbox,
    fetchMessages: fetchMessages,
    msg_acknowledgement: msg_acknowledgement,
    sending_is_typing_Status: sending_is_typing_Status,
    disconnect_socket: disconnect_socket,
    block_event: block_event,
    deleteChat: deleteChat,
    deleteMessage: deleteMessage,
    sendGroupMessage: sendGroupMessage,
    markMessagesRead: markMessagesRead,
    disconnect_socketId : disconnect_socketId
}