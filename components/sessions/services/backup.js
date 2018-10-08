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


var APP_CONSTANTS = configs.constants;
var LESSON_TYPE = APP_CONSTANTS.LESSON_TYPE;
var SESSION_STATUS = APP_CONSTANTS.SESSION_STATUS;



module.exports = {

    addGroupLesson: function(params, callback) {
        var notAvailableDates = []

        Utils.async.auto({

                checkAllComingDates: [function(cb) {
                    Utils.universalFunctions.logger("First check all the dates that are in params that there must not be any bookings for same time")

                    Utils.async.eachSeries(params.dateAndTime, function(item, Incb) {

                            Utils.async.auto({
                                    checkingIfThereIsNoOtherBookingAtSameTime: [function(cb) {

                                        Utils.universalFunctions.logger("checking if there is no other booking of same time for this guru")

                                        // item.endDateTime = Utils.moment(item.endDateTime * 1000).add(15, 'minutes').unix()

                                        var criteria = {
                                            $or: [{
                                                    $and: [{ startDateTime: { $lte: item.startDateTime } }, { endDateLagTime: { $gte: item.startDateTime } }]
                                                },
                                                {
                                                    $and: [{ startDateTime: { $lte: item.endDateTime } }, { endDateLagTime: { $gte: item.endDateTime } }]
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
                getGroupLessonId: [function(cb) {

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
                                        ratePerRookie: params.ratePerRookie,
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
            hourlyRate;
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
                            $and: [{
                                    $and: [{ startDateTime: { $lte: date.startDateTime } }, { endDateLagTime: { $gte: date.startDateTime } }]
                                },
                                {
                                    $and: [{ startDateTime: { $lte: lagTime } }, { endDateLagTime: { $gte: lagTime } }]
                                }
                            ],
                            status: SESSION_STATUS.payment_done,
                            isDeleted: false
                        }, function(err, res) {
                            console.log("check available slots booking.....", res)

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
                            ratePerHour: hourlyRate,
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
                            err ? Incb(err) : Incb(null, true)
                        })
                    }, function(err, result) {
                        err ? cb(err) : cb(null, true)
                    })
                } else {
                    callback(null, { status: "success", statusCode: 200, message: "Request successful", data: { bookingDoneSlots: availableSlotsForBooking, notBooked: bookedSlots } })
                }
            }]
        }, function(err, result) {
            err ? callback(err) : callback(null, { status: "success", statusCode: 200, message: "Request successful", data: { bookingDoneSlots: availableSlotsForBooking, notBooked: bookedSlots } })
        })
    },
    approveRejectOneToOneLesson: function(params, callback) { // api for guru to approve one to one lesson of a student
        Utils.universalFunctions.logger("inside approve reject")

        if (params.type == 1) { // when to accept the lesson
            Utils.async.auto({

                validateSession: [function(cb) { // get the session details
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
                        $and: [{
                                $and: [{ startDateTime: { $lte: data.validateSession.startDateTime } }, { endDateLagTime: { $gte: data.validateSession.endDateLagTime } }]
                            },
                            {
                                $and: [{ startDateTime: { $lte: data.validateSession.endDateTime } }, { endDateLagTime: { $gte: data.validateSession.endDateLagTime } }]
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

                // createSessionBooking: ['acceptSessionRequest', function(data, cb) { // create the booking of session
                //     var obj = {
                //         sessionId: params.session_id
                //     }
                //     sessionBookingsModel(obj).save(function(err, res) {
                //         err ? cb(err) : cb(null, res)
                //     })
                // }],

                // expireAllOtherRequestOfThisStudentAtTheSameTime: ['createSessionBooking', function(data, cb) {
                //     sessionsModel.update({
                //         _id: { $ne: params.session_id },
                //         requestedBy: data.validateSession.requestedBy,
                //         startDateTime: data.validateSession.startDateTime,
                //         endDateTime: data.validateSession.endDateTime,
                //     }, { status: 'expired' }, { multi: true }, function(err, res) {
                //         err ? cb(err) : cb(null, res)
                //         //err? cb(err) : (res ? cb(null, res): cb({status:'warning', statusCode:401, message:'You are not available to accept this session'}))
                //     })
                // }]

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
                err ? callback(err) : callback(null, { status: 'success', statusCode: 200, message: 'Session rejected successfully' })
                //err? cb(err) : (res ? cb(null, res): cb({status:'warning', statusCode:401, message:'You are not available to accept this session'}))
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

                    Utils.async.eachSeries(timestamps, function(item, Incb) {

                            Utils.async.auto({
                                    checkBookingForSameTime: [function(cb) {

                                        var criteria = {
                                            $or: [{
                                                    $and: [{ startDateTime: { $lte: item.start_date_time } }, { endDateLagTime: { $gte: item.start_date_time } }]
                                                },
                                                {
                                                    $and: [{ startDateTime: { $lte: item.end_date_time } }, { endDateLagTime: { $gte: item.end_date_time } }]
                                                }
                                            ],
                                            status: SESSION_STATUS.payment_done,
                                            requestedTo: params.userId,
                                            isDeleted: false
                                        }

                                        sessionsModel.find(criteria, function(err, res) {
                                            res.length == 0 ? item["available"] = true : item["available"] = false
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
            notAvailableDates = []

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
                        a == true ? { statusCode: 401, status: "warning", message: "You have already joined the lesson." } : null, params)
                })
            }],
            getAllDatesOfLesson: [function(cb) {
                Utils.universalFunctions.logger("Get all the dates of the group lesson")

                sessionsModel.find({ groupLessonNumber: params.groupLessonNumber, sessionType: LESSON_TYPE.group }, function(err, res) {
                    if (err) cb(err)
                    else {
                        for (var i = 0; i < res.length; i++) {
                            allDates.push({ guruId: res[i].requestedBy, sessionId: res[i]._id, startDateTime: res[i].startDateTime, endDateLagTime: res[i].endDateLagTime })
                        }
                        cb(null, params)
                    }
                });

            }],
            checkIfRookieHasNoOtherBookingAtSameTime: ["getAllDatesOfLesson", "checkIfGroupLessonExists", function(data, cb) {

                Utils.async.eachSeries(allDates, function(item, Incb) {

                        Utils.async.auto({
                                checkingIfThereIsNoOtherBookingAtSameTime: [function(cb) {

                                    Utils.universalFunctions.logger("checking if there is no other one-one booking of same time for this rookie")

                                    var criteria = {
                                        $or: [{
                                                $and: [{ startDateTime: { $lte: item.startDateTime } }, { endDateLagTime: { $gte: item.startDateTime } }]
                                            },
                                            {
                                                $and: [{ startDateTime: { $lte: item.endDateLagTime } }, { endDateLagTime: { $gte: item.endDateLagTime } }]
                                            }
                                        ],
                                        status: SESSION_STATUS.payment_done,
                                        requestedBy: params.userId,
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
                                        $or: [{
                                                $and: [{ startDateTime: { $lte: item.startDateTime } }, { endDateLagTime: { $gte: item.startDateTime } }]
                                            },
                                            {
                                                $and: [{ startDateTime: { $lte: item.endDateLagTime } }, { endDateLagTime: { $gte: item.endDateLagTime } }]
                                            }
                                        ],
                                        status: SESSION_STATUS.payment_done,
                                        joinees: { $in: [params.userId] },
                                        sessionType: LESSON_TYPE.group
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
                            callback({ statusCode: 401, status: "warning", message: "Sorry you already have the bookings on these dates ", notAvailableDates: notAvailableDates })
                        } else {
                            cb(null, params)
                        }
                    });
            }],
            checkIfGuruHasNoOtherBookingAtSameTime: ["getAllDatesOfLesson", "checkIfGroupLessonExists", function(data, cb) {

                Utils.async.eachSeries(allDates, function(item, Incb) {

                        Utils.async.auto({
                                checkingIfThereIsNoOtherBookingAtSameTime: [function(cb) {

                                    Utils.universalFunctions.logger("checking if there is no other one-one booking of same time for this rookie")

                                    var criteria = {
                                        $or: [{
                                                $and: [{ startDateTime: { $lte: item.startDateTime } }, { endDateLagTime: { $gte: item.startDateTime } }]
                                            },
                                            {
                                                $and: [{ startDateTime: { $lte: item.endDateLagTime } }, { endDateLagTime: { $gte: item.endDateLagTime } }]
                                            }
                                        ],
                                        status: SESSION_STATUS.payment_done,
                                        isDeleted: false,
                                        requestedTo: params.guruId,
                                        groupLessonNumber: { $ne: params.groupLessonNumber }
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
                        else if (notAvailableDates.length > 0) {
                            callback({ statusCode: 401, status: "warning", message: "Sorry guru has already been booked for these dates ", notAvailableDates: notAvailableDates })
                        } else {
                            cb(null, params)
                        }
                    });
            }],
            makePayment: ["checkIfRookieHasNoOtherBookingAtSameTime", "checkIfGuruHasNoOtherBookingAtSameTime", function(data, cb) {
                cb(null, null)
            }],
            makeEntryInBookings: ["makePayment", function(data, cb) {

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
                            }]
                            //save transactionId later here
                        }

                        sessionBookingsModel(obj).save(function(err, res) {
                            Incb(err ? err : null, res)
                        })
                    },
                    function(err, result) {
                        cb(err ? err : null, result)
                    });
            }],
            updateSessions: ["makePayment", function(data, cb) {

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
            }]
        }, function(err, result) {
            callback(err ? err : null, { statusCode: 200, status: "success", message: "Booking successful" });
        });
    },

    cancelOneOneLessonGuru: function(params, callback) {
        Utils.async.auto({

            checkSessionId: [function(cb) {

                sessionsModel.findOne({ _id: params.sessionId, sessionType: LESSON_TYPE.one, isDeleted: false }, function(err, res) {
                    cb(err ? err : res == null ? { statusCode: 401, status: "warning", message: "Invalid session id" } : null, res)
                })
            }],
            checkIfPaymentDone: [function(cb) {
                Utils.universalFunctions.logger("Check if payment was done or not")

                sessionBookingsModel.findOne({ sessionId: params.sessionId }, function(err, res) {
                    res == null ? params.payment = false : params.payment = true
                    cb(err ? err : null, params)
                })
            }],
            initiateRefund: ["checkIfPaymentDone", function(data, cb) {

                if (params.payment == true) {
                    Utils.universalFunctions.logger("If payment already done then initiate refund")
                    cb(null, params)
                } else {
                    cb(null, params)
                }
            }],
            updateSessionStatus: ["initiateRefund", function(data, cb) {
                var objToSave = {}
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

                sessionsModel.findOneAndUpdate({ _id: params.sessionId }, objToSave, { new: true }, function(err, res) {
                    cb(err ? err : null, res)
                })
            }],
            updateBookingStatus: ["initiateRefund", function(data, cb) {
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

                    objToSave.$addToSet = { statusHistory: { $each: arr } }

                } else {
                    objToSave.$push = {
                        statusHistory: {
                            "status": SESSION_STATUS.cancelled_by_guru,
                            "updatedAt": Utils.moment().unix()
                        }

                    }
                }

                sessionBookingsModel.findOneAndUpdate({ sessionId: params.sessionId }, objToSave, { new: true }, function(err, res) {
                    cb(err ? err : null, res)
                })
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
            initiateRefund: ["checkIfDiffIsLess", function(data, cb) {

                if (params.payment == true) {
                    Utils.universalFunctions.logger("If payment already done then initiate refund")
                    cb(null, params)
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

                sessionsModel.findOneAndUpdate({ _id: params.sessionId }, objToSave, { new: true }, function(err, res) {
                    cb(err ? err : null, res)
                })
            }],
            updateBookingStatus: ["initiateRefund", "checkIfDiffIsLess", function(data, cb) {

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

                    objToSave.$addToSet = { statusHistory: { $each: arr } }

                } else {
                    objToSave.$push = {
                        statusHistory: {
                            "status": SESSION_STATUS.cancelled_by_rookie,
                            "updatedAt": Utils.moment().unix()
                        }
                    }
                }

                sessionBookingsModel.findOneAndUpdate({ sessionId: params.sessionId }, objToSave, { new: true }, function(err, res) {
                    cb(err ? err : null, res)
                })
            }]
        }, function(err, result) {
            var message
            params.payment == true ?
                message = "Your booking has been cancelled and refund has been initiated" : message = "Booking cancelled but you won't get any refund for the same."

            callback(err ? err : { statusCode: 200, status: "success", message: message });
        });
    },

    rookiePayForOneOneLesson: function(params, callback) {
        var details
        Utils.async.auto({
                checkSessionIdAndRequestStatus: [function(cb) {

                    sessionsModel.findOne({ _id: params.sessionId, sessionType: LESSON_TYPE.one, isDeleted: false }, function(err, res) {

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
                        $and: [{
                                $and: [{ startDateTime: { $lte: details.startDateTime } }, { endDateLagTime: { $gte: details.startDateTime } }]
                            },
                            {
                                $and: [{ startDateTime: { $lte: details.endDateLagTime } }, { endDateLagTime: { $gte: details.endDateLagTime } }]
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
                        $and: [{
                                $and: [{ startDateTime: { $lte: details.startDateTime } }, { endDateLagTime: { $gte: details.startDateTime } }]
                            },
                            {
                                $and: [{ startDateTime: { $lte: details.endDateLagTime } }, { endDateLagTime: { $gte: details.endDateLagTime } }]
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
                        $and: [{
                                $and: [{ startDateTime: { $lte: details.startDateTime } }, { endDateLagTime: { $gte: details.startDateTime } }]
                            },
                            {
                                $and: [{ startDateTime: { $lte: details.endDateLagTime } }, { endDateLagTime: { $gte: details.endDateLagTime } }]
                            }
                        ],
                        status: SESSION_STATUS.payment_done,
                        isDeleted: false
                    }, function(err, res) {
                        cb(err ? err : res != null ? { statusCode: 401, status: 'warning', message: "Guru has been already booked for this slot." } : null, res)
                    })
                }],
                makePayment: ["checkSessionIdAndRequestStatus", function(data, cb) {
                    Utils.universalFunctions.logger("Make payment for 1-1 lesson")
                    cb(null, null)
                }],
                makeBooking: ["makePayment", function(data, cb) {

                    var obj = {
                        sessionId: params.sessionId,
                        paymentStatus: SESSION_STATUS.payment_done,
                        paymentDoneBy: params.userId,
                        paymentDoneTo: details.requestedTo,
                        statusHistory: [{
                            status: SESSION_STATUS.payment_done,
                            updatedAt: Utils.moment().unix()
                        }]
                        //save transactionId later here
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
                            requestedTo: details.requestedTo,
                            // $and: [{
                            //         $or: [{ startDateTime: { $lte: details.startDateTime } }, { endDateTime: { $gte: details.startDateTime } }]
                            //     },
                            //     {
                            //         $or: [{ startDateTime: { $lte: details.endDateTime } }, { endDateTime: { $gte: details.endDateTime } }]
                            //     }
                            // ],
                            startDateTime: details.startDateTime,
                            endDateTime: details.endDateTime,
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
                                    "createdAt": -1
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

                        sessionsModel.find({ $and: params_array }, { requestedBy: 1, requestedTo: 1, totalSeats: 1, groupLessonNumber: 1, skillId: 1, title: 1, lessonDetails: 1, joinees: 1, ratePerRookie: 1, startDateTime: 1, endDateTime: 1 }, { lean: true, sort: { startDateTime: -1 } })
                            .populate({ path: "joinees", select: "profilePic firstName lastName" })
                            .populate({ path: "requestedTo", select: "profilePic firstName lastName" })
                            .populate({ path: "requestedBy", select: "profilePic firstName lastName" })
                            .populate({ path: "skillId", select: "name parent", populate: { path: "parent", select: "name" } })
                            .exec(function(err, res) {
                                console.log(err)
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
            final = [];

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
                params.totalCount = result.modifyData.length
                result.modifyData = Utils._.chain(result.modifyData)
                    .rest(params.skip || 0)
                    .first(params.limit || 30)

                var arr = result.modifyData
                arr = arr._wrapped

                if (params.userData.userType == '2') {
                    for (var i = 0; i < arr.length; i++) {
                        for (var j = 0; j < arr[i].ratingFeedbacks.length; j++) {
                            if (arr[i].ratingFeedbacks[j].userId.toString() == params.userData._id.toString()) {
                                arr[i].rating = arr[i].ratingFeedbacks[j].rating ? arr[i].ratingFeedbacks[j].rating : "",
                                    arr[i].feedback = arr[i].ratingFeedbacks[j].feedback ? arr[i].ratingFeedbacks[j].feedback : ""
                            }
                            break;
                        }
                        let check = arr[i].complaints.some(function(element, index) {
                            return element.userId.toString() === params.userData._id.toString();
                        });

                        let checkStatus = arr[i].complaints.some(function(element, index) {
                            return element.status === "Complaint rejected by admin"
                        });

                        if (check == true && arr[i].status == "refunded") {
                            arr[i].status = "refunded"
                        } else if (check == true && arr[i].status != "refunded")
                            arr[i].status = "inprocess"
                        else if (check == true && arr[i].complaints.length == 3 && checkStatus == true) {
                            arr[i].status = "rejected"
                        }

                        delete arr[i].complaints
                        delete arr[i].ratingFeedbacks
                    }
                } else {
                    for (var i = 0; i < arr.length; i++) {

                        arr[i].rating = arr[i].ratingFeedbacks[0].rating ? arr[i].ratingFeedbacks[0].rating : ""
                        arr[i].feedback = arr[i].ratingFeedbacks[0].feedback ? arr[i].ratingFeedbacks[0].feedback : ""

                        let checkStatus = arr[i].complaints.some(function(element, index) {
                            return element.status === "Complaint rejected by admin"
                        });

                        if (arr[i].complaints.length > 0 && arr[i].status == "refunded") {
                            arr[i].status = "refunded"
                        } else if (arr[i].complaints.length > 0 && arr[i].status != "refunded")
                            arr[i].status = "complaint raised"
                        else if (arr[i].complaints.length > 0 && arr[i].complaints.length == 3 && checkStatus == true) {
                            arr[i].status = "rejected"
                        }

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
                tmp = []
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
                        if (params.subject) {
                            params_array.push({ skillId: { $in: skills } })
                        }
                        sessionsModel.find({ $and: params_array }, { complaints: 1, ratingFeedbacks: 1, requestedBy: 1, requestedTo: 1, totalSeats: 1, groupLessonNumber: 1, skillId: 1, title: 1, lessonDetails: 1, joinees: 1, ratePerRookie: 1, startDateTime: 1, endDateTime: 1 }, { lean: true, sort: { startDateTime: -1 } })
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
                                                complaints: map[i][j].complaints
                                            })
                                            break;
                                        }
                                    }

                                    params.totalCount = arr.length

                                    arr = Utils._.chain(arr)
                                        .rest(params.skip || 0)
                                        .first(params.limit || 30)

                                    arr = arr._wrapped

                                    if (params.userData.userType == 'rookie') {
                                        for (var i = 0; i < arr.length; i++) {
                                            tmp.push(arr[i])
                                            for (var j = 0; j < arr[i].ratingFeedbacks.length; j++) {
                                                if (arr[i].ratingFeedbacks[j].userId.toString() == params.userData._id.toString()) {
                                                    arr[i].rating = arr[i].ratingFeedbacks[j].rating ? arr[i].ratingFeedbacks[j].rating : "",
                                                        arr[i].feedback = arr[i].ratingFeedbacks[j].feedback ? arr[i].ratingFeedbacks[j].feedback : ""
                                                }
                                                break;
                                            }
                                            delete arr[i].ratingFeedbacks
                                        }
                                    } else {
                                        for (var i = 0; i < arr.length; i++) {
                                            tmp.push(arr[i])
                                            arr[i].rating = arr[i].ratingFeedbacks[0].rating ? arr[i].ratingFeedbacks[0].rating : ""
                                            arr[i].feedback = arr[i].ratingFeedbacks[0].feedback ? arr[i].ratingFeedbacks[0].feedback : ""

                                            delete arr[i].ratingFeedbacks
                                        }
                                    }
                                    cb(null, arr)
                                }
                            });
                    }],
                    checkBookings: ["fetchUserRoleAndPrepareSearchCriteria", function(data, cb) {

                        if (params.userData.userType == 'rookie') {
                            Utils.async.eachSeries(arr, function(item, Incb) {

                                    sessionBookingsModel.findOne({ paymentDoneBy: params.userData._id, groupLessonNumber: item.groupLessonNumber }, function(err, res) {
                                        if (err) cb(err)
                                        else {
                                            let check = item.complaints.some(function(element, index) {
                                                return element.userId.toString() === params.userData._id.toString();
                                            });
                                            let checkStatus = arr[i].complaints.some(function(element, index) {
                                                return element.status === "Complaint rejected by admin"
                                            });

                                            if (check == true && res.status == "refunded") {
                                                item.status = "refunded"
                                            } else if (check == true && status != "refunded") {
                                                item.status = "inprocess"
                                            } else if (check == true && item.complaints.length == 3 && checkStatus == true) {
                                                item.status = "rejcted"
                                            }

                                            Incb();


                                        }
                                    })
                                },
                                function(err, result) {
                                    if (err) cb(err);
                                    cb(null, data);
                                });
                        } else {

                        }




                    }]
                },
                function(err, result) {
                    err ? callback(err) : callback(null, { status: "success", statusCode: 200, message: "Group lessons fetched successfully", totalCount: params.totalCount, data: arr })
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
                initiateRefund: ["checkIfAnyJoineeExists", function(data, cb) {

                    if (params.payment == true) {
                        Utils.universalFunctions.logger("If payment already done then initiate refund")
                        cb(null, params)
                    } else {
                        cb(null, params)
                    }
                }],
                updateSessionStatus: ["initiateRefund", function(data, cb) {
                    var objToSave = {}
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

                    sessionsModel.update({ groupLessonNumber: params.groupLessonNumber, sessionType: LESSON_TYPE.group }, objToSave, { new: true, multi: true }, function(err, res) {
                        cb(err ? err : null, res)
                    })
                }],
                updateBookingStatus: ["initiateRefund", function(data, cb) {
                    var objToSave = {}
                    params.payment == true ? objToSave.paymentStatus = SESSION_STATUS.refunded : objToSave.paymentStatus = SESSION_STATUS.cancelled_by_guru

                    params.reason ? objToSave.cancelReason = params.reason : null
                params.cancelDescription ? objToSave.cancelDescription = params.description : null

                    sessionBookingsModel.update({ groupLessonNumber: params.groupLessonNumber }, objToSave, { new: true, multi: true }, function(err, res) {
                        cb(err ? err : null, res)
                    })
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
            initiateRefund: ["checkIfAnyJoineeExists", function(data, cb) {

                if (params.payment == true) {
                    Utils.universalFunctions.logger("If payment already done then initiate refund")
                    cb(null, params)
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

                sessionsModel.update({ groupLessonNumber: params.groupLessonNumber, sessionType: LESSON_TYPE.group }, objToSave, { new: true, multi: true }, function(err, res) {
                    cb(err ? err : null, res)
                })
            }],
            updateBookingStatus: ["initiateRefund", function(data, cb) {
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

                sessionBookingsModel.update({ paymentDoneBy: params.userId, groupLessonNumber: params.groupLessonNumber }, objToSave, { new: true, multi: true }, function(err, res) {
                    cb(err ? err : null, res)
                })
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

                    sessionsModel.findOneAndUpdate({ _id: params.sessionId, status: SESSION_STATUS.rejected }, { isDeleted: true }, { new: true }, function(err, res) {
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
                    cb(err ? err : { statusCode: 200, status: "success", message: "Fetched successfully", data: count })
                })
            }],
        }, function(err, result) {
            callback(err ? err : null, result);
        });
    },

    getCountOfLessonsCompleted: function(params, callback) {
        var count = 0,
            tmp = []
        Utils.async.auto({
            getCountOfLessonsCompleted: [function(cb) {

                var criteria = {
                    $or: [{ requestedBy: params.userId }, { requestedTo: params.userId }, { joinees: { $in: [params.userId] } }],
                    status: SESSION_STATUS.payment_done,
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

                        var x = Utils._.uniq(tmp, function(obj) {
                            return obj.groupLessonNumber
                        })

                        count = count + x.length

                    }
                    cb(err ? err : { statusCode: 200, status: "success", message: "Fetched successfully", data: count })
                })
            }],
        }, function(err, result) {
            callback(err ? err : null, result);
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
                        startDateTime: { $gte: params.currentTime },
                        endDateTime: { $lte: endTime }
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
                        endDateTime: { $lte: endTime }
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
                    status: { $ne: SESSION_STATUS.cancelled_by_guru }
                }

                if (params.startDate && params.endDate) {
                    criteria.$and = [{ startDateTime: { $gte: params.startDate } }, { endDateTime: { $lte: params.endDate } }]
                }

                sessionsModel.find(criteria, { totalSeats: 1, groupLessonNumber: 1, skillId: 1, title: 1, lessonDetails: 1, joinees: 1, ratePerRookie: 1, startDateTime: 1, endDateTime: 1 }, { lean: true, sort: { startDateTime: -1 } })
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


                            for (var i = 0; i < map.length; i++) {
                                for (var j = 0; j < map[i].length; j++) {
                                    var length = map[i].length
                                    arr.push({
                                        startDateTime: map[i][length - 1].startDateTime,
                                        endDateTime: map[i][j].endDateTime,
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
            tmp = []
        Utils.async.auto({
            getLessons: [function(cb) {

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
                        status: "payment done"
                    }, { sessionType: 1, ratingFeedbacks: 1, requestedTo: 1, skillId: 1 }, { lean: true, sort: { endDateTime: -1 } })
                    .populate({ path: "requestedTo", select: "firstName lastName profilePic rating" })
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
                                        sessionType: map[i][j].sessionType,
                                        ratingFeedbacks: map[i][j].ratingFeedbacks
                                    })
                                    break;
                                }
                            }

                            params.totalCount = arr.length

                            arr = Utils._.chain(arr)
                                .rest(params.skip || 0)
                                .first(params.limit || 30)

                            arr = arr._wrapped

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
        }, function(err, result) {
            callback(err ? err : null, { statusCode: 200, status: "success", message: "Fetched successfully", totalCount: params.totalCount, data: result.getLessons });
        });
    },

    giveFeedbackOnSession: function(params, callback) {
        Utils.async.auto({
            checkIfAlreadyExists: [function(cb) {

                if (params.sessionType == "one-one") {

                    sessionsModel.findOne({ _id: params.sessionId })
                        .populate({ path: "requestedTo", select: 'rating' })
                        .exec(function(err, res) {
                            if (err) cb(err)
                            else if (res == null) {
                                cb({ statusCode: 401, status: 'warning', message: "Invalid session id" })
                            } else {
                                cb(null, res)
                            }
                        })
                } else {

                    sessionsModel.findOne({ groupLessonNumber: params.sessionId })
                        .populate({ path: "requestedTo", select: 'rating' })
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


                sessionsModel.update(criteria, dataToSet, { multi: true, new: true }, function(err, res) {
                    cb(err ? err : null, res)
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

                params.sessionType == "one-one" ? criteria._id = params.sessionId : params.groupLessonNumber = params.sessionId

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
                Utils.universalFunctions.logger("complaint an only be raised till 24 hrs of completion of lesson")

                params.sessionType == "group" ? criteria.groupLessonNumber = params.sessionId : criteria._id = params.sessionId

                sessionsModel.findOne(criteria, { complaints: 1, endDateTime: 1 }, function(err, res) {
                    if (err) cb(err)
                    if (res == null) cb({ statusCode: 400, status: "error", message: "Invalid sessionId" })
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
            saveComplaint: ["checkTime", function(data, cb) {

                var dataToSet = {
                    $push: {
                        "complaints": {
                            userId: params.userId,
                            message: params.complaintMessage,
                            createdAt: params.currentTime,
                            status: "Complaint by rookie"
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
                            createdAt: params.currentTime,
                            status: "Complaint by rookie"
                        },
                        statusHistory: {
                            "status": SESSION_STATUS.complaint_raised,
                            "updatedAt": Utils.moment().unix()
                        }
                    },
                    paymentStatus: SESSION_STATUS.complaint_raised
                }

                sessionBookingsModel.update(criteria, dataToSet, { multi: true, new: true }, function(err, res) {
                    cb(err ? err : null, res)
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
                sessionsModel.findOne(criteria, function(err, res) {
                    if (err) cb(err)
                    if (res == null) cb({ statusCode: 401, status: "warning", message: "Invalid session/user id" })
                    else {

                        cb(null, res)
                    }
                    //cb(err ? err : (res == null ? { statusCode: 401, status: "warning", message: "Invalid session/user id" } : null, res))
                })
            }],
            checkConditions: ["checkIfauthenticatedUser", function(data, cb) {

                if (params.actionToPerform == "refund") {

                    if (data.checkIfauthenticatedUser.sessionType == "one-one") {

                        Utils.async.auto({
                                checkSession: [function(cb) {

                                    sessionsModel.findOne({ _id: params.sessionId, status: 'payment done' }, function(err, res) {
                                        cb(err ? err : res == null ? { statusCode: 401, status: "warning", message: "Refund can't be initiated" } : null, res)
                                    })
                                }],
                                initiateRefund: ["checkSession", function(data, cb) {
                                    Utils.universalFunctions.logger("Initiate refund")
                                    cb(null, null)
                                }],
                                updateDb: ["initiateRefund", function(data, cb) {

                                    sessionsModel.findOneAndUpdate({ _id: params.sessionId }, {
                                        $push: {
                                            statusHistory: {
                                                "status": "refunded",
                                                "updatedAt": Utils.moment().unix()
                                            }
                                        },
                                        status: "refunded"
                                    }, { new: true }, function(err, res) {
                                        if (err) cb(err)
                                        if (res == null) cb({ statusCode: 401, status: "warning", message: "Refund can't be initiated" })
                                        else {
                                            cb(null, res)
                                        }
                                    })
                                }],
                                updateBookingStatus: ["updateDb", function(data, cb) {

                                    sessionBookingsModel.findOneAndUpdate({ sessionId: params.sessionId }, {
                                        $push: {
                                            statusHistory: {
                                                "status": "refunded",
                                                "updatedAt": Utils.moment().unix()
                                            }
                                        },
                                        paymentStatus: "refunded"
                                    }, { new: true }, function(err, res) {
                                        cb(err ? err : null, res)
                                    })
                                }]
                            },
                            function(err, res) {
                                callback(err ? err : null, { statusCode: 200, status: "success", message: "Rookie refunded successfully" })
                            });
                    } else {
                        // REFUND IN GROUP LESSONS

                        Utils.async.auto({
                                checkSession: [function(cb) {

                                    sessionsModel.findOne({ groupLessonNumber: params.sessionId, status: 'payment done' }, function(err, res) {
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
                                initiateRefund: ["checkSession", function(data, cb) {
                                    Utils.universalFunctions.logger("Initiate refund")
                                    cb(null, null)
                                }],
                                updateDb: ["initiateRefund", function(data, cb) {
                                    var dataToSet = {
                                        $push: {
                                            statusHistory: {
                                                "status": "refunded",
                                                "updatedAt": Utils.moment().unix()
                                            }
                                        }
                                    }

                                    data.checkSession.joinees.length == 1 ? dataToSet.status = "refunded" : null

                                    sessionsModel.update({ groupLessonNumber: params.sessionId, status: "payment done" }, dataToSet, { new: true }, function(err, res) {
                                        if (err) cb(err)
                                        if (res == null) cb({ statusCode: 401, status: "warning", message: "Refund can't be initiated" })
                                        else {
                                            cb(null, res)
                                        }
                                    })
                                }],
                                updateBookingStatus: ["updateDb", function(data, cb) {

                                    sessionBookingsModel.findOneAndUpdate({ groupLessonNumber: params.sessionId, status: "payment done", paymentDoneBy: params.rookieId }, {
                                        $push: {
                                            statusHistory: {
                                                "status": "refunded",
                                                "updatedAt": Utils.moment().unix()
                                            }
                                        },
                                        paymentStatus: "refunded"
                                    }, { new: true }, function(err, res) {
                                        cb(err ? err : null, res)
                                    })
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
                                status: "Complaint rejected by guru",
                                rejectedUserId: params.rookieId
                            }
                        }
                    }

                    sessionsModel.update(criteria, dataToSet, { new: true }, function(err, res) {
                        callback(err ? err : null, { statusCode: 200, status: "success", message: "Complaint rejected successfully" })
                        // if (err) cb(err)
                        // else {
                        //     params.sessionType == "group" ? criteria.groupLessonNumber = params.sessionId : criteria.sessionId = params.sessionId
                        //     criteria.paymentDoneBy = params.rookieId
                        //     sessionBookingsModel.update(criteria,{status : "complaint rejected"}, { new: true }, function(err, res) {

                        //     })


                        // }

                    })
                }
            }]


        }, function(err, result) {
            callback(err ? err : null, result);
        });
    },

    adminRespondToComplaint: function(params, callback) {

        Utils.async.auto({
            checkIfauthenticatedUser: [function(cb) {
                var criteria = {}
                params.sessionType == "group" ? criteria.groupLessonNumber = params.sessionId : criteria._id = params.sessionId

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
                                        cb(err ? err : res == null ? { statusCode: 401, status: "warning", message: "Refund can't be initiated" } : null, res)
                                    })
                                }],
                                initiateRefund: ["checkSession", function(data, cb) {
                                    Utils.universalFunctions.logger("Initiate refund")
                                    cb(null, null)
                                }],
                                updateDb: ["initiateRefund", function(data, cb) {

                                    sessionsModel.findOneAndUpdate({ _id: params.sessionId }, {
                                        $push: {
                                            statusHistory: {
                                                "status": "refunded",
                                                "updatedAt": Utils.moment().unix()
                                            }
                                        },
                                        status: "refunded"
                                    }, { new: true }, function(err, res) {
                                        if (err) cb(err)
                                        if (res == null) cb({ statusCode: 401, status: "warning", message: "Refund can't be initiated" })
                                        else {
                                            cb(null, res)
                                        }
                                    })
                                }],
                                updateBookingStatus: ["updateDb", function(data, cb) {

                                    sessionBookingsModel.findOneAndUpdate({ sessionId: params.sessionId }, {
                                        $push: {
                                            statusHistory: {
                                                "status": "refunded",
                                                "updatedAt": Utils.moment().unix()
                                            }
                                        },
                                        paymentStatus: "refunded"
                                    }, { new: true }, function(err, res) {
                                        cb(err ? err : null, res)
                                    })
                                }]
                            },
                            function(err, res) {
                                cb(err ? err : null, { statusCode: 200, status: "success", message: "Rookie refunded successfully" })
                            });
                    } else {
                        // REFUND IN GROUP LESSONS

                        Utils.async.auto({
                                checkSession: [function(cb) {

                                    sessionsModel.findOne({ groupLessonNumber: params.sessionId, status: 'payment done' }, function(err, res) {
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
                                initiateRefund: ["checkSession", function(data, cb) {
                                    Utils.universalFunctions.logger("Initiate refund")
                                    cb(null, null)
                                }],
                                updateDb: ["initiateRefund", function(data, cb) {
                                    var dataToSet = {
                                        $push: {
                                            statusHistory: {
                                                "status": "refunded",
                                                "updatedAt": Utils.moment().unix()
                                            }
                                        }
                                    }

                                    data.checkSession.joinees.length == 1 ? dataToSet.status = "refunded" : null

                                    sessionsModel.update({ groupLessonNumber: params.sessionId, status: "payment done" }, dataToSet, { new: true }, function(err, res) {
                                        if (err) cb(err)
                                        if (res == null) cb({ statusCode: 401, status: "warning", message: "Refund can't be initiated" })
                                        else {
                                            cb(null, res)
                                        }
                                    })
                                }],
                                updateBookingStatus: ["updateDb", function(data, cb) {

                                    sessionBookingsModel.findOneAndUpdate({ groupLessonNumber: params.sessionId, status: "payment done", paymentDoneBy: params.rookieId }, {
                                        $push: {
                                            statusHistory: {
                                                "status": "refunded",
                                                "updatedAt": Utils.moment().unix()
                                            }
                                        },
                                        paymentStatus: "refunded"
                                    }, { new: true }, function(err, res) {
                                        cb(err ? err : null, res)
                                    })
                                }]
                            },
                            function(err, res) {
                                cb(err ? err : null, { statusCode: 200, status: "success", message: "Rookie refunded successfully" })
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
                                status: "Complaint rejected by admin",
                                rejectedUserId: params.rookieId
                            }
                        }
                    }

                    sessionsModel.update(criteria, dataToSet, { new: true }, function(err, res) {
                        cb(err ? err : null, { statusCode: 200, status: "success", message: "Complaint rejected successfully" })
                    })
                }
            }]


        }, function(err, result) {
            callback(err ? err : null, result);
        });
    }



}