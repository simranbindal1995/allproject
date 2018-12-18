/*
 * @description: This file defines the crons
 * @date: 18 june 2018
 * @author: Simran
 * */


'use strict';

// include Utils module

var Utils = require('../../../utils/index');
var env = require('../../../env');
var configs = require('../../../configs');
var moment = require('moment');
var mongoose = require('mongoose');

var availabilityModel = require('../models/index');
var skillGuruTeachesModel = require('../../skillsGuruTeaches/models/index');
var availabilityServies = require('../../availability/services/index');
var sessionsModel = require('../../sessions/models/index');
var sessionBookingsModel = require('../../sessionBookings/models/index');
var userModel = require('../../user/models/index');
var newModel = require('../../availability/models/index');
var subjectnskills = require('../../subjectNSkill/models/index');
var stripeService = require('../../stripe/services/index');
var transactionsModel = require('../../sessionBookings/models/transactions');
var ticketCounterModel = require('../../sessions/models/ticketcounter');

var stripe = require("stripe")(configs.config.stripeKeys.secretKey);

var APP_CONSTANTS = configs.constants;
var LESSON_TYPE = APP_CONSTANTS.LESSON_TYPE;
var SESSION_STATUS = APP_CONSTANTS.SESSION_STATUS;
var TRANSACTION_TYPE = APP_CONSTANTS.TRANSACTION_TYPES;
var REQUEST_STATUS = APP_CONSTANTS.REQUEST_STATUS;
var NOTIFICATION_TYPE = APP_CONSTANTS.NOTIFICATION_TYPE

