/*
 * @description: This file defines the availability of the user
 * @date: 5 april 2018
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
var cancellationReasonsModel = require('../../sessions/models/cancellationReasons');
var contactUsModel = require('../../sessions/models/contactUs');


var APP_CONSTANTS = configs.constants;
var LESSON_TYPE = APP_CONSTANTS.LESSON_TYPE;
var SESSION_STATUS = APP_CONSTANTS.SESSION_STATUS;
var TRANSACTION_TYPE = APP_CONSTANTS.TRANSACTION_TYPES;
var REQUEST_STATUS = APP_CONSTANTS.REQUEST_STATUS;
var NOTIFICATION_TYPE = APP_CONSTANTS.NOTIFICATION_TYPE


module.exports = {

    addGroupLesson: function(params, callback) {
        var notAvailableDates = []

        Utils.async.auto({

                checkIfBankDetailsAdded: [function(cb) {

                    userModel.findOne({ _id: params.userId }, function(err, res) {
                        if (err) cb(err)
                        else {
                            if (!res.customAccount) {
                                cb({ statusCode: 401, status: "warning", message: "You cannot add group lesson until you have not added your bank account details with us." })
                            } else {
                                cb(null, null)
                            }
                        }
                    })

                }],

                checkAllComingDates: ['checkIfBankDetailsAdded', function(data, cb) {
                    Utils.universalFunctions.logger("First check all the dates that are in params that there must not be any bookings for same time")

                    Utils.async.eachSeries(params.dateAndTime, function(item, Incb) {

                            Utils.async.auto({
                                    checkingIfThereIsNoOtherBookingAtSameTime: [function(cb) {

                                        Utils.universalFunctions.logger("checking if there is no other booking of same time for this guru")

                                        // item.endDateTime = Utils.moment(item.endDateTime * 1000).add(15, 'minutes').unix()

                                        var criteria = {
                                            // $or: [{
                                            //         $and: [{ startDateTime: { $lte: item.startDateTime } }, { endDateLagTime: { $gte: item.startDateTime } }]
                                            //     },
                                            //     {
                                            //         $and: [{ startDateTime: { $lte: item.endDateTime } }, { endDateLagTime: { $gte: item.endDateTime } }]
                                            //     }
                                            // ],
                                            $or: [{
                                                    $and: [{ startDateTime: { $gte: item.startDateTime } }, { startDateTime: { $lte: item.endDateTime } }]
                                                },
                                                {
                                                    $and: [{ endDateLagTime: { $gte: item.startDateTime } }, { endDateLagTime: { $lte: item.endDateTime } }]
                                                }
                                            ],
                                            status: SESSION_STATUS.payment_done,
                                            requestedTo: params.userId,
                                            isDeleted: false
                                        }

                                        sessionsModel.find(criteria, function(err, res) {
                                            res.length == 0 ? null : notAvailableDates.push(item.startDateTime)
                                            cb(err ? err : null, res)
                                        })

                                    }]
                                },
                                function(err, result) {
                                    Incb(err ? err : null, true)
                                })


                        },
                        function(err, result) {
                            if (err) cb(err)
                            if (notAvailableDates.length > 0) {
                                callback({ statusCode: 401, status: "warning", message: "Sorry you already have the bookings on these dates " + notAvailableDates, notAvailableDates: notAvailableDates })
                            } else {
                                cb(null, params)
                            }
                        });
                }],
                getGroupLessonId: ['checkIfBankDetailsAdded', function(data, cb) {

                    sessionsModel.findOne({ sessionType: LESSON_TYPE.group, isDeleted: false }, { groupLessonNumber: 1 }, { sort: { groupLessonNumber: -1, limit: 1 } }, function(err, res) {
                        cb(err ? err : null,
                            res == null ? params.groupLessonNumber = 0 : (params.groupLessonNumber = res.groupLessonNumber))
                    })

                }],
                saveGroupLesson: ["checkAllComingDates", "getGroupLessonId", function(data, cb) {
                    Utils.universalFunctions.logger("Make entry in sessions for each date")
                    params.groupLessonNumber = params.groupLessonNumber + 1

                    Utils.async.eachSeries(params.dateAndTime, function(item, Incb) {

                            var lagTime = Utils.moment(item.endDateTime * 1000).add(15, 'minutes').unix()

                            Utils.async.auto({
                                saveLesson: [function(cb) {

                                    Utils.universalFunctions.logger("checking if there is no other booking of same time for this guru")

                                    var objToSave = {
                                        requestedBy: params.userId,
                                        requestedTo: params.userId,
                                        startDateTime: item.startDateTime,
                                        endDateTime: item.endDateTime,
                                        endDateLagTime: lagTime,
                                        sessionType: LESSON_TYPE.group,
                                        skillId: params.skillId,
                                        title: params.title,
                                        totalSeats: params.totalSeats,
                                        ratePerRookie: Math.round(params.ratePerRookie),
                                        lessonDetails: params.lessonDetails,
                                        groupLessonNumber: params.groupLessonNumber,
                                        status: SESSION_STATUS.accepted,
                                        statusHistory: [{
                                            status: SESSION_STATUS.accepted,
                                            updatedAt: Utils.moment().unix()
                                        }]
                                    }

                                    sessionsModel(objToSave).save(function(err, res) {
                                        // console.log('groupLessonNumber======', params.groupLessonNumber, 'saved===', res._id)
                                        err ? cb(err) : cb(null, true)
                                    })
                                }]
                            }, function(err, result) {
                                Incb(err ? err : null, true)
                            })
                        },
                        function(err, result) {
                            cb(err ? err : result)
                        });
                }]

            },
            function(err, result) {
                callback(err ? err : { statusCode: 200, status: "success", message: "Saved successfully" })
            });
    },
    requestOneToOneLesson: function(params, callback) {
        // api to save one to one lesson

        var bookedSlots = [],
            availableSlots = [],
            availableSlotsForBooking = [],
            hourlyRate, allLesson = [];
        Utils.async.auto({
            // matchGuruSkills: [function(cb) { // check if guru teaches all selected skills //skillId: { $in: params.skillId }
            //     skillGuruTeachesModel.find({ type: 1, userId: params.guruId }).populate({ path: 'userId', select: 'hourlyRate' }).exec(function(err, res) {
            //         res.length > 0 ? hourlyRate = res[0].userId.hourlyRate : null
            //         err ? cb(err) : cb(null, res);
            //     })
            // }],
            getGuruDetails: [function(cb) { // check if guru teaches all selected skills //skillId: { $in: params.skillId }
                userModel.findOne({ _id: params.guruId }).exec(function(err, res) {
                    res ? hourlyRate = res.hourlyRate : null

                    err ? cb(err) : cb(null, res);
                })
            }],

            checkIfGivenSlotsAreAvailable: ["getGuruDetails", function(data, cb) {

                Utils.async.forEach(params.dateAndTime, function(date, Incb) {

                    var criteria = {
                        $and: [{ startDateTime: { $lte: date.startDateTime } }, { endDateTime: { $gte: date.endDateTime } }],

                        userId: params.guruId

                    }
                    newModel.find(criteria, function(err, res) {

                        if (res.length > 0) {
                            availableSlots.push({ skillId: date.skillId, startDateTime: date.startDateTime, endDateTime: date.endDateTime })

                        } else {
                            bookedSlots.push({ startDateTime: date.startDateTime, endDateTime: date.endDateTime })
                        }
                        Incb(null, true)
                    })

                }, function(err, result) {
                    err ? cb(err) : cb(null, true)
                })

            }],

            checkIfAvailableSlotsAreNotBooked: ['checkIfGivenSlotsAreAvailable', function(data, cb) {


                if (availableSlots.length > 0) { // if any slots available for booking , then create the session
                    Utils.async.forEach(availableSlots, function(date, Incb) {

                        var lagTime = Utils.moment(date.endDateTime * 1000).add(15, 'minutes').unix()

                        sessionsModel.findOne({
                            requestedTo: { $in: [mongoose.Types.ObjectId(params.guruId), mongoose.Types.ObjectId(params.userId)] },
                            // requestedBy: { $in: [mongoose.Types.ObjectId(params.guruId), mongoose.Types.ObjectId(params.userId)] },
                            // $and: [{
                            //         $and: [{ startDateTime: { $lte: date.startDateTime } }, { endDateLagTime: { $gte: date.startDateTime } }]
                            //     },
                            //     {
                            //         $and: [{ startDateTime: { $lte: lagTime } }, { endDateLagTime: { $gte: lagTime } }]
                            //     }
                            // ],
                            $or: [{
                                    $and: [{ startDateTime: { $gte: date.startDateTime } }, { startDateTime: { $lte: lagTime } }]
                                },
                                {
                                    $and: [{ endDateLagTime: { $gte: date.startDateTime } }, { endDateLagTime: { $lte: lagTime } }]
                                }
                            ],
                            status: SESSION_STATUS.payment_done,
                            isDeleted: false
                        }, function(err, res) {
                            //console.log("check available slots booking.....", res)

                            err ? Incb(err) :
                                (res ?
                                    (bookedSlots.push(date), Incb(null, true)) :
                                    (availableSlotsForBooking.push(date), Incb(null, true)))
                        })
                    }, function(err, result) {
                        err ? cb(err) : cb(null, true)
                    })
                } else {
                    callback(null, { status: "success", statusCode: 200, message: "Request successful", data: { bookingDoneSlots: availableSlots, notBooked: bookedSlots } })
                }
            }],

            finalBooking: ['checkIfAvailableSlotsAreNotBooked', function(data, cb) {

                if (availableSlotsForBooking.length > 0) { // if any slots available for booking , then create the session
                    Utils.async.forEach(availableSlotsForBooking, function(date, Incb) {
                        var lagTime = Utils.moment(date.endDateTime * 1000).add(15, 'minutes').unix()

                        var duration = date.endDateTime - date.startDateTime //total duration of lesson in seconds
                        var h = Math.floor(duration / 3600);
                        var m = Math.floor(duration % 3600 / 60);

                        var hrs, mins
                        if (h < 10) { hrs = "0" + h } else hrs = h
                        if (m < 10) { mins = "0" + m } else mins = m
                        var totalTime = hrs + ":" + mins;

                        var y = Utils.moment.duration(totalTime).asHours()

                        var ratePerHour = hourlyRate * y


                        var objToSave = {
                            requestedTo: params.guruId, // requested to
                            requestedBy: params.userId, //reqested from
                            startDateTime: date.startDateTime, // session start date and time
                            endDateTime: date.endDateTime, //session end date time
                            endDateLagTime: lagTime,
                            skillId: date.skillId, // skills that will be taught under this session
                            comments: [{
                                created_by: params.userId,
                                comment: params.description
                            }],
                            sessionType: 'one-one',
                            ratePerHour: ratePerHour,
                            status: SESSION_STATUS.pending,
                            lessonType: 'one', //one-to-one lesson ; group lesson
                            statusHistory: [{
                                status: SESSION_STATUS.pending,
                                updatedAt: Utils.moment().unix()
                            }],
                            ratingFeedbacks: [{
                                userId: params.userId
                            }]
                        }
                        sessionsModel(objToSave).save(function(err, res) {
                            res ? allLesson.push(res._id) : null
                            err ? Incb(err) : Incb(null, true)
                        })
                    }, function(err, result) {
                        err ? cb(err) : cb(null, true)
                    })
                } else {
                    cb(null, { status: "success", statusCode: 200, message: "Request successful", data: { bookingDoneSlots: availableSlotsForBooking, notBooked: bookedSlots } })
                }
            }],
            sendNotification: ["finalBooking", function(data, cb) {
                var x = params.firstName
                params.firstName = x.charAt(0).toUpperCase() + x.slice(1)

                var obj = {
                    senderId: params.userId,
                    receiverId: params.guruId,
                    notificationEventType: NOTIFICATION_TYPE.lesson_request,
                    sessionId: allLesson,
                    createdAt: Utils.moment().unix(),
                    saveInDb: true,
                    message: "You got a new lesson request from " + params.firstName,
                }

                Utils.universalFunctions.sendNotification(obj, "notification", function(err, res) {
                    cb(err, data)
                })
            }]
        }, function(err, result) {
            err ? callback(err) : callback(null, { status: "success", statusCode: 200, message: "Request successful", data: { bookingDoneSlots: availableSlotsForBooking, notBooked: bookedSlots } })
        })
    },
    approveRejectOneToOneLesson: function(params, callback) { // api for guru to approve one to one lesson of a student
        Utils.universalFunctions.logger("inside approve reject")

        if (params.type == 1) { // when to accept the lesson
            Utils.async.auto({

                checkIfBankDetailsAdded: [function(cb) {

                    userModel.findOne({ _id: params.userId }, function(err, res) {
                        if (err) cb(err)
                        else {
                            if (!res.customAccount) {
                                cb({ statusCode: 401, status: "warning", message: "You cannot accept the lesson until you have not added your bank account details with us." })
                            } else {
                                cb(null, null)
                            }
                        }
                    })

                }],
                validateSession: ["checkIfBankDetailsAdded", function(data, cb) { // get the session details
                    sessionsModel.findOne({ _id: params.session_id, isDeleted: false }, function(err, res) {
                        err ? (err.name == "CastError" ? cb({ status: "warning", statusCode: 401, message: "Session not exist" }) : cb(err)) : (cb(null, res))
                    })
                }],
                checkIfGuruIsAvailableForThisSession: ['validateSession', function(data, cb) { // check guru availablity for the timeof session
                    availabilityServies.checkAvailability({
                        guruId: params.userId,
                        startTime: data.validateSession.startDateTime,
                        endTime: data.validateSession.endDateTime
                    }, function(err, res) { //endDateTime
                        res && res.is_available == false ? cb(null, res) : cb({ status: 'warning', statusCode: 401, message: 'You are not available to accept this session' })
                    })
                }],

                checkIfGuruHasNoPreviousBookingOnThisSessionTime: ['checkIfGuruIsAvailableForThisSession', function(data, cb) {

                    sessionsModel.findOne({
                        requestedTo: params.userId,
                        _id: { $ne: params.session_id },
                        // $and: [{
                        //         $and: [{ startDateTime: { $lte: data.validateSession.startDateTime } }, { endDateLagTime: { $gte: data.validateSession.endDateLagTime } }]
                        //     },
                        //     {
                        //         $and: [{ startDateTime: { $lte: data.validateSession.endDateTime } }, { endDateLagTime: { $gte: data.validateSession.endDateLagTime } }]
                        //     }
                        // ],
                        $or: [{
                                $and: [{ startDateTime: { $gte: data.validateSession.startDateTime } }, { startDateTime: { $lte: data.validateSession.endDateLagTime } }]
                            },
                            {
                                $and: [{ endDateLagTime: { $gte: data.validateSession.startDateTime } }, { endDateLagTime: { $lte: data.validateSession.endDateLagTime } }]
                            }
                        ],
                        status: SESSION_STATUS.payment_done,
                        isDeleted: false
                    }, function(err, res) {
                        err ? cb(err) : (!res ? cb(null, res) : cb({ status: 'warning', statusCode: 401, message: 'You are not available to accept this session' }))
                    })
                }],

                acceptSessionRequest: ['checkIfGuruHasNoPreviousBookingOnThisSessionTime', function(data, cb) {
                    sessionsModel.findOneAndUpdate({
                        _id: params.session_id
                    }, {
                        status: SESSION_STATUS.accepted,
                        $push: {
                            comments: {
                                "created_by": params.userId,
                                "comment": params.comment
                            },
                            statusHistory: {
                                status: SESSION_STATUS.accepted,
                                updatedAt: Utils.moment().unix()
                            }
                        }
                    }, function(err, res) {
                        err ? cb(err) : cb(null, res)
                        //err? cb(err) : (res ? cb(null, res): cb({status:'warning', statusCode:401, message:'You are not available to accept this session'}))
                    })
                }],
                sendNotification: ["acceptSessionRequest", function(data, cb) {
                    var x = params.firstName
                    params.firstName = x.charAt(0).toUpperCase() + x.slice(1)

                    var startDate = Utils.moment(data.validateSession.startDateTime * 1000).format("YYYY-MM-DD HH:mm:ss")


                    var obj = {
                        senderId: params.userId,
                        receiverId: data.validateSession.requestedBy,
                        notificationEventType: NOTIFICATION_TYPE.accept_lesson,
                        sessionId: params.session_id,
                        createdAt: Utils.moment().unix(),
                        saveInDb: true,
                        message: "Guru " + params.firstName + " has accepted your one to one lesson you requested for " + startDate + " with the comment " + params.comment,
                    }

                    Utils.universalFunctions.sendNotification(obj, "notification", function(err, res) {
                        cb(err, data)
                    })
                }]
            }, function(err, result) {
                err ? callback(err) : callback(null, { status: 'success', statusCode: 200, message: 'Request accepted successfully' })
            })
        } else if (params.type == 2) { // when to reject the lesson
            sessionsModel.findOneAndUpdate({
                _id: params.session_id
            }, {
                status: SESSION_STATUS.rejected,
                $push: {
                    comments: {
                        "created_by": params.userId,
                        "comment": params.comment
                    },
                    statusHistory: {
                        status: SESSION_STATUS.rejected,
                        updatedAt: Utils.moment().unix()
                    }
                }
            }, function(err, res) {
                //err ? callback(err) : callback(null, { status: 'success', statusCode: 200, message: 'Session rejected successfully' })
                if (err) callback(err)
                else {

                    var x = params.firstName
                    params.firstName = x.charAt(0).toUpperCase() + x.slice(1)

                    var startDate = Utils.moment(res.startDateTime * 1000).format("YYYY-MM-DD HH:mm:ss")

                    var obj = {
                        senderId: params.userId,
                        receiverId: res.requestedBy,
                        notificationEventType: NOTIFICATION_TYPE.reject_lesson,
                        sessionId: params.session_id,
                        createdAt: Utils.moment().unix(),
                        saveInDb: true,
                        message: "Guru " + params.firstName + " has rejected your one to one lesson request for " + startDate + " with the reason " + params.comment,
                    }

                    Utils.universalFunctions.sendNotification(obj, "notification", function(err, res) {
                        callback(null, { status: 'success', statusCode: 200, message: 'Session rejected successfully' })
                    })
                }

            })
        }

    },
    getAllAvailableDatesForGroupLesson: function(params, callback) {
        var timestamps = [],
            arr = []
        Utils.async.auto({

                getAllDatesBet2dates: [function(cb) {

                    Utils.universalFunctions.logger("getting hours minutes from end time ie comins in params")
                    var endDate = new Date(moment(params.endTime * 1000))
                    var hrs = endDate.getHours()
                    var mins = endDate.getMinutes()



                    Utils.universalFunctions.logger("getting end date of the month")
                    var endDate = new Date(moment(params.startTime * 1000).endOf('month'))
                    endDate = moment(endDate)

                    Utils.universalFunctions.logger("setting hrs n mins ie in params in end date")
                    var x = endDate.set({ hour: hrs, minute: mins, second: 0, millisecond: 0 })
                    var endTime = moment(x).unix()
                    //endTime = Utils.moment(endTime * 1000).add(15, 'minutes').unix()

                    var endForLoop = endTime

                    var startTime = params.startTime



                    while (startTime <= endForLoop) {

                        var endDate = new Date(moment(startTime * 1000))
                        endDate = moment(endDate)
                        var x = endDate.set({ hour: hrs, minute: mins, second: 0, millisecond: 0 })
                        var endTime = moment(x).unix()
                        //endTime = Utils.moment(endTime * 1000).add(15, 'minutes').unix()

                        timestamps.push({ start_date_time: startTime, end_date_time: endTime })

                        startTime = moment(startTime * 1000).add(1, 'days').unix()

                    }
                    cb(null, null)
                }],
                checkingBookingsOfGuru: ["getAllDatesBet2dates", function(data, cb) {
                    //imestamps=[{start_date_time : 1532741400, end_date_time : 1532770200}]
                    Utils.async.eachSeries(timestamps, function(item, Incb) {

                            Utils.async.auto({
                                    checkBookingForSameTime: [function(cb) {

                                        var criteria = {
                                            // $or: [{
                                            //         $and: [{ startDateTime: { $gte: item.start_date_time } }, { startDateTime: { $gte: item.end_date_time } }]
                                            //     },
                                            //     {
                                            //         $and: [{ endDateLagTime: { $lte: item.start_date_time } }, { endDateLagTime: { $lte: item.end_date_time } }]
                                            //     }
                                            // ],
                                            $or: [{
                                                    $and: [{ startDateTime: { $gte: item.start_date_time } }, { startDateTime: { $lte: item.end_date_time } }]
                                                },
                                                {
                                                    $and: [{ endDateLagTime: { $gte: item.start_date_time } }, { endDateLagTime: { $lte: item.end_date_time } }]
                                                }
                                            ],
                                            status: SESSION_STATUS.payment_done,
                                            requestedTo: params.userId,
                                            isDeleted: false
                                        }



                                        sessionsModel.find(criteria, function(err, res) {
                                            console.log('check availability res----------', res)
                                            res.length == 0 ? item["available"] = true : item["available"] = false
                                            //res.length == 0 ? item["available"] = false : item["available"] = true
                                            item.start_date_time = moment(item.start_date_time * 1000).startOf('day').unix()
                                            item.end_date_time = moment(item.start_date_time * 1000).startOf('day').unix()
                                            arr.push(item)
                                            cb(err ? err : null, res)
                                        })

                                    }]
                                },
                                function(err, result) {
                                    Incb(err ? err : null, true)
                                })
                        },
                        function(err, result) {
                            cb(err ? err : null, result)
                        });
                }]
            },
            function(err, result) {
                callback(err ? err : null, { statusCode: 200, status: "success", message: "Fetched successfully", data: arr });
            });
    },

    joinGroupLesson: function(params, callback) {

        var allDates = [],
            notAvailableDates = [],
            paymentStatus

        Utils.async.auto({
            checkIfGroupLessonExists: [function(cb) {
                Utils.universalFunctions.logger("Check if group exists and is not full of seats")

                sessionsModel.findOne({ groupLessonNumber: params.groupLessonNumber, sessionType: LESSON_TYPE.group }, function(err, res) {
                    var arr = []
                    for (var i = 0; i < res.joinees.length; i++) {
                        arr.push(res.joinees[i].toString())
                    }
                    var a = Utils._.contains(arr, params.userId.toString())

                    res ? params.guruId = res.requestedBy : null

                    cb(err ? err : res == null ? { statusCode: 401, status: "warning", message: "Invalid group lesson number" } :
                        res.totalSeats == res.joinees.length ? { statusCode: 401, status: "warning", message: "Sorry ! All seats are already booked for the lesson" } :
                        a == true ? { statusCode: 401, status: "warning", message: "You have already joined the lesson." } : null, res)
                })
            }],
            getAllDatesOfLesson: [function(cb) {
                Utils.universalFunctions.logger("Get all the dates of the group lesson")

                sessionsModel.find({ groupLessonNumber: params.groupLessonNumber, sessionType: LESSON_TYPE.group })
                    .populate({ path: "requestedBy", select: "firstName lastName" })
                    .exec(function(err, res) {
                        if (err) cb(err)
                        else {
                            for (var i = 0; i < res.length; i++) {
                                allDates.push({ guruId: res[i].requestedBy._id, sessionId: res[i]._id, startDateTime: res[i].startDateTime, endDateLagTime: res[i].endDateLagTime })
                            }

                            cb(null, res)
                        }
                    });

            }],
            checkIfRookieHasNoOtherBookingAtSameTime: ["getAllDatesOfLesson", "checkIfGroupLessonExists", function(data, cb) {

                Utils.async.eachSeries(allDates, function(item, Incb) {
                        console.log('item---', item)

                        Utils.async.auto({
                                checkingIfThereIsNoOtherBookingAtSameTime: [function(cb) {

                                    Utils.universalFunctions.logger("checking if there is no other one-one booking of same time for this rookie")

                                    var criteria = {
                                        // $or: [{
                                        //         $and: [{ startDateTime: { $lte: item.startDateTime } }, { endDateLagTime: { $gte: item.startDateTime } }]
                                        //     },
                                        //     {
                                        //         $and: [{ startDateTime: { $lte: item.endDateLagTime } }, { endDateLagTime: { $gte: item.endDateLagTime } }]
                                        //     }
                                        // ],
                                        status: SESSION_STATUS.payment_done,
                                        requestedBy: params.userId,
                                        $or: [{
                                                $and: [{ startDateTime: { $gte: item.startDateTime } }, { startDateTime: { $lte: item.endDateLagTime } }]
                                            },
                                            {
                                                $and: [{ endDateLagTime: { $gte: item.startDateTime } }, { endDateLagTime: { $lte: item.endDateLagTime } }]
                                            }
                                        ],
                                        sessionType: LESSON_TYPE.one
                                    }


                                    sessionsModel.find(criteria, function(err, res) {

                                        res.length == 0 ? null : notAvailableDates.push(item.startDateTime)
                                        cb(err ? err : null, res)
                                    })
                                }],
                                checkGroupLesson: [function(cb) {

                                    Utils.universalFunctions.logger("checking if there is no other group lesson booking of same time for this rookie")

                                    var criteria = {
                                        // $or: [{
                                        //         $and: [{ startDateTime: { $lte: item.startDateTime } }, { endDateLagTime: { $gte: item.startDateTime } }]
                                        //     },
                                        //     {
                                        //         $and: [{ startDateTime: { $lte: item.endDateLagTime } }, { endDateLagTime: { $gte: item.endDateLagTime } }]
                                        //     }
                                        // ],
                                        status: SESSION_STATUS.payment_done,
                                        joinees: { $in: [params.userId] },
                                        sessionType: LESSON_TYPE.group,
                                        $or: [{
                                                $and: [{ startDateTime: { $gte: item.startDateTime } }, { startDateTime: { $lte: item.endDateLagTime } }]
                                            },
                                            {
                                                $and: [{ endDateLagTime: { $gte: item.startDateTime } }, { endDateLagTime: { $lte: item.endDateLagTime } }]
                                            }
                                        ],
                                    }

                                    sessionsModel.find(criteria, function(err, res) {


                                        res.length == 0 ? null : notAvailableDates.push(item.startDateTime)
                                        cb(err ? err : null, res)
                                    })
                                }]
                            },
                            function(err, result) {
                                Incb(err ? err : null, data)
                            })
                    },
                    function(err, result) {
                        if (err) cb(err)
                        if (notAvailableDates.length > 0) {
                            return callback({ statusCode: 401, status: "warning", message: "Sorry you already have the bookings on these dates ", notAvailableDates: notAvailableDates })
                        } else {
                            cb(null, data)
                        }
                    });
            }],
            checkIfGuruHasNoOtherBookingAtSameTime: ['checkIfRookieHasNoOtherBookingAtSameTime', "getAllDatesOfLesson", "checkIfGroupLessonExists", function(data, cb) {

                Utils.async.eachSeries(allDates, function(item, Incb) {

                        Utils.async.auto({
                                checkingIfThereIsNoOtherBookingAtSameTime: [function(cb) {

                                    Utils.universalFunctions.logger("checking if there is no other one-one booking of same time for this rookie")

                                    var criteria = {
                                        // $or: [{
                                        //         $and: [{ startDateTime: { $lte: item.startDateTime } }, { endDateLagTime: { $gte: item.startDateTime } }]
                                        //     },
                                        //     {
                                        //         $and: [{ startDateTime: { $lte: item.endDateLagTime } }, { endDateLagTime: { $gte: item.endDateLagTime } }]
                                        //     }
                                        // ],
                                        status: SESSION_STATUS.payment_done,
                                        isDeleted: false,
                                        requestedTo: params.guruId,
                                        groupLessonNumber: { $ne: params.groupLessonNumber },
                                        $or: [{
                                                $and: [{ startDateTime: { $gte: item.startDateTime } }, { startDateTime: { $lte: item.endDateLagTime } }]
                                            },
                                            {
                                                $and: [{ endDateLagTime: { $gte: item.startDateTime } }, { endDateLagTime: { $lte: item.endDateLagTime } }]
                                            }
                                        ],
                                    }

                                    sessionsModel.find(criteria, function(err, res) {
                                        res.length == 0 ? null : notAvailableDates.push(item.startDateTime)
                                        cb(err ? err : null, res)
                                    })
                                }]
                            },
                            function(err, result) {
                                Incb(err ? err : null, data)
                            })
                    },
                    function(err, result) {
                        if (err) cb(err)
                        else if (notAvailableDates.length > 0) {
                            callback({ statusCode: 401, status: "warning", message: "Sorry guru has already been booked for these dates ", notAvailableDates: notAvailableDates })
                        } else {
                            cb(null, data)
                        }
                    });
            }],
            checkCustomerId: ["checkIfRookieHasNoOtherBookingAtSameTime", "checkIfGuruHasNoOtherBookingAtSameTime", function(data, cb) {

                if (!params.userDetails.stripeCustomerId) {

                    stripeService.createCustomer(params.userDetails, function(err, res) {
                        if (err) cb(err)
                        else {
                            params.userDetails.stripeCustomerId = res.stripeCustomerId
                            cb(null, data)
                        }
                    })
                } else {
                    cb(null, data)
                }
            }],
            createSourceToLinkUserCard: ['checkCustomerId', function(response, cb) { // create source and link card to the user

                if (params.cardToken && params.cardToken != "") { // create source only when new card

                    stripeService.createSource(params,
                        function(err, card) {
                            if (err) {
                                callback(err)
                            } else {
                                params.cardId = card.id
                                cb(null, response)
                            }
                        }
                    );
                } else {
                    cb(null, response)
                }

            }],
            createCharge: ['createSourceToLinkUserCard', "checkCustomerId", "checkIfRookieHasNoOtherBookingAtSameTime", "checkIfGuruHasNoOtherBookingAtSameTime", function(data, cb) {


                var stripeData = {
                    total: Math.round(data.checkIfGroupLessonExists.ratePerRookie),
                    cardID: params.cardId,
                    stripeCustomerId: params.userDetails.stripeCustomerId,
                    sessionId: params.groupLessonNumber
                };

                stripeService.createCharge(stripeData, function(err, charge) {
                    // console.log('payment--', err, charge)
                    if (err) {
                        paymentStatus = "failed";
                        var errorMetaData = err;
                        if (err.raw) {
                            var stripeErrType = err.raw.type;
                            var stripeErrMessage = err.raw.message;
                        }
                        return callback({ statusCode: 401, status: 'warning', errorType: stripeErrType, message: stripeErrMessage })
                    } else {
                        paymentStatus = "success";
                        cb(null, charge);
                    }
                });
            }],
            setDefaultCard: ["createCharge", function(data, cb) {

                stripeService.setDefaultCard(params, function(err, res) {
                    if (err) {

                        paymentStatus = "failed";
                        var errorMetaData = err;
                        if (err.raw) {
                            var stripeErrType = err.raw.type;
                            var stripeErrMessage = err.raw.message;
                        }
                        callback({ statusCode: 401, status: 'warning', errorType: stripeErrType, message: stripeErrMessage })
                    } else {
                        cb(null, res);
                    }
                })

            }],
            makeTransaction: ["createCharge", function(data, cb) {

                // Calculating amount to transfer to the user
                // REst amount will be admin's commission

                var amountToTransferToGuru = APP_CONSTANTS.stripeUserShare / 100 * data.checkIfGroupLessonExists.ratePerRookie

                var objToSave = {
                    groupLessonNumber: params.groupLessonNumber,
                    stripeCustomerID: params.userDetails.stripeCustomerId,
                    cardID: params.cardID,
                    metaData: data.createCharge,
                    transactionType: TRANSACTION_TYPE.cardToStripe,
                    finalAmountToTransfer: Math.round(amountToTransferToGuru),
                    requestStatus: REQUEST_STATUS.ongoing,
                    paymentDoneBy: params.userId,
                    paymentDoneTo: data.getAllDatesOfLesson[0].requestedBy._id
                }

                objToSave.chargeID = data.createCharge.stripeCharge.id ? data.createCharge.stripeCharge.id : null;
                objToSave.transactionID = data.createCharge.stripeCharge.balance_transaction ? data.createCharge.stripeCharge.balance_transaction : null;
                objToSave.transactionStatus = data.createCharge.stripeCharge.status ? data.createCharge.stripeCharge.status : null;
                objToSave.currency = data.createCharge.stripeCharge.currency ? data.createCharge.stripeCharge.currency : null;
                objToSave.transactionDate = data.createCharge.stripeCharge.created ? data.createCharge.stripeCharge.created : null;


                transactionsModel(objToSave).save(function(err, res) {
                    if (err) {
                        Utils.universalFunctions.logger(err);
                        cb(err);
                    } else {
                        cb(null, res);
                    }
                });
            }],
            makeEntryInBookings: ["makeTransaction", function(data, cb) {

                Utils.async.eachSeries(allDates, function(item, Incb) {

                        var obj = {
                            sessionId: item.sessionId,
                            paymentStatus: SESSION_STATUS.payment_done,
                            paymentDoneBy: params.userId,
                            paymentDoneTo: item.guruId,
                            groupLessonNumber: params.groupLessonNumber,
                            statusHistory: [{
                                status: SESSION_STATUS.payment_done,
                                updatedAt: Utils.moment().unix()
                            }],
                            transactionDetails: [{
                                transactionId: data.makeTransaction._id,
                                message: "Transfer from card to stripe account"
                            }]
                        }

                        sessionBookingsModel(obj).save(function(err, res) {
                            Incb(err ? err : null, res)
                        })
                    },
                    function(err, result) {
                        cb(err ? err : null, result)
                    });
            }],
            updateSessions: ["createCharge", function(data, cb) {

                sessionsModel.update({ groupLessonNumber: params.groupLessonNumber }, {
                    // $push: { joinees: params.userId },
                    status: SESSION_STATUS.payment_done,
                    $push: {
                        joinees: params.userId,
                        statusHistory: {
                            status: SESSION_STATUS.payment_done,
                            updatedAt: Utils.moment().unix()
                        },
                        ratingFeedbacks: {
                            userId: params.userId
                        }
                    }
                }, { new: true, multi: true }, function(err, res) {
                    cb(err ? err : null, res)
                })
            }],
            sendNotification: ["updateSessions", function(data, cb) {
                var x = params.userDetails.firstName
                params.userDetails.firstName = x.charAt(0).toUpperCase() + x.slice(1)

                var startDate = Utils.moment(data.checkIfGroupLessonExists.startDateTime * 1000).format("YYYY-MM-DD HH:mm:ss")

                var obj = {
                    senderId: params.userDetails,
                    receiverId: data.checkIfGroupLessonExists.requestedTo,
                    notificationEventType: NOTIFICATION_TYPE.rookie_pay_group,
                    groupLessonNumber: params.groupLessonNumber,
                    createdAt: Utils.moment().unix(),
                    saveInDb: true,
                    message: "Rookie " + params.userDetails.firstName + " has paid for the group lesson starting from " + startDate
                }


                Utils.universalFunctions.sendNotification(obj, "notification", function(err, res) {
                    cb(err, data)
                })
            }],
            sendMail: ['updateSessions', 'getAllDatesOfLesson', function(data, cb) {

                var subject = "Group lesson successfully joined";

                var x = data.getAllDatesOfLesson[0].requestedBy.firstName
                var guruName = x.charAt(0).toUpperCase() + x.slice(1)

                var startDate = Utils.moment(data.checkIfGroupLessonExists.startDateTime * 1000).format("YYYY-MM-DD HH:mm:ss")

                var templatepath = Utils.path.join(__dirname, '../../../assets/emailTemplates/');
                var fileReadStream = Utils.fs.createReadStream(templatepath + 'notifications.html');

                var emailTemplate = '';

                fileReadStream.on('data', function(buffer) {
                    emailTemplate += buffer.toString();
                });

                fileReadStream.on('end', function(res) {

                    var message = "You have successfully joined the group lesson starting on " + startDate + " with the guru " + guruName + " ."

                    var otherMessage = "We have successfully received the lesson fee of £" + data.checkIfGroupLessonExists.ratePerRookie + " from you." + "<br>" + " Please be available to attend the lesson on time."

                    var sendStr = emailTemplate.replace('{{firstName}}', params.userDetails.firstName).replace('{{message}}', message).replace('{{otherMessage}}', otherMessage)

                    Utils.universalFunctions.sendMail(params.userDetails.email, subject, sendStr)

                    cb(null, null)

                });

            }]
        }, function(err, result) {
            callback(err ? err : null, { statusCode: 200, status: "success", message: "Booking successful" });
        });
    },

    cancelOneOneLessonGuru: function(params, callback) {
        Utils.async.auto({

            checkSessionId: [function(cb) {

                sessionsModel.findOne({ _id: params.sessionId, sessionType: LESSON_TYPE.one, isDeleted: false })
                    .populate({ path: "requestedBy" })
                    .exec(function(err, res) {
                        cb(err ? err : res == null ? { statusCode: 401, status: "warning", message: "Invalid session id" } : null, res)
                    })
            }],
            checkIfPaymentDone: [function(cb) {
                Utils.universalFunctions.logger("Check if payment was done or not")

                sessionBookingsModel.findOne({ sessionId: params.sessionId }, function(err, res) {
                    res == null ? params.payment = false : params.payment = true
                    cb(err ? err : null, res)
                })
            }],
            getTransactionId: ["checkIfPaymentDone", "checkSessionId", function(data, cb) {
                if (params.payment == true) {
                    transactionsModel.findOne({ sessionId: params.sessionId }, function(err, res) {
                        if (err) cb(err)
                        else if (res == null) {
                            cb({ statusCode: 401, status: "warning", message: "No payments found to be refund" })
                        } else {
                            cb(null, res)
                        }
                    })
                } else {
                    cb(null, data)
                }
            }],
            initiateRefund: ["getTransactionId", function(data, cb) {

                if (params.payment == true) {
                    Utils.universalFunctions.logger("If payment already done then initiate refund")

                    var obj = {
                        charge: data.getTransactionId.chargeID,
                        amount: data.getTransactionId.metaData.stripeCharge.amount
                    }
                    stripeService.refundCharge(obj, function(err, res) {
                        if (err) {
                            var paymentStatus = "failed";
                            var errorMetaData = err;
                            if (err.raw) {
                                var stripeErrType = err.raw.type;
                                var stripeErrMessage = err.raw.message;
                            }
                            return callback({ statusCode: 401, status: 'warning', errorType: stripeErrType, message: stripeErrMessage })
                        } else {
                            var paymentStatus = "success";
                            cb(null, res);
                        }
                    })
                } else {
                    cb(null, params)
                }
            }],
            makeTransaction: ["initiateRefund", function(data, cb) {

                if (params.payment == true) {
                    var objToSave = {
                        sessionId: params.sessionId,
                        stripeCustomerID: params.userDetails.stripeCustomerId,
                        metaData: data.initiateRefund,
                        transactionType: TRANSACTION_TYPE.refund,
                        paymentDoneBy: data.checkIfPaymentDone.paymentDoneBy,
                        paymentDoneTo: data.checkIfPaymentDone.paymentDoneTo,
                    }

                    objToSave.chargeID = data.initiateRefund.refundCharge.id ? data.initiateRefund.refundCharge.id : null;
                    objToSave.transactionID = data.initiateRefund.refundCharge.balance_transaction ? data.initiateRefund.refundCharge.balance_transaction : null;
                    objToSave.transactionStatus = data.initiateRefund.refundCharge.status ? data.initiateRefund.refundCharge.status : null;
                    objToSave.currency = data.initiateRefund.refundCharge.currency ? data.initiateRefund.refundCharge.currency : null;
                    objToSave.transactionDate = data.initiateRefund.refundCharge.created ? data.initiateRefund.refundCharge.created : null;
                    objToSave.requestStatus = REQUEST_STATUS.completed

                    transactionsModel(objToSave).save(function(err, res) {
                        //console.log('transaction saved========', res)
                        if (err) {
                            Utils.universalFunctions.logger(err);
                            cb(err);
                        } else {
                            cb(null, res);
                        }
                    });
                } else {
                    cb(null, params)
                }
            }],
            updateSessionStatus: ["initiateRefund", function(data, cb) {
                var objToSave = {
                    is_cancelled_by_guru: true
                }
                params.payment == true ? objToSave.status = SESSION_STATUS.refunded : objToSave.status = SESSION_STATUS.cancelled_by_guru

                if (params.payment == true) {

                    var arr = [{
                        "status": SESSION_STATUS.cancelled_by_guru,
                        "updatedAt": Utils.moment().unix(),
                    }, {
                        "status": SESSION_STATUS.refunded,
                        "updatedAt": Utils.moment().unix()
                    }]

                    objToSave.$addToSet = { statusHistory: { $each: arr } }

                } else {
                    objToSave.$push = {
                        statusHistory: {
                            "status": SESSION_STATUS.cancelled_by_guru,
                            "updatedAt": Utils.moment().unix()
                        }

                    }
                }
                params.reason ? objToSave.cancelReason = params.reason : null
                params.cancelDescription ? objToSave.cancelDescription = params.description : null,


                    sessionsModel.findOneAndUpdate({ _id: params.sessionId }, objToSave, { new: true }, function(err, res) {
                        cb(err ? err : null, res)
                    })
            }],
            updateBookingStatus: ["makeTransaction", function(data, cb) {
                var objToSave = {}
                params.payment == true ? objToSave.paymentStatus = SESSION_STATUS.refunded : objToSave.paymentStatus = SESSION_STATUS.cancelled_by_guru

                if (params.payment == true) {

                    var arr = [{
                        "status": SESSION_STATUS.cancelled_by_guru,
                        "updatedAt": Utils.moment().unix(),
                    }, {
                        "status": SESSION_STATUS.refunded,
                        "updatedAt": Utils.moment().unix()
                    }]
                    var tmp = [{
                        transactionId: data.makeTransaction._id,
                        message: "Refund"
                    }]

                    objToSave.$addToSet = { statusHistory: { $each: arr }, transactionDetails: { $each: tmp } }

                } else {
                    objToSave.$push = {
                        statusHistory: {
                            "status": SESSION_STATUS.cancelled_by_guru,
                            "updatedAt": Utils.moment().unix()
                        }

                    }
                }

                params.reason ? objToSave.cancelReason = params.reason : null
                params.cancelDescription ? objToSave.cancelDescription = params.description : null

                sessionBookingsModel.findOneAndUpdate({ sessionId: params.sessionId }, objToSave, { new: true }, function(err, res) {
                    cb(err ? err : null, res)
                })
            }],
            sendNotification: ["updateBookingStatus", function(data, cb) {
                var x = params.userDetails.firstName
                params.userDetails.firstName = x.charAt(0).toUpperCase() + x.slice(1)

                var startDate = Utils.moment(data.checkSessionId.startDateTime * 1000).format("YYYY-MM-DD HH:mm:ss")
                var message
                if (params.payment == true) {
                    message = "Guru " + params.userDetails.firstName + " has cancelled the one to one lesson starting from " + startDate + " with the reason " + params.reason + " . Your refund has also been initiated for the lesson."
                } else {
                    message = "Guru " + params.userDetails.firstName + " has cancelled the one to one lesson starting from " + startDate + " with the reason " + params.reason

                }

                var obj = {
                    senderId: params.userDetails,
                    receiverId: data.checkSessionId.requestedBy,
                    notificationEventType: NOTIFICATION_TYPE.cancel_one_one_lesson,
                    sessionId: [params.sessionId],
                    createdAt: Utils.moment().unix(),
                    saveInDb: true,
                    message: message
                }

                Utils.universalFunctions.sendNotification(obj, "notification", function(err, res) {
                    cb(err, data)
                })
            }],
            sendMail: ['updateBookingStatus', function(data, cb) {

                if (params.payment == true) {
                    var subject = "Refund initiated for One to one lesson";

                    var startDate = Utils.moment(data.checkSessionId.startDateTime * 1000).format("YYYY-MM-DD HH:mm:ss")

                    var templatepath = Utils.path.join(__dirname, '../../../assets/emailTemplates/');
                    var fileReadStream = Utils.fs.createReadStream(templatepath + 'notifications.html');

                    var emailTemplate = '';

                    fileReadStream.on('data', function(buffer) {
                        emailTemplate += buffer.toString();
                    });

                    fileReadStream.on('end', function(res) {


                        var message = "Guru " + params.userDetails.firstName + " has cancelled the one to one lesson starting on " + startDate + " ."

                        var otherMessage = "We have successfully refunded you with the amount £" + data.checkSessionId.ratePerHour + " ."

                        var sendStr = emailTemplate.replace('{{firstName}}', data.checkSessionId.requestedBy.firstName).replace('{{message}}', message).replace('{{otherMessage}}', otherMessage)

                        Utils.universalFunctions.sendMail(data.checkSessionId.requestedBy.email, subject, sendStr)

                        cb(null, null)

                    });
                } else {
                    cb(null, null)
                }

            }]
        }, function(err, result) {
            callback(err ? err : { statusCode: 200, status: "success", message: "Cancelled successfully" });
        });
    },

    cancelOneOneLessonRookie: function(params, callback) {
        Utils.async.auto({

            checkSessionId: [function(cb) {

                sessionsModel.findOne({ _id: params.sessionId, sessionType: LESSON_TYPE.one, isDeleted: false }, function(err, res) {
                    cb(err ? err : res == null ? { statusCode: 401, status: "warning", message: "Invalid session id" } : null, res)
                })
            }],
            checkIfPaymentDone: [function(cb) {
                Utils.universalFunctions.logger("Check if payment was done or not")

                sessionBookingsModel.findOne({ sessionId: params.sessionId, isDeleted: false }, function(err, res) {
                    res == null ? params.payment = false : params.payment = true
                    cb(err ? err : null, res)
                })
            }],
            checkIfDiffIsLess: ["checkSessionId", "checkIfPaymentDone", function(data, cb) {
                Utils.universalFunctions.logger("If cancelling time difference less than 24 hrs then no refund to rookie else refund")

                if (params.payment == true) {
                    var startTime = data.checkSessionId.startDateTime //start time of lesson
                    var currentTime = params.cancellationTime //current time of user's machine
                    var hrs = Utils.moment.duration("24:00").asSeconds(); //converting 24 hrs in seconds

                    var diff = startTime - currentTime
                    // If difference greater than 24 hrs then only refund rookie
                    diff >= hrs ? params.payment = true : params.payment = false
                }
                cb(null, params)
            }],
            getTransactionId: ["checkIfPaymentDone", "checkSessionId", function(data, cb) {
                if (params.payment == true) {
                    transactionsModel.findOne({ sessionId: params.sessionId }, function(err, res) {
                        if (err) cb(err)
                        else if (res == null) {
                            cb({ statusCode: 401, status: "warning", message: "No payments found to be refund" })
                        } else {
                            cb(null, res)
                        }
                    })
                } else {
                    cb(null, data)
                }
            }],
            initiateRefund: ["getTransactionId", function(data, cb) {

                if (params.payment == true) {
                    Utils.universalFunctions.logger("If payment already done then initiate refund")

                    var obj = {
                        charge: data.getTransactionId.chargeID,
                        amount: data.getTransactionId.metaData.stripeCharge.amount
                    }
                    stripeService.refundCharge(obj, function(err, res) {
                        if (err) {
                            var paymentStatus = "failed";
                            var errorMetaData = err;
                            if (err.raw) {
                                var stripeErrType = err.raw.type;
                                var stripeErrMessage = err.raw.message;
                            }
                            return callback({ statusCode: 401, status: 'warning', errorType: stripeErrType, message: stripeErrMessage })
                        } else {
                            var paymentStatus = "success";
                            cb(null, res);
                        }
                    })
                } else {
                    cb(null, params)
                }
            }],
            makeTransaction: ["initiateRefund", function(data, cb) {

                if (params.payment == true) {

                    var objToSave = {
                        sessionId: params.sessionId,
                        stripeCustomerID: params.userDetails.stripeCustomerId,
                        metaData: data.initiateRefund,
                        transactionType: TRANSACTION_TYPE.refund,
                        requestStatus: REQUEST_STATUS.completed,
                        paymentDoneBy: data.checkIfPaymentDone.paymentDoneBy,
                        paymentDoneTo: data.checkIfPaymentDone.paymentDoneTo
                    }

                    objToSave.chargeID = data.initiateRefund.refundCharge.id ? data.initiateRefund.refundCharge.id : null;
                    objToSave.transactionID = data.initiateRefund.refundCharge.balance_transaction ? data.initiateRefund.refundCharge.balance_transaction : null;
                    objToSave.transactionStatus = data.initiateRefund.refundCharge.status ? data.initiateRefund.refundCharge.status : null;
                    objToSave.currency = data.initiateRefund.refundCharge.currency ? data.initiateRefund.refundCharge.currency : null;
                    objToSave.transactionDate = data.initiateRefund.refundCharge.created ? data.initiateRefund.refundCharge.created : null;

                    transactionsModel(objToSave).save(function(err, res) {
                        if (err) {
                            Utils.universalFunctions.logger(err);
                            cb(err);
                        } else {
                            cb(null, res);
                        }
                    });
                } else {
                    cb(null, params)
                }
            }],

            updateSessionStatus: ["initiateRefund", "checkIfDiffIsLess", function(data, cb) {
                var objToSave = {}
                params.payment == true ? objToSave.status = SESSION_STATUS.refunded : objToSave.status = SESSION_STATUS.cancelled_by_rookie

                if (params.payment == true) {
                    var arr = [{
                        "status": SESSION_STATUS.cancelled_by_rookie,
                        "updatedAt": Utils.moment().unix(),
                    }, {
                        "status": SESSION_STATUS.refunded,
                        "updatedAt": Utils.moment().unix()
                    }]

                    objToSave.$addToSet = { statusHistory: { $each: arr } }

                } else {
                    objToSave.$push = {
                        statusHistory: {
                            "status": SESSION_STATUS.cancelled_by_rookie,
                            "updatedAt": Utils.moment().unix()
                        }

                    }
                }
                params.reason ? objToSave.cancelReason = params.reason : null
                params.cancelDescription ? objToSave.cancelDescription = params.description : null

                sessionsModel.findOneAndUpdate({ _id: params.sessionId }, objToSave, { new: true }, function(err, res) {
                    cb(err ? err : null, res)
                })
            }],
            updateBookingStatus: ["initiateRefund", "checkIfDiffIsLess", "makeTransaction", function(data, cb) {

                var objToSave = {}
                params.payment == true ? objToSave.paymentStatus = SESSION_STATUS.refunded : objToSave.paymentStatus = SESSION_STATUS.cancelled_by_rookie

                if (params.payment == true) {
                    var arr = [{
                        "status": SESSION_STATUS.cancelled_by_rookie,
                        "updatedAt": Utils.moment().unix(),
                    }, {
                        "status": SESSION_STATUS.refunded,
                        "updatedAt": Utils.moment().unix()
                    }]
                    var tmp = [{
                        transactionId: data.makeTransaction._id,
                        message: "Refund"
                    }]


                    objToSave.$addToSet = { statusHistory: { $each: arr }, transactionDetails: { $each: tmp } }

                } else {
                    objToSave.$push = {
                        statusHistory: {
                            "status": SESSION_STATUS.cancelled_by_rookie,
                            "updatedAt": Utils.moment().unix()
                        }
                    }
                }

                params.reason ? objToSave.cancelReason = params.reason : null
                params.cancelDescription ? objToSave.cancelDescription = params.description : null

                sessionBookingsModel.findOneAndUpdate({ sessionId: params.sessionId }, objToSave, { new: true }, function(err, res) {
                    cb(err ? err : null, res)
                })
            }],
            sendNotification: ["updateBookingStatus", function(data, cb) {
                var x = params.userDetails.firstName
                params.userDetails.firstName = x.charAt(0).toUpperCase() + x.slice(1)

                var startDate = Utils.moment(data.checkSessionId.startDateTime * 1000).format("YYYY-MM-DD HH:mm:ss")

                var obj = {
                    senderId: params.userDetails,
                    receiverId: data.checkSessionId.requestedTo,
                    notificationEventType: NOTIFICATION_TYPE.cancel_one_one_lesson,
                    sessionId: [params.sessionId],
                    createdAt: Utils.moment().unix(),
                    saveInDb: true,
                    message: "Rookie " + params.userDetails.firstName + " has cancelled the one to one lesson starting from " + startDate + " with the reason " + params.reason
                }

                Utils.universalFunctions.sendNotification(obj, "notification", function(err, res) {
                    cb(err, data)
                })
            }],
            sendMail: ['updateBookingStatus', function(data, cb) {

                if (params.payment == true) {
                    var subject = "Refund initiated for One to one lesson";

                    var startDate = Utils.moment(data.checkSessionId.startDateTime * 1000).format("YYYY-MM-DD HH:mm:ss")

                    var templatepath = Utils.path.join(__dirname, '../../../assets/emailTemplates/');
                    var fileReadStream = Utils.fs.createReadStream(templatepath + 'notifications.html');

                    var emailTemplate = '';

                    fileReadStream.on('data', function(buffer) {
                        emailTemplate += buffer.toString();
                    });

                    fileReadStream.on('end', function(res) {


                        var message = "We have successfully fulfilled your request to cancel the one to one lesson starting on " + startDate

                        var otherMessage = "We have successfully refunded you with the amount £" + data.checkSessionId.ratePerHour + " ."

                        var sendStr = emailTemplate.replace('{{firstName}}', params.userDetails.firstName).replace('{{message}}', message).replace('{{otherMessage}}', otherMessage)

                        Utils.universalFunctions.sendMail(params.userDetails.email, subject, sendStr)

                        cb(null, null)

                    });
                } else {
                    var subject = "One to one lesson cancelled";

                    var startDate = Utils.moment(data.checkSessionId.startDateTime * 1000).format("YYYY-MM-DD HH:mm:ss")

                    var templatepath = Utils.path.join(__dirname, '../../../assets/emailTemplates/');
                    var fileReadStream = Utils.fs.createReadStream(templatepath + 'notifications.html');

                    var emailTemplate = '';

                    fileReadStream.on('data', function(buffer) {
                        emailTemplate += buffer.toString();
                    });

                    fileReadStream.on('end', function(res) {

                        var message = "We have successfully fulfilled your request to cancel the one to one lesson starting on " + startDate

                        var otherMessage = "But you won't get any refund for the lesson because cancelling the lesson within 24 hours of starting is not in the Virtual Classroom's policies. "

                        var sendStr = emailTemplate.replace('{{firstName}}', params.userDetails.firstName).replace('{{message}}', message).replace('{{otherMessage}}', otherMessage)

                        Utils.universalFunctions.sendMail(params.userDetails.email, subject, sendStr)

                        cb(null, null)
                    });

                }

            }]
        }, function(err, result) {
            var message
            params.payment == true ?
                message = "Your booking has been cancelled and refund has been initiated" : message = "Booking cancelled but you won't get any refund for the same."

            callback(err ? err : { statusCode: 200, status: "success", message: message });
        });
    },

    rookiePayForOneOneLesson: function(params, callback) {
        var details, paymentStatus
        Utils.async.auto({
                checkSessionIdAndRequestStatus: [function(cb) {

                    sessionsModel.findOne({ _id: params.sessionId, sessionType: LESSON_TYPE.one, isDeleted: false })
                        .populate({ path: "requestedTo" })
                        .exec(function(err, res) {

                            cb(err ? err : res == null ? { statusCode: 401, status: "warning", message: "Invalid session id" } :
                                res.status != SESSION_STATUS.accepted ? {
                                    statusCode: 401,
                                    status: "warning",
                                    message: "Booking not accepted"
                                } : null, res)
                        })
                }],
                checkIfRookieHasNoOtherOneLesson: ["checkSessionIdAndRequestStatus", function(data, cb) {
                    details = data.checkSessionIdAndRequestStatus

                    sessionsModel.findOne({
                        requestedBy: params.userId,
                        /*  $and: [{
                                  $and: [{ startDateTime: { $lte: details.startDateTime } }, { endDateLagTime: { $gte: details.startDateTime } }]
                              },
                              {
                                  $and: [{ startDateTime: { $lte: details.endDateLagTime } }, { endDateLagTime: { $gte: details.endDateLagTime } }]
                              }
                          ],*/
                        $or: [{
                                $and: [{ startDateTime: { $gte: details.startDateTime } }, { startDateTime: { $lte: details.endDateLagTime } }]
                            },
                            {
                                $and: [{ endDateLagTime: { $gte: details.startDateTime } }, { endDateLagTime: { $lte: details.endDateLagTime } }]
                            }
                        ],
                        status: SESSION_STATUS.payment_done,
                        sessionType: LESSON_TYPE.one,
                        isDeleted: false
                    }, function(err, res) {
                        cb(err ? err : res != null ? { statusCode: 401, status: 'warning', message: "You already have the one to one lesson booking for the same slot" } : null, res)
                    })
                }],
                checkIfRookieHasNoOtherGroupLesson: ["checkSessionIdAndRequestStatus", function(data, cb) {
                    details = data.checkSessionIdAndRequestStatus

                    sessionsModel.findOne({
                        joinees: { $in: [params.userId] },
                        // $and: [{
                        //         $and: [{ startDateTime: { $lte: details.startDateTime } }, { endDateLagTime: { $gte: details.startDateTime } }]
                        //     },
                        //     {
                        //         $and: [{ startDateTime: { $lte: details.endDateLagTime } }, { endDateLagTime: { $gte: details.endDateLagTime } }]
                        //     }
                        // ],
                        $or: [{
                                $and: [{ startDateTime: { $gte: details.startDateTime } }, { startDateTime: { $lte: details.endDateLagTime } }]
                            },
                            {
                                $and: [{ endDateLagTime: { $gte: details.startDateTime } }, { endDateLagTime: { $lte: details.endDateLagTime } }]
                            }
                        ],
                        status: SESSION_STATUS.payment_done,
                        sessionType: LESSON_TYPE.group,
                        isDeleted: false
                    }, function(err, res) {
                        cb(err ? err : res != null ? { statusCode: 401, status: 'warning', message: "You already have the group lesson booking for the same slot" } : null, res)
                    })
                }],
                checkIfGuruHasNoOtherBooking: ["checkSessionIdAndRequestStatus", function(data, cb) {
                    details = data.checkSessionIdAndRequestStatus

                    sessionsModel.findOne({
                        requestedTo: details.requestedTo,
                        // $and: [{
                        //         $and: [{ startDateTime: { $lte: details.startDateTime } }, { endDateLagTime: { $gte: details.startDateTime } }]
                        //     },
                        //     {
                        //         $and: [{ startDateTime: { $lte: details.endDateLagTime } }, { endDateLagTime: { $gte: details.endDateLagTime } }]
                        //     }
                        // ],
                        $or: [{
                                $and: [{ startDateTime: { $gte: details.startDateTime } }, { startDateTime: { $lte: details.endDateLagTime } }]
                            },
                            {
                                $and: [{ endDateLagTime: { $gte: details.startDateTime } }, { endDateLagTime: { $lte: details.endDateLagTime } }]
                            }
                        ],
                        status: SESSION_STATUS.payment_done,
                        isDeleted: false
                    }, function(err, res) {
                        cb(err ? err : res != null ? { statusCode: 401, status: 'warning', message: "Guru has been already booked for this slot." } : null, res)
                    })
                }],
                checkCustomerId: ["checkIfGuruHasNoOtherBooking", function(data, cb) {

                    if (!params.userDetails.stripeCustomerId) {

                        stripeService.createCustomer(params.userDetails, function(err, res) {
                            if (err) cb(err)
                            else {
                                params.userDetails.stripeCustomerId = res.stripeCustomerId
                                cb(null, null)
                            }
                        })
                    } else {
                        cb(null, null)
                    }
                }],
                createSourceToLinkUserCard: ['checkCustomerId', function(response, cb) { // create source and link card to the user

                    if (params.cardToken && params.cardToken != "") { // create source only when new card

                        stripeService.createSource(params,
                            function(err, card) {

                                if (err) {
                                    callback(err)
                                } else {
                                    params.cardId = card.id
                                    cb(null, response)
                                }
                            }
                        );
                    } else {
                        cb(null, response)
                    }

                }],
                createCharge: ['createSourceToLinkUserCard', "checkSessionIdAndRequestStatus", function(data, cb) {
                    Utils.universalFunctions.logger("Make payment for 1-1 lesson")

                    var stripeData = {
                        total: Math.round(data.checkSessionIdAndRequestStatus.ratePerHour),
                        cardID: params.cardId,
                        stripeCustomerId: params.userDetails.stripeCustomerId,
                        sessionId: params.sessionId
                    };

                    stripeService.createCharge(stripeData, function(err, charge) {
                        if (err) {
                            cb(err)
                        } else {
                            cb(null, charge);
                        }
                    });

                }],
                setDefaultCard: ["createCharge", function(data, cb) {

                    stripeService.setDefaultCard(params, function(err, res) {
                        if (err) {

                            var errorMetaData = err;
                            if (err.raw) {
                                var stripeErrType = err.raw.type;
                                var stripeErrMessage = err.raw.message;
                            }
                            callback({ statusCode: 401, status: 'warning', errorType: stripeErrType, message: stripeErrMessage })
                        } else {
                            cb(null, res);
                        }
                    })

                }],
                makeTransaction: ["setDefaultCard", function(data, cb) {

                    var amountToTransferToGuru = APP_CONSTANTS.stripeUserShare / 100 * data.checkSessionIdAndRequestStatus.ratePerHour

                    var objToSave = {
                        sessionId: params.sessionId,
                        stripeCustomerID: params.userDetails.stripeCustomerId,
                        cardID: params.cardID,
                        metaData: data.createCharge,
                        transactionType: TRANSACTION_TYPE.cardToStripe,
                        finalAmountToTransfer: Math.round(amountToTransferToGuru),
                        requestStatus: REQUEST_STATUS.ongoing,
                        paymentDoneBy: params.userId,
                        paymentDoneTo: details.requestedTo._id
                    }

                    objToSave.chargeID = data.createCharge.stripeCharge.id ? data.createCharge.stripeCharge.id : null;
                    objToSave.transactionID = data.createCharge.stripeCharge.balance_transaction ? data.createCharge.stripeCharge.balance_transaction : null;
                    objToSave.transactionStatus = data.createCharge.stripeCharge.status ? data.createCharge.stripeCharge.status : null;
                    objToSave.currency = data.createCharge.stripeCharge.currency ? data.createCharge.stripeCharge.currency : null;
                    objToSave.transactionDate = data.createCharge.stripeCharge.created ? data.createCharge.stripeCharge.created : null;

                    transactionsModel(objToSave).save(function(err, res) {

                        if (err) {
                            Utils.universalFunctions.logger(err);
                            cb(err);
                        } else {
                            cb(null, res);
                        }
                    });
                }],
                makeBooking: ["makeTransaction", function(data, cb) {

                    var obj = {
                        sessionId: params.sessionId,
                        paymentStatus: SESSION_STATUS.payment_done,
                        paymentDoneBy: params.userId,
                        paymentDoneTo: details.requestedTo._id,
                        statusHistory: [{
                            status: SESSION_STATUS.payment_done,
                            updatedAt: Utils.moment().unix()
                        }],
                        transactionDetails: [{
                            transactionId: data.makeTransaction._id,
                            message: "Transfer from card to stripe account"
                        }]
                    }

                    sessionBookingsModel(obj).save(function(err, res) {
                        cb(err ? err : null, res)
                    })
                }],
                updateSession: ["makeBooking", function(data, cb) {

                    var dataToSet = {
                        status: SESSION_STATUS.payment_done,
                        $push: {
                            statusHistory: {
                                status: SESSION_STATUS.payment_done,
                                updatedAt: Utils.moment().unix()
                            }
                        }
                    }

                    sessionsModel.findOneAndUpdate({ _id: params.sessionId }, dataToSet, { new: true }, function(err, res) {
                        cb(err ? err : null, data)
                    })

                }],
                expireAllOtherRequestOfThisStudentAtTheSameTime: ['makeBooking', function(data, cb) {
                    sessionsModel.update({
                            _id: { $ne: params.sessionId },
                            requestedTo: details.requestedTo._id,
                            // $and: [{
                            //         $or: [{ startDateTime: { $lte: details.startDateTime } }, { endDateTime: { $gte: details.startDateTime } }]
                            //     },
                            //     {
                            //         $or: [{ startDateTime: { $lte: details.endDateTime } }, { endDateTime: { $gte: details.endDateTime } }]
                            //     }
                            // ],
                            startDateTime: details.startDateTime,
                            endDateTime: details.endDateTime,
                            status: { $nin: [SESSION_STATUS.refunded, SESSION_STATUS.cancelled_by_guru, SESSION_STATUS.cancelled_by_rookie] }
                        }, {
                            status: SESSION_STATUS.expired,
                            $push: {
                                statusHistory: {
                                    status: SESSION_STATUS.expired,
                                    updatedAt: Utils.moment().unix()
                                }
                            }
                        }, { multi: true },
                        function(err, res) {
                            err ? cb(err) : cb(null, res)
                        })
                }],
                sendNotification: ["expireAllOtherRequestOfThisStudentAtTheSameTime", function(data, cb) {
                    var x = params.userDetails.firstName
                    params.userDetails.firstName = x.charAt(0).toUpperCase() + x.slice(1)

                    var startDate = Utils.moment(details.startDateTime * 1000).format("YYYY-MM-DD HH:mm:ss")

                    var obj = {
                        senderId: params.userDetails,
                        receiverId: details.requestedTo,
                        notificationEventType: NOTIFICATION_TYPE.rookie_pay_one_one,
                        sessionId: [params.sessionId],
                        createdAt: Utils.moment().unix(),
                        saveInDb: true,
                        message: "Rookie " + params.userDetails.firstName + " has paid for one to one lesson starting on " + startDate
                    }

                    Utils.universalFunctions.sendNotification(obj, "notification", function(err, res) {
                        cb(err, data)
                    })
                }],
                sendMail: ['updateSession', function(data, cb) {

                    var subject = "Payment received for one to one lesson";

                    var x = details.requestedTo.firstName
                    var guruName = x.charAt(0).toUpperCase() + x.slice(1)

                    var startDate = Utils.moment(details.startDateTime * 1000).format("YYYY-MM-DD HH:mm:ss")

                    var templatepath = Utils.path.join(__dirname, '../../../assets/emailTemplates/');
                    var fileReadStream = Utils.fs.createReadStream(templatepath + 'notifications.html');

                    var emailTemplate = '';

                    fileReadStream.on('data', function(buffer) {
                        emailTemplate += buffer.toString();
                    });

                    fileReadStream.on('end', function(res) {

                        var message = "You have successfully paid for one to one lesson starting on " + startDate + " with the guru " + guruName + " ."

                        var otherMessage = "We have successfully received the lesson fee of £" + details.ratePerHour + " from you." + "<br>" + " Please be available to attend the lesson on time."

                        var sendStr = emailTemplate.replace('{{firstName}}', params.userDetails.firstName).replace('{{message}}', message).replace('{{otherMessage}}', otherMessage)

                        Utils.universalFunctions.sendMail(params.userDetails.email, subject, sendStr)

                        cb(null, null)

                    });

                }]
            },
            function(err, result) {
                callback(err ? err : null, { statusCode: 200, status: "success", message: "Payment successful" });
            });
    },

    listAllLessons: function(params, callback) { // api for student/guru to list all one to one lessons
        Utils.universalFunctions.logger("inside fetch all lessons api")

        var startDateTime, startOfDay, endDateTime, endOfDay, params_array = [],
            obj, obj1,
            finalResult = [],
            myArray = [],
            users = [],
            arr = [];

        if (params.startDate) {
            startDateTime = new Date(params.startDate * 1000);
            startOfDay = startDateTime
        }
        if (params.endDate) {
            endDateTime = new Date(params.endDate * 1000);
            endOfDay = endDateTime.setHours(23, 59, 59, 999);
        }
        if (params.type == LESSON_TYPE.one) { // if to fetch one to one lesson
            obj = { sessionType: LESSON_TYPE.one };
            params_array.push(obj);
            Utils.async.auto({

                searchFilter: [function(cb) {
                    if (params.search && params.search != "") {
                        userModel.find({ $or: [{ firstName: new RegExp(params.search) }, { lastName: new RegExp(params.search) }] }, function(err, res) {
                            for (var i = 0; i < res.length; i++) {
                                users.push(mongoose.Types.ObjectId(res[i]._id))
                            }
                            cb(null, null)
                        })
                    } else {
                        cb(null, null)
                    }
                }],
                fetchUserRoleAndPrepareSearchCriteria: ["searchFilter", function(data, cb) {

                    if (params.search && params.search != "") {

                        params.userData.userType == 'guru' || params.userData.userType == '1' ?
                            obj = { requestedTo: { $in: users }, status: SESSION_STATUS.payment_done, isDeleted: false } :
                            obj = { requestedBy: { $in: users }, status: SESSION_STATUS.payment_done, isDeleted: false }
                    } else {
                        params.userData.userType == 'guru' || params.userData.userType == '1' ?
                            obj = { requestedTo: params.userData._id, status: SESSION_STATUS.payment_done, isDeleted: false } :
                            obj = { requestedBy: params.userData._id, status: SESSION_STATUS.payment_done, isDeleted: false }
                    }
                    params_array.push(obj);

                    if (params.startDate && params.startDate > 0 && !params.endDate) { // only start date in search
                        var obj = { 'startDateTime': { $gte: Math.round(startOfDay / 1000) } };
                        params_array.push(obj);
                    }
                    if (params.endDate && params.endDate > 0 && !params.startDate) { // only end date in search
                        var obj = { 'endDateTime': { $lte: Math.round(endOfDay / 1000) } };
                        params_array.push(obj);
                    }
                    if (params.startDate && params.startDate > 0 && params.endDate && params.endDate > 0) { // both start and end date in search
                        var obj = { $and: [{ 'startDateTime': { $gte: Math.round(startOfDay / 1000) } }, { 'endDateTime': { $lte: Math.round(endOfDay / 1000) } }] }
                        params_array.push(obj);
                    }

                    var filter_array = []
                    if (params.subject && params.subject != "") {
                        var obj1 = { $eq: ["$$comp._id", mongoose.Types.ObjectId(params.subject)] };
                        filter_array.push(obj1);
                    }



                    sessionsModel.aggregate([{
                                "$match": { $and: params_array }
                            },
                            {
                                "$unwind": {
                                    "path": "$skillId",
                                    "preserveNullAndEmptyArrays": false
                                }
                            }, {
                                "$lookup": {
                                    "from": 'subjectnskills',
                                    "localField": 'skillId',
                                    "foreignField": '_id',
                                    "as": 'Skills'
                                }
                            },

                            {
                                "$unwind": {
                                    "path": "$Skills",
                                    "preserveNullAndEmptyArrays": false
                                }
                            },
                            {
                                "$lookup": {
                                    from: "subjectnskills",
                                    localField: "Skills.parent",
                                    foreignField: "_id",
                                    as: "Skills.parent"
                                }
                            },
                            {
                                "$addFields": {
                                    "Skills.parent": {
                                        "$arrayElemAt": [{
                                                "$filter": {
                                                    "input": "$Skills.parent",
                                                    "as": "comp",
                                                    cond: {
                                                        $and: filter_array
                                                    }
                                                }
                                            },
                                            0
                                        ]
                                    }
                                }
                            },

                            {
                                "$unwind": {
                                    "path": "$comments",
                                    "preserveNullAndEmptyArrays": false
                                }
                            }, {
                                "$lookup": {
                                    "from": 'users',
                                    "localField": 'comments.created_by',
                                    "foreignField": '_id',
                                    "as": 'comments.userData'
                                }
                            },
                            {
                                "$lookup": {
                                    "from": 'users',
                                    "localField": 'requestedTo',
                                    "foreignField": '_id',
                                    "as": 'requestedToUser'
                                }
                            },
                            {
                                "$lookup": {
                                    "from": 'users',
                                    "localField": 'requestedBy',
                                    "foreignField": '_id',
                                    "as": 'requestedByUser'
                                }
                            },
                            {
                                $project: {
                                    "status": 1,
                                    "startDateTime": 1,
                                    "sessionType": 1,
                                    "ratePerHour": 1,
                                    "endDateTime": 1,
                                    "Skills._id": 1,
                                    "Skills.name": 1,
                                    "Skills.parent": 1,
                                    "requestedToUser.firstName": 1,
                                    "requestedToUser.lastName": 1,
                                    "requestedToUser.bio": 1,
                                    "requestedToUser._id": 1,
                                    "requestedToUser.rating": 1,
                                    "requestedByUser.firstName": 1,
                                    "requestedByUser.lastName": 1,
                                    "requestedByUser._id": 1,
                                    "requestedByUser.bio": 1,
                                    "requestedByUser.rating": 1,
                                    "requestedByUser.profilePic": 1,
                                    "requestedToUser.profilePic": 1,
                                    "comments.comment": 1,
                                    "comments.userData.profilePic": 1,
                                    "comments.userData.userType": 1,
                                    "comments.userData.firstName": 1,
                                    "comments.userData.lastName": 1

                                }
                            },
                            {
                                $sort: {
                                    "startDateTime": -1
                                }
                            },
                            {
                                "$group": {
                                    "_id": "$_id",
                                    "status": {
                                        "$first": "$status",
                                    },
                                    "startDateTime": {
                                        "$first": "$startDateTime",
                                    },
                                    "endDateTime": {
                                        "$first": "$endDateTime",
                                    },
                                    "ratePerHour": {
                                        "$first": "$ratePerHour",
                                    },
                                    "sessionType": {
                                        "$first": "$sessionType",
                                    },
                                    "requestedBy": {
                                        $first: "$requestedByUser"
                                    },
                                    "requestedTo": {
                                        $first: "$requestedToUser"
                                    },
                                    "comments": { "$addToSet": "$comments" },
                                    "Skills": { "$addToSet": "$Skills" }
                                }
                            },

                            // {
                            //     $skip: params.skip
                            // },
                            // {
                            //     $limit: params.limit || 30
                            // }
                        ],
                        function(err, res) {
                            err ? cb(err) : cb(null, res)
                        })
                }],

                modifyData: ['fetchUserRoleAndPrepareSearchCriteria', function(data, cb) {
                    Utils.universalFunctions.logger("Step 2 to modify the data");
                    if (data.fetchUserRoleAndPrepareSearchCriteria.length > 0 && params.subject) {
                        data.fetchUserRoleAndPrepareSearchCriteria.forEach(function(sessions) { // remove skills that dont have matching subject as in filter
                            myArray = sessions.Skills.filter(function(obj) {
                                return obj.subject;
                            });
                            sessions.Skills = myArray
                        })

                        finalResult = data.fetchUserRoleAndPrepareSearchCriteria.filter(function(obj) { // remove session if no skills found under that
                            return obj.Skills.length > 0;
                        });
                        cb(null, finalResult)
                    } else {
                        cb(null, data.fetchUserRoleAndPrepareSearchCriteria)
                    }
                }],
                checkIfBlocked: ["modifyData", function(data, cb) {

                    Utils.async.eachSeries(data.modifyData, function(item, Incb) {
                            var isBlocked = false
                            userModel.findOne({ _id: item.requestedTo[0]._id }, function(err, res) {
                                if (err) cb(err)
                                else {
                                    if (res.blockedList && res.blockedList.length > 0) {
                                        for (var i = 0; i < res.blockedList.length; i++) {
                                            res.blockedList[i] = res.blockedList[i].toString()
                                        }
                                        isBlocked = Utils._.contains(res.blockedList, item.requestedBy[0]._id.toString());
                                    }
                                    item['isBlocked'] = isBlocked
                                    Incb()
                                }
                            })
                        },
                        function(err, result) {
                            cb(err ? err : null, data)
                        });
                }]
            }, function(err, result) {
                params.totalCount = result.modifyData.length
                result.modifyData = Utils._.chain(result.modifyData)
                    .rest(params.skip || 0)
                    .first(params.limit || 30)
                err ? callback(err) : callback(null, { status: "success", statusCode: 200, message: " One to One lessons fetched successfully", totalCount: params.totalCount, data: result.modifyData })
            })
        }
        /*  else {
              obj = { sessionType: LESSON_TYPE.group };
              params_array.push(obj);
              Utils.async.auto({

                  fetchUserRoleAndPrepareSearchCriteria: [function(cb) {

                      params.userData.userType == 'guru' || params.userData.userType == '1' ?
                          obj = { requestedTo: params.userData._id, status: SESSION_STATUS.payment_done, isDeleted: false } :
                          obj = { joinees: { $in: [params.userData._id] }, status: SESSION_STATUS.payment_done, isDeleted: false }
                      params_array.push(obj);


                      if (params.startDate && params.startDate > 0 && !params.endDate) { // only start date in search
                          obj = { 'startDateTime': { $gte: Math.round(startOfDay / 1000) } };
                          params_array.push(obj);
                      }
                      if (params.endDate && params.endDate > 0 && !params.startDate) { // only end date in search
                          obj = { 'endDateTime': { $lte: Math.round(endOfDay / 1000) } };
                          params_array.push(obj);
                      }
                      if (params.startDate && params.startDate > 0 && params.endDate && params.endDate > 0) { // both start and end date in search
                          obj = { $and: [{ 'startDateTime': { $gte: Math.round(startOfDay / 1000) } }, { 'endDateTime': { $lte: Math.round(endOfDay / 1000) } }] }
                          params_array.push(obj);
                      }

                      var filter_array = []
                      if (params.subject && params.subject != "") {
                          obj1 = { $eq: ["$$comp._id", mongoose.Types.ObjectId(params.subject)] };
                          filter_array.push(obj1);
                      }

                      sessionsModel.aggregate([{
                                  "$match": { $and: params_array }
                              },
                              {
                                  "$unwind": {
                                      "path": "$skillId",
                                      "preserveNullAndEmptyArrays": false
                                  }
                              }, {
                                  "$lookup": {
                                      "from": 'subjectnskills',
                                      "localField": 'skillId',
                                      "foreignField": '_id',
                                      "as": 'Skills'
                                  }
                              },

                              {
                                  "$unwind": {
                                      "path": "$Skills",
                                      "preserveNullAndEmptyArrays": false
                                  }
                              },
                              {
                                  "$lookup": {
                                      from: "subjectnskills",
                                      localField: "Skills.parent",
                                      foreignField: "_id",
                                      as: "Skills.subject"
                                  }
                              },
                              {
                                  "$addFields": {
                                      "Skills.subject": {
                                          "$arrayElemAt": [{
                                                  "$filter": {
                                                      "input": "$Skills.subject",
                                                      "as": "comp",
                                                      cond: {
                                                          $and: filter_array
                                                      }
                                                  }
                                              },
                                              0
                                          ]
                                      }
                                  }
                              },
                              {
                                  "$unwind": {
                                      "path": "$joinees",
                                      "preserveNullAndEmptyArrays": false
                                  }
                              },
                              {
                                  "$lookup": {
                                      "from": 'users',
                                      "localField": 'joinees',
                                      "foreignField": '_id',
                                      "as": 'Joinees'
                                  }
                              },
                              {
                                  "$unwind": {
                                      "path": "$Joinees",
                                      "preserveNullAndEmptyArrays": false
                                  }
                              },
                              {
                                  "$lookup": {
                                      "from": 'users',
                                      "localField": 'requestedTo',
                                      "foreignField": '_id',
                                      "as": 'requestedToUser'
                                  }
                              },
                              {
                                  "$lookup": {
                                      "from": 'users',
                                      "localField": 'requestedBy',
                                      "foreignField": '_id',
                                      "as": 'requestedByUser'
                                  }
                              },
                              {
                                  $project: {
                                      "status": 1,
                                      "startDateTime": 1,
                                      "groupLessonNumber": 1,
                                      "lessonDetails": 1,
                                      "title": 1,
                                      "sessionType": 1,
                                      "ratePerHour": 1,
                                      "ratePerRookie": 1,
                                      "endDateTime": 1,
                                      "Skills._id": 1,
                                      "Skills.name": 1,
                                      "Skills.subject": 1,
                                      "requestedToUser.firstName": 1,
                                      "requestedToUser.lastName": 1,
                                      "requestedToUser.bio": 1,
                                      "requestedToUser.rating": 1,
                                      "requestedByUser.firstName": 1,
                                      "requestedByUser.lastName": 1,
                                      "requestedByUser.bio": 1,
                                      "requestedByUser.rating": 1,
                                      "Joinees.profilePic": 1,
                                      "Joinees.firstName": 1,
                                      "Joinees.lastName": 1
                                  }
                              },
                              {
                                  $sort: {
                                      "createdAt": -1
                                  }
                              },
                              {
                                  "$group": {
                                      "_id": "$_id",
                                      "status": {
                                          "$first": "$status",
                                      },
                                      "groupLessonNumber": {
                                          "$first": "$groupLessonNumber"
                                      },
                                      "startDateTime": {
                                          "$last": "$startDateTime",
                                      },
                                      "endDateTime": {
                                          "$last": "$endDateTime",
                                      },
                                      "ratePerHour": {
                                          "$first": "$ratePerHour",
                                      },
                                      "sessionType": {
                                          "$first": "$sessionType",
                                      },
                                      "requestedBy": {
                                          $first: "$requestedByUser"
                                      },
                                      "requestedTo": {
                                          $first: "$requestedToUser"
                                      },
                                      "Skills": { "$addToSet": "$Skills" },
                                      "Joinees": { "$push": "$Joinees" },
                                      "lessonDetails": {
                                          "$first": "$lessonDetails"
                                      },
                                      "title": {
                                          "$first": "$title"
                                      },
                                      "ratePerRookie": {
                                          "$first": "$ratePerRookie"
                                      },
                                  }
                              },

                              {
                                  $skip: params.skip
                              },
                              {
                                  $limit: params.limit || 30
                              }
                          ],
                          function(err, res) {
                              if (err) cb(err)
                              else {
                                  console.log('res---------', res)
                                  var x = Utils._.groupBy(res, function(obj) {
                                      return obj.groupLessonNumber
                                  })
                                  var map = Utils._.map(x, function(num) {
                                      return num
                                  })

                                  for (var i = 0; i < map.length; i++) {
                                      for (var j = 0; j < map[i].length; j++) {
                                          var length = map[i].length
                                          arr.push({
                                              startDateTime: map[i][j].startDateTime,
                                              endDateTime: map[i][length - 1].endDateTime,
                                              title: map[i][j].title,
                                              status: map[i][j].status,
                                              sessionType: "group",
                                              ratePerRookie: map[i][j].ratePerRookie,
                                              lessonDetails: map[i][j].lessonDetails,
                                              Joinees: map[i][j].Joinees,
                                              groupLessonNumber: map[i][j].groupLessonNumber,
                                              Skills: map[i][j].Skills,
                                              requestedBy: map[i][j].requestedBy,
                                              requestedTo: map[i][j].requestedTo,

                                          })
                                          break;
                                      }
                                  }
                                  console.log('arr======', arr)
                                  cb(null, arr)
                              }
                          })
                  }],

                  modifyData: ['fetchUserRoleAndPrepareSearchCriteria', function(data, cb) {
                      Utils.universalFunctions.logger("Step 2 to modify the data");
                      if (data.fetchUserRoleAndPrepareSearchCriteria.length > 0 && params.subject) {
                          data.fetchUserRoleAndPrepareSearchCriteria.forEach(function(sessions) { // remove skills that dont have matching subject as in filter
                              myArray = sessions.Skills.filter(function(obj) {
                                  return obj.subject;
                              });
                              sessions.Skills = myArray
                          })

                          finalResult = data.fetchUserRoleAndPrepareSearchCriteria.filter(function(obj) { // remove session if no skills found under that
                              return obj.Skills.length > 0;
                          });
                          cb(null, finalResult)
                      } else {
                          cb(null, data.fetchUserRoleAndPrepareSearchCriteria)
                      }
                  }]
              }, function(err, result) {
                  err ? callback(err) : callback(null, { status: "success", statusCode: 200, message: "Group lessons fetched successfully", data: result.modifyData })
              })

          } */
        else {
            var skills = []
            obj = { sessionType: LESSON_TYPE.group };
            params_array.push(obj);
            Utils.async.auto({
                    getSkills: [function(cb) {

                        if (params.subject) {


                            subjectnskills.find({ parent: params.subject }, function(err, res) {
                                if (err) cb(err)
                                else {
                                    for (var i = 0; i < res.length; i++) {
                                        skills.push(mongoose.Types.ObjectId(res[i]._id))
                                    }


                                    cb(null, res)
                                }
                            })

                        } else {
                            cb(null, null)
                        }
                    }],
                    fetchUserRoleAndPrepareSearchCriteria: ['getSkills', function(data, cb) {

                        params.userData.userType == 'guru' || params.userData.userType == '1' ?
                            obj = { requestedTo: params.userData._id, status: { $in: [SESSION_STATUS.payment_done, SESSION_STATUS.accepted] }, isDeleted: false } :
                            obj = { joinees: { $in: [params.userData._id] }, status: SESSION_STATUS.payment_done, isDeleted: false }
                        params_array.push(obj);


                        if (params.startDate && params.startDate > 0 && !params.endDate) { // only start date in search
                            obj = { 'startDateTime': { $gte: Math.round(startOfDay / 1000) } };
                            params_array.push(obj);
                        }
                        if (params.endDate && params.endDate > 0 && !params.startDate) { // only end date in search
                            obj = { 'endDateTime': { $lte: Math.round(endOfDay / 1000) } };
                            params_array.push(obj);
                        }
                        if (params.startDate && params.startDate > 0 && params.endDate && params.endDate > 0) { // both start and end date in search
                            obj = { $and: [{ 'startDateTime': { $gte: Math.round(startOfDay / 1000) } }, { 'endDateTime': { $lte: Math.round(endOfDay / 1000) } }] }
                            params_array.push(obj);
                        }

                        if (params.subject) {
                            params_array.push({ skillId: { $in: skills } })
                        }



                        sessionsModel.find({ $and: params_array }, { title: 1, requestedBy: 1, requestedTo: 1, totalSeats: 1, groupLessonNumber: 1, skillId: 1, title: 1, lessonDetails: 1, joinees: 1, ratePerRookie: 1, startDateTime: 1, endDateTime: 1 }, { lean: true, sort: { startDateTime: 1 } })
                            .populate({ path: "joinees", select: "profilePic firstName lastName" })
                            .populate({ path: "requestedTo", select: "profilePic firstName lastName" })
                            .populate({ path: "requestedBy", select: "profilePic firstName lastName" })
                            .populate({ path: "skillId", select: "name parent", populate: { path: "parent", select: "name" } })
                            .exec(function(err, res) {

                                if (err) cb(err)
                                else {

                                    var x = Utils._.groupBy(res, function(obj) {
                                        return obj.groupLessonNumber
                                    })
                                    var map = Utils._.map(x, function(num) {
                                        return num
                                    })

                                    for (var i = 0; i < map.length; i++) {
                                        for (var j = 0; j < map[i].length; j++) {
                                            var length = map[i].length
                                            arr.push({
                                                startDateTime: map[i][j].startDateTime,
                                                endDateTime: map[i][length - 1].endDateTime,
                                                title: map[i][j].title,
                                                status: map[i][j].status,
                                                sessionType: "group",
                                                ratePerRookie: map[i][j].ratePerRookie,
                                                lessonDetails: map[i][j].lessonDetails,
                                                Joinees: map[i][j].joinees,
                                                groupLessonNumber: map[i][j].groupLessonNumber,
                                                Skills: map[i][j].skillId,
                                                requestedBy: [map[i][j].requestedBy],
                                                requestedTo: [map[i][j].requestedTo],
                                                title: map[i][j].title
                                            })
                                            break;
                                        }
                                    }
                                    // console.log('arr=====',arr)

                                    params.totalCount = arr.length

                                    arr = Utils._.chain(arr)
                                        .rest(params.skip || 0)
                                        .first(params.limit || 30)

                                    arr = arr._wrapped

                                    cb(null, arr)
                                }
                            });
                    }],
                    checkDates: ['fetchUserRoleAndPrepareSearchCriteria', function(data, cb) {

                        Utils.async.eachSeries(arr, function(item, Incb) {
                                sessionsModel.find({ groupLessonNumber: item.groupLessonNumber }, {}, { sort: { startDateTime: 1 } }, function(err, res) {
                                    if (err) Incb(err)
                                    else {
                                        if (res.length > 0) {
                                            var length = res.length
                                            var i = 0

                                            item.startDateTime = res[i].startDateTime
                                            item.endDateTime = res[length - 1].endDateTime
                                        }
                                        Incb();
                                    }
                                })
                            },
                            function(err, result) {
                                cb(err ? err : null, result)
                            });
                    }],
                    checkIfBlocked: ["checkDates", function(data, cb) {

                        if (params.userData.userType == '1') {

                            Utils.async.eachSeries(arr, function(item, Incb) {
                                    var blocked = []
                                    Utils.async.eachSeries(item.Joinees, function(user, Inncb) {
                                            var isBlocked = false

                                            userModel.findOne({ _id: user._id }, function(err, res) {
                                                if (err) cb(err)
                                                else {
                                                    if (res.blockedList && res.blockedList.length > 0) {
                                                        for (var i = 0; i < res.blockedList.length; i++) {
                                                            res.blockedList[i] = res.blockedList[i].toString()
                                                        }
                                                        isBlocked = Utils._.contains(res.blockedList, item.requestedTo[0]._id.toString());
                                                        blocked.push(isBlocked)
                                                    } else {
                                                        blocked.push(false)
                                                    }
                                                    //item['isBlocked'] = isBlocked
                                                    Inncb()
                                                }
                                            })
                                        },
                                        function(err, result) {
                                            if (err) Incb(err)
                                            else {

                                                var a = Utils._.contains(blocked, false);

                                                if (a == true) {
                                                    item['isBlocked'] = false
                                                } else {
                                                    item['isBlocked'] = true
                                                }

                                                Incb()

                                            }

                                        });

                                },
                                function(err, result) {
                                    cb(err ? err : null, data)
                                });

                        } else {

                            Utils.async.eachSeries(arr, function(item, Incb) {
                                    var isBlocked = false
                                    userModel.findOne({ _id: params.userData._id }, function(err, res) {
                                        if (err) cb(err)
                                        else {
                                            if (res.blockedList && res.blockedList.length > 0) {
                                                for (var i = 0; i < res.blockedList.length; i++) {
                                                    res.blockedList[i] = res.blockedList[i].toString()
                                                }
                                                isBlocked = Utils._.contains(res.blockedList, item.requestedBy[0]._id.toString());
                                            }
                                            item['isBlocked'] = isBlocked
                                            Incb()
                                        }
                                    })



                                },
                                function(err, result) {
                                    cb(err ? err : null, data)
                                });



                        }

                    }]
                },
                function(err, result) {
                    err ? callback(err) : callback(null, { status: "success", statusCode: 200, message: "Group lessons fetched successfully", totalCount: params.totalCount, data: arr })
                })
        }

    },

    listAllCompletedLessons: function(params, callback) { // api for student/guru to list all one to one lessons
        Utils.universalFunctions.logger("inside fetch all lessons api")

        var startDateTime, startOfDay, endDateTime, endOfDay, params_array = [],
            obj, obj1,
            finalResult = [],
            myArray = [],
            users = [],
            arr = [],
            final = [],
            cancels = [];

        if (params.startDate) {
            startDateTime = new Date(params.startDate * 1000);
            startOfDay = startDateTime.setHours(0, 0, 0);
        }
        if (params.endDate) {
            endDateTime = new Date(params.endDate * 1000);
            endOfDay = endDateTime
        }
        if (params.type == LESSON_TYPE.one) { // if to fetch one to one lesson
            obj = { sessionType: LESSON_TYPE.one };
            params_array.push(obj);
            Utils.async.auto({

                searchFilter: [function(cb) {
                    if (params.search && params.search != "") {
                        userModel.find({ $or: [{ firstName: new RegExp(params.search) }, { lastName: new RegExp(params.search) }] }, function(err, res) {
                            for (var i = 0; i < res.length; i++) {
                                users.push(mongoose.Types.ObjectId(res[i]._id))
                            }
                            cb(null, null)
                        })
                    } else {
                        cb(null, null)
                    }
                }],
                fetchUserRoleAndPrepareSearchCriteria: ["searchFilter", function(data, cb) {

                    if (params.search && params.search != "") {

                        params.userData.userType == 'guru' || params.userData.userType == '1' ?
                            obj = { requestedTo: { $in: users }, status: { $in: [SESSION_STATUS.payment_done, SESSION_STATUS.completed] }, isDeleted: false } :
                            obj = { requestedBy: { $in: users }, status: { $in: [SESSION_STATUS.payment_done, SESSION_STATUS.completed] }, isDeleted: false }
                    } else {
                        params.userData.userType == 'guru' || params.userData.userType == '1' ?
                            obj = { requestedTo: params.userData._id, status: { $in: [SESSION_STATUS.payment_done, SESSION_STATUS.completed] }, isDeleted: false } :
                            obj = { requestedBy: params.userData._id, status: { $in: [SESSION_STATUS.payment_done, SESSION_STATUS.completed] }, isDeleted: false }
                    }
                    params_array.push(obj);

                    if (params.startDate && params.startDate > 0 && !params.endDate) { // only start date in search
                        var obj = { 'startDateTime': { $gte: Math.round(startOfDay / 1000) } };
                        params_array.push(obj);
                    }
                    if (params.endDate && params.endDate > 0 && !params.startDate) { // only end date in search
                        var obj = { 'endDateTime': { $lte: Math.round(endOfDay / 1000) } };
                        params_array.push(obj);
                    }
                    if (params.startDate && params.startDate > 0 && params.endDate && params.endDate > 0) { // both start and end date in search
                        var obj = { $and: [{ 'startDateTime': { $gte: Math.round(startOfDay / 1000) } }, { 'endDateTime': { $lte: Math.round(endOfDay / 1000) } }] }
                        params_array.push(obj);
                    }

                    var filter_array = []
                    if (params.subject && params.subject != "") {
                        var obj1 = { $eq: ["$$comp._id", mongoose.Types.ObjectId(params.subject)] };
                        filter_array.push(obj1);
                    }



                    sessionsModel.aggregate([{
                                "$match": { $and: params_array }
                            },
                            {
                                "$unwind": {
                                    "path": "$skillId",
                                    "preserveNullAndEmptyArrays": false
                                }
                            }, {
                                "$lookup": {
                                    "from": 'subjectnskills',
                                    "localField": 'skillId',
                                    "foreignField": '_id',
                                    "as": 'Skills'
                                }
                            },

                            {
                                "$unwind": {
                                    "path": "$Skills",
                                    "preserveNullAndEmptyArrays": false
                                }
                            },
                            {
                                "$lookup": {
                                    from: "subjectnskills",
                                    localField: "Skills.parent",
                                    foreignField: "_id",
                                    as: "Skills.parent"
                                }
                            },
                            {
                                "$addFields": {
                                    "Skills.parent": {
                                        "$arrayElemAt": [{
                                                "$filter": {
                                                    "input": "$Skills.parent",
                                                    "as": "comp",
                                                    cond: {
                                                        $and: filter_array
                                                    }
                                                }
                                            },
                                            0
                                        ]
                                    }
                                }
                            },

                            {
                                "$unwind": {
                                    "path": "$comments",
                                    "preserveNullAndEmptyArrays": false
                                }
                            }, {
                                "$lookup": {
                                    "from": 'users',
                                    "localField": 'comments.created_by',
                                    "foreignField": '_id',
                                    "as": 'comments.userData'
                                }
                            },
                            {
                                "$lookup": {
                                    "from": 'users',
                                    "localField": 'requestedTo',
                                    "foreignField": '_id',
                                    "as": 'requestedToUser'
                                }
                            },
                            {
                                "$lookup": {
                                    "from": 'users',
                                    "localField": 'requestedBy',
                                    "foreignField": '_id',
                                    "as": 'requestedByUser'
                                }
                            },
                            {
                                $project: {
                                    "status": 1,
                                    "ratingFeedbacks": 1,
                                    "startDateTime": 1,
                                    "sessionType": 1,
                                    "ratePerHour": 1,
                                    "endDateTime": 1,
                                    "Skills._id": 1,
                                    "Skills.name": 1,
                                    "Skills.parent": 1,
                                    "complaints": 1,
                                    "requestedToUser.firstName": 1,
                                    "requestedToUser.lastName": 1,
                                    "requestedToUser.bio": 1,
                                    "requestedToUser.rating": 1,
                                    "requestedByUser.firstName": 1,
                                    "requestedByUser.lastName": 1,
                                    "requestedByUser.bio": 1,
                                    "requestedByUser.rating": 1,
                                    "requestedByUser.profilePic": 1,
                                    "requestedToUser.profilePic": 1,
                                    "comments.comment": 1,
                                    "comments.userData.profilePic": 1,
                                    "comments.userData.userType": 1,
                                    "comments.userData.firstName": 1,
                                    "comments.userData.lastName": 1

                                }
                            },
                            // {
                            //     $sort: {
                            //         "endDateTime": 1
                            //     }
                            // },
                            {
                                "$group": {
                                    "_id": "$_id",
                                    "status": {
                                        "$first": "$status",
                                    },
                                    "startDateTime": {
                                        "$first": "$startDateTime",
                                    },
                                    "endDateTime": {
                                        "$first": "$endDateTime",
                                    },
                                    "ratePerHour": {
                                        "$first": "$ratePerHour",
                                    },
                                    "sessionType": {
                                        "$first": "$sessionType",
                                    },
                                    "requestedBy": {
                                        $first: "$requestedByUser"
                                    },
                                    "requestedTo": {
                                        $first: "$requestedToUser"
                                    },
                                    "ratingFeedbacks": {
                                        "$first": "$ratingFeedbacks"
                                    },
                                    "comments": { "$addToSet": "$comments" },
                                    "Skills": { "$addToSet": "$Skills" },
                                    "complaints": { "$first": "$complaints" }
                                }
                            },
                            // {
                            //     lean: true
                            // },
                            // {
                            //     $limit: params.limit || 30
                            // }
                        ],
                        function(err, res) {

                            err ? cb(err) : cb(null, res)
                        })
                }],

                modifyData: ['fetchUserRoleAndPrepareSearchCriteria', function(data, cb) {
                    Utils.universalFunctions.logger("Step 2 to modify the data");
                    if (data.fetchUserRoleAndPrepareSearchCriteria.length > 0 && params.subject) {
                        data.fetchUserRoleAndPrepareSearchCriteria.forEach(function(sessions) { // remove skills that dont have matching subject as in filter
                            myArray = sessions.Skills.filter(function(obj) {
                                return obj.parent;
                            });
                            sessions.Skills = myArray

                        })

                        finalResult = data.fetchUserRoleAndPrepareSearchCriteria.filter(function(obj) { // remove session if no skills found under that
                            return obj.Skills.length > 0;
                        });
                        cb(null, finalResult)
                    } else {
                        cb(null, data.fetchUserRoleAndPrepareSearchCriteria)
                    }
                }],

                getCancelledLessons: ["modifyData", 'fetchUserRoleAndPrepareSearchCriteria', function(data, cb) {
                    var criteria = {
                        $or: [{ requestedTo: params.userData._id }, { requestedBy: params.userData._id }],
                        isDeleted: false,
                        sessionType: LESSON_TYPE.one,
                        status: { $in: [SESSION_STATUS.refunded, SESSION_STATUS.cancelled_by_guru, SESSION_STATUS.cancelled_by_rookie] }
                    }
                    sessionsModel.find(criteria, {}, { lean: true })
                        .populate({ path: "comments.created_by", select: "userType firstName lastName profilePic" })
                        .populate({ path: "requestedTo", select: "firstName lastName profilePic rating bio" })
                        .populate({ path: "requestedBy", select: "firstName lastName profilePic rating bio" })
                        .populate({ path: "skillId", select: "name parent", populate: { path: "parent", select: "name" } })
                        .exec(function(err, res) {
                            // console.log('all cancelled lessons==========', res.length)
                            for (var i = 0; i < res.length; i++) {
                                var comments = []
                                for (var j = 0; j < res[i].comments.length; j++) {
                                    comments.push({
                                        comment: res[i].comments[j].comment,
                                        userData: [res[i].comments[j].created_by]
                                    })
                                }


                                res[i].requestedTo = [res[i].requestedTo],
                                    res[i].requestedBy = [res[i].requestedBy],
                                    res[i].comments = comments,
                                    res[i].Skills = res[i].skillId,
                                    res[i].ratingFeedbacks = res[i].ratingFeedbacks

                                cancels.push(res[i])
                            }

                            cb(null, null)
                        })
                }]

            }, function(err, result) {
                var finalArr = result.modifyData.concat(cancels)

                finalArr = Utils._.sortBy(finalArr, function(obj) {
                    return obj.endDateTime
                }).reverse()

                params.totalCount = finalArr.length
                finalArr = Utils._.chain(finalArr)
                    .rest(params.skip || 0)
                    .first(params.limit || 30)

                var arr = finalArr
                arr = arr._wrapped

                //var showComplaints = true;

                if (params.userData.userType == '2') {
                    for (var i = 0; i < arr.length; i++) {
                        arr[i].showComplaints = true
                        for (var j = 0; j < arr[i].ratingFeedbacks.length; j++) {
                            if (arr[i].ratingFeedbacks[j].userId.toString() == params.userData._id.toString()) {
                                arr[i].rating = arr[i].ratingFeedbacks[j].rating ? arr[i].ratingFeedbacks[j].rating : "",
                                    arr[i].feedback = arr[i].ratingFeedbacks[j].feedback ? arr[i].ratingFeedbacks[j].feedback : ""
                            }
                            break;
                        }
                        if (arr[i].status == SESSION_STATUS.payment_done)
                            arr[i].status = "Raise Complaint"

                        let check = arr[i].complaints.some(function(element, index) {
                            return element.userId.toString() === params.userData._id.toString();
                        });

                        let checkStatus = arr[i].complaints.some(function(element, index) {
                            return element.status === 3
                        });

                        if (arr[i].complaints.length == 0)
                            arr[i].showComplaints = false;

                        if (check == true && arr[i].status == "refunded") {
                            arr[i].status = "refunded"
                        } else if (check == true && arr[i].status != "refunded")
                            arr[i].status = "In Process"
                        else if (check == true && arr[i].complaints.length == 3 && checkStatus == true) {
                            arr[i].status = "Rejected"
                        } else if (arr[i].status == SESSION_STATUS.cancelled_by_guru || arr[i].status == SESSION_STATUS.cancelled_by_rookie)
                            arr[i].status = arr[i].status
                        else if (arr[i].status == SESSION_STATUS.refunded)
                            arr[i].status == SESSION_STATUS.refunded

                        delete arr[i].complaints
                        delete arr[i].ratingFeedbacks
                    }
                } else {
                    for (var i = 0; i < arr.length; i++) {
                        var endTime
                        arr[i].showComplaints = true
                        arr[i].rating = arr[i].ratingFeedbacks[0].rating ? arr[i].ratingFeedbacks[0].rating : ""
                        arr[i].feedback = arr[i].ratingFeedbacks[0].feedback ? arr[i].ratingFeedbacks[0].feedback : ""

                        let checkStatus = arr[i].complaints.some(function(element, index) {
                            return element.status === 3
                        });

                        if (arr[i].complaints.length == 0)
                            arr[i].showComplaints = false;

                        if (arr[i].complaints.length == 1) {
                            var complaintTime = arr[i].complaints[0].createdAt
                            endTime = moment(complaintTime * 1000).add(24, "hours").unix()
                        }
                        if (arr[i].complaints.length > 0 && arr[i].status == "refunded") {
                            arr[i].status = "refunded"
                        } else if (arr[i].complaints.length > 0 && arr[i].status != "refunded" && arr[i].complaints.length != 2 && endTime >= Utils.moment().unix())
                            arr[i].status = "Complaint Raised"
                        else if (arr[i].complaints.length == 1 && arr[i].status != "refunded" && endTime <= Utils.moment().unix()) {
                            arr[i].status = "Overdue"
                        } else if (arr[i].complaints.length > 0 && arr[i].complaints.length == 2 && checkStatus == false) {
                            arr[i].status = "Rejected"
                        } else if (arr[i].complaints.length > 0 && arr[i].complaints.length == 3 && checkStatus == true) {
                            arr[i].status = "Rejected"
                        } else if (arr[i].status == SESSION_STATUS.cancelled_by_guru || arr[i].status == SESSION_STATUS.cancelled_by_rookie)
                            arr[i].status = arr[i].status
                        else if (arr[i].status == SESSION_STATUS.refunded)
                            arr[i].status == SESSION_STATUS.refunded
                        else arr[i].status = SESSION_STATUS.payment_done

                        delete arr[i].ratingFeedbacks
                        delete arr[i].complaints
                    }


                }

                err ? callback(err) : callback(null, { status: "success", statusCode: 200, message: " One to One lessons fetched successfully", totalCount: params.totalCount, data: arr })
            })
        }
        /*else {
            obj = { sessionType: LESSON_TYPE.group };
            params_array.push(obj);
            Utils.async.auto({

                fetchUserRoleAndPrepareSearchCriteria: [function(cb) {

                    params.userData.userType == 'guru' || params.userData.userType == '1' ?
                        obj = { requestedTo: params.userData._id, status: SESSION_STATUS.payment_done, isDeleted: false } :
                        obj = { joinees: { $in: [params.userData._id] }, status: SESSION_STATUS.payment_done, isDeleted: false }
                    params_array.push(obj);


                    if (params.startDate && params.startDate > 0 && !params.endDate) { // only start date in search
                        obj = { 'startDateTime': { $gte: Math.round(startOfDay / 1000) } };
                        params_array.push(obj);
                    }
                    if (params.endDate && params.endDate > 0 && !params.startDate) { // only end date in search
                        obj = { 'endDateTime': { $lte: Math.round(endOfDay / 1000) } };
                        params_array.push(obj);
                    }
                    if (params.startDate && params.startDate > 0 && params.endDate && params.endDate > 0) { // both start and end date in search
                        obj = { $and: [{ 'startDateTime': { $gte: Math.round(startOfDay / 1000) } }, { 'endDateTime': { $lte: Math.round(endOfDay / 1000) } }] }
                        params_array.push(obj);
                    }

                    var filter_array = []
                    if (params.subject && params.subject != "") {
                        obj1 = { $eq: ["$$comp._id", mongoose.Types.ObjectId(params.subject)] };
                        filter_array.push(obj1);
                    }

                    sessionsModel.aggregate([{
                                "$match": { $and: params_array }
                            },
                            {
                                "$unwind": {
                                    "path": "$skillId",
                                    "preserveNullAndEmptyArrays": false
                                }
                            }, {
                                "$lookup": {
                                    "from": 'subjectnskills',
                                    "localField": 'skillId',
                                    "foreignField": '_id',
                                    "as": 'Skills'
                                }
                            },

                            {
                                "$unwind": {
                                    "path": "$Skills",
                                    "preserveNullAndEmptyArrays": false
                                }
                            },
                            {
                                "$lookup": {
                                    from: "subjectnskills",
                                    localField: "Skills.parent",
                                    foreignField: "_id",
                                    as: "Skills.subject"
                                }
                            },
                            {
                                "$addFields": {
                                    "Skills.subject": {
                                        "$arrayElemAt": [{
                                                "$filter": {
                                                    "input": "$Skills.subject",
                                                    "as": "comp",
                                                    cond: {
                                                        $and: filter_array
                                                    }
                                                }
                                            },
                                            0
                                        ]
                                    }
                                }
                            },
                            {
                                "$unwind": {
                                    "path": "$joinees",
                                    "preserveNullAndEmptyArrays": false
                                }
                            },
                            {
                                "$lookup": {
                                    "from": 'users',
                                    "localField": 'joinees',
                                    "foreignField": '_id',
                                    "as": 'Joinees'
                                }
                            },
                            {
                                "$unwind": {
                                    "path": "$Joinees",
                                    "preserveNullAndEmptyArrays": false
                                }
                            },
                            {
                                "$lookup": {
                                    "from": 'users',
                                    "localField": 'requestedTo',
                                    "foreignField": '_id',
                                    "as": 'requestedToUser'
                                }
                            },
                            {
                                "$lookup": {
                                    "from": 'users',
                                    "localField": 'requestedBy',
                                    "foreignField": '_id',
                                    "as": 'requestedByUser'
                                }
                            },
                            {
                                $project: {
                                    "status": 1,
                                    "startDateTime": 1,
                                    "groupLessonNumber": 1,
                                    "lessonDetails": 1,
                                    "sessionType": 1,
                                    "ratePerHour": 1,
                                    "ratePerRookie": 1,
                                    "endDateTime": 1,
                                    "Skills._id": 1,
                                    "Skills.name": 1,
                                    "Skills.subject": 1,
                                    "requestedToUser.firstName": 1,
                                    "requestedToUser.lastName": 1,
                                    "requestedToUser.bio": 1,
                                    "requestedToUser.rating": 1,
                                    "requestedByUser.firstName": 1,
                                    "requestedByUser.lastName": 1,
                                    "requestedByUser.bio": 1,
                                    "requestedByUser.rating": 1,
                                    "Joinees.profilePic": 1

                                }
                            },
                            {
                                $sort: {
                                    "startDateTime": -1
                                }
                            },
                            {
                                "$group": {
                                    "_id": "$_id",
                                    "status": {
                                        "$first": "$status",
                                    },
                                    "groupLessonNumber": {
                                        "$first": "$groupLessonNumber"
                                    },
                                    "startDateTime": {
                                        "$first": "$startDateTime",
                                    },
                                    "endDateTime": {
                                        "$first": "$endDateTime",
                                    },
                                    "ratePerHour": {
                                        "$first": "$ratePerHour",
                                    },
                                    "sessionType": {
                                        "$first": "$sessionType",
                                    },
                                    "requestedBy": {
                                        $first: "$requestedByUser"
                                    },
                                    "requestedTo": {
                                        $first: "$requestedToUser"
                                    },
                                    "Skills": { "$addToSet": "$Skills" },
                                    "Joinees": { "$push": "$Joinees" },
                                    "lessonDetails": {
                                        "$first": "$lessonDetails"
                                    },
                                    "ratePerRookie": {
                                        "$first": "$ratePerRookie"
                                    },
                                }
                            },

                            {
                                $skip: params.skip
                            },
                            {
                                $limit: params.limit || 30
                            }
                        ],
                        function(err, res) {
                            err ? cb(err) : cb(null, res)
                        })
                }],

                modifyData: ['fetchUserRoleAndPrepareSearchCriteria', function(data, cb) {
                    Utils.universalFunctions.logger("Step 2 to modify the data");
                    if (data.fetchUserRoleAndPrepareSearchCriteria.length > 0 && params.subject) {
                        data.fetchUserRoleAndPrepareSearchCriteria.forEach(function(sessions) { // remove skills that dont have matching subject as in filter
                            myArray = sessions.Skills.filter(function(obj) {
                                return obj.subject;
                            });
                            sessions.Skills = myArray
                        })

                        finalResult = data.fetchUserRoleAndPrepareSearchCriteria.filter(function(obj) { // remove session if no skills found under that
                            return obj.Skills.length > 0;
                        });
                        cb(null, finalResult)
                    } else {
                        cb(null, data.fetchUserRoleAndPrepareSearchCriteria)
                    }
                }]
            }, function(err, result) {
                err ? callback(err) : callback(null, { status: "success", statusCode: 200, message: "Group lessons fetched successfully", data: result.modifyData })
            })

        } */
        else {
            var skills = [],
                tmp = [],
                final = []
            obj = { sessionType: LESSON_TYPE.group };
            params_array.push(obj);
            Utils.async.auto({
                    getSkills: [function(cb) {

                        if (params.subject) {

                            subjectnskills.find({ parent: params.subject }, function(err, res) {
                                if (err) cb(err)
                                else {
                                    for (var i = 0; i < res.length; i++) {
                                        skills.push(mongoose.Types.ObjectId(res[i]._id))
                                    }

                                    cb(null, res)
                                }
                            })

                        } else {
                            cb(null, null)
                        }
                    }],
                    fetchUserRoleAndPrepareSearchCriteria: ['getSkills', function(data, cb) {
                        params.userData.userType == 'guru' || params.userData.userType == '1' ?
                            obj = { requestedTo: params.userData._id, status: { $in: [SESSION_STATUS.payment_done, SESSION_STATUS.completed] }, isDeleted: false } :
                            obj = { joinees: { $in: [params.userData._id] }, status: { $in: [SESSION_STATUS.payment_done, SESSION_STATUS.cancelled_by_rookie, SESSION_STATUS.completed] }, isDeleted: false }
                        params_array.push(obj);


                        if (params.startDate && params.startDate > 0 && !params.endDate) { // only start date in search
                            obj = { 'startDateTime': { $gte: Math.round(startOfDay / 1000) } };
                            params_array.push(obj);
                        }
                        if (params.endDate && params.endDate > 0 && !params.startDate) { // only end date in search
                            obj = { 'endDateTime': { $lte: Math.round(endOfDay / 1000) } };
                            params_array.push(obj);
                        }
                        if (params.startDate && params.startDate > 0 && params.endDate && params.endDate > 0) { // both start and end date in search
                            obj = { $and: [{ 'startDateTime': { $gte: Math.round(startOfDay / 1000) } }, { 'endDateTime': { $lte: Math.round(endOfDay / 1000) } }] }
                            params_array.push(obj);
                        }
                        if (params.subject) {
                            params_array.push({ skillId: { $in: skills } })
                        }



                        sessionsModel.find({ $and: params_array }, { cancelledJoinees: 1, complaints: 1, ratingFeedbacks: 1, requestedBy: 1, requestedTo: 1, totalSeats: 1, groupLessonNumber: 1, skillId: 1, title: 1, lessonDetails: 1, joinees: 1, ratePerRookie: 1, startDateTime: 1, endDateTime: 1 }, { lean: true })
                            .populate({ path: "joinees", select: "profilePic firstName" })
                            .populate({ path: "requestedTo", select: "profilePic firstName lastName" })
                            .populate({ path: "requestedBy", select: "profilePic firstName lastName" })
                            .populate({ path: "skillId", select: "name parent", populate: { path: "parent", select: "name" } })
                            .exec(function(err, res) {
                                if (err) cb(err)
                                else {

                                    var x = Utils._.groupBy(res, function(obj) {
                                        return obj.groupLessonNumber
                                    })
                                    var map = Utils._.map(x, function(num) {
                                        return num
                                    })

                                    for (var i = 0; i < map.length; i++) {
                                        for (var j = 0; j < map[i].length; j++) {
                                            var length = map[i].length
                                            arr.push({
                                                startDateTime: map[i][length - 1].startDateTime,
                                                endDateTime: map[i][j].endDateTime,
                                                title: map[i][j].title,
                                                status: map[i][j].status,
                                                sessionType: "group",
                                                ratePerRookie: map[i][j].ratePerRookie,
                                                lessonDetails: map[i][j].lessonDetails,
                                                Joinees: map[i][j].joinees,
                                                groupLessonNumber: map[i][j].groupLessonNumber,
                                                Skills: map[i][j].skillId,
                                                requestedBy: [map[i][j].requestedBy],
                                                requestedTo: [map[i][j].requestedTo],
                                                ratingFeedbacks: map[i][j].ratingFeedbacks,
                                                complaints: map[i][j].complaints,
                                                cancelledJoinees: map[i][j].cancelledJoinees ? map[i][j].cancelledJoinees : [],
                                                totalCancellations: 0
                                            })
                                            break;
                                        }
                                    }

                                    if (params.userData.userType == 'rookie' || params.userData.userType == '2') {
                                        for (var i = 0; i < arr.length; i++) {
                                            tmp.push(arr[i])
                                            for (var j = 0; j < arr[i].ratingFeedbacks.length; j++) {

                                                if (arr[i].ratingFeedbacks[j].userId.toString() == params.userData._id.toString()) {
                                                    arr[i].rating = arr[i].ratingFeedbacks.length > 0 && arr[i].ratingFeedbacks[j].rating ? arr[i].ratingFeedbacks[j].rating : "",
                                                        arr[i].feedback = arr[i].ratingFeedbacks.length > 0 && arr[i].ratingFeedbacks[j].feedback ? arr[i].ratingFeedbacks[j].feedback : ""
                                                    break;
                                                }

                                            }

                                            for (var j = 0; j < arr[i].cancelledJoinees.length; j++) {
                                                arr[i].totalCancellations = 0;
                                                if (arr[i].cancelledJoinees[j].toString() == params.userData._id.toString()) {
                                                    arr[i].totalCancellations++;
                                                }
                                            }

                                            // console.log('=========',arr[i])

                                            delete arr[i].ratingFeedbacks
                                            delete arr[i].cancelledJoinees
                                        }
                                    } else {
                                        for (var i = 0; i < arr.length; i++) {
                                            tmp.push(arr[i])
                                            for (var j = 0; j < arr[i].ratingFeedbacks.length; j++) {
                                                if (arr[i].ratingFeedbacks[j].rating && arr[i].ratingFeedbacks[j].feedback) {
                                                    arr[i].rating = arr[i].ratingFeedbacks[j].rating
                                                    arr[i].feedback = arr[i].ratingFeedbacks[j].feedback
                                                    break;
                                                } else {
                                                    arr[i].rating = ""
                                                    arr[i].feedback = ""
                                                }
                                            }
                                            arr[i].totalCancellations = arr[i].cancelledJoinees.length

                                            delete arr[i].ratingFeedbacks
                                            delete arr[i].cancelledJoinees
                                        }
                                    }
                                    cb(null, arr)
                                }
                            });
                    }],
                    checkBookings: ["fetchUserRoleAndPrepareSearchCriteria", function(data, cb) {
                        var tmp = []
                        if (params.userData.userType == 'rookie' || params.userData.userType == '2') {
                            var i = 0;
                            Utils.async.eachSeries(arr, function(item, Incb) {

                                    sessionBookingsModel.findOne({ paymentDoneBy: params.userData._id, groupLessonNumber: item.groupLessonNumber }, {}, { lean: true }, function(err, res) {
                                        if (err) cb(err)
                                        else {
                                            let check = item.complaints.some(function(element, index) {
                                                return element.userId.toString() === params.userData._id.toString();
                                            });

                                            let checkStatus = arr[i].complaints.some(function(element, index) {
                                                return element.status === 3
                                            });

                                            if (check == true && res.paymentStatus == "refunded") {
                                                item['status'] = "Refunded"
                                            } else if (check == true && res.paymentStatus != "refunded" && checkStatus == false) {
                                                item['status'] = "In Process"
                                            } else if (check == true && res.complaints.length == 3 && checkStatus == true) {
                                                item['status'] = "Rejected"
                                            } else item['status'] = "Raise Complaint"
                                            arr[i] = item
                                            i++
                                            Incb();


                                        }
                                    })
                                },
                                function(err, result) {
                                    if (err) cb(err);
                                    cb(null, data);
                                });
                        } else {
                            Utils.async.eachSeries(arr, function(item, Incb) {
                                    var totalComplaints = 0,
                                        totalRefunds = 0,
                                        totalRejections = 0
                                    if (item.complaints.length > 0) {
                                        Utils.async.eachSeries(item.complaints, function(innerItem, Inncb) {
                                                if (innerItem.status == 1) {

                                                    Utils.async.auto({
                                                        checkBooking: [function(cb) {

                                                            sessionBookingsModel.findOne({ groupLessonNumber: item.groupLessonNumber, paymentDoneBy: innerItem.userId }, function(err, res) {
                                                                if (err) cb(err)
                                                                else {

                                                                    var obj = Utils._.sortBy(res.complaints, function(obj) {
                                                                        return obj.status
                                                                    }).reverse()

                                                                    if (obj[0].status == 1) {
                                                                        totalComplaints++
                                                                    } else if (obj[0].status == 2 || obj[0].status == 3)
                                                                        totalRejections++;
                                                                    else if (obj[0].status == 4)
                                                                        totalRefunds++;



                                                                    cb(null, null)
                                                                }
                                                            })

                                                        }]
                                                    }, function(err, result) {
                                                        Inncb(err ? err : null, true)
                                                    })
                                                } else {
                                                    Inncb();
                                                }
                                            },
                                            function(err, result) {
                                                item.totalComplaints = totalComplaints
                                                item.totalRefunds = totalRefunds
                                                item.totalRejections = totalRejections
                                                Incb(err ? err : null, true)
                                            });
                                    } else {
                                        item.totalComplaints = totalComplaints
                                        item.totalRefunds = totalRefunds
                                        item.totalRejections = totalRejections
                                        Incb()
                                    }
                                },
                                function(err, result) {
                                    cb(err ? err : null, result)
                                });
                        }
                    }],
                    checkDates: ['fetchUserRoleAndPrepareSearchCriteria', function(data, cb) {

                        Utils.async.eachSeries(arr, function(item, Incb) {
                                sessionsModel.find({ groupLessonNumber: item.groupLessonNumber }, {}, { sort: { startDateTime: -1 } }, function(err, res) {
                                    if (err) Incb(err)
                                    else {
                                        if (res.length > 0) {
                                            var length = res.length
                                            var i = 0

                                            item.startDateTime = res[length - 1].startDateTime
                                            item.endDateTime = res[i].endDateTime
                                            if (item.endDateTime <= params.endDate) {
                                                final.push(item)
                                            }
                                            if (item.status == SESSION_STATUS.refunded) {
                                                final.push(item)
                                            }
                                        }
                                        Incb();
                                    }
                                })
                            },
                            function(err, result) {
                                // params.totalCount = final.length

                                // final = Utils._.chain(final)
                                //     .rest(params.skip || 0)
                                //     .first(params.limit || 10)

                                // final = final._wrapped

                                // final = Utils._.sortBy(final, function(obj) {
                                //     return obj.endDateTime
                                // }).reverse()

                                cb(err ? err : null, result)
                            });

                    }],
                    getCancelledLessons: ['checkDates', "checkBookings", function(data, cb) {
                        var tmp = []
                        var criteria = {
                            $or: [{ requestedTo: params.userData._id }, { joinees: { $in: [params.userData._id] } }, { cancelledJoinees: { $in: [params.userData._id] } }],
                            isDeleted: false,
                            sessionType: LESSON_TYPE.group,
                            status: { $in: [SESSION_STATUS.refunded, SESSION_STATUS.cancelled_by_guru, SESSION_STATUS.cancelled_by_rookie] }
                        }
                        sessionsModel.find(criteria, {}, {})
                            .populate({ path: "requestedTo", select: "firstName lastName profilePic rating" })
                            .populate({ path: "requestedBy", select: "firstName lastName profilePic rating" })
                            .populate({ path: "joinees", select: "firstName lastName profilePic rating" })
                            .populate({ path: "skillId", select: "name parent", populate: { path: "parent", select: "name" } })
                            .exec(function(err, res) {

                                if (err) cb(err)
                                else {
                                    var x = Utils._.groupBy(res, function(obj) {
                                        return obj.groupLessonNumber
                                    })
                                    var map = Utils._.map(x, function(num) {
                                        return num
                                    })

                                    for (var i = 0; i < map.length; i++) {
                                        var totalCancellations = 0
                                        for (var j = 0; j < map[i].length; j++) {
                                            var length = map[i].length


                                            if (params.userData.userType == "2") {

                                                for (var k = 0; k < map[i][j].cancelledJoinees.length; k++) {
                                                    //map[i][j].totalCancellations = 0;

                                                    if (map[i][j].cancelledJoinees[k].toString() == params.userData._id.toString()) {
                                                        totalCancellations += 1
                                                    }
                                                }

                                            } else {
                                                totalCancellations = map[i][j].cancelledJoinees ? map[i][j].cancelledJoinees.length : 0
                                            }

                                            tmp.push({
                                                startDateTime: map[i][j].startDateTime,
                                                endDateTime: map[i][length - 1].endDateTime,
                                                title: map[i][j].title,
                                                status: map[i][j].status,
                                                sessionType: "group",
                                                ratePerRookie: map[i][j].ratePerRookie,
                                                lessonDetails: map[i][j].lessonDetails,
                                                Joinees: map[i][j].joinees,
                                                groupLessonNumber: map[i][j].groupLessonNumber,
                                                Skills: map[i][j].skillId,
                                                requestedBy: [map[i][j].requestedBy],
                                                requestedTo: [map[i][j].requestedTo],
                                                "rating": "",
                                                "feedback": "",
                                                "totalComplaints": 0,
                                                "totalRefunds": 0,
                                                "totalRejections": 0,
                                                totalCancellations: totalCancellations
                                            })
                                            break;
                                        }
                                    }

                                    cb(null, tmp)
                                }

                            })
                    }],
                    pagination: ["getCancelledLessons", function(data, cb) {
                        final = final.concat(data.getCancelledLessons)
                        params.totalCount = final.length

                        final = Utils._.sortBy(final, function(obj) {
                            return obj.endDateTime
                        }).reverse()

                        final = Utils._.chain(final)
                            .rest(params.skip || 0)
                            .first(params.limit || 10)

                        final = final._wrapped


                        cb(null, null)
                    }]
                },
                function(err, result) {
                    err ? callback(err) : callback(null, { status: "success", statusCode: 200, message: "Group lessons fetched successfully", totalCount: params.totalCount, data: final })
                })
        }

    },

    cancelGroupLessonGuru: function(params, callback) {
        Utils.async.auto({

                checkSessionId: [function(cb) {

                    sessionsModel.findOne({ groupLessonNumber: params.groupLessonNumber, sessionType: LESSON_TYPE.group, isDeleted: false, requestedBy: params.userId }, function(err, res) {
                        cb(err ? err : res == null ? { statusCode: 401, status: "warning", message: "This session doesn't belongs to you." } : null, res)
                    })
                }],
                checkIfAnyJoineeExists: [function(cb) {
                    Utils.universalFunctions.logger("If no joinee exists then cancel anytime")
                    Utils.universalFunctions.logger("If joinee exists then check if cancelling before 24 hrs then cancel otherwise not")

                    sessionsModel.findOne({ groupLessonNumber: params.groupLessonNumber, sessionType: LESSON_TYPE.group }, {}, { sort: { startDateTime: 1 } }, function(err, res) {
                        res.joinees && res.joinees.length == 0 ? params.cancel = true : params.cancel = false
                        cb(err ? err : null, res)
                    })
                }],
                checkIf24hrsBefore: ["checkIfAnyJoineeExists", function(data, cb) {
                    params.payment = false

                    if (params.cancel == false) {

                        var startTime = data.checkIfAnyJoineeExists.startDateTime
                        var currentTime = params.cancellationTime
                        //Because guru can cancel before 24 hrs only
                        var hrs = Utils.moment.duration("24:00").asSeconds(); //converting 24 hrs in seconds

                        var diff = startTime - currentTime

                        // If difference greater than 24 hrs then only refund rookie
                        diff >= hrs ? params.payment = true : callback({ statusCode: 401, status: "warning", message: "Group lesson cannot be cancelled now !" })
                        cb(null, params)
                    } else {
                        cb(null, params)
                    }
                }],
                initiateRefund: ["checkIfAnyJoineeExists", "checkSessionId", "checkIf24hrsBefore", function(data, cb) {
                    var objData = data.checkSessionId

                    if (params.payment == true) {
                        Utils.universalFunctions.logger("If payment already done then initiate refund")

                        Utils.async.eachSeries(data.checkIfAnyJoineeExists.joinees, function(item, Incb) {

                                Utils.async.auto({
                                    getUserStripeId: [function(cb) {

                                        userModel.findOne({ _id: item }, function(err, res) {
                                            res.stripeCustomerId ? params.stripeCustomerId = res.stripeCustomerId : null
                                            cb(err ? err : null, res)
                                        })
                                    }],
                                    getTransactionId: [function(cb) {

                                        sessionBookingsModel.findOne({ groupLessonNumber: params.groupLessonNumber, paymentDoneBy: item })
                                            .populate({ path: 'transactionDetails.transactionId' })
                                            .exec(function(err, res) {

                                                if (err) cb(err)
                                                else if (res == null) {
                                                    Incb()
                                                } else {

                                                    params.transactionData = res.transactionDetails[0].transactionId
                                                    cb(null, res)
                                                }
                                            })
                                    }],
                                    initiateRefund: ["getTransactionId", function(data, cb) {

                                        if (params.payment == true) {
                                            Utils.universalFunctions.logger("If payment already done then initiate refund")

                                            var obj = {
                                                charge: params.transactionData.chargeID,
                                                amount: Math.round(params.transactionData.metaData.stripeCharge.amount)
                                            }
                                            stripeService.refundCharge(obj, function(err, res) {

                                                if (err) {
                                                    var paymentStatus = "failed";
                                                    var errorMetaData = err;
                                                    if (err.raw) {
                                                        var stripeErrType = err.raw.type;
                                                        var stripeErrMessage = err.raw.message;
                                                    }
                                                    return callback({ statusCode: 401, status: 'warning', errorType: stripeErrType, message: stripeErrMessage })
                                                } else {
                                                    var paymentStatus = "success";
                                                    cb(null, res);
                                                }
                                            })
                                        } else {
                                            cb(null, params)
                                        }
                                    }],
                                    makeTransaction: ["initiateRefund", 'getUserStripeId', function(data, cb) {

                                        var objToSave = {
                                            groupLessonNumber: params.groupLessonNumber,
                                            stripeCustomerID: params.stripeCustomerId,
                                            metaData: data.initiateRefund,
                                            transactionType: TRANSACTION_TYPE.refund,
                                            paymentDoneBy: item,
                                            paymentDoneTo: data.getTransactionId.paymentDoneTo
                                        }

                                        objToSave.chargeID = data.initiateRefund.refundCharge.id ? data.initiateRefund.refundCharge.id : null;
                                        objToSave.transactionID = data.initiateRefund.refundCharge.balance_transaction ? data.initiateRefund.refundCharge.balance_transaction : null;
                                        objToSave.transactionStatus = data.initiateRefund.refundCharge.status ? data.initiateRefund.refundCharge.status : null;
                                        objToSave.currency = data.initiateRefund.refundCharge.currency ? data.initiateRefund.refundCharge.currency : null;
                                        objToSave.transactionDate = data.initiateRefund.refundCharge.created ? data.initiateRefund.refundCharge.created : null;

                                        transactionsModel(objToSave).save(function(err, res) {

                                            if (err) {
                                                Utils.universalFunctions.logger(err);
                                                cb(err);
                                            } else {
                                                cb(null, res);
                                            }
                                        });
                                    }],
                                    updateBookingStatus: ["makeTransaction", function(data, cb) {
                                        var objToSave = {}
                                        objToSave.paymentStatus = SESSION_STATUS.refunded

                                        var tmp = [{
                                            transactionId: data.makeTransaction._id,
                                            message: "Refund"
                                        }]

                                        var arr = [{
                                            "status": SESSION_STATUS.cancelled_by_guru,
                                            "updatedAt": Utils.moment().unix(),
                                        }, {
                                            "status": SESSION_STATUS.refunded,
                                            "updatedAt": Utils.moment().unix()
                                        }]

                                        objToSave.$addToSet = { statusHistory: { $each: arr }, transactionDetails: { $each: tmp } }

                                        sessionBookingsModel.update({ paymentDoneBy: item, groupLessonNumber: params.groupLessonNumber }, objToSave, { new: true, multi: true }, function(err, res) {
                                            cb(err ? err : null, res)
                                        })
                                    }],
                                    sendNotification: ["updateBookingStatus", function(data, cb) {
                                        var x = params.userDetails.firstName
                                        params.userDetails.firstName = x.charAt(0).toUpperCase() + x.slice(1)

                                        var startDate = Utils.moment(objData.startDateTime * 1000).format("YYYY-MM-DD HH:mm:ss")
                                        var message
                                        if (params.payment == true) {
                                            message = "Guru " + params.userDetails.firstName + " has cancelled the group lesson starting from " + startDate + " with the reason " + params.reason + " . Your refund has also been initiated for the lesson."
                                        } else {
                                            message = "Guru " + params.userDetails.firstName + " has cancelled the group lesson starting from " + startDate + " with the reason " + params.reason

                                        }

                                        var obj = {
                                            senderId: params.userDetails,
                                            receiverId: item,
                                            notificationEventType: NOTIFICATION_TYPE.cancel_group_lesson,
                                            groupLessonNumber: params.groupLessonNumber,
                                            createdAt: Utils.moment().unix(),
                                            saveInDb: true,
                                            message: message
                                        }

                                        Utils.universalFunctions.sendNotification(obj, "notification", function(err, res) {
                                            cb(err, data)
                                        })
                                    }],
                                    sendMail: ['updateBookingStatus', function(data, cb) {

                                        if (params.payment == true) {
                                            var subject = "Refund initiated for group lesson";

                                            var startDate = Utils.moment(objData.startDateTime * 1000).format("YYYY-MM-DD HH:mm:ss")

                                            var templatepath = Utils.path.join(__dirname, '../../../assets/emailTemplates/');
                                            var fileReadStream = Utils.fs.createReadStream(templatepath + 'notifications.html');

                                            var emailTemplate = '';

                                            fileReadStream.on('data', function(buffer) {
                                                emailTemplate += buffer.toString();
                                            });

                                            fileReadStream.on('end', function(res) {


                                                var message = "Guru " + params.userDetails.firstName + " has cancelled the group lesson starting on " + startDate + " ."

                                                var otherMessage = "We have successfully refunded you with the amount £" + objData.ratePerHour + " ."

                                                var sendStr = emailTemplate.replace('{{firstName}}', data.getUserStripeId.firstName).replace('{{message}}', message).replace('{{otherMessage}}', otherMessage)

                                                Utils.universalFunctions.sendMail(data.getUserStripeId.email, subject, sendStr)

                                                cb(null, null)

                                            });
                                        } else {
                                            cb(null, null)
                                        }

                                    }]

                                }, function(err, result) {
                                    Incb(err ? err : null, true)
                                })
                            },
                            function(err, result) {
                                cb(err ? err : null, params)
                            });


                    } else {
                        cb(null, params)
                    }
                }],
                updateSessionStatus: ["initiateRefund", function(data, cb) {
                    var objToSave = {
                        is_cancelled_by_guru: true
                    }
                    params.payment == true ? objToSave.status = SESSION_STATUS.refunded : objToSave.status = SESSION_STATUS.cancelled_by_guru

                    if (params.payment == true) {

                        var arr = [{
                            "status": SESSION_STATUS.cancelled_by_guru,
                            "updatedAt": Utils.moment().unix(),
                        }, {
                            "status": SESSION_STATUS.refunded,
                            "updatedAt": Utils.moment().unix()
                        }]

                        objToSave.$addToSet = { statusHistory: { $each: arr } }

                    } else {
                        objToSave.$push = {
                            statusHistory: {
                                "status": SESSION_STATUS.cancelled_by_guru,
                                "updatedAt": Utils.moment().unix()
                            }
                        }
                    }
                    params.reason ? objToSave.cancelReason = params.reason : null
                    params.cancelDescription ? objToSave.cancelDescription = params.description : null
                    objToSave.cancelledJoinees = data.checkSessionId.joinees

                    sessionsModel.update({ groupLessonNumber: params.groupLessonNumber, sessionType: LESSON_TYPE.group }, objToSave, { new: true, multi: true }, function(err, res) {
                        cb(err ? err : null, res)
                    })
                }],
                updateBookingStatus: ["initiateRefund", function(data, cb) {
                    if (params.payment == false) {
                        var objToSave = {}
                        objToSave.paymentStatus = SESSION_STATUS.cancelled_by_guru

                        params.reason ? objToSave.cancelReason = params.reason : null
                        params.cancelDescription ? objToSave.cancelDescription = params.description : null

                        objToSave.$push = {
                            statusHistory: {
                                "status": SESSION_STATUS.cancelled_by_guru,
                                "updatedAt": Utils.moment().unix()
                            }
                        }

                        // objToSave.$addToSet = { statusHistory: { $each: arr } }

                        sessionBookingsModel.update({ groupLessonNumber: params.groupLessonNumber }, objToSave, { new: true, multi: true }, function(err, res) {
                            cb(err ? err : null, res)
                        })
                    } else {
                        cb(null, null)
                    }
                }]
            },
            function(err, result) {
                callback(err ? err : { statusCode: 200, status: "success", message: "Cancelled successfully" });
            });
    },

    cancelGroupLessonRookie: function(params, callback) {
        Utils.async.auto({

            checkSessionId: [function(cb) {

                sessionsModel.findOne({ groupLessonNumber: params.groupLessonNumber, sessionType: LESSON_TYPE.group, isDeleted: false, joinees: { $in: [params.userId] } }, function(err, res) {
                    cb(err ? err : res == null ? { statusCode: 401, status: "warning", message: "This session doesn't belongs to you." } : null, res)
                })
            }],
            checkIfAnyJoineeExists: [function(cb) {
                Utils.universalFunctions.logger("get length of joinees in session")
                Utils.universalFunctions.logger("If only 1 rookie then change status in sessions else not")

                sessionsModel.findOne({ groupLessonNumber: params.groupLessonNumber, sessionType: LESSON_TYPE.group }, {}, { sort: { startDateTime: 1 } }, function(err, res) {
                    params.length = res.joinees.length
                    cb(err ? err : null, res)
                })
            }],
            checkIf24hrsBefore: ["checkIfAnyJoineeExists", function(data, cb) {

                var startTime = data.checkIfAnyJoineeExists.startDateTime
                var currentTime = params.cancellationTime
                //Because rookie can cancel before 24 hrs only
                var hrs = Utils.moment.duration("24:00").asSeconds(); //converting 24 hrs in seconds

                var diff = startTime - currentTime

                // If difference greater than 24 hrs then only refund rookie
                diff >= hrs ? params.payment = true : params.payment = false
                cb(null, params)
            }],
            getTransactionId: ["checkIfAnyJoineeExists", "checkSessionId", function(data, cb) {

                if (params.payment == true) {
                    Utils.universalFunctions.logger("If payment already done then initiate refund")
                    sessionBookingsModel.findOne({ groupLessonNumber: params.groupLessonNumber, paymentDoneBy: params.userId })
                        .populate({ path: 'transactionDetails.transactionId' })
                        .exec(function(err, res) {

                            if (err) cb(err)
                            else if (res == null) {
                                Incb()
                            } else {
                                params.transactionData = res.transactionDetails[0].transactionId
                                cb(null, res)
                            }
                        })
                } else {
                    cb(null, params)
                }
            }],
            initiateRefund: ["getTransactionId", function(data, cb) {

                if (params.payment == true) {
                    Utils.universalFunctions.logger("If payment already done then initiate refund")

                    var obj = {
                        charge: params.transactionData.chargeID,
                        amount: Math.round(params.transactionData.metaData.stripeCharge.amount)
                    }
                    stripeService.refundCharge(obj, function(err, res) {

                        if (err) {
                            var paymentStatus = "failed";
                            var errorMetaData = err;
                            if (err.raw) {
                                var stripeErrType = err.raw.type;
                                var stripeErrMessage = err.raw.message;
                            }
                            return callback({ statusCode: 401, status: 'warning', errorType: stripeErrType, message: stripeErrMessage })
                        } else {
                            var paymentStatus = "success";
                            cb(null, res);
                        }
                    })
                } else {
                    cb(null, params)
                }
            }],
            makeTransaction: ["initiateRefund", function(data, cb) {
                if (params.payment == true) {
                    var objToSave = {
                        groupLessonNumber: params.groupLessonNumber,
                        stripeCustomerID: params.userDetails.stripeCustomerId,
                        metaData: data.initiateRefund,
                        transactionType: TRANSACTION_TYPE.refund,
                        requestStatus: REQUEST_STATUS.completed,
                        paymentDoneBy: params.userId,
                        paymentDoneTo: data.getTransactionId.paymentDoneTo
                    }

                    objToSave.chargeID = data.initiateRefund.refundCharge.id ? data.initiateRefund.refundCharge.id : null;
                    objToSave.transactionID = data.initiateRefund.refundCharge.balance_transaction ? data.initiateRefund.refundCharge.balance_transaction : null;
                    objToSave.transactionStatus = data.initiateRefund.refundCharge.status ? data.initiateRefund.refundCharge.status : null;
                    objToSave.currency = data.initiateRefund.refundCharge.currency ? data.initiateRefund.refundCharge.currency : null;
                    objToSave.transactionDate = data.initiateRefund.refundCharge.created ? data.initiateRefund.refundCharge.created : null;

                    transactionsModel(objToSave).save(function(err, res) {

                        if (err) {
                            Utils.universalFunctions.logger(err);
                            cb(err);
                        } else {
                            cb(null, res);
                        }
                    });
                } else {
                    cb(null, params)
                }
            }],
            updateSessionStatus: ["initiateRefund", function(data, cb) {
                var objToSave = {}

                params.payment == true && params.length == 1 ? objToSave.status = SESSION_STATUS.refunded : null
                objToSave.$pull = { joinees: params.userId }

                if (params.payment == true) {
                    var arr = [{
                        "status": SESSION_STATUS.cancelled_by_rookie,
                        "updatedAt": Utils.moment().unix(),
                    }, {
                        "status": SESSION_STATUS.refunded,
                        "updatedAt": Utils.moment().unix()
                    }]

                    objToSave.$addToSet = { statusHistory: { $each: arr } }

                } else {
                    objToSave.$push = {
                        statusHistory: {
                            "status": SESSION_STATUS.cancelled_by_rookie,
                            "updatedAt": Utils.moment().unix()
                        }
                    }
                }
                params.reason ? objToSave.cancelReason = params.reason : null
                params.cancelDescription ? objToSave.cancelDescription = params.description : null
                objToSave.$push = { cancelledJoinees: params.userId }

                sessionsModel.update({ groupLessonNumber: params.groupLessonNumber, sessionType: LESSON_TYPE.group }, objToSave, { new: true, multi: true }, function(err, res) {
                    cb(err ? err : null, res)
                })
            }],
            updateBookingStatus: ["makeTransaction", function(data, cb) {
                var objToSave = {}

                params.payment == true ? objToSave.paymentStatus = SESSION_STATUS.refunded : objToSave.paymentStatus = SESSION_STATUS.cancelled_by_rookie

                if (params.payment == true) {
                    var arr = [{
                        "status": SESSION_STATUS.cancelled_by_rookie,
                        "updatedAt": Utils.moment().unix(),
                    }, {
                        "status": SESSION_STATUS.refunded,
                        "updatedAt": Utils.moment().unix()
                    }]

                    var tmp = [{
                        transactionId: data.makeTransaction._id,
                        message: "Refund"
                    }]

                    objToSave.$addToSet = { statusHistory: { $each: arr }, transactionDetails: { $each: tmp } }
                } else {
                    objToSave.$push = {
                        statusHistory: {
                            "status": SESSION_STATUS.cancelled_by_rookie,
                            "updatedAt": Utils.moment().unix()
                        }
                    }
                }
                params.reason ? objToSave.cancelReason = params.reason : null
                params.cancelDescription ? objToSave.cancelDescription = params.description : null

                sessionBookingsModel.update({ paymentDoneBy: params.userId, groupLessonNumber: params.groupLessonNumber }, objToSave, { new: true, multi: true }, function(err, res) {
                    cb(err ? err : null, res)
                })
            }],
            sendNotification: ["updateBookingStatus", function(data, cb) {
                var x = params.userDetails.firstName
                params.userDetails.firstName = x.charAt(0).toUpperCase() + x.slice(1)

                var startDate = Utils.moment(data.checkSessionId.startDateTime * 1000).format("YYYY-MM-DD HH:mm:ss")

                var obj = {
                    senderId: params.userDetails,
                    receiverId: data.checkSessionId.requestedTo,
                    notificationEventType: NOTIFICATION_TYPE.cancel_group_lesson,
                    groupLessonNumber: params.groupLessonNumber,
                    createdAt: Utils.moment().unix(),
                    saveInDb: true,
                    message: "Rookie " + params.userDetails.firstName + " has cancelled the group lesson starting from " + startDate
                }

                Utils.universalFunctions.sendNotification(obj, "notification", function(err, res) {
                    cb(err, data)
                })
            }],
            sendMail: ['updateBookingStatus', function(data, cb) {

                if (params.payment == true) {
                    var subject = "Refund initiated for group lesson";

                    var startDate = Utils.moment(data.checkSessionId.startDateTime * 1000).format("YYYY-MM-DD HH:mm:ss")

                    var templatepath = Utils.path.join(__dirname, '../../../assets/emailTemplates/');
                    var fileReadStream = Utils.fs.createReadStream(templatepath + 'notifications.html');

                    var emailTemplate = '';

                    fileReadStream.on('data', function(buffer) {
                        emailTemplate += buffer.toString();
                    });

                    fileReadStream.on('end', function(res) {


                        var message = "We have successfully fulfilled your request to cancel the group lesson starting on " + startDate

                        var otherMessage = "We have successfully refunded you with the amount £" + data.checkSessionId.ratePerRookie + " ."

                        var sendStr = emailTemplate.replace('{{firstName}}', params.userDetails.firstName).replace('{{message}}', message).replace('{{otherMessage}}', otherMessage)

                        Utils.universalFunctions.sendMail(params.userDetails.email, subject, sendStr)

                        cb(null, null)

                    });
                } else {
                    var subject = "Group lesson cancelled";

                    var startDate = Utils.moment(data.checkSessionId.startDateTime * 1000).format("YYYY-MM-DD HH:mm:ss")

                    var templatepath = Utils.path.join(__dirname, '../../../assets/emailTemplates/');
                    var fileReadStream = Utils.fs.createReadStream(templatepath + 'notifications.html');

                    var emailTemplate = '';

                    fileReadStream.on('data', function(buffer) {
                        emailTemplate += buffer.toString();
                    });

                    fileReadStream.on('end', function(res) {

                        var message = "We have successfully fulfilled your request to cancel the group lesson starting on " + startDate

                        var otherMessage = "But you won't get any refund for the lesson because cancelling the lesson within 24 hours of starting is not in the Virtual Classroom's policies. "

                        var sendStr = emailTemplate.replace('{{firstName}}', params.userDetails.firstName).replace('{{message}}', message).replace('{{otherMessage}}', otherMessage)

                        Utils.universalFunctions.sendMail(params.userDetails.email, subject, sendStr)

                        cb(null, null)
                    });

                }

            }]
        }, function(err, result) {
            var message;
            params.payment == true ? message = "Booking cancelled and refund has been initiated" : message = "Booking cancelled and refund will not be initiated."
            callback(err ? err : { statusCode: 200, status: "success", message: message });
        });
    },

    guruRemoveRejectRequests: function(params, callback) {
        Utils.async.auto({
            updateDb: [function(cb) {

                if (params.type == 1) {

                    sessionsModel.findOneAndUpdate({ _id: params.sessionId, $or: [{ status: SESSION_STATUS.rejected }, { status: SESSION_STATUS.expired }] }, { isDeleted: true }, { new: true }, function(err, res) {
                        cb(err ? err : res == null ? { statusCode: 401, status: "error", message: "Can only remove rejected requests" } : null, res)
                    })

                } else {
                    sessionsModel.findOneAndUpdate({ _id: params.sessionId, status: { $in: [SESSION_STATUS.pending, SESSION_STATUS.accepted] } }, { status: SESSION_STATUS.rejected }, { new: true }, function(err, res) {
                        cb(err ? err : res == null ? { statusCode: 401, status: "error", message: "Can only cancel requests in accepted or pending state" } : null, res)
                    })
                }
            }]
        }, function(err, result) {
            callback(err ? err : null, { statusCode: 200, status: "success", message: "Updated successfully" });
        });
    },

    getCountOfLessonsScheduled: function(params, callback) {
        var count = 0,
            tmp = []
        Utils.async.auto({
            getCountOfLessonsScheduled: [function(cb) {

                var criteria = {
                    $or: [{ requestedBy: params.userId }, { requestedTo: params.userId }, { joinees: { $in: [params.userId] } }],
                    status: SESSION_STATUS.payment_done,
                    startDateTime: { $gte: params.currentTime },
                    isDeleted: false
                }

                sessionsModel.find(criteria, function(err, res) {
                    if (res) {
                        for (var i = 0; i < res.length; i++) {
                            if (res[i].sessionType == "one-one") {
                                count++
                            } else {
                                tmp.push(res[i])
                            }
                        }
                        var x = Utils._.uniq(tmp, function(obj) {
                            return obj.groupLessonNumber
                        })

                        count = count + x.length
                    }
                    cb(err ? err : null, res)
                })
            }],
            getGroupLessonsThatAreOnlyRequested: ["getCountOfLessonsScheduled", function(data, cb) {

                var criteria = {
                    requestedTo: params.userId,
                    status: SESSION_STATUS.accepted,
                    isDeleted: false,
                    sessionType: "group",
                    startDateTime: { $gte: params.currentTime }
                }
                sessionsModel.find(criteria, function(err, res) {
                    count += res.length
                    cb(null, data)
                })

            }]
        }, function(err, result) {
            callback(err ? err : null, { statusCode: 200, status: "success", message: "Fetched successfully", data: count });
        });
    },

    getCountOfLessonsCompleted: function(params, callback) {
        var count = 0,
            tmp = []
        Utils.async.auto({
            getCountOfLessonsCompleted: [function(cb) {

                var criteria = {
                    $or: [{ requestedBy: params.userId }, { requestedTo: params.userId }, { joinees: { $in: [params.userId] } }],
                    status: { $in: [SESSION_STATUS.payment_done, SESSION_STATUS.completed, SESSION_STATUS.refunded] },
                    endDateTime: { $lte: params.currentTime },
                    isDeleted: false
                }

                sessionsModel.find(criteria, function(err, res) {
                    if (res) {
                        for (var i = 0; i < res.length; i++) {
                            if (res[i].sessionType == "one-one") {
                                count++
                            } else {
                                tmp.push(res[i])
                            }
                        }

                        // var x = Utils._.uniq(tmp, function(obj) {
                        //     return obj.groupLessonNumber
                        // })

                        // console.log('x==',x)

                        // count = count + x.length

                    }
                    cb(err ? err : null, res)
                })
            }],
            checkDates: ['getCountOfLessonsCompleted', function(data, cb) {
                var final = []
                tmp = Utils._.uniq(tmp, function(obj) {
                    return obj.groupLessonNumber
                })

                Utils.async.eachSeries(tmp, function(item, Incb) {
                        sessionsModel.find({ groupLessonNumber: item.groupLessonNumber }, {}, { sort: { startDateTime: -1 } }, function(err, res) {
                            if (err) Incb(err)
                            else {
                                if (res.length > 0) {
                                    var length = res.length
                                    var i = 0

                                    item.startDateTime = res[length - 1].startDateTime
                                    item.endDateTime = res[i].endDateTime
                                    if (item.endDateTime <= params.currentTime) {
                                        final.push(item)
                                    }
                                }
                                Incb();
                            }
                        })
                    },
                    function(err, result) {
                        count = count + final.length
                        cb(err ? err : null, null)
                    });

            }],
            getCancelledLessons: ['checkDates', function(data, cb) {

                var criteria = {
                    $or: [{ requestedBy: params.userId }, { requestedTo: params.userId }, { joinees: { $in: [params.userId] } }, { cancelledJoinees: { $in: [params.userId] } }],
                    isDeleted: false,
                    // sessionType: LESSON_TYPE.group,
                    status: { $in: [SESSION_STATUS.refunded, SESSION_STATUS.cancelled_by_guru, SESSION_STATUS.cancelled_by_rookie] }
                }
                sessionsModel.find(criteria, {}, {})
                    .populate({ path: "requestedTo", select: "firstName lastName profilePic rating" })
                    .populate({ path: "requestedBy", select: "firstName lastName profilePic rating" })
                    .populate({ path: "joinees", select: "firstName lastName profilePic rating" })
                    .populate({ path: "skillId", select: "name parent", populate: { path: "parent", select: "name" } })
                    .exec(function(err, res) {

                        if (err) cb(err)
                        else {

                            var x = Utils._.uniq(res, function(obj) {
                                return obj.groupLessonNumber
                            })

                            count = count + x.length

                            cb(null, res)
                        }

                    })
            }],
        }, function(err, result) {
            callback(err ? err : null, { statusCode: 200, status: "success", message: "Fetched successfully", data: count });
        });
    },

    getTodaysSession: function(params, callback) {

        //var startTime = moment(params.currentTime * 1000).startOf('day').unix()
        var endTime = moment(params.currentTime * 1000).endOf('day').unix()

        Utils.async.auto({
                getSessionsTotalCount: [function(cb) {

                    var criteria = {
                        $or: [{ requestedBy: params.userId }, { requestedTo: params.userId }, { joinees: { $in: [params.userId] } }],
                        status: SESSION_STATUS.payment_done,
                        //startDateTime: { $gte: params.currentTime },
                        endDateTime: { $gte: params.currentTime, $lte: endTime }
                    }

                    sessionsModel.find(criteria, function(err, res) {
                        cb(err ? err : null, res.length)
                    })
                }],
                getSessionsData: [function(cb) {

                    var criteria = {
                        $or: [{ requestedBy: params.userId }, { requestedTo: params.userId }, { joinees: { $in: [params.userId] } }],
                        status: SESSION_STATUS.payment_done,
                        //startDateTime: { $gte: params.currentTime },
                        //endDateTime: { $lte: endTime }
                        endDateTime: { $gte: params.currentTime, $lte: endTime }
                    }
                    var projection = {
                        requestedTo: 1,
                        requestedBy: 1,
                        startDateTime: 1,
                        endDateTime: 1,
                        comments: 1,
                        skillId: 1,
                        groupLessonNumber: 1,
                        ratePerRookie: 1,
                        sessionType: 1,
                        joinees: 1,
                        ratePerHour: 1,
                        lessonDetails: 1,
                        title: 1,
                        callStatus: 1,
                        isCallInitiatedGuru: 1,
                        isCallInitiatedRookie: 1
                    }
                    var populate = [{
                            path: 'requestedTo',
                            select: 'firstName lastName profilePic  bio'
                        },
                        {
                            path: 'requestedBy',
                            select: 'firstName lastName profilePic  bio'
                        },
                        {
                            path: 'comments.created_by',
                            select: { userType: 1, firstName: 1, lastName: 1, profilePic: 1, hourlyRate: 1, bio: 1 }
                        }, {
                            path: 'skillId',
                            select: { name: 1, _id: 0, parent: 1 },
                            populate: {
                                path: "parent",
                                select: { name: 1, _id: 0 }
                            }
                        },
                        {
                            path: 'joinees',
                            select: 'firstName lastName profilePic'
                        },
                    ]

                    sessionsModel.find(criteria, projection, { sort: { startDateTime: 1 }, skip: params.skip || 0, limit: params.limit || 30, lean: true })
                        .populate(populate)
                        .exec(function(err, res) {
                            for (var i = 0; i < res.length; i++) {
                                var skills = []
                                res[i].subjects = res[i].skillId[0].parent.name

                                for (var j = 0; j < res[i].skillId.length; j++) {
                                    skills.push(res[i].skillId[j].name)
                                }
                                res[i].skills = skills
                                delete res[i].skillId

                                // console.log(res[i].requestedTo._id.toString(), params.userId.toString())

                                if (res[i].sessionType == "group" && res[i].requestedBy._id.toString() == params.userId.toString()) {
                                    !res[i].callStatus ? res[i].callStatus = "Make Call" : null;
                                } else if (res[i].sessionType == "group" && res[i].requestedBy._id.toString() != params.userId.toString()) {
                                    res[i].callStatus = "Join Call"
                                } else if (res[i].sessionType == "one-one" && res[i].requestedTo._id.toString() == params.userId.toString()) {
                                    !res[i].callStatus ? res[i].callStatus = "Make Call" : null;
                                } else if (res[i].sessionType == "one-one" && res[i].requestedTo._id.toString() != params.userId.toString()) {
                                    res[i].callStatus = "Join Call"
                                }

                                !res[i].isCallInitiatedGuru ? res[i].isCallInitiatedGuru = false : null;
                                !res[i].isCallInitiatedRookie ? res[i].isCallInitiatedRookie = false : null;
                            }
                            cb(err ? err : null, res)
                        })
                }],
                checkDates: ['getSessionsData', "getSessionsTotalCount", function(data, cb) {

                    Utils.async.eachSeries(data.getSessionsData, function(item, Incb) {
                            if (item.sessionType == "group") {
                                sessionsModel.find({ groupLessonNumber: item.groupLessonNumber }, {}, { sort: { startDateTime: -1 } }, function(err, res) {
                                    if (err) Incb(err)
                                    else {
                                        if (res.length > 0) {
                                            var length = res.length
                                            var i = 0

                                            item.startDateTime = res[length - 1].startDateTime
                                            item.endDateTime = res[i].endDateTime

                                        }
                                        Incb();
                                    }
                                })
                            } else {
                                Incb()
                            }
                        },
                        function(err, result) {
                            cb(err ? err : null, result)
                        });

                }],
            },
            function(err, result) {
                callback(err ? err : null, { statusCode: 200, status: "success", message: "Fetched successfully", totalCount: result.getSessionsTotalCount, data: result.getSessionsData });
            });
    },
    getDataOfLessonsScheduled: function(params, callback) {
        Utils.async.auto({
                getSessionsTotalCount: [function(cb) {

                    var criteria = {
                        $or: [{ requestedBy: params.userId }, { requestedTo: params.userId }, { joinees: { $in: [params.userId] } }],
                        status: SESSION_STATUS.payment_done,
                        startDateTime: { $gte: params.currentTime },
                        isDeleted: false
                    }

                    sessionsModel.find(criteria, function(err, res) {
                        cb(err ? err : null, res.length)
                    })
                }],
                getSessionsData: [function(cb) {

                    var criteria = {
                        $or: [{ requestedBy: params.userId }, { requestedTo: params.userId }, { joinees: { $in: [params.userId] } }],
                        status: SESSION_STATUS.payment_done,
                        startDateTime: { $gte: params.currentTime },
                        isDeleted: false
                    }
                    var projection = {
                        requestedTo: 1,
                        requestedBy: 1,
                        startDateTime: 1,
                        endDateTime: 1,
                        comments: 1,
                        skillId: 1,
                        groupLessonNumber: 1,
                        ratePerRookie: 1,
                        sessionType: 1,
                        joinees: 1,
                        ratePerHour: 1,
                        lessonDetails: 1,
                        title: 1
                    }
                    var populate = [{
                            path: 'requestedTo',
                            select: 'firstName lastName profilePic  bio blockedList'
                        },
                        {
                            path: 'requestedBy',
                            select: 'firstName lastName profilePic bio blockedList'
                        },
                        {
                            path: 'comments.created_by',
                            select: { userType: 1, firstName: 1, lastName: 1, profilePic: 1, hourlyRate: 1, bio: 1 }
                        }, {
                            path: 'skillId',
                            select: { name: 1, _id: 0, parent: 1 },
                            populate: {
                                path: "parent",
                                select: { name: 1, _id: 0 }
                            }
                        },
                        {
                            path: 'joinees',
                            select: 'firstName lastName profilePic blockedList'
                        },
                    ]

                    sessionsModel.find(criteria, projection, { sort: { startDateTime: 1 }, skip: params.skip || 0, limit: params.limit || 30, lean: true })
                        .populate(populate)
                        .exec(function(err, res) {
                            for (var i = 0; i < res.length; i++) {
                                var skills = []
                                var isBlocked = false
                                res[i].subjects = res[i].skillId[0].parent.name

                                for (var j = 0; j < res[i].skillId.length; j++) {
                                    skills.push(res[i].skillId[j].name)
                                }
                                res[i].skills = skills
                                delete res[i].skillId

                                if (res[i].sessionType == "one-one" && res[i].requestedTo.blockedList && res[i].requestedTo.blockedList.length > 0) {
                                    for (var j = 0; j < res[i].requestedTo.blockedList.length; j++) {
                                        res[i].requestedTo.blockedList[j] = res[i].requestedTo.blockedList[j].toString()
                                    }
                                    isBlocked = Utils._.contains(res[i].requestedTo.blockedList, res[i].requestedBy._id.toString());
                                    //console.log(isBlocked, '====', Utils._.contains(res[i].requestedTo.blockedList, res[i].requestedBy._id.toString()))
                                    res[i]["isUserBlocked"] = isBlocked
                                }
                                if (res[i].sessionType == "group" && res[i].requestedTo.blockedList && res[i].requestedTo.blockedList.length > 0) {
                                    for (var j = 0; j < res[i].requestedTo.blockedList.length; j++) {
                                        res[i].requestedTo.blockedList[j] = res[i].requestedTo.blockedList[j].toString()
                                    }

                                    isBlocked = Utils._.contains(res[i].requestedTo.blockedList, params.userId);
                                    res[i]["isUserBlocked"] = isBlocked
                                }
                            }
                            cb(err ? err : null, res)
                        })
                }],
            },
            function(err, result) {
                callback(err ? err : null, { statusCode: 200, status: "success", message: "Fetched successfully", totalCount: result.getSessionsTotalCount, data: result.getSessionsData });
            });
    },

    getDataOfLessonsCompleted: function(params, callback) {
        Utils.async.auto({
                getSessionsTotalCount: [function(cb) {

                    var criteria = {
                        $or: [{ requestedBy: params.userId }, { requestedTo: params.userId }, { joinees: { $in: [params.userId] } }],
                        status: SESSION_STATUS.payment_done,
                        endDateTime: { $lte: params.currentTime },
                        isDeleted: false
                    }

                    sessionsModel.find(criteria, function(err, res) {
                        cb(err ? err : null, res.length)
                    })
                }],
                getSessionsData: [function(cb) {

                    var criteria = {
                        $or: [{ requestedBy: params.userId }, { requestedTo: params.userId }, { joinees: { $in: [params.userId] } }],
                        status: SESSION_STATUS.payment_done,
                        endDateTime: { $lte: params.currentTime },
                        isDeleted: false
                    }
                    var projection = {
                        requestedTo: 1,
                        requestedBy: 1,
                        startDateTime: 1,
                        endDateTime: 1,
                        comments: 1,
                        skillId: 1,
                        groupLessonNumber: 1,
                        ratePerRookie: 1,
                        sessionType: 1,
                        joinees: 1,
                        ratePerHour: 1,
                        lessonDetails: 1,
                        title: 1
                    }
                    var populate = [{
                            path: 'requestedTo',
                            select: 'firstName lastName profilePic  bio'
                        },
                        {
                            path: 'requestedBy',
                            select: 'firstName lastName profilePic  bio'
                        },
                        {
                            path: 'comments.created_by',
                            select: { userType: 1, firstName: 1, lastName: 1, profilePic: 1, hourlyRate: 1, bio: 1 }
                        }, {
                            path: 'skillId',
                            select: { name: 1, _id: 0, parent: 1 },
                            populate: {
                                path: "parent",
                                select: { name: 1, _id: 0 }
                            }
                        },
                        {
                            path: 'joinees',
                            select: 'firstName lastName profilePic'
                        },
                    ]

                    sessionsModel.find(criteria, projection, { sort: { startDateTime: 1 }, skip: params.skip || 0, limit: params.limit || 30, lean: true })
                        .populate(populate)
                        .exec(function(err, res) {
                            for (var i = 0; i < res.length; i++) {
                                var skills = []
                                res[i].subjects = res[i].skillId[0].parent.name

                                for (var j = 0; j < res[i].skillId.length; j++) {
                                    skills.push(res[i].skillId[j].name)
                                }
                                res[i].skills = skills
                                delete res[i].skillId
                            }
                            cb(err ? err : null, res)
                        })
                }],
            },
            function(err, result) {
                callback(err ? err : null, { statusCode: 200, status: "success", message: "Fetched successfully", totalCount: result.getSessionsTotalCount, data: result.getSessionsData });
            });
    },

    listAllGroupLessonsOfGuru: function(params, callback) {
        var arr = [],
            final = []
        Utils.async.auto({
            getAllLessons: [function(cb) {

                var criteria = {
                    requestedBy: params.guruId,
                    endDateTime: { $gte: params.currentTime },
                    isDeleted: false,
                    sessionType: "group",
                    status: { $ne: SESSION_STATUS.cancelled_by_guru },
                    is_cancelled_by_guru: false,
                    cancelledJoinees: { $ne: params.guruId }
                }

                if (params.startDate && params.endDate) {
                    criteria.$and = [{ startDateTime: { $gte: params.startDate } }, { endDateTime: { $lte: params.endDate } }]
                }

                sessionsModel.find(criteria, { totalSeats: 1, groupLessonNumber: 1, skillId: 1, title: 1, lessonDetails: 1, joinees: 1, ratePerRookie: 1, startDateTime: 1, endDateTime: 1 }, { lean: true, sort: { createdAt: -1 } })
                    .populate({ path: "joinees", select: "profilePic firstName" })
                    .populate({ path: "skillId", select: "name parent", populate: { path: "parent", select: "name" } })
                    .exec(function(err, res) {
                        if (err) cb(err)
                        else {

                            var x = Utils._.groupBy(res, function(obj) {
                                return obj.groupLessonNumber
                            })
                            var map = Utils._.map(x, function(num) {
                                return num
                            })

                            //console.log('map============',map)

                            for (var i = 0; i < map.length; i++) {
                                for (var j = 0; j < map[i].length; j++) {
                                    var length = map[i].length
                                    arr.push({
                                        startDateTime: map[i][j].startDateTime,
                                        endDateTime: map[i][length - 1].endDateTime,
                                        title: map[i][j].title,
                                        totalSeats: map[i][j].totalSeats,
                                        ratePerRookie: map[i][j].ratePerRookie,
                                        lessonDetails: map[i][j].lessonDetails,
                                        joinees: map[i][j].joinees,
                                        groupLessonNumber: map[i][j].groupLessonNumber,
                                        skillId: map[i][j].skillId,
                                    })
                                    break;
                                }
                            }


                            for (var i = 0; i < arr.length; i++) {

                                for (var j = 0; j < arr[i].joinees.length; j++) {
                                    arr[i].joinees[j]._id = arr[i].joinees[j]._id.toString()
                                }

                                let check = arr[i].joinees.some(function(element, index) {
                                    return element._id === params.userId.toString();
                                });

                                check == true ? arr[i]["buttonText"] = "Already Booked" : arr[i]["buttonText"] = "Book"

                                if (arr[i].joinees.length == arr[i].totalSeats)
                                    arr[i]["buttonText"] = "All seats booked"

                                arr[i]["subject"] = arr[i].skillId[0].parent.name

                                if (params.subject && params.subject != "") {
                                    if (arr[i]['subject'].toLowerCase() == params.subject.toLowerCase()) {
                                        final.push(arr[i])
                                    }

                                } else {
                                    final.push(arr[i])
                                }
                            }

                            params.totalCount = final.length

                            final = Utils._.chain(final)
                                .rest(params.skip || 0)
                                .first(params.limit || 10)

                            final = final._wrapped

                            cb(null, final)
                        }

                    })
            }],
            getGuruDetails: [function(cb) {
                userModel.findOne({ _id: params.guruId }, { rating: 1, hourlyRate: 1, firstName: 1, lastName: 1, profilePic: 1 }, function(err, res) {
                    cb(err ? err : null, res)
                })
            }]
        }, function(err, result) {
            callback(err ? err : null, { statusCode: 200, status: "success", message: "Fetched successfully", totalCount: params.totalCount, data: result.getAllLessons, getGuruDetails: result.getGuruDetails });
        });
    },

    listLessonsForFeedbacks: function(params, callback) {
        var arr = [],
            tmp = [],
            final = []
        Utils.async.auto({
            getLessons: [function(cb) {
                var session
                params.type == 1 ? session = "one-one" : session = "group"

                sessionsModel.find({
                        endDateTime: { $lte: params.currentTime },
                        ratingFeedbacks: {
                            $elemMatch: {
                                userId: params.userId,
                                $or: [{ feedback: { $exists: false } }, { rating: { $exists: false } }]
                            }
                        },
                        $or: [
                            { requestedBy: params.userId },
                            { joinees: { $in: [params.userId] } }
                        ],
                        status: "payment done",
                        sessionType: session
                    }, { comments: 1, title: 1, lessonDetails: 1, groupLessonNumber: 1, startDateTime: 1, endDateTime: 1, joinees: 1, sessionType: 1, ratingFeedbacks: 1, requestedTo: 1, skillId: 1 }, { lean: true, sort: { endDateTime: -1 } })
                    .populate({ path: "requestedTo", select: "firstName lastName profilePic rating" })
                    .populate({ path: "joinees", select: "firstName lastName profilePic" })
                    .populate({ path: "comments.created_by", select: "firstName lastName profilePic" })
                    .populate({ path: "skillId", select: "name parent", populate: { path: 'parent', select: "name" } })
                    .exec(function(err, res) {
                        if (err) cb(err)
                        else {
                            for (var i = 0; i < res.length; i++) {
                                if (res[i].sessionType == "one-one") {
                                    arr.push(res[i])
                                } else {
                                    tmp.push(res[i])
                                }
                            }
                            var x = Utils._.groupBy(tmp, function(obj) {
                                return obj.groupLessonNumber
                            })
                            var map = Utils._.map(x, function(num) {
                                return num
                            })
                            for (var i = 0; i < map.length; i++) {
                                for (var j = 0; j < map[i].length; j++) {
                                    var length = map[i].length
                                    arr.push({
                                        requestedTo: map[i][j].requestedTo,
                                        skillId: map[i][j].skillId,
                                        joinees: map[i][j].joinees,
                                        sessionType: map[i][j].sessionType,
                                        ratingFeedbacks: map[i][j].ratingFeedbacks,
                                        startDateTime: map[i][j].startDateTime,
                                        endDateTime: map[i][j].endDateTime,
                                        groupLessonNumber: map[i][j].groupLessonNumber
                                    })
                                    break;
                                }
                            }

                            // params.totalCount = arr.length

                            // arr = Utils._.chain(arr)
                            //     .rest(params.skip || 0)
                            //     .first(params.limit || 30)

                            // arr = arr._wrapped

                            for (var i = 0; i < arr.length; i++) {
                                for (var j = 0; j < arr[i].ratingFeedbacks.length; j++) {
                                    if (arr[i].ratingFeedbacks[j].userId.toString() == params.userId.toString()) {
                                        arr[i].rating = arr[i].ratingFeedbacks[j].rating ? arr[i].ratingFeedbacks[j].rating : "",
                                            arr[i].feedback = arr[i].ratingFeedbacks[j].feedback ? arr[i].ratingFeedbacks[j].feedback : ""
                                    }
                                    break;
                                }
                                delete arr[i].ratingFeedbacks
                            }
                            cb(null, arr)
                        }

                    })
            }],
            checkDates: ['getLessons', function(data, cb) {

                if (params.type == 2) {

                    Utils.async.eachSeries(arr, function(item, Incb) { //console.log('item.groupLessonNumber---',item.groupLessonNumber)
                            sessionsModel.find({ groupLessonNumber: item.groupLessonNumber }, {}, { sort: { startDateTime: -1 } }, function(err, res) {
                                if (err) Incb(err)
                                else {
                                    if (res.length > 0) {
                                        var length = res.length
                                        var i = 0

                                        item.startDateTime = res[length - 1].startDateTime
                                        item.endDateTime = res[i].endDateTime
                                        if (item.endDateTime <= params.currentTime) {
                                            final.push(item)
                                        }
                                    }
                                    Incb();
                                }
                            })
                        },
                        function(err, result) {
                            params.totalCount = final.length

                            final = Utils._.chain(final)
                                .rest(params.skip || 0)
                                .first(params.limit || 10)

                            final = final._wrapped
                            cb(err ? err : null, result)
                        });
                } else {

                    params.totalCount = arr.length

                    arr = Utils._.chain(arr)
                        .rest(params.skip || 0)
                        .first(params.limit || 10)

                    final = arr._wrapped
                    cb(null, null)
                }

            }]
        }, function(err, result) {
            callback(err ? err : null, { statusCode: 200, status: "success", message: "Fetched successfully", totalCount: params.totalCount, data: final });
        });
    },

    giveFeedbackOnSession: function(params, callback) {
        Utils.async.auto({
            checkIfAlreadyExists: [function(cb) {

                if (params.sessionType == "one-one") {

                    sessionsModel.findOne({ _id: params.sessionId })
                        .populate({ path: "requestedTo", select: 'rating deviceDetails' })
                        .exec(function(err, res) {
                            if (err) cb(err)
                            else if (res == null) {
                                cb({ statusCode: 401, status: 'warning', message: "Invalid session id" })
                            } else {
                                cb(null, res)
                            }
                        })
                } else {

                    sessionsModel.findOne({ groupLessonNumber: params.sessionId }, {}, { sort: { endDateTime: -1 } })
                        .populate({ path: "requestedTo", select: 'rating deviceDetails' })
                        .exec(function(err, res) {
                            if (err) cb(err)
                            else if (res == null) {
                                cb({ statusCode: 401, status: 'warning', message: "Invalid groupLessonNumber" })
                            } else {
                                cb(null, res)
                            }
                        })
                }
            }],
            saveRating: ["checkIfAlreadyExists", function(data, cb) {
                if (params.rating) {

                    var rating = data.checkIfAlreadyExists.requestedTo.rating
                    var totalRating = rating.totalRating + params.rating
                    var noOfRatings = rating.noOfRatings + 1

                    var averageRating = parseInt(totalRating / noOfRatings)

                    averageRating > 5 ? averageRating = 5 : null

                    var objToSave = {
                        rating: {
                            averageRating: averageRating,
                            totalRating: totalRating,
                            noOfRatings: noOfRatings
                        }
                    }

                    userModel.findOneAndUpdate({ _id: data.checkIfAlreadyExists.requestedTo._id }, objToSave, { new: true }, function(err, res) {
                        cb(err ? err : null, res)
                    })
                } else {
                    cb(null, data)
                }
            }],
            saveFeedback: ["saveRating", function(data, cb) {
                var criteria = {
                    ratingFeedbacks: {
                        $elemMatch: {
                            userId: params.userId
                        }
                    }
                }

                data.checkIfAlreadyExists.sessionType == "group" ? criteria.groupLessonNumber = params.sessionId : criteria._id = params.sessionId

                var dataToSet = {}

                params.rating ? dataToSet.$set = { 'ratingFeedbacks.$.rating': params.rating } : null

                params.feedback ? dataToSet.$set = { 'ratingFeedbacks.$.feedback': params.feedback } : null

                if (params.rating && params.feedback) {
                    dataToSet.$set = {
                        'ratingFeedbacks.$.rating': params.rating,
                        'ratingFeedbacks.$.feedback': params.feedback
                    }
                }

                sessionsModel.update(criteria, dataToSet, { multi: true, new: true }, function(err, res) {
                    cb(err ? err : null, res)
                })
            }],
            sendNotification: ["saveFeedback", function(data, cb) {
                var x = params.firstName
                params.firstName = x.charAt(0).toUpperCase() + x.slice(1)

                var startDate = Utils.moment(data.checkIfAlreadyExists.endDateTime * 1000).format("YYYY-MM-DD HH:mm:ss")

                var obj = {
                    senderId: params.userId,
                    receiverId: data.checkIfAlreadyExists.requestedTo,
                    notificationEventType: NOTIFICATION_TYPE.give_feedback,
                    createdAt: Utils.moment().unix(),
                    saveInDb: true,
                    message: "Rookie " + params.firstName + " has given you feedback " + params.feedback + " and " + params.rating + " star rating for lesson ended at " + startDate
                }

                params.sessionType == "group" ? obj.groupLessonNumber = params.sessionId : obj.sessionId = [params.sessionId]

                Utils.universalFunctions.sendNotification(obj, "notification", function(err, res) {
                    cb(err, data)
                })
            }]
        }, function(err, result) {
            callback(err ? err : null, { statusCode: 200, status: "success", message: "Saved successfully" });
        });
    },

    readFeedbackOnSession: function(params, callback) {
        var arr = []
        Utils.async.auto({
            getInfo: [function(cb) {
                var criteria = {}

                params.sessionType == "one-one" ? criteria._id = params.sessionId : criteria.groupLessonNumber = params.sessionId

                sessionsModel.find(criteria, { requestedTo: 1, requestedBy: 1, skillId: 1, startDateTime: 1, endDateTime: 1, ratePerHour: 1, ratePerRookie: 1, ratingFeedbacks: 1 })
                    .populate({ path: 'requestedTo', select: "firstName lastName profilePic" })
                    .populate({ path: 'requestedBy', select: "firstName lastName profilePic" })
                    .populate({ path: 'ratingFeedbacks.userId', select: "firstName lastName profilePic" })
                    .populate({ path: 'skillId', select: "name parent", populate: { path: "parent", select: "name" } })
                    .exec(function(err, res) {
                        if (err) cb(err)
                        else {
                            if (params.sessionType == "one-one") {
                                arr = res
                            } else {

                                var x = Utils._.groupBy(res, function(obj) {
                                    return obj.groupLessonNumber
                                })
                                var map = Utils._.map(x, function(num) {
                                    return num
                                })

                                for (var i = 0; i < map.length; i++) {
                                    for (var j = 0; j < map[i].length; j++) {
                                        console.log(map[i][j])
                                        var length = map[i].length
                                        arr.push({
                                            startDateTime: map[i][length - 1].startDateTime,
                                            endDateTime: map[i][j].endDateTime,
                                            ratePerRookie: map[i][j].ratePerRookie,
                                            ratingFeedbacks: map[i][j].ratingFeedbacks,
                                            groupLessonNumber: map[i][j].groupLessonNumber,
                                            skillId: map[i][j].skillId,
                                            requestedBy: map[i][j].requestedBy,
                                            requestedTo: map[i][j].requestedTo,
                                        })
                                        break;
                                    }
                                }
                                var tmp = []
                                for (var i = 0; i < arr[0].ratingFeedbacks.length; i++) {
                                    if (arr[0].ratingFeedbacks[i].rating && arr[0].ratingFeedbacks[i].rating != "" && arr[0].ratingFeedbacks[i].feedback && arr[0].ratingFeedbacks[i].feedback != "") {
                                        tmp.push(arr[0].ratingFeedbacks[i])
                                    }
                                }
                                arr[0].ratingFeedbacks = tmp


                            }
                            cb(null, arr)
                        }
                    })

            }],
        }, function(err, result) {
            callback(err ? err : null, { statusCode: 200, status: "success", message: "Fetched successfully", data: arr });
        });
    },

    raiseComplaintRookie: function(params, callback) {
        var criteria = {}
        Utils.async.auto({
            checkTime: [function(cb) {
                Utils.universalFunctions.logger("complaint can only be raised till 24 hrs of completion of lesson")

                params.sessionType == "group" ? criteria.groupLessonNumber = params.sessionId : criteria._id = params.sessionId

                sessionsModel.findOne(criteria, { requestedTo: 1, complaints: 1, endDateTime: 1 }, { sort: { endDateTime: -1 } }, function(err, res) {

                    if (err) cb(err)
                    else if (res == null) cb({ statusCode: 400, status: "error", message: "Invalid sessionId" })
                    else {
                        var endTime = moment(res.endDateTime * 1000).add(24, "hours").unix()

                        if (endTime <= params.currentTime) {
                            cb({ statusCode: 401, status: "warning", message: "Complaint cannot be raised now" })
                        } else {
                            let check = res.complaints.some(function(element, index) {
                                return element.userId.toString() === params.userId.toString();
                            });
                            check == true ? cb({ statusCode: 401, status: "warning", message: "Complaint already registered by you" }) : cb(null, res)
                            //cb(null, res)
                        }
                    }
                })
            }],
            getTicketNumber: ["checkTime", function(data, cb) {
                ticketCounterModel.findOne({}, function(err, res) {
                    res == null ? params.ticketNumber = 101 : params.ticketNumber = res.ticketCounter + 1
                    cb(err ? err : null, res)
                })
            }],
            saveComplaint: ["getTicketNumber", function(data, cb) {

                var dataToSet = {
                    $push: {
                        "complaints": {
                            userId: params.userId,
                            message: params.complaintMessage,
                            reason: params.complaintReason,
                            createdAt: params.currentTime,
                            status: 1,
                            ticketNumber: params.ticketNumber
                        },
                        statusHistory: {
                            "status": SESSION_STATUS.complaint_raised,
                            "updatedAt": Utils.moment().unix()
                        }
                    }
                }

                sessionsModel.update(criteria, dataToSet, { multi: true, new: true }, function(err, res) {
                    cb(err ? err : null, res)
                })
            }],
            saveTicketNumber: ["saveComplaint", function(data, cb) {
                if (params.ticketNumber == 101) {

                    ticketCounterModel({ ticketCounter: params.ticketNumber }).save(function(err, res) {
                        cb(err ? err : null, res)
                    })

                } else {
                    ticketCounterModel.findOneAndUpdate({}, { ticketCounter: params.ticketNumber }, { new: true }, function(err, res) {
                        cb(err ? err : null, res)
                    })
                }
            }],
            saveInBookings: ["saveComplaint", function(data, cb) {
                var criteria = {
                    paymentDoneBy: params.userId
                }
                params.sessionType == "group" ? criteria.groupLessonNumber = params.sessionId : criteria.sessionId = params.sessionId

                var dataToSet = {
                    $push: {
                        "complaints": {
                            userId: params.userId,
                            message: params.complaintMessage,
                            reason: params.complaintReason,
                            createdAt: params.currentTime,
                            status: 1,
                            ticketNumber: params.ticketNumber
                        },
                        statusHistory: {
                            "status": SESSION_STATUS.complaint_raised,
                            "updatedAt": Utils.moment().unix()
                        }
                    },
                    //paymentStatus: SESSION_STATUS.complaint_raised
                }

                sessionBookingsModel.update(criteria, dataToSet, { multi: true, new: true }, function(err, res) {
                    cb(err ? err : null, res)
                })
            }],
            sendNotification: ["saveInBookings", function(data, cb) {
                var x = params.firstName
                params.firstName = x.charAt(0).toUpperCase() + x.slice(1)

                var startDate = Utils.moment(data.checkTime.endDateTime * 1000).format("YYYY-MM-DD HH:mm:ss")

                var obj = {
                    senderId: params.userId,
                    receiverId: data.checkTime.requestedTo,
                    notificationEventType: NOTIFICATION_TYPE.complaint_raised,
                    createdAt: Utils.moment().unix(),
                    saveInDb: true,
                    message: "Rookie " + params.firstName + " has raised a complaint on lesson ended at " + startDate
                }

                params.sessionType == "group" ? obj.groupLessonNumber = params.sessionId : obj.sessionId = [params.sessionId]

                Utils.universalFunctions.sendNotification(obj, "notification", function(err, res) {
                    cb(err, data)
                })
            }]

        }, function(err, result) {
            callback(err ? err : null, { statusCode: 200, status: "success", message: "Complaint successfully registered" });
        });
    },

    guruRespondToComplaint: function(params, callback) {

        Utils.async.auto({
            checkIfauthenticatedUser: [function(cb) {
                var criteria = {}
                params.sessionType == "group" ? criteria.groupLessonNumber = params.sessionId : criteria._id = params.sessionId

                criteria.requestedTo = params.userId

                sessionsModel.findOne(criteria, {}, { sort: { endDateTime: -1 } }, function(err, res) {
                    if (err) cb(err)
                    else if (res == null) cb({ statusCode: 401, status: "warning", message: "Invalid session/user id" })
                    else {

                        if (params.sessionType == "one-one") {
                            var complaintTime = res.complaints[0].createdAt

                            var endTime = moment(complaintTime * 1000).add(24, "hours").unix()

                            if (endTime <= params.currentTime) {
                                cb({ statusCode: 401, status: "warning", message: "You cannot take action on the session after 24 hours of the raised complaint . Now only admin can take the action." })
                            } else {
                                cb(null, res)
                            }
                        } else {

                            for (var i = 0; i < res.complaints.length; i++) {
                                if (res.complaints[i].status == 1 && res.complaints[i].userId.toString() == params.rookieId.toString()) {
                                    var complaintTime = res.complaints[i].createdAt

                                    var endTime = moment(complaintTime * 1000).add(24, "hours").unix()

                                    if (endTime <= params.currentTime) {
                                        cb({ statusCode: 401, status: "warning", message: "You cannot take action on the session after 24 hours of the raised complaint . Now only admin can take the action." })
                                    }
                                }
                            }
                            cb(null, res)
                        }

                    }
                })
            }],
            checkConditions: ["checkIfauthenticatedUser", function(data, cb) {

                if (params.actionToPerform == "refund") {

                    if (data.checkIfauthenticatedUser.sessionType == "one-one") {

                        Utils.async.auto({
                                checkSession: [function(cb) {

                                    sessionsModel.findOne({ _id: params.sessionId, status: 'payment done' }, function(err, res) {
                                        res ? params.rookieId = res.requestedBy : null
                                        cb(err ? err : res == null ? { statusCode: 401, status: "warning", message: "Refund can't be initiated" } : null, res)
                                    })
                                }],
                                getTransactionId: ["checkSession", function(data, cb) {

                                    transactionsModel.findOne({ sessionId: params.sessionId }, function(err, res) {
                                        if (err) cb(err)
                                        else if (res == null) {
                                            cb({ statusCode: 401, status: "warning", message: "No payments found to be refund" })
                                        } else {
                                            cb(null, res)
                                        }
                                    })
                                }],
                                getRookiesDetails: ["getTransactionId", function(data, cb) {

                                    userModel.findOne({ _id: params.rookieId }, function(err, res) {
                                        cb(err ? err : null, res)
                                    })

                                }],
                                initiateRefund: ["getTransactionId", function(data, cb) {

                                    Utils.universalFunctions.logger("If payment already done then initiate refund")

                                    var obj = {
                                        charge: data.getTransactionId.chargeID,
                                        amount: Math.round(data.getTransactionId.metaData.stripeCharge.amount)
                                    }
                                    stripeService.refundCharge(obj, function(err, res) {
                                        if (err) {
                                            var paymentStatus = "failed";
                                            var errorMetaData = err;
                                            if (err.raw) {
                                                var stripeErrType = err.raw.type;
                                                var stripeErrMessage = err.raw.message;
                                            }
                                            return callback({ statusCode: 401, status: 'warning', errorType: stripeErrType, message: stripeErrMessage })
                                        } else {
                                            var paymentStatus = "success";
                                            cb(null, res);
                                        }
                                    })
                                }],
                                makeTransaction: ["initiateRefund", function(data, cb) {

                                    var objToSave = {
                                        sessionId: params.sessionId,
                                        stripeCustomerID: data.getRookiesDetails.stripeCustomerId,
                                        metaData: data.initiateRefund,
                                        transactionType: TRANSACTION_TYPE.refund,
                                        requestStatus: REQUEST_STATUS.completed,
                                        paymentDoneBy: params.rookieId,
                                        paymentDoneTo: data.checkSession.requestedTo
                                    }

                                    objToSave.chargeID = data.initiateRefund.refundCharge.id ? data.initiateRefund.refundCharge.id : null;
                                    objToSave.transactionID = data.initiateRefund.refundCharge.balance_transaction ? data.initiateRefund.refundCharge.balance_transaction : null;
                                    objToSave.transactionStatus = data.initiateRefund.refundCharge.status ? data.initiateRefund.refundCharge.status : null;
                                    objToSave.currency = data.initiateRefund.refundCharge.currency ? data.initiateRefund.refundCharge.currency : null;
                                    objToSave.transactionDate = data.initiateRefund.refundCharge.created ? data.initiateRefund.refundCharge.created : null;

                                    transactionsModel(objToSave).save(function(err, res) {
                                        if (err) {
                                            Utils.universalFunctions.logger(err);
                                            cb(err);
                                        } else {
                                            cb(null, res);
                                        }
                                    })
                                }],
                                updateDb: ["initiateRefund", function(data, cb) {

                                    sessionsModel.findOneAndUpdate({ _id: params.sessionId }, {
                                        $push: {
                                            statusHistory: {
                                                "status": "refunded",
                                                "updatedAt": Utils.moment().unix()
                                            },
                                            complaints: {
                                                userId: params.rookieId,
                                                createdAt: params.currentTime,
                                                status: 4
                                            }
                                        },
                                        status: "refunded",
                                    }, { new: true }, function(err, res) {
                                        if (err) cb(err)
                                        if (res == null) cb({ statusCode: 401, status: "warning", message: "Refund can't be initiated" })
                                        else {
                                            cb(null, res)
                                        }
                                    })
                                }],
                                updateBookingStatus: ["updateDb", "makeTransaction", function(data, cb) {
                                    var tmp = [{
                                        transactionId: data.makeTransaction._id,
                                        message: "Refund"
                                    }]
                                    sessionBookingsModel.findOneAndUpdate({ sessionId: params.sessionId }, {
                                        $push: {
                                            statusHistory: {
                                                "status": "refunded",
                                                "updatedAt": Utils.moment().unix()
                                            },
                                            "complaints": {
                                                userId: params.rookieId,
                                                createdAt: params.currentTime,
                                                status: 4
                                            },
                                        },
                                        $addToSet: { "transactionDetails": { $each: tmp } },
                                        paymentStatus: "refunded"
                                    }, { new: true }, function(err, res) {
                                        cb(err ? err : null, res)
                                    })
                                }],
                                sendNotification: ["updateBookingStatus", function(data, cb) {
                                    var x = params.userDetails.firstName
                                    params.userDetails.firstName = x.charAt(0).toUpperCase() + x.slice(1)

                                    var startDate = Utils.moment(data.checkSession.endDateTime * 1000).format("YYYY-MM-DD HH:mm:ss")

                                    var obj = {
                                        senderId: params.userDetails,
                                        receiverId: params.rookieId,
                                        sessionId: [params.sessionId],
                                        notificationEventType: NOTIFICATION_TYPE.complaint_raised,
                                        createdAt: Utils.moment().unix(),
                                        saveInDb: true,
                                        message: "Guru " + params.userDetails.firstName + " has accepted the complaint and refunded you for the one to one lesson ended on " + startDate
                                    }

                                    Utils.universalFunctions.sendNotification(obj, "notification", function(err, res) {
                                        cb(err, data)
                                    })
                                }],
                                sendMail: ['updateBookingStatus', function(data, cb) {

                                    var x = data.getRookiesDetails.firstName
                                    data.getRookiesDetails.firstName = x.charAt(0).toUpperCase() + x.slice(1)

                                    var subject = "Refund initiated for one to one lesson";

                                    var startDate = Utils.moment(data.checkSession.endDateTime * 1000).format("YYYY-MM-DD HH:mm:ss")

                                    var templatepath = Utils.path.join(__dirname, '../../../assets/emailTemplates/');
                                    var fileReadStream = Utils.fs.createReadStream(templatepath + 'notifications.html');

                                    var emailTemplate = '';

                                    fileReadStream.on('data', function(buffer) {
                                        emailTemplate += buffer.toString();
                                    });

                                    fileReadStream.on('end', function(res) {

                                        var message = "Guru " + params.userDetails.firstName + " has accepted the complaint you raised on one to one lesson ended on " + startDate + " ."

                                        var otherMessage = "We have successfully refunded you with the amount £" + data.checkSession.ratePerHour + " ."

                                        var sendStr = emailTemplate.replace('{{firstName}}', data.getRookiesDetails.firstName).replace('{{message}}', message).replace('{{otherMessage}}', otherMessage)

                                        Utils.universalFunctions.sendMail(data.getRookiesDetails.email, subject, sendStr)

                                        cb(null, null)

                                    });
                                }]
                            },
                            function(err, res) {
                                callback(err ? err : null, { statusCode: 200, status: "success", message: "Rookie refunded successfully" })
                            });
                    } else {
                        // REFUND IN GROUP LESSONS

                        Utils.async.auto({
                                checkSession: [function(cb) {

                                    sessionsModel.findOne({ groupLessonNumber: params.sessionId, status: 'payment done' }, {}, { sort: { endDateTime: -1 } }, function(err, res) {
                                        if (err) cb(err)
                                        else if (res == null) {
                                            cb({ statusCode: 401, status: "warning", message: "Refund can't be initiated" })
                                        } else {
                                            for (var i = 0; i < res.joinees.length; i++) {
                                                res.joinees[i] = res.joinees[i].toString()
                                            }

                                            if (Utils._.contains(res.joinees, params.rookieId)) {

                                                let check = res.complaints.some(function(element, index) {
                                                    return element.userId.toString() === params.rookieId.toString();
                                                });

                                                if (check == true) {
                                                    cb(null, res)
                                                } else {
                                                    cb({ statusCode: 401, status: "warning", message: "Refund can't be initiated for this user" })
                                                }
                                            } else {
                                                cb({ statusCode: 400, status: "warning", message: "Invalid refunded user" })
                                            }
                                        }
                                    })
                                }],
                                getTransactionId: ["checkSession", function(data, cb) {

                                    sessionBookingsModel.findOne({ groupLessonNumber: params.sessionId, paymentDoneBy: params.rookieId })
                                        .populate({ path: 'transactionDetails.transactionId' })
                                        .exec(function(err, res) {

                                            if (err) cb(err)
                                            else if (res == null) {
                                                Incb()
                                            } else {
                                                params.transactionData = res.transactionDetails[0].transactionId
                                                cb(null, res)
                                            }
                                        })
                                }],
                                getRookiesDetails: ["getTransactionId", function(data, cb) {

                                    userModel.findOne({ _id: params.rookieId }, function(err, res) {
                                        cb(err ? err : null, res)
                                    })

                                }],
                                initiateRefund: ["getTransactionId", function(data, cb) {

                                    Utils.universalFunctions.logger("If payment already done then initiate refund")

                                    var obj = {
                                        charge: params.transactionData.chargeID,
                                        amount: Math.round(params.transactionData.metaData.stripeCharge.amount)
                                    }
                                    stripeService.refundCharge(obj, function(err, res) {

                                        if (err) {
                                            var paymentStatus = "failed";
                                            var errorMetaData = err;
                                            if (err.raw) {
                                                var stripeErrType = err.raw.type;
                                                var stripeErrMessage = err.raw.message;
                                            }
                                            return callback({ statusCode: 401, status: 'warning', errorType: stripeErrType, message: stripeErrMessage })
                                        } else {
                                            var paymentStatus = "success";
                                            cb(null, res);
                                        }
                                    })
                                }],
                                makeTransaction: ["initiateRefund", function(data, cb) {

                                    var objToSave = {
                                        groupLessonNumber: params.sessionId,
                                        stripeCustomerID: data.getRookiesDetails.stripeCustomerId,
                                        metaData: data.initiateRefund,
                                        transactionType: TRANSACTION_TYPE.refund,
                                        requestStatus: REQUEST_STATUS.completed,
                                        paymentDoneBy: params.rookieId,
                                        paymentDoneTo: data.getTransactionId.paymentDoneTo
                                    }

                                    objToSave.chargeID = data.initiateRefund.refundCharge.id ? data.initiateRefund.refundCharge.id : null;
                                    objToSave.transactionID = data.initiateRefund.refundCharge.balance_transaction ? data.initiateRefund.refundCharge.balance_transaction : null;
                                    objToSave.transactionStatus = data.initiateRefund.refundCharge.status ? data.initiateRefund.refundCharge.status : null;
                                    objToSave.currency = data.initiateRefund.refundCharge.currency ? data.initiateRefund.refundCharge.currency : null;
                                    objToSave.transactionDate = data.initiateRefund.refundCharge.created ? data.initiateRefund.refundCharge.created : null;

                                    transactionsModel(objToSave).save(function(err, res) {
                                        if (err) {
                                            Utils.universalFunctions.logger(err);
                                            cb(err);
                                        } else {
                                            cb(null, res);
                                        }
                                    })
                                }],
                                updateDb: ["initiateRefund", function(data, cb) {
                                    var dataToSet = {
                                        $push: {
                                            statusHistory: {
                                                "status": "refunded",
                                                "updatedAt": Utils.moment().unix()
                                            },
                                            complaints: {
                                                userId: params.rookieId,
                                                createdAt: params.currentTime,
                                                status: 4
                                            }
                                        }
                                    }

                                    data.checkSession.joinees.length == 1 ? dataToSet.status = "refunded" : null

                                    sessionsModel.update({ groupLessonNumber: params.sessionId }, dataToSet, { new: true }, function(err, res) {

                                        if (err) cb(err)
                                        if (res == null) cb({ statusCode: 401, status: "warning", message: "Refund can't be initiated" })
                                        else {
                                            cb(null, res)
                                        }
                                    })
                                }],
                                updateBookingStatus: ["updateDb", "makeTransaction", function(data, cb) {
                                    var tmp = [{
                                        transactionId: data.makeTransaction._id,
                                        message: "Refund"
                                    }]
                                    var criteria = { groupLessonNumber: params.sessionId, paymentDoneBy: params.rookieId }
                                    var dataToSet = {
                                        $push: {
                                            statusHistory: {
                                                "status": "refunded",
                                                "updatedAt": Utils.moment().unix()
                                            },
                                            "complaints": {
                                                userId: params.rookieId,
                                                createdAt: params.currentTime,
                                                status: 4
                                            },
                                        },
                                        $addToSet: { "transactionDetails": { $each: tmp } },
                                        paymentStatus: "refunded"
                                    }

                                    sessionBookingsModel.update(criteria, dataToSet, { new: true, multi: true }, function(err, res) {
                                        cb(err ? err : null, res)
                                    })
                                }],
                                sendNotification: ["updateBookingStatus", function(data, cb) {
                                    var x = params.userDetails.firstName
                                    params.userDetails.firstName = x.charAt(0).toUpperCase() + x.slice(1)

                                    var startDate = Utils.moment(data.checkSession.endDateTime * 1000).format("YYYY-MM-DD HH:mm:ss")

                                    var obj = {
                                        senderId: params.userDetails,
                                        receiverId: params.rookieId,
                                        groupLessonNumber: params.sessionId,
                                        notificationEventType: NOTIFICATION_TYPE.complaint_raised,
                                        createdAt: Utils.moment().unix(),
                                        saveInDb: true,
                                        message: "Guru " + params.userDetails.firstName + " has accepted the complaint and refunded you for the group lesson ended on " + startDate
                                    }

                                    Utils.universalFunctions.sendNotification(obj, "notification", function(err, res) {
                                        cb(err, data)
                                    })
                                }],
                                sendMail: ['updateBookingStatus', function(data, cb) {

                                    var x = data.getRookiesDetails.firstName
                                    data.getRookiesDetails.firstName = x.charAt(0).toUpperCase() + x.slice(1)

                                    var subject = "Refund initiated for group lesson";

                                    var startDate = Utils.moment(data.checkSession.endDateTime * 1000).format("YYYY-MM-DD HH:mm:ss")

                                    var templatepath = Utils.path.join(__dirname, '../../../assets/emailTemplates/');
                                    var fileReadStream = Utils.fs.createReadStream(templatepath + 'notifications.html');

                                    var emailTemplate = '';

                                    fileReadStream.on('data', function(buffer) {
                                        emailTemplate += buffer.toString();
                                    });

                                    fileReadStream.on('end', function(res) {

                                        var message = "Guru " + params.userDetails.firstName + " has accepted the complaint you raised on group lesson ended on " + startDate + " ."

                                        var otherMessage = "We have successfully refunded you with the amount £" + data.checkSession.ratePerRookie + " ."

                                        var sendStr = emailTemplate.replace('{{firstName}}', data.getRookiesDetails.firstName).replace('{{message}}', message).replace('{{otherMessage}}', otherMessage)

                                        Utils.universalFunctions.sendMail(data.getRookiesDetails.email, subject, sendStr)

                                        cb(null, null)

                                    });
                                }]
                            },
                            function(err, res) {
                                callback(err ? err : null, { statusCode: 200, status: "success", message: "Rookie refunded successfully" })
                            });
                    }
                } else {
                    //reject
                    var criteria = {}

                    params.sessionType == "group" ? criteria.groupLessonNumber = params.sessionId : criteria._id = params.sessionId

                    var dataToSet = {
                        $push: {
                            complaints: {
                                userId: params.userId,
                                message: params.complaintMessage,
                                createdAt: params.currentTime,
                                status: 2,
                                rejectedUserId: params.rookieId
                            }
                        }
                    }



                    sessionsModel.update(criteria, dataToSet, { new: true, multi: true }, function(err, res) {
                        // callback(err ? err : null, { statusCode: 200, status: "success", message: "Complaint rejected successfully" })

                        if (err) cb(err)
                        else {
                            var criteria = {}
                            params.sessionType == "group" ? criteria.groupLessonNumber = params.sessionId : criteria.sessionId = params.sessionId
                            criteria.paymentDoneBy = params.rookieId

                            var dataToSet = {
                                $push: {
                                    complaints: {
                                        userId: params.rookieId,
                                        createdAt: params.currentTime,
                                        message: params.complaintMessage,
                                        status: 2
                                    }
                                }
                            }
                            //dataToSet.status = "complaint rejected"
                            sessionBookingsModel.update(criteria, dataToSet, { new: true, multi: true }, function(err, res) {

                                var x = params.userDetails.firstName
                                params.userDetails.firstName = x.charAt(0).toUpperCase() + x.slice(1)

                                var startDate = Utils.moment(data.checkIfauthenticatedUser.endDateTime * 1000).format("YYYY-MM-DD HH:mm:ss")

                                var obj = {
                                    senderId: params.userDetails,
                                    receiverId: params.rookieId,
                                    notificationEventType: NOTIFICATION_TYPE.complaint_raised,
                                    createdAt: Utils.moment().unix(),
                                    saveInDb: true,
                                    message: "Guru " + params.userDetails.firstName + " has rejected your complaint on one to one lesson ended on " + startDate + " with the message " + params.complaintMessage + " .Now the request has been transfered to the admin where he can take the final action."
                                }

                                params.sessionType == "group" ? obj.groupLessonNumber = params.sessionId : obj.sessionId = [params.sessionId]

                                Utils.universalFunctions.sendNotification(obj, "notification", function(err, res) {
                                    callback(err ? err : null, { statusCode: 200, status: "success", message: "Complaint rejected successfully" })
                                })
                            })
                        }
                    })
                }
            }]


        }, function(err, result) {
            callback(err ? err : null, result);
        });
    },

    adminRespondToComplaint: function(params, callback) {

        Utils.async.auto({
            checkIfLoggedInUserAdmin: [function(cb) {

                userModel.findOne({ _id: params.userId }, function(err, res) {
                    if (err) cb(err)
                    else {
                        if (res.userType == "admin" || res.userType == "3") {
                            cb(null, null)
                        } else {
                            cb({ statusCode: 401, status: "warning", message: "Only admin can perform this action." })
                        }
                    }
                })
            }],
            checkIfauthenticatedUser: ["checkIfLoggedInUserAdmin", function(data, cb) {
                var criteria = {}
                params.sessionType == "group" ? criteria.groupLessonNumber = params.sessionId : criteria._id = params.sessionId

                //criteria.requestedTo = params.userId

                sessionsModel.findOne(criteria, function(err, res) {
                    if (err) cb(err)
                    if (res == null) cb({ statusCode: 401, status: "warning", message: "Invalid session/user id" })
                    else {
                        cb(null, res)
                    }
                })
            }],
            checkConditions: ["checkIfauthenticatedUser", function(data, cb) {

                if (params.actionToPerform == "refund") {

                    if (data.checkIfauthenticatedUser.sessionType == "one-one") {

                        Utils.async.auto({
                                checkSession: [function(cb) {

                                    sessionsModel.findOne({ _id: params.sessionId, status: 'payment done' }, function(err, res) {
                                        res ? params.rookieId = res.requestedBy : null
                                        cb(err ? err : res == null ? { statusCode: 401, status: "warning", message: "Refund can't be initiated" } : null, res)
                                    })
                                }],
                                getTransactionId: ["checkSession", function(data, cb) {

                                    transactionsModel.findOne({ sessionId: params.sessionId }, function(err, res) {
                                        if (err) cb(err)
                                        else if (res == null) {
                                            cb({ statusCode: 401, status: "warning", message: "No payments found to be refund" })
                                        } else {
                                            cb(null, res)
                                        }
                                    })
                                }],
                                getRookiesDetails: ["getTransactionId", function(data, cb) {

                                    userModel.findOne({ _id: params.rookieId }, function(err, res) {
                                        cb(err ? err : null, res)
                                    })

                                }],
                                initiateRefund: ["getTransactionId", function(data, cb) {

                                    Utils.universalFunctions.logger("If payment already done then initiate refund")

                                    var obj = {
                                        charge: data.getTransactionId.chargeID,
                                        amount: Math.round(data.getTransactionId.metaData.stripeCharge.amount)
                                    }
                                    stripeService.refundCharge(obj, function(err, res) {
                                        if (err) {
                                            var paymentStatus = "failed";
                                            var errorMetaData = err;
                                            if (err.raw) {
                                                var stripeErrType = err.raw.type;
                                                var stripeErrMessage = err.raw.message;
                                            }
                                            return callback({ statusCode: 401, status: 'warning', errorType: stripeErrType, message: stripeErrMessage })
                                        } else {
                                            var paymentStatus = "success";
                                            cb(null, res);
                                        }
                                    })
                                }],
                                makeTransaction: ["initiateRefund", function(data, cb) {

                                    var objToSave = {
                                        sessionId: params.sessionId,
                                        stripeCustomerID: data.getRookiesDetails.stripeCustomerId,
                                        metaData: data.initiateRefund,
                                        transactionType: TRANSACTION_TYPE.refund,
                                        requestStatus: REQUEST_STATUS.completed,
                                        paymentDoneBy: params.rookieId,
                                        paymentDoneTo: data.checkSession.requestedTo
                                    }

                                    objToSave.chargeID = data.initiateRefund.refundCharge.id ? data.initiateRefund.refundCharge.id : null;
                                    objToSave.transactionID = data.initiateRefund.refundCharge.balance_transaction ? data.initiateRefund.refundCharge.balance_transaction : null;
                                    objToSave.transactionStatus = data.initiateRefund.refundCharge.status ? data.initiateRefund.refundCharge.status : null;
                                    objToSave.currency = data.initiateRefund.refundCharge.currency ? data.initiateRefund.refundCharge.currency : null;
                                    objToSave.transactionDate = data.initiateRefund.refundCharge.created ? data.initiateRefund.refundCharge.created : null;

                                    transactionsModel(objToSave).save(function(err, res) {
                                        if (err) {
                                            Utils.universalFunctions.logger(err);
                                            cb(err);
                                        } else {
                                            cb(null, res);
                                        }
                                    })
                                }],
                                updateDb: ["initiateRefund", function(data, cb) {

                                    sessionsModel.findOneAndUpdate({ _id: params.sessionId }, {
                                        $push: {
                                            statusHistory: {
                                                "status": "refunded",
                                                "updatedAt": Utils.moment().unix()
                                            },
                                            complaints: {
                                                userId: params.rookieId,
                                                createdAt: params.currentTime,
                                                status: 4
                                            }
                                        },
                                        status: "refunded",
                                    }, { new: true }, function(err, res) {
                                        if (err) cb(err)
                                        if (res == null) cb({ statusCode: 401, status: "warning", message: "Refund can't be initiated" })
                                        else {
                                            cb(null, res)
                                        }
                                    })
                                }],
                                updateBookingStatus: ["updateDb", "makeTransaction", function(data, cb) {
                                    var tmp = [{
                                        transactionId: data.makeTransaction._id,
                                        message: "Refund"
                                    }]
                                    sessionBookingsModel.findOneAndUpdate({ sessionId: params.sessionId }, {
                                        $push: {
                                            statusHistory: {
                                                "status": "refunded",
                                                "updatedAt": Utils.moment().unix()
                                            },
                                            "complaints": {
                                                userId: params.rookieId,
                                                createdAt: params.currentTime,
                                                status: 4
                                            },
                                        },
                                        $addToSet: { "transactionDetails": { $each: tmp } },
                                        paymentStatus: "refunded"
                                    }, { new: true }, function(err, res) {
                                        cb(err ? err : null, res)
                                    })
                                }],
                                sendNotification: ["updateBookingStatus", function(data, cb) {

                                    var startDate = Utils.moment(data.checkSession.endDateTime * 1000).format("YYYY-MM-DD HH:mm:ss")

                                    var obj = {
                                        senderId: params.userDetails,
                                        receiverId: params.rookieId,
                                        sessionId: [params.sessionId],
                                        notificationEventType: NOTIFICATION_TYPE.complaint_raised,
                                        createdAt: Utils.moment().unix(),
                                        saveInDb: true,
                                        message: "Admin has accepted the complaint and refunded you for the one to one lesson ended on " + startDate
                                    }

                                    Utils.universalFunctions.sendNotification(obj, "notification", function(err, res) {
                                        cb(err, data)
                                    })
                                }],
                                sendMail: ['updateBookingStatus', function(data, cb) {

                                    var x = data.getRookiesDetails.firstName
                                    data.getRookiesDetails.firstName = x.charAt(0).toUpperCase() + x.slice(1)

                                    var subject = "Refund initiated for one to one lesson";

                                    var startDate = Utils.moment(data.checkSession.endDateTime * 1000).format("YYYY-MM-DD HH:mm:ss")

                                    var templatepath = Utils.path.join(__dirname, '../../../assets/emailTemplates/');
                                    var fileReadStream = Utils.fs.createReadStream(templatepath + 'notifications.html');

                                    var emailTemplate = '';

                                    fileReadStream.on('data', function(buffer) {
                                        emailTemplate += buffer.toString();
                                    });

                                    fileReadStream.on('end', function(res) {

                                        var message = "Admin has accepted the complaint you raised on one to one lesson ended on " + startDate + " ."

                                        var otherMessage = "We have successfully refunded you with the amount £" + data.checkSession.ratePerHour + " ."

                                        var sendStr = emailTemplate.replace('{{firstName}}', data.getRookiesDetails.firstName).replace('{{message}}', message).replace('{{otherMessage}}', otherMessage)

                                        Utils.universalFunctions.sendMail(data.getRookiesDetails.email, subject, sendStr)

                                        cb(null, null)

                                    });
                                }]
                            },
                            function(err, res) {
                                callback(err ? err : null, { statusCode: 200, status: "success", message: "Rookie refunded successfully" })
                            });
                    } else {
                        // REFUND IN GROUP LESSONS

                        Utils.async.auto({
                                checkSession: [function(cb) {

                                    sessionsModel.findOne({ groupLessonNumber: params.sessionId, status: 'payment done' }, {}, { sort: { endDateTime: -1 } }, function(err, res) {
                                        if (err) cb(err)
                                        else if (res == null) {
                                            cb({ statusCode: 401, status: "warning", message: "Refund can't be initiated" })
                                        } else {
                                            for (var i = 0; i < res.joinees.length; i++) {
                                                res.joinees[i] = res.joinees[i].toString()
                                            }

                                            if (Utils._.contains(res.joinees, params.rookieId)) {

                                                let check = res.complaints.some(function(element, index) {
                                                    return element.userId.toString() === params.rookieId.toString();
                                                });

                                                if (check == true) {
                                                    cb(null, res)
                                                } else {
                                                    cb({ statusCode: 401, status: "warning", message: "Refund can't be initiated for this user" })
                                                }
                                            } else {
                                                cb({ statusCode: 400, status: "warning", message: "Invalid refunded user" })
                                            }
                                        }
                                    })
                                }],
                                getTransactionId: ["checkSession", function(data, cb) {

                                    sessionBookingsModel.findOne({ groupLessonNumber: params.sessionId, paymentDoneBy: params.rookieId })
                                        .populate({ path: 'transactionDetails.transactionId' })
                                        .exec(function(err, res) {

                                            if (err) cb(err)
                                            else if (res == null) {
                                                Incb()
                                            } else {
                                                params.transactionData = res.transactionDetails[0].transactionId
                                                cb(null, res)
                                            }
                                        })
                                }],
                                getRookiesDetails: ["getTransactionId", function(data, cb) {

                                    userModel.findOne({ _id: params.rookieId }, function(err, res) {
                                        cb(err ? err : null, res)
                                    })

                                }],
                                initiateRefund: ["getTransactionId", function(data, cb) {

                                    Utils.universalFunctions.logger("If payment already done then initiate refund")

                                    var obj = {
                                        charge: params.transactionData.chargeID,
                                        amount: Math.round(params.transactionData.metaData.stripeCharge.amount)
                                    }
                                    stripeService.refundCharge(obj, function(err, res) {

                                        if (err) {
                                            var paymentStatus = "failed";
                                            var errorMetaData = err;
                                            if (err.raw) {
                                                var stripeErrType = err.raw.type;
                                                var stripeErrMessage = err.raw.message;
                                            }
                                            return callback({ statusCode: 401, status: 'warning', errorType: stripeErrType, message: stripeErrMessage })
                                        } else {
                                            var paymentStatus = "success";
                                            cb(null, res);
                                        }
                                    })
                                }],
                                makeTransaction: ["initiateRefund", function(data, cb) {

                                    var objToSave = {
                                        groupLessonNumber: params.sessionId,
                                        stripeCustomerID: data.getRookiesDetails.stripeCustomerId,
                                        metaData: data.initiateRefund,
                                        transactionType: TRANSACTION_TYPE.refund,
                                        requestStatus: REQUEST_STATUS.completed,
                                        paymentDoneBy: params.rookieId,
                                        paymentDoneTo: data.getTransactionId.paymentDoneTo
                                    }

                                    objToSave.chargeID = data.initiateRefund.refundCharge.id ? data.initiateRefund.refundCharge.id : null;
                                    objToSave.transactionID = data.initiateRefund.refundCharge.balance_transaction ? data.initiateRefund.refundCharge.balance_transaction : null;
                                    objToSave.transactionStatus = data.initiateRefund.refundCharge.status ? data.initiateRefund.refundCharge.status : null;
                                    objToSave.currency = data.initiateRefund.refundCharge.currency ? data.initiateRefund.refundCharge.currency : null;
                                    objToSave.transactionDate = data.initiateRefund.refundCharge.created ? data.initiateRefund.refundCharge.created : null;

                                    transactionsModel(objToSave).save(function(err, res) {
                                        if (err) {
                                            Utils.universalFunctions.logger(err);
                                            cb(err);
                                        } else {
                                            cb(null, res);
                                        }
                                    })
                                }],
                                updateDb: ["initiateRefund", function(data, cb) {
                                    var dataToSet = {
                                        $push: {
                                            statusHistory: {
                                                "status": "refunded",
                                                "updatedAt": Utils.moment().unix()
                                            },
                                            complaints: {
                                                userId: params.rookieId,
                                                createdAt: params.currentTime,
                                                status: 4
                                            }
                                        }
                                    }

                                    data.checkSession.joinees.length == 1 ? dataToSet.status = "refunded" : null

                                    sessionsModel.update({ groupLessonNumber: params.sessionId }, dataToSet, { new: true }, function(err, res) {

                                        if (err) cb(err)
                                        if (res == null) cb({ statusCode: 401, status: "warning", message: "Refund can't be initiated" })
                                        else {
                                            cb(null, res)
                                        }
                                    })
                                }],
                                // updateDbComplaints: ["initiateRefund", function(data, cb) {

                                //     sessionsModel.update({ groupLessonNumber: params.sessionId, "complaints.userId": params.rookieId }, {
                                //         "complaints.$.status": 4
                                //     }, { new: true }, function(err, res) {
                                //         if (err) cb(err)
                                //         if (res == null) cb({ statusCode: 401, status: "warning", message: "Refund can't be initiated" })
                                //         else {
                                //             cb(null, res)
                                //         }
                                //     })
                                // }],
                                updateBookingStatus: ["updateDb", "makeTransaction", function(data, cb) {
                                    var tmp = [{
                                        transactionId: data.makeTransaction._id,
                                        message: "Refund"
                                    }]
                                    var criteria = { groupLessonNumber: params.sessionId, paymentDoneBy: params.rookieId }
                                    var dataToSet = {
                                        $push: {
                                            statusHistory: {
                                                "status": "refunded",
                                                "updatedAt": Utils.moment().unix()
                                            },
                                            "complaints": {
                                                userId: params.rookieId,
                                                createdAt: params.currentTime,
                                                status: 4
                                            },
                                        },
                                        $addToSet: { "transactionDetails": { $each: tmp } },
                                        paymentStatus: "refunded"
                                    }

                                    sessionBookingsModel.update(criteria, dataToSet, { new: true, multi: true }, function(err, res) {
                                        cb(err ? err : null, res)
                                    })
                                }],
                                sendNotification: ["updateBookingStatus", function(data, cb) {
                                    var x = params.userDetails.firstName
                                    params.userDetails.firstName = x.charAt(0).toUpperCase() + x.slice(1)

                                    var startDate = Utils.moment(data.checkSession.endDateTime * 1000).format("YYYY-MM-DD HH:mm:ss")

                                    var obj = {
                                        senderId: params.userDetails,
                                        receiverId: params.rookieId,
                                        groupLessonNumber: params.sessionId,
                                        notificationEventType: NOTIFICATION_TYPE.complaint_raised,
                                        createdAt: Utils.moment().unix(),
                                        saveInDb: true,
                                        message: "Admin has accepted the complaint and refunded you for the group lesson ended on " + startDate
                                    }

                                    Utils.universalFunctions.sendNotification(obj, "notification", function(err, res) {
                                        cb(err, data)
                                    })
                                }],
                                sendMail: ['updateBookingStatus', function(data, cb) {

                                    var x = data.getRookiesDetails.firstName
                                    data.getRookiesDetails.firstName = x.charAt(0).toUpperCase() + x.slice(1)

                                    var subject = "Refund initiated for group lesson";

                                    var startDate = Utils.moment(data.checkSession.endDateTime * 1000).format("YYYY-MM-DD HH:mm:ss")

                                    var templatepath = Utils.path.join(__dirname, '../../../assets/emailTemplates/');
                                    var fileReadStream = Utils.fs.createReadStream(templatepath + 'notifications.html');

                                    var emailTemplate = '';

                                    fileReadStream.on('data', function(buffer) {
                                        emailTemplate += buffer.toString();
                                    });

                                    fileReadStream.on('end', function(res) {

                                        var message = "Admin has accepted the complaint you raised on group lesson ended on " + startDate + " ."

                                        var otherMessage = "We have successfully refunded you with the amount £" + data.checkSession.ratePerRookie + " ."

                                        var sendStr = emailTemplate.replace('{{firstName}}', data.getRookiesDetails.firstName).replace('{{message}}', message).replace('{{otherMessage}}', otherMessage)

                                        Utils.universalFunctions.sendMail(data.getRookiesDetails.email, subject, sendStr)

                                        cb(null, null)

                                    });
                                }]
                            },
                            function(err, res) {
                                callback(err ? err : null, { statusCode: 200, status: "success", message: "Rookie refunded successfully" })
                            });
                    }
                }
                /*else {
                    //reject
                    var criteria = {}
                    params.sessionType == "group" ? criteria.groupLessonNumber = params.sessionId : criteria._id = params.sessionId

                    var dataToSet = {
                        $push: {
                            complaints: {
                                userId: params.userId,
                                message: params.complaintMessage,
                                createdAt: params.currentTime,
                                status: 3,
                                rejectedUserId: params.rookieId
                            }
                        }
                    }

                    sessionsModel.update(criteria, dataToSet, { new: true, multi: true }, function(err, res) {
                        // callback(err ? err : null, { statusCode: 200, status: "success", message: "Complaint rejected successfully" })
                        if (err) cb(err)
                        else {
                            params.sessionType == "group" ? criteria.groupLessonNumber = params.sessionId : criteria.sessionId = params.sessionId
                            criteria.paymentDoneBy = params.rookieId

                            var dataToSet = {
                                $push: {
                                    complaints: {
                                        userId: params.rookieId,
                                        createdAt: params.currentTime,
                                        message: params.complaintMessage,
                                        status: 3
                                    }
                                }
                            }
                            //dataToSet.status = "complaint rejected"
                            sessionBookingsModel.update(criteria, dataToSet, { new: true }, function(err, res) {
                                callback(err ? err : null, { statusCode: 200, status: "success", message: "Complaint rejected successfully" })
                            })
                        }
                    })
                } */
                else {
                    if (params.sessionType == "group") { // rejecting complaint on group lesson
                        var update = false
                        Utils.async.auto({
                            insertComplaint: [function(cb) {

                                var dataToSet = {
                                    $push: {
                                        complaints: {
                                            userId: params.userId,
                                            message: params.complaintMessage,
                                            createdAt: params.currentTime,
                                            status: 3,
                                            rejectedUserId: params.rookieId
                                        }
                                    }
                                }
                                var criteria = {
                                    groupLessonNumber: params.sessionId
                                }

                                sessionsModel.update(criteria, dataToSet, { new: true, multi: true }, function(err, res) {
                                    // callback(err ? err : null, { statusCode: 200, status: "success", message: "Complaint rejected successfully" })
                                    if (err) cb(err)
                                    else {
                                        //params.sessionType == "group" ? criteria.groupLessonNumber = params.sessionId : criteria.sessionId = params.sessionId
                                        criteria.paymentDoneBy = params.rookieId

                                        var dataToSet = {
                                            $push: {
                                                complaints: {
                                                    userId: params.rookieId,
                                                    createdAt: params.currentTime,
                                                    message: params.complaintMessage,
                                                    status: 3
                                                }
                                            }
                                        }

                                        sessionBookingsModel.update(criteria, dataToSet, { new: true }, function(err, res) {
                                            cb(err ? err : null, { statusCode: 200, status: "success", message: "Complaint rejected successfully" })
                                        })
                                    }
                                })

                            }],
                            getSessionEndDate: ["insertComplaint", function(data, cb) {

                                sessionsModel.findOne({ groupLessonNumber: params.sessionId }, {}, { sort: { endDateTime: -1 } }, function(err, res) {
                                    if (err) cb(err)
                                    else {
                                        var endDate = Utils.moment(res.endDateTime * 1000).add(1, "day").unix()

                                        if (endDate <= params.currentTime) {
                                            update = true
                                            cb(null, data)
                                        } else {
                                            cb(null, data)
                                        }
                                    }
                                })
                            }],
                            getTransactionId: ["getSessionEndDate", function(data, cb) {

                                sessionBookingsModel.findOne({ paymentStatus: SESSION_STATUS.payment_done, groupLessonNumber: params.sessionId, paymentDoneBy: params.rookieId }, function(err, res) {
                                    if (err) cb(err)
                                    else {
                                        params.transactionId = res.transactionDetails[0].transactionId
                                        cb(null, null)
                                    }
                                })
                            }],
                            updateTransaction: ["getTransactionId", function(data, cb) {
                                if (update == true) {
                                    transactionsModel.findOneAndUpdate({ _id: params.transactionId }, { requestStatus: REQUEST_STATUS.readyForPayment }, { new: true }, function(err, res) {
                                        cb(null, data)
                                    })
                                } else {
                                    cb(null, null)
                                }

                            }],
                            sendNotification: ["updateTransaction", function(data, cb) {

                                var startDate = Utils.moment(data.getSessionEndDate.endDateTime * 1000).format("YYYY-MM-DD HH:mm:ss")

                                var obj = {
                                    senderId: params.userDetails,
                                    receiverId: params.rookieId,
                                    groupLessonNumber: params.sessionId,
                                    notificationEventType: NOTIFICATION_TYPE.complaint_raised,
                                    createdAt: Utils.moment().unix(),
                                    saveInDb: true,
                                    message: "Admin has rejected your complaint on group lesson ended on " + startDate + " with the message " + params.complaintMessage + " . Therefore, you won't get any refund for the session."
                                }

                                Utils.universalFunctions.sendNotification(obj, "notification", function(err, res) {
                                    cb(err, data)
                                })
                            }]

                        }, function(err, result) {
                            callback(err ? err : null, { statusCode: 200, status: "success", message: "Complaint rejected successfully" })
                        });
                    } else { // rejecting complaint on one one lesson
                        var sessionDetails
                        Utils.async.auto({
                            updateModels: [function(cb) {
                                var dataToSet = {
                                    $push: {
                                        complaints: {
                                            userId: params.userId,
                                            message: params.complaintMessage,
                                            createdAt: params.currentTime,
                                            status: 3,
                                            rejectedUserId: params.rookieId
                                        }
                                    }
                                }
                                var criteria = {
                                    _id: params.sessionId
                                }

                                sessionsModel.update(criteria, dataToSet, { new: true, multi: true }, function(err, res) {
                                    // callback(err ? err : null, { statusCode: 200, status: "success", message: "Complaint rejected successfully" })
                                    if (err) cb(err)
                                    else {
                                        sessionDetails = res
                                        //params.sessionType == "group" ? criteria.groupLessonNumber = params.sessionId : criteria.sessionId = params.sessionId
                                        criteria.paymentDoneBy = params.rookieId

                                        var dataToSet = {
                                            $push: {
                                                complaints: {
                                                    userId: params.rookieId,
                                                    createdAt: params.currentTime,
                                                    message: params.complaintMessage,
                                                    status: 3
                                                }
                                            }
                                        }
                                        //dataToSet.status = "complaint rejected"
                                        sessionBookingsModel.update(criteria, dataToSet, { new: true }, function(err, res) {
                                            cb(err ? err : null, { statusCode: 200, status: "success", message: "Complaint rejected successfully" })
                                        })
                                    }
                                })
                            }],
                            checkIfActionTakenAfter24hrsOfCompletionOfLesson: ["updateModels", function(data, cb) {

                                var endDate = Utils.moment(sessionDetails.endDateTime * 1000).add(1, "day").unix()

                                if (endDate <= params.currentTime) {

                                    transactionsModel.findOneAndUpdate({ sessionId: params.sessionId, transactionType: TRANSACTION_TYPE.cardToStripe }, { requestStatus: REQUEST_STATUS.readyForPayment }, { new: true }, function(err, res) {
                                        cb(null, data)
                                    })

                                } else {
                                    cb(null, data)
                                }
                            }],
                            sendNotification: ["checkIfActionTakenAfter24hrsOfCompletionOfLesson", function(data, cb) {

                                var startDate = Utils.moment(data.checkIfauthenticatedUser.endDateTime * 1000).format("YYYY-MM-DD HH:mm:ss")

                                var obj = {
                                    senderId: params.userDetails,
                                    receiverId: params.rookieId,
                                    sessionId: [params.sessionId],
                                    notificationEventType: NOTIFICATION_TYPE.complaint_raised,
                                    createdAt: Utils.moment().unix(),
                                    saveInDb: true,
                                    message: "Admin has rejected your complaint on one to one lesson ended on " + startDate + " with the message " + params.complaintMessage + " . Therefore, you won't get any refund for the session."
                                }

                                Utils.universalFunctions.sendNotification(obj, "notification", function(err, res) {
                                    cb(err, data)
                                })
                            }]
                        }, function(err, result) {
                            callback(err ? err : null, { statusCode: 200, status: "success", message: "Complaint rejected successfully" })
                        });
                    }
                }
            }]


        }, function(err, result) {
            callback(err ? err : null, result);
        });
    },

    readComplaintOnSession: function(params, callback) {
        var arr = []
        Utils.async.auto({
            getInfo: [function(cb) {
                var criteria = {}

                params.sessionType == "one-one" ? criteria._id = params.sessionId : criteria.groupLessonNumber = params.sessionId

                sessionsModel.find(criteria, { requestedTo: 1, requestedBy: 1, skillId: 1, startDateTime: 1, endDateTime: 1, ratePerHour: 1, ratePerRookie: 1, complaints: 1 })
                    .populate({ path: 'requestedTo', select: "firstName lastName profilePic" })
                    .populate({ path: 'requestedBy', select: "firstName lastName profilePic" })
                    .populate({ path: 'complaints.userId', select: "firstName lastName profilePic" })
                    .populate({ path: 'skillId', select: "name parent", populate: { path: "parent", select: "name" } })
                    .exec(function(err, res) {
                        if (err) cb(err)
                        else {
                            if (params.sessionType == "one-one") {
                                arr = res
                            } else {

                                var x = Utils._.groupBy(res, function(obj) {
                                    return obj.groupLessonNumber
                                })
                                var map = Utils._.map(x, function(num) {
                                    return num
                                })

                                for (var i = 0; i < map.length; i++) {
                                    for (var j = 0; j < map[i].length; j++) {
                                        var length = map[i].length
                                        arr.push({
                                            startDateTime: map[i][length - 1].startDateTime,
                                            endDateTime: map[i][j].endDateTime,
                                            ratePerRookie: map[i][j].ratePerRookie,
                                            complaints: map[i][j].complaints,
                                            groupLessonNumber: map[i][j].groupLessonNumber,
                                            skillId: map[i][j].skillId,
                                            requestedBy: map[i][j].requestedBy,
                                            requestedTo: map[i][j].requestedTo,
                                        })
                                        break;
                                    }
                                }
                            }
                            cb(null, arr)
                        }
                    })

            }],
        }, function(err, result) {
            callback(err ? err : null, { statusCode: 200, status: "success", message: "Fetched successfully", data: arr });
        });
    },

    getUsersOnComplaints: function(params, callback) {
        var rookieComment = {},
            guruComment = {},
            adminComment = {}
        Utils.async.auto({
            checkSession: [function(cb) {
                var criteria = {}

                params.sessionType == "group" ? criteria.groupLessonNumber = params.sessionId : criteria._id = params.sessionId

                sessionsModel.findOne(criteria, { complaints: 1 })
                    .populate({ path: "complaints.userId", select: "profilePic firstName lastName" })
                    .exec(function(err, res) {
                        if (err) cb(err)
                        if (res == null) cb({ statusCode: 401, status: "warning", message: "Invalid session/user id" })
                        else {
                            cb(null, res)
                        }
                    })
            }],
            getComplaints: ["checkSession", function(data, cb) {

                if (params.sessionType == "one-one") {

                    if (data.checkSession.complaints.length > 0) {

                        for (var i = 0; i < data.checkSession.complaints.length; i++) {

                            if (data.checkSession.complaints[i].status == 1) {
                                rookieComment = {
                                    userDetails: data.checkSession.complaints[i].userId,
                                    ticketNumber: data.checkSession.complaints[i].ticketNumber,
                                    message: data.checkSession.complaints[i].message,
                                    reason: data.checkSession.complaints[i].reason,
                                }

                            }
                            if (data.checkSession.complaints[i].status == 2) {
                                guruComment = {
                                    userDetails: data.checkSession.complaints[i].userId,
                                    message: data.checkSession.complaints[i].message,
                                    reason: data.checkSession.complaints[i].reason,
                                }
                            }
                            if (data.checkSession.complaints[i].status == 3) {
                                adminComment = {
                                    userDetails: {
                                        "_id": data.checkSession.complaints[i].userId._id,
                                        "firstName": "Admin",
                                        "profilePic": ""
                                    },
                                    message: data.checkSession.complaints[i].message,
                                    reason: data.checkSession.complaints[i].reason,
                                }
                            }
                        }

                    }

                } else {
                    if (data.checkSession.complaints.length > 0) {

                        for (var i = 0; i < data.checkSession.complaints.length; i++) {

                            if (params.userDetails._id.toString() == data.checkSession.complaints[i].userId._id.toString() && data.checkSession.complaints[i].status == 1) {
                                rookieComment = {
                                    userDetails: data.checkSession.complaints[i].userId,
                                    ticketNumber: data.checkSession.complaints[i].ticketNumber,
                                    message: data.checkSession.complaints[i].message,
                                    reason: data.checkSession.complaints[i].reason,
                                }
                            }
                            if (data.checkSession.complaints[i].status == 2 && params.userDetails._id.toString() == data.checkSession.complaints[i].rejectedUserId.toString()) {
                                guruComment = {
                                    userDetails: data.checkSession.complaints[i].userId,
                                    message: data.checkSession.complaints[i].message,
                                    reason: data.checkSession.complaints[i].reason,
                                }
                            }
                            if (data.checkSession.complaints[i].status == 3 && params.userDetails._id.toString() == data.checkSession.complaints[i].rejectedUserId.toString()) {
                                adminComment = {
                                    userDetails: {
                                        "_id": data.checkSession.complaints[i].userId._id,
                                        "firstName": "Admin",
                                        "profilePic": ""
                                    },
                                    message: data.checkSession.complaints[i].message,
                                    reason: data.checkSession.complaints[i].reason,
                                }
                            }
                        }

                    }
                }
                cb(null, null)
            }]

        }, function(err, result) {
            callback(err ? err : null, {
                statusCode: 200,
                status: "success",
                message: "Complaints fetched successfully",
                rookieComment: rookieComment,
                guruComment: guruComment,
                adminComment: adminComment
            });
        });
    },

    guruGetComplaintsOnGroupLesson: function(params, callback) {
        var final = []
        Utils.async.auto({
            checkSession: [function(cb) {
                if (params.type != 4) {
                    var criteria = {}

                    params.sessionType == "group" ? criteria.groupLessonNumber = params.sessionId : criteria._id = params.sessionId

                    sessionsModel.findOne(criteria, { complaints: 1 })
                        .populate({ path: "complaints.userId", select: "profilePic firstName lastName" })
                        .exec(function(err, res) {
                            if (err) cb(err)
                            if (res == null) cb({ statusCode: 401, status: "warning", message: "Invalid session/user id" })
                            else {
                                cb(null, res)
                            }
                        })
                } else {
                    var criteria = {}

                    params.sessionType == "group" ? criteria.groupLessonNumber = params.sessionId : criteria._id = params.sessionId

                    sessionsModel.findOne(criteria, { cancelledJoinees: 1 })
                        .populate({ path: "cancelledJoinees", select: "profilePic firstName lastName" })
                        .exec(function(err, res) {
                            if (err) cb(err)
                            if (res == null) cb({ statusCode: 401, status: "warning", message: "Invalid session/user id" })
                            else {
                                cb(null, res)
                            }
                        })
                }
            }],
            getComplaints: ["checkSession", function(data, cb) {


                if (params.type != 4 && data.checkSession.complaints.length > 0) {

                    Utils.async.eachSeries(data.checkSession.complaints, function(innerItem, Inncb) {
                            if (innerItem.status == 1) {
                                var isOverDue = false
                                Utils.async.auto({
                                    checkBooking: [function(cb) {

                                        sessionBookingsModel.findOne({ groupLessonNumber: params.sessionId, paymentDoneBy: innerItem.userId._id }, function(err, res) {
                                            if (err) cb(err)
                                            else {

                                                var obj = Utils._.sortBy(res.complaints, function(obj) {
                                                    return obj.status
                                                }).reverse()

                                                if (params.type == 1 && obj[0].status == 1) {

                                                    var complaintTime = obj[0].createdAt
                                                    var endTime = moment(complaintTime * 1000).add(24, "hours").unix()



                                                    if (endTime <= Utils.moment().unix()) {
                                                        isOverDue = true
                                                    }

                                                    final.push({
                                                        userDetails: innerItem.userId,
                                                        ticketNumber: innerItem.ticketNumber ? innerItem.ticketNumber : 0,
                                                        message: innerItem.message ? innerItem.message : "",
                                                        reason: innerItem.reason ? innerItem.reason : "",
                                                        isOverDue: isOverDue
                                                    })

                                                } else if (params.type == 2 && (obj[0].status == 2 || obj[0].status == 3)) {
                                                    console.log(innerItem, obj[0])
                                                    final.push({
                                                        userDetails: innerItem.userId,
                                                        message: obj[0].message ? obj[0].message : "",
                                                        reason: obj[0].message ? obj[0].message : "",
                                                    })
                                                } else if (params.type == 3 && obj[0].status == 4) {
                                                    final.push({
                                                        userDetails: innerItem.userId
                                                    })
                                                }

                                                cb(null, null)
                                            }
                                        })

                                    }]
                                }, function(err, result) {
                                    Inncb(err ? err : null, true)
                                })
                            } else {
                                Inncb();
                            }
                        },
                        function(err, result) {
                            cb(null, null)
                        });

                } else {
                    var criteria = {}
                    params.sessionType == "group" ? criteria.groupLessonNumber = params.sessionId : criteria.sessionId = params.sessionId


                    Utils.async.eachSeries(data.checkSession.cancelledJoinees, function(item, Incb) {

                            criteria.paymentDoneBy = item._id

                            sessionBookingsModel.findOne(criteria).exec(function(err, res) {
                                if (err) Incb(err)
                                else {

                                    final.push({
                                        userDetails: item,
                                        isRefunded: res.paymentStatus == SESSION_STATUS.refunded ? true : false
                                    })
                                    Incb();
                                }
                            })

                        },
                        function(err, result) {
                            if (err) cb(err);
                            cb(null, data);
                        });
                }

            }]

        }, function(err, result) {
            callback(err ? err : null, {
                statusCode: 200,
                status: "success",
                message: "Fetched successfully",
                data: final
            });
        });
    },

    getStudentListingForGuru: function(params, callback) {
        var arr = []
        Utils.async.auto({
                getLessons: [function(cb) {

                    sessionsModel.find({ endDateTime: { $lte: Utils.moment().unix() }, status: { $in: [SESSION_STATUS.refunded, SESSION_STATUS.payment_done, SESSION_STATUS.completed] }, requestedTo: params.userDetails._id }, { groupLessonNumber: 1, ratePerRookie: 1, ratePerHour: 1, startDateTime: 1, endDateTime: 1, sessionType: 1, requestedBy: 1, joinees: 1, skillId: 1 }, {})
                        .populate({ path: 'skillId', select: "parent name", populate: { path: "parent", select: "name" } })
                        .populate({ path: "joinees", select: "email firstName lastName profilePic" })
                        .populate({ path: "requestedBy", select: "email firstName lastName profilePic" })
                        .exec(function(err, res) {

                            cb(err ? err : null, res)
                        })
                }],
                setData: ["getLessons", function(data, cb) {

                    Utils.async.eachSeries(data.getLessons, function(item, Incb) {

                            if (item.sessionType == "one-one") {
                                arr.push({
                                    userData: item.requestedBy,
                                    skillId: item.skillId,
                                    startDateTime: item.startDateTime,
                                    endDateTime: item.endDateTime,
                                    ratePerHour: item.ratePerHour,
                                    sessionType: "one-one",
                                    _id: item._id

                                })

                            } else {
                                for (var i = 0; i < item.joinees.length; i++) {
                                    item.joinees[0] = item.joinees[i]
                                    arr.push({
                                        userData: item.joinees[0],
                                        skillId: item.skillId,
                                        startDateTime: item.startDateTime,
                                        endDateTime: item.endDateTime,
                                        ratePerRookie: item.ratePerRookie,
                                        sessionType: "group",
                                        _id: item.groupLessonNumber,
                                        isOnGoing: false
                                    })

                                }
                            }
                            Incb()
                        },
                        function(err, res) {

                            cb(err ? err : null, res)
                        })
                }],
                getUniqueRecords: ["setData", function(data, cb) {

                    arr = Utils._.sortBy(arr, function(obj) {
                        return obj.endDateTime
                    }).reverse()

                    arr = Utils._.uniq(arr, function(obj) {
                        return obj.userData.email
                    })

                    params.totalRecords = arr.length

                    arr = Utils._.chain(arr)
                        .rest(params.skip || 0)
                        .first(params.limit || 10)

                    arr = arr._wrapped


                    cb(null, null)
                }],
                checkGroupLessonLastDate: ["getUniqueRecords", function(data, cb) {

                    Utils.async.eachSeries(arr, function(item, Incb) {

                            if (item.sessionType == "group") {

                                sessionsModel.find({ groupLessonNumber: item._id }, {}, { sort: { startDateTime: -1 } }, function(err, res) {

                                    if (res.length > 0) {
                                        var length = res.length
                                        var i = 0

                                        var startDateTime = res[length - 1].startDateTime
                                        var endDateTime = res[i].endDateTime

                                        if (endDateTime >= Utils.moment().unix()) {
                                            item.isOnGoing = true
                                        }
                                    }
                                    Incb()
                                })

                            } else {
                                Incb()
                            }
                        },
                        function(err, res) {

                            cb(err ? err : null, res)
                        })
                }]
            },
            function(err, result) {
                callback(err ? err : null, { statusCode: 200, status: "success", message: "Fetched successfully", totalRecords: params.totalRecords, data: arr });
            });
    },
    getPaymentDetails: function(params, callback) {
        var arr = []
        if (params.userDetails.userType == "1") { // guru fetching details

            Utils.async.auto({
                getTransactios: [function(cb) {

                    transactionsModel.find({
                            paymentDoneTo: params.userDetails._id,
                            requestStatus: REQUEST_STATUS.completed,
                            transactionType: TRANSACTION_TYPE.stripeToBank
                        }, {}, { skip: params.skip || 0, limit: params.limit || 10, sort: { transactionDate: -1 } })
                        .populate({ path: "paymentDoneBy", select: "firstName lastName" })
                        .exec(function(err, res) {
                            if (err) cb(err)
                            else {

                                for (var i = 0; i < res.length; i++) {
                                    arr.push({
                                        transactionId: res[i].transactionID,
                                        transactionDate: res[i].transactionDate,
                                        amount: res[i].finalAmountToTransfer,
                                        user: res[i].paymentDoneBy ? res[i].paymentDoneBy : "",
                                        status: "Transfered successfully to bank account"
                                    })
                                }
                                cb(null, null)
                            }
                        })
                }],
                getTotalCount: [function(cb) {

                    transactionsModel.find({
                        paymentDoneTo: params.userDetails._id,
                        requestStatus: REQUEST_STATUS.completed,
                        transactionType: TRANSACTION_TYPE.stripeToBank
                    }, {}, {}, function(err, res) {
                        if (err) cb(err)
                        else {
                            params.totalRecords = res.length
                            cb(null, null)
                        }
                    })
                }]
            }, function(err, result) {
                callback(err ? err : null, { statusCode: 200, status: "success", message: "Fetched successfully", totalRecords: params.totalRecords, data: arr });
            });
        } else { // rookie fetching details
            Utils.async.auto({

                getTransactios: [function(cb) {

                    transactionsModel.find({
                            paymentDoneBy: params.userDetails._id,
                            transactionType: { $in: [TRANSACTION_TYPE.cardToStripe, TRANSACTION_TYPE.refund] },
                        }, {}, { skip: params.skip || 0, limit: params.limit || 10, sort: { transactionDate: -1 } })
                        .populate({ path: "paymentDoneTo", select: "firstName lastName" })
                        .exec(function(err, res) {
                            if (err) cb(err)
                            else {

                                for (var i = 0; i < res.length; i++) {
                                    arr.push({
                                        transactionId: res[i].transactionID,
                                        transactionDate: res[i].transactionDate,
                                        user: res[i].paymentDoneTo ? res[i].paymentDoneTo : "",
                                        status: res[i].transactionType == 1 ? "Deducted from you" : "Refunded",
                                        amount: res[i].transactionType == 1 ? res[i].metaData.stripeCharge.amount / 100 : res[i].metaData.refundCharge.amount / 100
                                    })
                                }
                                cb(null, null)
                            }
                        })
                }],
                getTotalCount: [function(cb) {

                    transactionsModel.find({
                        paymentDoneBy: params.userDetails._id,
                        transactionType: { $in: [TRANSACTION_TYPE.cardToStripe, TRANSACTION_TYPE.refund] },
                    }, function(err, res) {
                        if (err) cb(err)
                        else {
                            params.totalRecords = res.length
                            cb(null, null)
                        }
                    })
                }]
            }, function(err, result) {
                callback(err ? err : null, { statusCode: 200, status: "success", message: "Fetched successfully", totalRecords: params.totalRecords, data: arr });
            });
        }
    },

    sendReminderNotification: function(params, callback) {
        var endDate = Utils.moment().endOf("day").unix()

        sessionsModel.findOne({ groupLessonNumber: groupLessonNumber, startDateTime: { $gt: endDate } }, {}, { sort: { endDateTime: -1 } }, function(err, res) {
            if (err) callback(err)
            if (res == null) callback(null, null)
            else {

                async.eachSeries(res.joinees, function(item, Incb) {

                        var startTime = Utils.moment(res.startDateTime * 1000).format("YYYY-MM-DD HH:mm:ss")

                        var message = "Your next class for this session will be on " + startTime + " . Please be available to attend the session."

                        var obj = {
                            senderId: item,
                            receiverId: item,
                            notificationEventType: NOTIFICATION_TYPE.reminder_notification,
                            createdAt: Utils.moment().unix(),
                            saveInDb: true,
                            message: message,
                            groupLessonNumber: params.groupLessonNumber
                        }

                        Utils.universalFunctions.sendNotification(obj, "notification", function(err, res) {
                            Incb(null, true)
                        })
                    },
                    function(err, result) {
                        callback(err ? err : null, result)
                    });

            }
        })
    },

    addReason: function(params, callback) {
        Utils.async.auto({
            addReason: [function(cb) {

                cancellationReasonsModel(params).save(function(err, res) {
                    cb(err ? err : null, res)
                })
            }]
        }, function(err, result) {
            callback(err ? err : { statusCode: 200, status: "success", message: "Saved successfully" });
        });
    },
    getReasons: function(params, callback) {
        Utils.async.auto({
            getReasons: [function(cb) {

                cancellationReasonsModel.find({ type: params.type }, { reason: 1 }, { sort: { reason: 1 } }, function(err, res) {
                    cb(err ? err : null, res)
                })
            }]
        }, function(err, result) {
            callback(err ? err : { statusCode: 200, status: "success", message: "Fetched successfully", data: result.getReasons });
        });
    },

    contactUs: function(params, callback) {
        Utils.async.auto({
            contactUs: [function(cb) {

                contactUsModel(params).save(function(err, res) {
                    cb(err ? err : null, res)
                })
            }],
            getAllAdmins: [function(cb) {

                userModel.find({ userType: "3" }, { email: 1 }, function(err, res) {
                    cb(null, res)
                })
            }],
            sendEmailToAdmin: ["contactUs", "getAllAdmins", function(data, cb) {

                Utils.async.eachSeries(data.getAllAdmins, function(item, Incb) {

                        var templatepath = Utils.path.join(__dirname, '../../../assets/emailTemplates/');
                        var fileReadStream = Utils.fs.createReadStream(templatepath + 'contactUs.html');
                        var emailTemplate = '';

                        fileReadStream.on('data', function(buffer) {
                            emailTemplate += buffer.toString();
                        });

                        fileReadStream.on('end', function(res) {

                            var sendStr = emailTemplate.replace('{{name}}', params.name).replace('{{email}}', params.email).replace('{{message}}', params.message);

                            Utils.universalFunctions.sendMail(item.email, "Virtual Classroom Contact Us", sendStr);
                            Incb();
                        });

                    },
                    function(err, result) {
                        cb(err ? err : null, result)
                    });
            }]
        }, function(err, result) {
            callback(err ? err : { statusCode: 200, status: "success", message: "Submitted successfully" });
        });
    },


}