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

var availabilityModel = require('../models/index');
var sessionsModel = require('../../sessions/models/index')

var APP_CONSTANTS = configs.constants;
var SESSION_STATUS = APP_CONSTANTS.SESSION_STATUS;

module.exports = {

    /* addAvailability: function(params, callback) {

         var day = Utils.moment(params.startTime * 1000).format('dddd')
         var startDate = Utils.moment(params.startTime * 1000).startOf('day').unix()
         var endDate = Utils.moment(params.startTime * 1000).endOf('day').unix()
         var lagTime = Utils.moment(params.endTime * 1000).add(15, 'minutes').unix()

         Utils.async.auto({

             getTotalAvailabilitiesOfTheDay: [function(cb) {
                 Utils.universalFunctions.logger("get count of total availabilities of the date coming in params")

                 var criteria = { startDateTime: { $gte: startDate }, endDatelagTime: { $lte: endDate }, userId: params.userId }

                 availabilityModel.count(criteria, function(err, res) {
                     cb(err ? err : null, res)
                 })
             }],
             checkAvailability: ["getTotalAvailabilitiesOfTheDay", function(data, cb) {
                 Utils.universalFunctions.logger("Check availability if the same exists do not add else add availability in params")

                 var criteria = {
                     startDateTime: { $gt: startDate },
                     $or: [{
                             $and: [{ startDateTime: { $gt: params.startTime } }, { startDateTime: { $gt: lagTime } }]
                         },
                         {
                             $and: [{ endDatelagTime: { $lt: params.startTime } }, { endDatelagTime: { $lt: lagTime } }]
                         }
                     ],
                     userId: params.userId
                 }

                 availabilityModel.find(criteria, function(err, res) {

                     if (data.getTotalAvailabilitiesOfTheDay == 0) {
                         cb(null, params)
                     } else if (data.getTotalAvailabilitiesOfTheDay > 0) {
                         if (data.getTotalAvailabilitiesOfTheDay != res.length) {
                             cb({ statusCode: 401, status: "warning", message: "Availability slot already taken." })
                         } else {
                             cb(null, params)
                         }
                     }
                 })

             }],
             addAvailability: ["checkAvailability", function(data, cb) {
                 var obj = {
                     userId: params.userId,
                     startDateTime: params.startTime,
                     endDateTime: params.endTime,
                     endDatelagTime: lagTime,
                     day: day
                 }

                 availabilityModel(obj).save(function(err, res) {
                     cb(err ? err : null, res)
                 })
             }]

         }, function(err, result) {
             callback(err ? err : { statusCode: 200, status: "success", message: "Saved successfully" })
         });
     }, */

    addAvailability: function(params, callback) {
        var available = [],
            notAvailable = []
        Utils.async.eachSeries(params.dateAndTime, function(item, Incb) {


                var day = Utils.moment(item.startTime * 1000).format('dddd')
                var startDate = Utils.moment(item.startTime * 1000).startOf('day').unix()
                var endDate = Utils.moment(item.startTime * 1000).endOf('day').unix()
                var lagTime = Utils.moment(item.endTime * 1000).add(15, 'minutes').unix() //add(15, 'minutes')

                Utils.async.auto({

                    checkIfAnySession: [function(cb) {

                        var criteria = {
                            // $or: [{
                            //         $and: [{ startDateTime: { $lte: item.startTime } }, { endDateLagTime: { $gte: item.startTime } }]
                            //     },
                            //     {
                            //         $and: [{ startDateTime: { $lte: lagTime } }, { endDateLagTime: { $gte: lagTime } }]
                            //     }
                            // ],
                            $or: [{
                                    $and: [{ startDateTime: { $gte: item.startTime } }, { startDateTime: { $lte: lagTime } }]
                                },
                                {
                                    $and: [{ endDateLagTime: { $gte: item.startTime } }, { endDateLagTime: { $lte: lagTime } }]
                                }
                            ],
                            status: SESSION_STATUS.payment_done,
                            requestedTo: params.userId,
                            isDeleted: false
                        }

                        sessionsModel.find(criteria, function(err, res) {

                            if (err) cb(err)
                            if (res.length == 0) cb(null, res)
                            else {
                                notAvailable.push({ startTime: item.startTime, endTime: item.endTime })
                                Incb(null, true)
                            }
                        })
                    }],
                    getTotalAvailabilitiesOfTheDay: ['checkIfAnySession', function(data, cb) {
                        Utils.universalFunctions.logger("get count of total availabilities of the date coming in params")

                        var criteria = { startDateTime: { $gte: startDate }, endDatelagTime: { $lte: endDate }, userId: params.userId }

                        availabilityModel.count(criteria, function(err, res) {
                            cb(err ? err : null, res)
                        })
                    }],
                    checkAvailability: ["getTotalAvailabilitiesOfTheDay", function(data, cb) {
                        Utils.universalFunctions.logger("Check availability if the same exists do not add else add availability in params")

                        var criteria = {
                            startDateTime: { $gt: startDate },
                            $or: [{
                                    $and: [{ startDateTime: { $gte: item.startTime } }, { startDateTime: { $gte: lagTime } }]
                                },
                                {
                                    $and: [{ endDatelagTime: { $lte: item.startTime } }, { endDatelagTime: { $lte: lagTime } }]
                                }
                            ],
                            userId: params.userId,
                            endDateTime: { $lte: endDate }
                        }

                        availabilityModel.find(criteria, function(err, res) {

                            if (data.getTotalAvailabilitiesOfTheDay == 0) {
                                cb(null, params)
                            } else if (data.getTotalAvailabilitiesOfTheDay > 0) {
                                if (data.getTotalAvailabilitiesOfTheDay != res.length) {
                                    notAvailable.push({ startTime: item.startTime, endTime: item.endTime })
                                    Incb(null, true)
                                    //  cb({ statusCode: 401, status: "warning", message: "Availability slot already taken." })
                                } else {
                                    cb(null, params)
                                }
                            }
                        })

                    }],
                    addAvailability: ["checkAvailability", function(data, cb) {
                        var obj = {
                            userId: params.userId,
                            startDateTime: item.startTime,
                            endDateTime: item.endTime,
                            endDatelagTime: lagTime,
                            day: day
                        }

                        availabilityModel(obj).save(function(err, res) {
                            available.push({ startTime: item.startTime, endTime: item.endTime })
                            cb(err ? err : null, res)
                        })
                    }]

                }, function(err, result) {
                    Incb(null, true)
                    //callback(err ? err : { statusCode: 200, status: "success", message: "Saved successfully", available: available, notAvailable: notAvailable })
                });
            },
            function(err, result) {
                callback(err ? err : { statusCode: 200, status: "success", message: "Saved successfully", available: available, notAvailable: notAvailable })

            });
    },

    fetchAvailability: function(params, callback) {

        Utils.async.auto({

            addAvailability: [function(cb) {

                var startDate = Utils.moment(params.date * 1000).startOf('day').unix()
                var endDate = Utils.moment(params.date * 1000).endOf('day').unix()

                params.userId && params.userId != "" ? params.userId = params.userId : params.userId = params.userDetails._id

                availabilityModel.find({ isDeleted: false, userId: params.userId, startDateTime: { $gte: startDate }, endDateTime: { $lte: endDate } }, { userId: 0, createdAt: 0, isDeleted: 0, __v: 0, day: 0 }, { sort: { startDateTime: 1 } }, function(err, res) {
                    cb(err ? err : null, res)
                })
            }]

        }, function(err, result) {
            callback(err ? err : null, { statusCode: 200, status: "success", message: "Fetched successfully", data: result.addAvailability })
        });
    },
    // checkAvailability: function(params, callback) { // api to check if a guru is available

    //     var day = Utils.moment(params.startTime * 1000).format('dddd')
    //     var startDate = Utils.moment(params.startTime * 1000).startOf('day').unix()
    //     var endDate = Utils.moment(params.startTime * 1000).endOf('day').unix()
    //     var lagTime = Utils.moment(params.endTime * 1000).add(15, 'minutes').unix()
    //     var is_available

    //     console.log(params)

    //     Utils.async.auto({

    //         getTotalAvailabilitiesOfTheDay: [function(cb) {
    //             Utils.universalFunctions.logger("get count of total availabilities of the date coming in params")

    //             var criteria = { startDateTime: { $gte: startDate }, endDatelagTime: { $lte: endDate }, userId: params.guruId }

    //             availabilityModel.count(criteria, function(err, res) {
    //                 cb(err ? err : null, res)
    //             })
    //         }],

    //         checkAvailability: ['getTotalAvailabilitiesOfTheDay', function(data, cb) {
    //             Utils.universalFunctions.logger("Check availability if the same exists do not add else add availability in params")

    //             var criteria = {
    //                 userId: params.guruId,
    //                 startDateTime: { $gt: startDate },
    //                 $or: [{
    //                         $and: [{ startDateTime: { $gt: params.startTime } }, { startDateTime: { $gt: lagTime } }]
    //                     },
    //                     {
    //                         $and: [{ endDatelagTime: { $lt: params.startTime } }, { endDatelagTime: { $lt: lagTime } }]
    //                     }
    //                 ],
    //                 // $and: [{
    //                 //         $and: [{ startDateTime: { $lte: params.startTime } }, { endDatelagTime: { $gte: params.startTime } }]
    //                 //     },
    //                 //     {
    //                 //         $and: [{ startDateTime: { $lte: lagTime } }, { endDatelagTime: { $gte: lagTime } }]
    //                 //     }
    //                 // ]
    //             }

    //             availabilityModel.find(criteria, function(err, res) {

    //                 // err ? cb(err) : (res.length > 0 ? cb(null, { statusCode: 200, status: "success", message: "Fetched availability", is_available: false }) : cb(null, { statusCode: 200, status: "success", message: "Fetched availability", is_available: true }))
    //                 if (err) cb(err)
    //                 if (data.getTotalAvailabilitiesOfTheDay == 0) {
    //                     is_available = true
    //                     cb(null, null)
    //                 } else if (data.getTotalAvailabilitiesOfTheDay > 0) {
    //                     if (data.getTotalAvailabilitiesOfTheDay != res.length) {
    //                         is_available = false
    //                     } else {
    //                         is_available = true
    //                     }
    //                     cb(null, null)
    //                 }


    //             })
    //         }],
    //     }, function(err, result) {

    //         (err) ? callback(err): callback(null, { statusCode: 200, status: "success", message: "Fetched availability", is_available: is_available })
    //     })
    // },

    checkAvailability: function(params, callback) { // api to check if a guru is available

        var day = Utils.moment(params.startTime * 1000).format('dddd')
        var startDate = Utils.moment(params.startTime * 1000).startOf('day').unix()
        var endDate = Utils.moment(params.startTime * 1000).endOf('day').unix()
        var lagTime = Utils.moment(params.endTime * 1000).add(15, 'minutes').unix()
        var is_available



        Utils.async.auto({
            checkIfAnySession: [function(cb) {

                var criteria = {
                    // $or: [{
                    //         $and: [{ startDateTime: { $lte: params.startTime } }, { endDateLagTime: { $gte: params.startTime } }]
                    //     },
                    //     {
                    //         $and: [{ startDateTime: { $lte: params.endTime } }, { endDateLagTime: { $gte: params.endTime } }]
                    //     }
                    // ],
                    $or: [{
                            $and: [{ startDateTime: { $gte: params.startTime } }, { startDateTime: { $lte: params.endTime } }]
                        },
                        {
                            $and: [{ endDateLagTime: { $gte: params.startTime } }, { endDateLagTime: { $lte: params.endTime } }]
                        }
                    ],
                    status: SESSION_STATUS.payment_done,
                    requestedTo: params.guruId,
                    isDeleted: false
                }

                sessionsModel.find(criteria, function(err, res) {
                    console.log('********res***************', res)

                    if (err) cb(err)
                    if (res.length == 0) {
                        is_available = true
                        cb(null, res)
                    } else {
                        is_available = false
                        callback(null, { statusCode: 200, status: "success", message: "Fetched availability", is_available: is_available })
                    }
                })

            }],
            getTotalAvailabilitiesOfTheDay: ['checkIfAnySession', function(data, cb) {
                Utils.universalFunctions.logger("get count of total availabilities of the date coming in params")

                var criteria = { startDateTime: { $gte: startDate }, endDatelagTime: { $lte: endDate }, userId: params.guruId }


                availabilityModel.count(criteria, function(err, res) {
                    cb(err ? err : null, res)
                })
            }],

            checkAvailability: ['getTotalAvailabilitiesOfTheDay', function(data, cb) {
                Utils.universalFunctions.logger("Check availability if the same exists do not add else add availability in params")

                var criteria = {
                    userId: params.guruId,
                    startDateTime: { $gt: startDate },
                    $or: [{
                            $and: [{ startDateTime: { $gte: params.startTime } }, { startDateTime: { $gte: lagTime } }]
                        },
                        {
                            $and: [{ endDatelagTime: { $lte: params.startTime } }, { endDatelagTime: { $lte: lagTime } }]
                        }
                    ],
                    endDateTime: { $lte: endDate }
                    // $and: [{
                    //         $and: [{ startDateTime: { $lte: params.startTime } }, { endDatelagTime: { $gte: params.startTime } }]
                    //     },
                    //     {
                    //         $and: [{ startDateTime: { $lte: lagTime } }, { endDatelagTime: { $gte: lagTime } }]
                    //     }
                    // ]
                }

                availabilityModel.find(criteria, function(err, res) {

                    if (err) cb(err)
                    if (data.getTotalAvailabilitiesOfTheDay == 0) {
                        is_available = true

                        cb(null, null)
                    } else if (data.getTotalAvailabilitiesOfTheDay > 0) {
                        if (data.getTotalAvailabilitiesOfTheDay != res.length) {
                            is_available = false
                        } else {
                            is_available = true
                        }

                        cb(null, null)
                    }


                })
            }],
        }, function(err, result) {

            (err) ? callback(err): callback(null, { statusCode: 200, status: "success", message: "Fetched availability", is_available: is_available })
        })
    },

    checkAvailabilityFor1Lesson: function(params, callback) { // api to check if a guru is available

        var day = Utils.moment(params.startTime * 1000).format('dddd')
        var startDate = Utils.moment(params.startTime * 1000).startOf('day').unix()
        var endDate = Utils.moment(params.startTime * 1000).endOf('day').unix()
        var lagTime = Utils.moment(params.endTime * 1000).add(15, 'minutes').unix()
        var is_available

        var self = this

        Utils.async.auto({
            checkIfRookieIsAvailable: [function(cb) {

                sessionsModel.findOne({
                    $or: [{ requestedBy: params.userId }, { joinees: { $in: [params.userId] } }],
                    // $and: [{
                    //         $and: [{ startDateTime: { $lte: params.startTime } }, { endDateLagTime: { $gte: params.startTime } }]
                    //     },
                    //     {
                    //         $and: [{ startDateTime: { $lte: params.endTime } }, { endDateLagTime: { $gte: params.endTime } }]
                    //     }
                    // ],
                    $or: [{
                            $and: [{ startDateTime: { $gte: params.startTime } }, { startDateTime: { $lte: params.endTime } }]
                        },
                        {
                            $and: [{ endDateLagTime: { $gte: params.startTime } }, { endDateLagTime: { $lte: params.endTime } }]
                        }
                    ],
                    status: SESSION_STATUS.payment_done,
                    isDeleted: false
                }, function(err, res) {
                    cb(err ? err : res != null ? { statusCode: 401, status: 'warning', message: "You already have the booking for the same slot" } : null, res)
                })
            }],
            getTotalAvailabilitiesOfTheDay: ["checkIfRookieIsAvailable", function(data, cb) {
                Utils.universalFunctions.logger("get count of total availabilities of the date coming in params")

                var criteria = { startDateTime: { $gte: startDate }, endDatelagTime: { $lte: endDate }, userId: params.guruId }

                availabilityModel.count(criteria, function(err, res) {
                    console.log('1===', res)

                    res == 0 ? is_available = false : is_available = true
                    if (is_available == false)
                        callback(null, { statusCode: 200, status: "success", message: "Fetched availability", is_available: is_available })
                    else
                        cb(err ? err : null, null)
                })
            }],
            // checkIfGivenSlotsAreAvailable: ["getTotalAvailabilitiesOfTheDay", function(data, cb) {


            //     // self.checkAvailability({
            //     //     guruId: params.guruId,
            //     //     startTime: params.startTime,
            //     //     endTime: params.endTime
            //     // }, function(err, res) {
            //     var criteria = {
            //         //startDateTime: { $gt: startDate },

            //         $and: [{ startDateTime: { $lte: params.startTime } }, { endDatelagTime: { $gte: lagTime } }],

            //         // $or: [{
            //         //         $and: [{ startDateTime: { $gt: params.startTime } }, { startDateTime: { $gt: lagTime } }]
            //         //     },
            //         //     {
            //         //         $and: [{ endDatelagTime: { $lt: params.startTime } }, { endDatelagTime: { $lt: lagTime } }]
            //         //     }
            //         // ],
            //         userId: params.guruId

            //     }
            //     availabilityModel.find(criteria, function(err, res) {

            //         console.log("guru available...22222222222.", res)


            //         if (res.length == 0) {
            //             is_available = false
            //             callback(null, { statusCode: 200, status: "success", message: "Fetched availability", is_available: is_available })

            //             //availableSlots.push({skillId :date.skillId,startDateTime: date.startDateTime, endDateTime: date.endDateTime })
            //         } else {
            //             is_available = true
            //             cb(null, null)
            //             // bookedSlots.push({ startDateTime: date.startDateTime, endDateTime: date.endDateTime })
            //         }

            //     })



            // }],
            checkIfGivenSlotsAreAvailable: ["getTotalAvailabilitiesOfTheDay", function(data, cb) {

                var criteria = {
                    $and: [{ startDateTime: { $lte: params.startTime } }, { endDateTime: { $gte: params.endTime } }],

                    userId: params.guruId

                }
                availabilityModel.find(criteria, function(err, res) {
                    


                    if (res.length > 0) {
                        is_available = true
                        cb(null, null)
                        //callback(null, { statusCode: 200, status: "success", message: "Fetched availability", is_available: is_available })

                        //availableSlots.push({ skillId: date.skillId, startDateTime: date.startDateTime, endDateTime: date.endDateTime })

                    } else {
                        is_available = false
                        callback(null, { statusCode: 200, status: "success", message: "Fetched availability", is_available: is_available })

                        //bookedSlots.push({ startDateTime: date.startDateTime, endDateTime: date.endDateTime })
                    }

                })
            }],
            checktodayssession: ['checkIfGivenSlotsAreAvailable', function(data, cb) {
                Utils.universalFunctions.logger("get count of total availabilities of the date coming in params")

                var criteria = {
                    status: "payment done",
                    isDeleted: false,
                    startDateTime: { $gte: startDate },
                    endDateLagTime: { $lte: endDate },
                    requestedTo: params.guruId
                }

                sessionsModel.count(criteria, function(err, res) {

                    res == 0 ? is_available = true : is_available = false
                    if (is_available == true) {
                        cb(null, { statusCode: 200, status: "success", message: "Fetched availability", is_available: is_available })
                    } else
                        cb(err ? err : null, null)
                })
            }],

            checkIfAvailableSlotsAreNotBooked: ['checktodayssession', function(data, cb) {

                var lagTime = Utils.moment(params.endTime * 1000).add(15, 'minutes').unix()

                sessionsModel.find({
                    $or: [{
                            $and: [{ startDateTime: { $lte: params.startTime } }, { endDateLagTime: { $gte: params.startTime } }]
                        },
                        {
                            $and: [{ startDateTime: { $lte: lagTime } }, { endDateLagTime: { $gte: lagTime } }]
                        }
                    ],
                    status: SESSION_STATUS.payment_done,
                    requestedTo: params.guruId,
                    isDeleted: false
                }, function(err, res) {

                    res.length == 0 ? is_available = true : is_available = false
                    callback(null, { statusCode: 200, status: "success", message: "Fetched availability", is_available: is_available })
                })

            }],
        }, function(err, result) {

            (err) ? callback(err): callback(null, { statusCode: 200, status: "success", message: "Fetched availability", is_available: is_available })
        })
    }

}