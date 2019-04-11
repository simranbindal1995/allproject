/**
Socket.js file
10 Jan 2019
 **/

'use strict'
const socketIo = require('socket.io')
const context = require('../utils/context-builder')
const chatService = require('../components/chats/service')
const notificationService = require('../components/notifications/service')
const cronService = require('../components/cronJobs/service')
const bookingService = require('../components/bookings/service')

module.exports.configure = (server) => {
    var userDetails
    //console.log('server.listener==========',server.listener)
    let io = socketIo.listen(server.listener)

    chatService.setIo(io);
    notificationService.settingIo(io);
    bookingService.setBookingIo(io);
    cronService.setCronIo(io)

    io.use(async (socket, next) => {
        //console.log('request==========SOCKET REQUEST=',socket.handshake.query["x-logintoken"])
        logger.start(`sockets:services`)
        try {
            userDetails = await context.validateWithSocket(socket.handshake, socket)
            return next()
        } catch (err) {
            err.data = {
                isSuccess: false,
                statusCode: 400,
                status: "failure",
                message: err.message
            }
            return next(err);
        }
    })

    io.on('connection', async (socket) => {
        console.log('in connection=======================')
        logger.start('io:connection')

        socket.on('sendMessage', async (query, callback) => {
            logger.start('sockets:sendMessage')
            var chatMessage, checkSender, checkReceiver
            const data = query.hasOwnProperty('receiverId') && query.hasOwnProperty('message')

            if (!data) { //If all required params are not there in query
                callback({ isSuccess: false, statusCode: 400, status: "failure", message: "Invalid Json" });
            } else {

                checkReceiver = await chatService.checkReceiver(query)
                if (checkReceiver == null) callback({ isSuccess: false, statusCode: 400, status: "failure", message: "Invalid Sender" })

                query.senderId = userDetails._id
                chatMessage = await chatService.sendMessage(query)

                const count = await chatService.getUnReadCount(chatMessage)

                const dataToEmit = {
                    senderId: {
                        _id: userDetails._id,
                        firstName: userDetails.firstName,
                        lastName: userDetails.lastName ? checkReceiver.lastName : ""
                    },
                    receiverId: {
                        _id: checkReceiver._id,
                        firstName: checkReceiver.firstName,
                        lastName: checkReceiver.lastName ? checkReceiver.lastName : ""
                    },
                    message: chatMessage.message,
                    createdAt: chatMessage.createdAt,
                    _id: chatMessage._id,
                    chatRoomId: chatMessage.chatRoomId,
                    unReadCount: count
                }
                //console.log("dataToEmit==============", dataToEmit)
                if (checkReceiver.deviceDetails) {
                    if (checkReceiver.deviceDetails.socketId) {
                        io.to(checkReceiver.deviceDetails.socketId).emit("receiveMessageEvent", {
                            data: dataToEmit
                        });
                    } else { //Send Notification to user

                        const ntfcn = {
                            senderId: userDetails,
                            receiverId: checkReceiver,
                            notificationType: 4
                        }
                        await notificationService.sendNotification(ntfcn, false)
                    }
                }
                callback({ isSuccess: true, statusCode: 200, status: "success", message: "Message send successfully", data: dataToEmit })
            }

        }); //sendMessage

        socket.on('fetchMessages', async (query, callback) => {
            console.log('FETCH MESSAGES CALLED=================')
            const data = query.hasOwnProperty('receiverId') && query.hasOwnProperty('skip') && query.hasOwnProperty('limit')

            if (!data) { //If all required params are not there in query
                callback({ isSuccess: false, statusCode: 400, status: "failure", message: "Invalid Json" });
            } else {

                const checkReceiver = await chatService.checkReceiver(query)
                if (checkReceiver == null) callback({ isSuccess: false, statusCode: 400, status: "failure", message: "Invalid Sender" })

                query.senderId = userDetails._id

                const messages = await chatService.fetchMessages(query)
                callback({ isSuccess: true, statusCode: 200, status: "success", message: "Message fetched successfully", data: messages.data, totalCount: messages.totalCount })
            }

        }); //fetchMessages

        socket.on('fetchInbox', async (query, callback) => {

            query.senderId = userDetails._id
            await chatService.fetchInbox(query)


        }); //fetchInbox

        socket.on("acknowledgePatientForPayment", async (query, callback) => {
            //doctor will click press charges and this event will fire
            const data = query.hasOwnProperty('bookingId') && query.hasOwnProperty("type") //type - fitnote referral prescription

            if (!data) {
                callback({ isSuccess: false, statusCode: 400, status: "failure", message: "Invalid Json" });
            } else {
                //emit to the patient that doctor has requested for charges
                //pay button will be enabled at the patients side to pay
                //on click of pay api(history/makePaymentForFitNoteReferral) will be called to create charge 
                const details = db.bookings.findOne({ _id: query.bookingId }).populate({ path: "patientId", select: "deviceDetails" })

                if (details.patientId.deviceDetails) {
                    if (details.patientId.deviceDetails.socketId) {
                        const dataToEmit = {
                            bookingId: query.bookingId,
                            type: query.type,
                            payButton: true
                        }
                        io.to(details.patientId.deviceDetails.socketId).emit("acknowledgingPatientForPayment", {
                            data: dataToEmit
                        });
                    }
                }

            }

        })

        eventEmitter.on("acknowledgeDoctorPaymentDone", (data) => {
            //after patient pays for fitnote/referral acknowledge doctor and enable the Issue button

            if (data.doctorId.deviceDetails && data.doctorId.deviceDetails.socketId) {
                const dataToEmit = {
                    bookingId: data._id,
                    paymentType: data.paymentType,
                    issueButton: true
                }
                io.to(data.doctorId.deviceDetails.socketId).emit("acknowledgeDoctorPaymentDone", {
                    data: dataToEmit
                });
            } //once issue is enabled doctor will call addFitNote/addreferral

        })

        socket.on('disconnect', function() {
            console.log('A user disconnected')
        })
    })

}