module.exports = {


    updateTransactions: function(params, callback) {
        var final = [],
            lessonsToUpdate = [],
            transactionToMark = []
        Utils.universalFunctions.logger("Cron that will check sessions that have completed 24 hrs are ready for bank transfer")

        var currentTime = Utils.moment().unix()
        var beforeTime = Utils.moment().subtract(1, "hour").unix()

        Utils.async.auto({
                // sendTestMail: [function(cb) {

                //     Utils.universalFunctions.sendMail("simran.bindal@ignivasolutions.com", "update transactions cron after every 55 mins", "test")
                //     cb(null, null)

                // }],
                getOneOneSessions: [function(cb) {

                    var criteria = {
                        status: SESSION_STATUS.payment_done,
                        isDeleted: false,
                        sessionType: "one-one",
                        endDateTime: { $lte: currentTime } //endDateTime: { $gte: beforeTime, $lte: currentTime }
                    }

                    sessionsModel.find(criteria, function(err, res) {
                        if (err) cb(err)
                        else {
                            cb(null, res)
                        }
                    })
                }],
                getGroupSessions: ['getOneOneSessions', function(data, cb) {

                    var criteria = {
                        status: SESSION_STATUS.payment_done,
                        isDeleted: false,
                        sessionType: "group",
                        endDateTime: { $lte: currentTime }
                    }

                    sessionsModel.find(criteria, function(err, res) {
                        if (err) cb(err)
                        else {
                            cb(null, res)
                        }
                    })
                }],
                checkEndDatesOfSessions: ["getGroupSessions", function(data, cb) {

                    Utils.async.eachSeries(data.getGroupSessions, function(item, Incb) {

                        sessionsModel.find({ groupLessonNumber: item.groupLessonNumber }, {}, { sort: { startDateTime: -1 } }, function(err, res) {

                            if (err) Incb(err)
                            else {
                                if (res.length > 0) {
                                    var length = res.length
                                    var i = 0

                                    var startDateTime = res[length - 1].startDateTime
                                    var endDateTime = res[i].endDateTime

                                    if (endDateTime >= beforeTime && endDateTime <= currentTime) {
                                        final.push(item)
                                        Incb();
                                    } else {
                                        Incb()
                                    }
                                } else {
                                    Incb()
                                }
                            }
                        })
                    }, function(err, result) {
                        cb(err ? err : null, null)
                    })
                }],
                checkComplaintsOfJoinees: ["checkEndDatesOfSessions", function(data, cb) {

                    Utils.async.eachSeries(final, function(item, Incb) {

                            Utils.async.eachSeries(item.joinees, function(user, Inncb) {

                                    Utils.async.auto({
                                        hitBookingsTocheckComplaints: [function(cb) {

                                            sessionBookingsModel.findOne({ groupLessonNumber: item.groupLessonNumber, paymentDoneBy: user, paymentStatus: SESSION_STATUS.payment_done }, function(err, res) {

                                                if (err) cb(err)
                                                else if (res == null) Inncb();
                                                else {
                                                    if (res.complaints.length == 0) {
                                                        // change status for this request
                                                        transactionToMark.push(res.transactionDetails[0].transactionId)

                                                        cb(null, null)
                                                    } else {
                                                        var obj = Utils._.sortBy(res.complaints, function(obj) {
                                                            return obj.status
                                                        }).reverse()

                                                        if (obj[0].status == 3) {

                                                            transactionToMark.push(res.transactionDetails[0].transactionId)
                                                            // change status for this request
                                                        }
                                                        cb(null, null)
                                                    }
                                                }
                                            })


                                        }],

                                    }, function(err, result) {
                                        Inncb(err ? err : null, true)
                                    })

                                },
                                function(err, result) {
                                    if (err) Incb(err);
                                    Incb(null, data);
                                });
                        },
                        function(err, result) {
                            if (err) cb(err);
                            cb(null, data);
                        });
                }],
                getTransactionsForOneOneLesson: ["getOneOneSessions", function(data, cb) {

                    Utils.async.eachSeries(data.getOneOneSessions, function(item, Incb) {

                        sessionBookingsModel.findOne({ sessionId: item._id, paymentStatus: SESSION_STATUS.payment_done }, function(err, res) {

                            if (err) Incb(err)
                            else if (res == null) Incb();
                            else {
                                if (res.complaints.length == 0) {
                                    // change status for this request
                                    transactionToMark.push(res.transactionDetails[0].transactionId)

                                    Incb(null, null)
                                } else {
                                    var obj = Utils._.sortBy(res.complaints, function(obj) {
                                        return obj.status
                                    }).reverse()

                                    if (obj[0].status == 3) {

                                        transactionToMark.push(res.transactionDetails[0].transactionId)
                                        // change status for this request
                                    }
                                    Incb(null, null)
                                }
                            }
                        })
                    }, function(err, result) {
                        cb(err ? err : null, null)
                    })

                }],
                markTransactions: ["getTransactionsForOneOneLesson", "checkComplaintsOfJoinees", function(data, cb) {

                    transactionsModel.update({ _id: { $in: transactionToMark }, transactionType: 1 }, { requestStatus: REQUEST_STATUS.readyForPayment }, { new: true, multi: true }, function(err, res) {
                        cb(err ? err : null, res)
                    })
                }]
            },
            function(err, result) {
                callback(err ? err : null, result);
            });

    },

    transferMoneyToGuru: function(params, callback) {

        Utils.async.auto({
                // sendTestMail: [function(cb) {

                //     Utils.universalFunctions.sendMail("simran.bindal@ignivasolutions.com", "transfer money to guru every hour", "test")
                //     cb(null, null)

                // }],
                getTransactionThatAreReadyForPayment: [function(cb) {

                    transactionsModel.find({ requestStatus: REQUEST_STATUS.readyForPayment })
                        .populate({ path: "paymentDoneBy", select: "firstName lastName email deviceDetails" })
                        .populate({ path: "paymentDoneTo", select: "firstName lastName email deviceDetails" })
                        .exec(function(err, res) {
                            if (err) callback(err)
                            else if (res == null) callback(null, null)
                            else {
                                cb(null, res)
                            }
                        });
                }],
                makePayments: ['getTransactionThatAreReadyForPayment', function(data, cb) {

                    Utils.async.eachSeries(data.getTransactionThatAreReadyForPayment, function(item, Incb) {

                            Utils.async.auto({
                                getBankAccountID: [function(cb) {
                                    var criteria = {}

                                    item.sessionId ? criteria._id = item.sessionId : criteria.groupLessonNumber = item.groupLessonNumber

                                    sessionsModel.findOne(criteria, {}, { sort: { endDateTime: -1 } })
                                        .populate({ path: "requestedTo", select: "customAccount stripeCustomerId" })
                                        .exec(function(err, res) {
                                            if (err) Incb(err)
                                            else {

                                                if (res.requestedTo.customAccount) {
                                                    cb(null, res)
                                                } else {
                                                    Incb()
                                                }
                                            }
                                        })
                                }],
                                initiateTransfer: ["getBankAccountID", function(data, cb) {

                                    var transferData = {
                                        amount: Math.round(item.finalAmountToTransfer * 100),
                                        currency: APP_CONSTANTS.stripeCurrency,
                                        destination: data.getBankAccountID.requestedTo.customAccount,
                                    }
                                    stripe.transfers.create(transferData, (err, res) => {

                                        if (err) Incb(err)
                                        else {
                                            cb(null, res)
                                        }
                                    });
                                }],
                                storeTransactionInDb: ["initiateTransfer", function(data, cb) {

                                    var objToSave = {
                                        stripeCustomerID: data.getBankAccountID.requestedTo.stripeCustomerId,
                                        metaData: data.initiateTransfer,
                                        transactionType: TRANSACTION_TYPE.stripeToBank,
                                        requestStatus: REQUEST_STATUS.completed,
                                        paymentDoneTo: item.paymentDoneTo._id,
                                        paymentDoneBy: item.paymentDoneBy._id,
                                        finalAmountToTransfer: Math.round(item.finalAmountToTransfer)
                                    }

                                    item.sessionId ? objToSave.sessionId = item.sessionId : objToSave.groupLessonNumber = item.groupLessonNumber

                                    objToSave.chargeID = data.initiateTransfer.id ? data.initiateTransfer.id : null;
                                    objToSave.transactionID = data.initiateTransfer.balance_transaction ? data.initiateTransfer.balance_transaction : null;
                                    objToSave.transactionStatus = data.initiateTransfer.object ? data.initiateTransfer.object : null;
                                    objToSave.currency = data.initiateTransfer.currency ? data.initiateTransfer.currency : null;
                                    objToSave.transactionDate = data.initiateTransfer.created ? data.initiateTransfer.created : null;

                                    transactionsModel(objToSave).save(function(err, res) {

                                        if (err) {
                                            Utils.universalFunctions.logger(err);
                                            cb(err);
                                        } else {
                                            cb(null, res);
                                        }
                                    });
                                }],
                                markTransactionAsComplete: ["storeTransactionInDb", function(data, cb) {

                                    transactionsModel.findOneAndUpdate({ _id: item._id }, { requestStatus: REQUEST_STATUS.completed }, { new: true }, function(err, res) {

                                        cb(err ? err : null, res)
                                    })
                                }],
                                markSessionCompleted: ["markTransactionAsComplete", function(data, cb) {

                                    if (item.sessionId) {

                                        sessionBookingsModel.findOneAndUpdate({ sessionId: item.sessionId }, { paymentStatus: SESSION_STATUS.completed }, { new: true }, function(err, res) {
                                            if (err) cb(err)
                                            else {
                                                sessionsModel.findOneAndUpdate({ _id: item.sessionId }, { status: SESSION_STATUS.completed }, { new: true }, function(err, res) {
                                                    if (err) cb(err)
                                                    else {
                                                        cb(null, data)
                                                    }
                                                });
                                            }
                                        })
                                    } else {
                                        var criteria = {
                                            groupLessonNumber: item.groupLessonNumber,
                                            transactionDetails: {
                                                $elemMatch: {
                                                    transactionId: item._id
                                                }
                                            }
                                        }
                                        sessionBookingsModel.update(criteria, { paymentStatus: SESSION_STATUS.completed }, { multi: true, new: true }, function(err, res) {
                                            if (err) cb(err)
                                            else {

                                                cb(null, null)
                                            }
                                        });
                                    }
                                }],
                                markLessonCompleteInSessionsAlso: ["markSessionCompleted", function(data, cb) {

                                    if (item.groupLessonNumber) {
                                        sessionBookingsModel.find({ groupLessonNumber: item.groupLessonNumber }, function(err, res) {
                                            cb(err ? err : null, res.length)
                                        })
                                    } else {
                                        cb(null, null)
                                    }
                                }],
                                checkIfAllLessonsAreCompleted: ["markLessonCompleteInSessionsAlso", function(data, cb) {

                                    if (item.groupLessonNumber) {

                                        sessionBookingsModel.find({ groupLessonNumber: item.groupLessonNumber, paymentStatus: SESSION_STATUS.completed }, function(err, res) {
                                            if (err) cb(err)
                                            else {

                                                if (res.length == data.markLessonCompleteInSessionsAlso) {

                                                    sessionsModel.update({ groupLessonNumber: item.groupLessonNumber }, { status: SESSION_STATUS.completed }, { multi: true, new: true }, function(err, res) {
                                                        if (err) cb(err)
                                                        else {
                                                            cb(null, data)
                                                        }
                                                    });
                                                } else {
                                                    cb(null, data)
                                                }
                                            }
                                        })

                                    } else {
                                        cb(null, null)
                                    }

                                }],
                                sendMail: ['checkIfAllLessonsAreCompleted', function(data, cb) {

                                    var subject
                                    item.sessionId ? subject = "Payment successfully transfered for one to one lesson" : subject = "Payment successfully transfered for group lesson"

                                    var x = item.paymentDoneBy.firstName
                                    var rookieName = x.charAt(0).toUpperCase() + x.slice(1)

                                    var x = item.paymentDoneTo.firstName
                                    item.paymentDoneTo.firstName = x.charAt(0).toUpperCase() + x.slice(1)

                                    var endDate = Utils.moment(data.getBankAccountID.endDateTime * 1000).format("YYYY-MM-DD HH:mm:ss")

                                    var templatepath = Utils.path.join(__dirname, '../../../assets/emailTemplates/');
                                    var fileReadStream = Utils.fs.createReadStream(templatepath + 'notifications.html');

                                    var emailTemplate = '';

                                    fileReadStream.on('data', function(buffer) {
                                        emailTemplate += buffer.toString();
                                    });
                                    var message
                                    item.sessionId ?
                                        message = "We have successfully transfered you with the amount £" + data.getBankAccountID.ratePerHour + " for the one to one lesson ended on " + endDate + " for the rookie " + rookieName :
                                        message = "We have successfully transfered you with the amount £" + data.getBankAccountID.ratePerRookie + " for the group lesson ended on " + endDate + " for the rookie " + rookieName


                                    fileReadStream.on('end', function(res) {

                                        var otherMessage = "For any queries please , contact the admin at admin@yopmail.com."

                                        var sendStr = emailTemplate.replace('{{firstName}}', item.paymentDoneTo.firstName).replace('{{message}}', message).replace('{{otherMessage}}', otherMessage)

                                        Utils.universalFunctions.sendMail(item.paymentDoneTo.email, subject, sendStr)

                                        cb(null, null)

                                    });

                                }],
                                sendNotification: ["checkIfAllLessonsAreCompleted", function(data, cb) {
                                    var message;

                                    var x = item.paymentDoneBy.firstName
                                    var rookieName = x.charAt(0).toUpperCase() + x.slice(1)

                                    // var x = item.paymentDoneTo.firstName
                                    // item.paymentDoneTo.firstName = x.charAt(0).toUpperCase() + x.slice(1)

                                    var endDate = Utils.moment(data.getBankAccountID.endDateTime * 1000).format("YYYY-MM-DD HH:mm:ss")

                                    item.sessionId ?
                                        message = "We have successfully transfered you with the amount £" + data.getBankAccountID.ratePerHour + " for the one to one lesson ended on " + endDate + " for the rookie " + rookieName :
                                        message = "We have successfully transfered you with the amount £" + data.getBankAccountID.ratePerRookie + " for the group lesson ended on " + endDate + " for the rookie " + rookieName

                                    var obj = {
                                        senderId: item.paymentDoneBy,
                                        receiverId: item.paymentDoneTo,
                                        notificationEventType: NOTIFICATION_TYPE.transfer_to_guru,
                                        createdAt: Utils.moment().unix(),
                                        saveInDb: true,
                                        message: message
                                    }
                                    if (item.groupLessonNumber) {
                                        obj.groupLessonNumber = item.groupLessonNumber
                                    } else {
                                        obj.sessionId = [item._id]
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
                }]
            },
            function(err, result) {
                callback(err ? err : null, result);
            });
    },

    sendNotificationToGuru: function(params, callback) { // Send notification to guru rookie before 1 hour of starting a lesson

        var startTime = Utils.moment().add(1, "hour").unix()
        var endTime = Utils.moment().add(1.5, "hour").unix()

        Utils.async.auto({
            // sendTestMail: [function(cb) {

            //     Utils.universalFunctions.sendMail("simran.bindal@ignivasolutions.com", "send reminder ntfcn to guru before 1hr of start", "test")
            //     cb(null, null)

            // }],
            getAllSessions: [function(cb) {
                //GET ALL SESSIONS THAT NEED TO BE STARTED AFTER 1 HOUR

                sessionsModel.find({ startDateTime: { $gte: startTime, $lt: endTime }, isDeleted: false, status: SESSION_STATUS.payment_done }, function(err, res) {
                    console.log('send ntfcn to guru====', res)
                    cb(err ? err : null, res)
                })
            }],
            sendNotificationToGuru: ["getAllSessions", function(data, cb) {

                Utils.async.eachSeries(data.getAllSessions, function(item, Incb) {
                        Utils.async.auto({
                            sendReminderToguru: [function(cb) {

                                var message;

                                var startTime = Utils.moment(item.startDateTime * 1000).format("HH:mm")

                                if (item.sessionType == "one-one") {
                                    message = "Please be available today at " + startTime + " to conduct your scheduled one to one lesson."
                                } else {
                                    message = "Please be available today at " + startTime + " to conduct your scheduled group lesson."

                                }

                                var obj = {
                                    senderId: item.requestedTo,
                                    receiverId: item.requestedTo,
                                    notificationEventType: NOTIFICATION_TYPE.reminder_notification,
                                    createdAt: Utils.moment().unix(),
                                    saveInDb: true,
                                    message: message
                                }
                                if (item.sessionType == "group") {
                                    obj.groupLessonNumber = item.groupLessonNumber
                                } else {
                                    obj.sessionId = [item._id]
                                }
                                console.log('obj---', obj)
                                Utils.universalFunctions.sendNotification(obj, "notification", function(err, res) {
                                    cb(err, data)
                                })
                            }],
                            sendReminderToRookie: [function(cb) {

                                if (item.sessionType == "one-one") {

                                    var startTime = Utils.moment(item.startDateTime * 1000).format("HH:mm")

                                    var message = "Please be available today at " + startTime + " to attend your scheduled one to one lesson."

                                    var obj = {
                                        senderId: item.requestedBy,
                                        receiverId: item.requestedBy,
                                        notificationEventType: NOTIFICATION_TYPE.reminder_notification,
                                        createdAt: Utils.moment().unix(),
                                        saveInDb: true,
                                        message: message,
                                        sessionId: [item._id]
                                    }

                                    Utils.universalFunctions.sendNotification(obj, "notification", function(err, res) {
                                        cb(err, data)
                                    })
                                } else {

                                    Utils.async.eachSeries(item.joinees, function(Initem, Inncb) {

                                        var startTime = Utils.moment(item.startDateTime * 1000).format("HH:mm")

                                        var message = "Please be available today at " + startTime + " to attend your scheduled group lesson."

                                        var obj = {
                                            senderId: Initem,
                                            receiverId: Initem,
                                            notificationEventType: NOTIFICATION_TYPE.reminder_notification,
                                            createdAt: Utils.moment().unix(),
                                            saveInDb: true,
                                            message: message,
                                            sessionId: [item._id]
                                        }
                                        console.log('obj---', obj)
                                        Utils.universalFunctions.sendNotification(obj, "notification", function(err, res) {
                                            Inncb()
                                        })

                                    }, function(err, result) {
                                        cb(err ? err : null, true)
                                    })

                                }
                            }]
                        }, function(err, result) {
                            Incb(err ? err : null, true)
                        })
                    },
                    function(err, result) {
                        cb(err ? err : null, result)
                    });
            }]
        }, function(err, result) {
            callback(err ? err : null, result);
        });


    },

    reminderNotificationToRookieToPayLesson: function(params, callback) {

        Utils.async.auto({
            // sendTestMail: [function(cb) {

            //     Utils.universalFunctions.sendMail("simran.bindal@ignivasolutions.com", "reminder ntfcn to rookie to pay at 11:59", "test")
            //     cb(null, null)

            // }],
            getAllSessions: [function(cb) {

                var criteria = {
                    isDeleted: false,
                    status: SESSION_STATUS.accepted,
                    endDateTime: { $lte: Utils.moment().unix() },
                    sessionType: LESSON_TYPE.one
                }

                sessionsModel.find(criteria, function(err, res) {
                    cb(err ? err : null, res)
                })
            }],
            sendNotification: ["getAllSessions", function(data, cb) {

                Utils.async.eachSeries(data.getAllSessions, function(item, Incb) {

                        var startTime = Utils.moment(item.startDateTime * 1000).format("YYYY-MM-DD HH:mm:ss")

                        var message = "Please make payment for your accepted lesson scheduled on " + startTime + " before it gets expired or guru takes some another booking."

                        var obj = {
                            senderId: item.requestedBy,
                            receiverId: item.requestedBy,
                            notificationEventType: NOTIFICATION_TYPE.reminder_notification,
                            createdAt: Utils.moment().unix(),
                            saveInDb: true,
                            message: message,
                            sessionId: [item._id]
                        }

                        Utils.universalFunctions.sendNotification(obj, "notification", function(err, res) {
                            Incb(null, true)
                        })
                    },
                    function(err, result) {
                        cb(err ? err : null, result)
                    });
            }]
        }, function(err, result) {
            callback(err ? err : null, result);
        });

    },

    // emitSocketToCheckIfWorkingCorrectlyAtFrontend: function(params, callback) {
    //     console.log('NOTIFICATION CRON ---')
    //     var obj = {
    //         senderId: "",
    //         receiverId: "5b2251bad5364301f7fe2e33",
    //         notificationEventType: NOTIFICATION_TYPE.reminder_notification,
    //         createdAt: Utils.moment().unix(),
    //         saveInDb: false,
    //         message: "============ Hi testing sockets on frontend============",
    //         sessionId: ""
    //     }

    //     Utils.universalFunctions.sendNotification(obj, "notification", function(err, res) {
    //         callback()
    //     })
    // },

    toCheckWhichLessonIsAboutToStart: function(params, callback) {

        var currentTime = Utils.moment().unix()
        var beforeTime = Utils.moment().subtract(10, "minutes").unix()

        Utils.async.auto({

            getAllSessions: [function(cb) {

                var criteria = {
                    isDeleted: false,
                    status: SESSION_STATUS.payment_done,
                    startDateTime: {
                        $gte: Utils.moment().startOf('day').unix(),
                        $lte: Utils.moment().endOf('day').unix()
                    },
                    isCallInitiatedGuru: false
                }

                sessionsModel.find(criteria)
                    .populate({ path: "requestedTo", select: "deviceDetails" })
                    .exec(function(err, res) { //console.log('5 mins cron res===',res)
                        cb(err ? err : null, res)
                    })
            }],
            sendNotification: ["getAllSessions", function(data, cb) {

                Utils.async.eachSeries(data.getAllSessions, function(item, Incb) {
                        var diff = item.startDateTime - Utils.moment().unix() // emit socket exactly before 5 mins of starting a lesson
                        diff = diff / 60 // In minutes
                        // console.log('diff------',diff)
                        if (diff <= 5) {

                            var obj = {
                                status: "Make Call"
                            }
                            item.sessionType == "group" ? obj.sessionId = item.groupLessonNumber : obj.sessionId = item._id

                            Utils.async.eachSeries(item.requestedTo.deviceDetails, function(Innitem, Inncb) {

                                    Utils.universalFunctions.notifiyForLesson(obj, "guruJoinCall", Innitem.socketId, function(err, res) {

                                        var criteria = {
                                            startDateTime: {
                                                $gte: Utils.moment().startOf('day').unix(),
                                                $lte: Utils.moment().endOf('day').unix()
                                            }
                                        }
                                        item.sessionType == "group" ? criteria.groupLessonNumber = item.groupLessonNumber : criteria._id = item._id

                                        sessionsModel.update(criteria, { isCallInitiatedGuru: true }, { new: true, multi: true }, function(err, res) {
                                            Inncb()
                                        })

                                    })
                                },
                                function(err, result) {
                                    Incb()
                                });

                        } else {
                            Incb()
                        }

                    },
                    function(err, result) {
                        cb(err ? err : null, result)
                    });
            }]
        }, function(err, result) {
            callback(err ? err : null, result);
        });

    },

}