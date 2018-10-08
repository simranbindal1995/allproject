/*
 * @description: This file defines all the availability routes
 * @date: 5 april 2018
 * @author: Simran
 * */


'use strict';

// include utils module

var Utils = require('../../../utils/index');
var sessionService = require('../services/index');
var configs = require('../../../configs');
var env = require('../../../env');
var cronService = require('../services/cron');


var APP_CONSTANTS = configs.constants;
var USER_TYPE = APP_CONSTANTS.USER_TYPE;
var GENDER = APP_CONSTANTS.GENDER
var LESSON_TYPE = APP_CONSTANTS.LESSON_TYPE
var USER_STATUS = APP_CONSTANTS.USER_STATUS

module.exports = [{
        method: 'POST',
        path: '/v1/Sessions/addGroupLesson',
        config: {
            description: 'API for creating a group lesson.',
            notes: "Send dates in array with start and end time of each date",
            pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
            tags: ['api'],
            validate: {
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),
                payload: {
                    title: Utils.Joi.string().required(),
                    skillId: Utils.Joi.array().required(),
                    totalSeats: Utils.Joi.number().required().min(1).max(8),
                    ratePerRookie: Utils.Joi.number().required(),
                    lessonDetails: Utils.Joi.string().required(),
                    dateAndTime: Utils.Joi.array().items(Utils.Joi.object().keys({
                        startDateTime: Utils.Joi.number().required(),
                        endDateTime: Utils.Joi.number().required()
                    })).required().label('Date & Time'),
                },
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {

            request.payload.userId = request.pre.verify._id;

            if (request.pre.verify.userStatus == USER_STATUS.inactive) {
                reply({ statusCode: 401, status: "warning", message: "Lesson cannot be created because due to some reasons Admin has blocked ypur account." })
            }

            sessionService.addGroupLesson(request.payload, function(err, res) {
                reply(err ? err : res)
            });
        }
    },
    {
        method: 'POST',
        path: '/v1/Sessions/requestOneToOneLesson',
        config: {
            description: 'API for user to create one to one lesson',
            notes: 'API for user to create one to one lesson',
            pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
            tags: ['api'],
            validate: {
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),
                payload: {
                    guruId: Utils.Joi.string().required().label("User id of teacher"),
                    // categoryId: Utils.Joi.string().required(),
                    // subjectId: Utils.Joi.string().required(),
                    description: Utils.Joi.string().required().label('Session description'),
                    dateAndTime: Utils.Joi.array().items(Utils.Joi.object().keys({
                        skillId: Utils.Joi.array().required(),
                        startDateTime: Utils.Joi.number().required(),
                        endDateTime: Utils.Joi.number().required()
                    })).required().label('Date & Time'),
                },
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {

            request.payload.userId = request.pre.verify._id;
            request.payload.firstName = request.pre.verify.firstName

            if (request.pre.verify.userStatus == USER_STATUS.inactive) {
                reply({ statusCode: 401, status: "warning", message: "You cannot request the lesson because due to some reasons Admin has blocked ypur account." })
            }

            sessionService.requestOneToOneLesson(request.payload, function(err, res) {
                reply(err ? err : res)
            });
        }
    },
    {
        method: 'PUT',
        path: '/v1/Sessions/approveRejectOneToOneLesson',
        config: {
            description: 'API for guru to approve or reject one to one lesson of a student',
            notes: 'API for guru to approve one to one lesson of a student <br> Type is required 1- when accept the request, 2- reject the request. <br> Comment is mandatory in both the case',
            pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
            tags: ['api'],
            validate: {
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),
                payload: {
                    session_id: Utils.Joi.string().required(),
                    comment: Utils.Joi.string().required(),
                    type: Utils.Joi.number().default(1).required().valid(1, 2).label('type')
                },
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {

            request.payload.userId = request.pre.verify._id;
            request.payload.firstName = request.pre.verify.firstName;

            if (request.pre.verify.userStatus == USER_STATUS.inactive) {
                reply({ statusCode: 401, status: "warning", message: "You cannot perform any action on the lesson because due to some reasons Admin has blocked ypur account." })
            }

            sessionService.approveRejectOneToOneLesson(request.payload, function(err, res) {
                reply(err ? err : res)
            });
        }
    },
    {
        method: 'GET',
        path: '/v1/Sessions/getAllAvailableDatesForGroupLesson',
        config: {
            description: 'API to get all the available dates for booking a group lesson of that time',
            notes: "This api must be run before booking any of the group lesson.Just send the time for which dates are to be fetched",
            pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
            tags: ['api'],
            validate: {
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),
                query: {
                    startTime: Utils.Joi.number().required(),
                    endTime: Utils.Joi.number().required()
                },
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {

            request.query.userId = request.pre.verify._id;

            sessionService.getAllAvailableDatesForGroupLesson(request.query, function(err, res) {
                reply(err ? err : res)
            });
        }
    },
    {
        method: 'POST',
        path: '/v1/Sessions/joinGroupLesson',
        config: {
            description: 'API for joining a group lesson for rookie.',
            notes: "joinGroupLesson is auto incremented number for each group lesson",
            pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
            tags: ['api'],
            validate: {
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),
                payload: {
                    groupLessonNumber: Utils.Joi.number().required(),
                    cardId: Utils.Joi.string().optional().allow(''),
                    cardToken: Utils.Joi.string().optional().allow('')
                },
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {

            request.payload.userId = request.pre.verify._id;
            request.payload.userDetails = request.pre.verify

            if (request.pre.verify.userStatus == USER_STATUS.inactive) {
                reply({ statusCode: 401, status: "warning", message: "You cannot join the lesson because due to some reasons Admin has blocked ypur account." })
            }

            sessionService.joinGroupLesson(request.payload, function(err, res) {
                reply(err ? err : res)
            });
        }
    },
    // {
    //     method: 'GET',
    //     path: '/v1/Sessions/listLessons',
    //     config: {
    //         description: 'API for listing all the lessons on both ends.',
    //         notes: "Type 1 for getting One-one lessons and type 2 for getting group lessons.",
    //         pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
    //         tags: ['api'],
    //         validate: {
    //             headers: Utils.Joi.object({
    //                 'x-logintoken': Utils.Joi.string().required().trim()
    //             }).options({ allowUnknown: true }),
    //             query: {
    //                 type: Utils.Joi.number().required().valid([1, 2])
    //             },
    //             failAction: Utils.universalFunctions.failActionFunction
    //         }
    //     },
    //     handler: function(request, reply) {

    //         request.query.userDetails = request.pre.verify;

    //         sessionService.listLessons(request.query, function(err, res) {
    //             reply(err ? err : res)
    //         });
    //     }
    // },
    {
        method: 'POST',
        path: '/v1/Sessions/cancelOneOneLesson',
        config: {
            description: 'API for cancelling the one to one lesson.',
            notes: "cancellationTime is current time of user's machine.Required when rookie is cancelling",
            pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
            tags: ['api'],
            validate: {
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),
                payload: {
                    sessionId: Utils.Joi.string().required(),
                    cancellationTime: Utils.Joi.number().required(),
                    reason: Utils.Joi.string().allow(''),
                    description: Utils.Joi.string().allow('')
                },
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {

            var userDetails = request.pre.verify;
            request.payload.userDetails = userDetails

            if (userDetails.userType == USER_TYPE.guru) {
                sessionService.cancelOneOneLessonGuru(request.payload, function(err, res) {
                    reply(err ? err : res)
                });
            } else {
                sessionService.cancelOneOneLessonRookie(request.payload, function(err, res) {
                    reply(err ? err : res)
                });
            }
        }
    },
    {
        method: 'POST',
        path: '/v1/Sessions/cancelGroupLesson',
        config: {
            description: 'API for cancelling the group lesson.',
            notes: "cancellationTime is current time of user's machine.Required when rookie is cancelling",
            pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
            tags: ['api'],
            validate: {
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),
                payload: {
                    groupLessonNumber: Utils.Joi.number().required(),
                    cancellationTime: Utils.Joi.number().required(),
                    reason: Utils.Joi.string().allow(''),
                    description: Utils.Joi.string().allow('')
                },
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {

            var userDetails = request.pre.verify;
            request.payload.userId = userDetails._id
            request.payload.userDetails = userDetails

            if (userDetails.userType == USER_TYPE.guru) {
                sessionService.cancelGroupLessonGuru(request.payload, function(err, res) {
                    reply(err ? err : res)
                });
            } else {
                sessionService.cancelGroupLessonRookie(request.payload, function(err, res) {
                    reply(err ? err : res)
                });
            }
        }
    },
    {
        method: 'POST',
        path: '/v1/Sessions/rookiePayForOneOneLesson',
        config: {
            description: 'API for paying to one to one lesson.',
            notes: "Rookie will pay for 1-1 lesson after guru has accepted the request",
            pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
            tags: ['api'],
            validate: {
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),
                payload: {
                    sessionId: Utils.Joi.string().required(),
                    cardId: Utils.Joi.string().optional().allow(''),
                    cardToken: Utils.Joi.string().optional().allow('')
                },
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {

            request.payload.userId = request.pre.verify._id;
            request.payload.userDetails = request.pre.verify;

            sessionService.rookiePayForOneOneLesson(request.payload, function(err, res) {
                reply(err ? err : res)
            });
        }
    },
    {
        method: 'PUT',
        path: '/v1/Sessions/listAllLessons',
        config: {
            description: 'Api for guru and rookie and to fetch all the group lessons and one to one lesson',
            notes: 'Api for guru and rookie and to fetch all the group lessons and one to one lesson <br> Type is required, 1- One to one ,2- group lesson <br> If to fetch the group or one to one lesson of student give logintokne of student else give the logintoken of guru. <br> For filters give subject in search, and startDate , endDate if required',
            tags: ['api'],
            pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
            validate: {
                payload: {
                    type: Utils.Joi.string().required().valid([LESSON_TYPE.one, LESSON_TYPE.group]),
                    subject: Utils.Joi.string().optional().label('Search subject').allow(''),
                    startDate: Utils.Joi.number().optional().label('Start date'),
                    endDate: Utils.Joi.number().optional().label('End date'),
                    skip: Utils.Joi.number().optional().default(0).label('Skip'),
                    limit: Utils.Joi.number().optional().default(10).label('Limit'),
                    search: Utils.Joi.string().optional().allow('')
                },
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {

            request.payload.userData = request.pre.verify;
            sessionService.listAllLessons(request.payload, function(err, res) {
                reply(err ? err : res)
            })
        }
    },
    {
        method: 'PUT',
        path: '/v1/Sessions/listAllCompletedLessons',
        config: {
            description: 'Api for guru and rookie and to fetch all the group completed lessons and one to one lesson',
            notes: 'Api for guru and rookie and to fetch all the group lessons and one to one lesson <br> Type is required, 1- One to one ,2- group lesson <br> If to fetch the group or one to one lesson of student give logintokne of student else give the logintoken of guru. <br> For filters give subject in search, and startDate , endDate if required',
            tags: ['api'],
            pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
            validate: {
                payload: {
                    type: Utils.Joi.string().required().valid([LESSON_TYPE.one, LESSON_TYPE.group]),
                    subject: Utils.Joi.string().optional().label('Search subject').allow(''),
                    startDate: Utils.Joi.number().optional().label('Start date'),
                    endDate: Utils.Joi.number().optional().label('End date'),
                    skip: Utils.Joi.number().optional().default(0).label('Skip'),
                    limit: Utils.Joi.number().optional().default(10).label('Limit'),
                    search: Utils.Joi.string().optional().allow('')
                },
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {

            request.payload.userData = request.pre.verify;
            sessionService.listAllCompletedLessons(request.payload, function(err, res) {
                reply(err ? err : res)
            })
        }
    },
    {
        method: 'POST',
        path: '/v1/Sessions/guruRemoveRejectRequests',
        config: {
            description: 'API for removing or rejecting the sessions.',
            notes: "Guru can remove and reject the sessions.send type 1 for removing and type 2 for cancelling",
            pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
            tags: ['api'],
            validate: {
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),
                payload: {
                    sessionId: Utils.Joi.string().required(),
                    type: Utils.Joi.number().required().valid([1, 2])
                },
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {

            request.payload.userId = request.pre.verify._id;

            sessionService.guruRemoveRejectRequests(request.payload, function(err, res) {
                reply(err ? err : res)
            });
        }
    },
    {
        method: 'GET',
        path: '/v1/Sessions/getCountOfLessonsScheduled',
        config: {
            description: 'API for getting count of lessons scheduled for dashboard .',
            notes: "currentTime is unix timestamp",
            pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
            tags: ['api'],
            validate: {
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),
                query: {
                    currentTime: Utils.Joi.number().required()
                },
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {

            request.query.userId = request.pre.verify._id;

            sessionService.getCountOfLessonsScheduled(request.query, function(err, res) {
                reply(err ? err : res)
            });
        }
    },
    {
        method: 'GET',
        path: '/v1/Sessions/getCountOfLessonsCompleted',
        config: {
            description: 'API for getting count of lessons completed for dashboard .',
            notes: "currentTime is unix timestamp",
            pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
            tags: ['api'],
            validate: {
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),
                query: {
                    currentTime: Utils.Joi.number().required()
                },
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {

            request.query.userId = request.pre.verify._id;

            sessionService.getCountOfLessonsCompleted(request.query, function(err, res) {
                reply(err ? err : res)
            });
        }
    },
    {
        method: 'GET',
        path: '/v1/Sessions/getTodaysSession',
        config: {
            description: "API for getting all today's session for dashboard.",
            notes: "currentTime is unix timestamp",
            pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
            tags: ['api'],
            validate: {
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),
                query: {
                    currentTime: Utils.Joi.number().required(),
                    skip: Utils.Joi.number(),
                    limit: Utils.Joi.number()
                },
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {

            request.query.userId = request.pre.verify._id;

            sessionService.getTodaysSession(request.query, function(err, res) {
                reply(err ? err : res)
            });
        }
    },
    {
        method: 'GET',
        path: '/v1/Sessions/getDataOfLessonsScheduled',
        config: {
            description: 'API for getting data of lessons scheduled for dashboard .',
            notes: "currentTime is unix timestamp",
            pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
            tags: ['api'],
            validate: {
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),
                query: {
                    currentTime: Utils.Joi.number().required()
                },
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {

            request.query.userId = request.pre.verify._id;

            sessionService.getDataOfLessonsScheduled(request.query, function(err, res) {
                reply(err ? err : res)
            });
        }
    },
    {
        method: 'GET',
        path: '/v1/Sessions/getDataOfLessonsCompleted',
        config: {
            description: 'API for getting data of lessons completed for dashboard .',
            notes: "currentTime is unix timestamp",
            pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
            tags: ['api'],
            validate: {
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),
                query: {
                    currentTime: Utils.Joi.number().required()
                },
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {

            request.query.userId = request.pre.verify._id;

            sessionService.getDataOfLessonsCompleted(request.query, function(err, res) {
                reply(err ? err : res)
            });
        }
    },
    {
        method: 'POST',
        path: '/v1/Sessions/listAllGroupLessonsOfGuru',
        config: {
            description: 'API for getting data of group lessons that are yet to be completed.',
            notes: "currentTime is unix timestamp",
            pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
            tags: ['api'],
            validate: {
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),
                payload: {
                    guruId: Utils.Joi.string().required(),
                    currentTime: Utils.Joi.number().required(),
                    skip: Utils.Joi.number(),
                    limit: Utils.Joi.number(),
                    subject: Utils.Joi.string().optional().label('Search subject').allow(''),
                    startDate: Utils.Joi.number().optional().label('Start date'),
                    endDate: Utils.Joi.number().optional().label('End date'),
                },
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {

            request.payload.userId = request.pre.verify._id;

            sessionService.listAllGroupLessonsOfGuru(request.payload, function(err, res) {
                reply(err ? err : res)
            });
        }
    },
    {
        method: 'GET',
        path: '/v1/Sessions/listLessonsForFeedbacks',
        config: {
            description: 'API for getting all lessons whose feedback is pending.',
            notes: "Send type 1 for one-one lesson and type 2 for group lesson",
            pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
            tags: ['api'],
            validate: {
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),
                query: {
                    currentTime: Utils.Joi.number(),
                    type: Utils.Joi.number().default(1),
                    skip: Utils.Joi.number(),
                    limit: Utils.Joi.number(),
                },
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {

            request.query.userId = request.pre.verify._id;

            sessionService.listLessonsForFeedbacks(request.query, function(err, res) {
                reply(err ? err : res)
            });
        }
    },
    {
        method: 'POST',
        path: '/v1/Sessions/giveFeedbackOnSession',
        config: {
            description: 'API for giving feedback on a session.',
            notes: 'send sessionType one-one , group',
            pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
            tags: ['api'],
            validate: {
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),
                payload: {
                    sessionId: Utils.Joi.string().required(),
                    sessionType: Utils.Joi.string().required().allow([LESSON_TYPE.one, LESSON_TYPE.group]),
                    rating: Utils.Joi.number(),
                    feedback: Utils.Joi.string()
                },
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {

            request.payload.userId = request.pre.verify._id;
            request.payload.firstName = request.pre.verify.firstName

            sessionService.giveFeedbackOnSession(request.payload, function(err, res) {
                reply(err ? err : res)
            });
        }
    },
    {
        method: 'POST',
        path: '/v1/Sessions/readFeedbackOnSession',
        config: {
            description: 'API for reading feedback on a session',
            pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
            tags: ['api'],
            validate: {
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),
                payload: {
                    sessionId: Utils.Joi.string().required(),
                    sessionType: Utils.Joi.string().required().allow([LESSON_TYPE.one, LESSON_TYPE.group])
                },
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {

            request.payload.userId = request.pre.verify._id;

            sessionService.readFeedbackOnSession(request.payload, function(err, res) {
                reply(err ? err : res)
            });
        }
    },
    {
        method: 'POST',
        path: '/v1/Sessions/raiseComplaintRookie',
        config: {
            description: 'API for raising a complaint rookie',
            pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
            tags: ['api'],
            validate: {
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),
                payload: {
                    sessionId: Utils.Joi.string().required(),
                    sessionType: Utils.Joi.string().required().allow([LESSON_TYPE.one, LESSON_TYPE.group]),
                    currentTime: Utils.Joi.number().required(),
                    complaintReason: Utils.Joi.string().required(),
                    complaintMessage: Utils.Joi.string().required()
                },
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {

            request.payload.userId = request.pre.verify._id;
            request.payload.firstName = request.pre.verify.firstName;

            sessionService.raiseComplaintRookie(request.payload, function(err, res) {
                reply(err ? err : res)
            });
        }
    },
    {
        method: 'POST',
        path: '/v1/Sessions/guruRespondToComplaint',
        config: {
            description: 'API for guru to respond to complaint',
            notes: 'Guru can reject or refund to the complaint.User id is mandatory in group lessons for telling which rookies refund is being initiated',
            pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
            tags: ['api'],
            validate: {
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),
                payload: {
                    sessionId: Utils.Joi.string().required(),
                    sessionType: Utils.Joi.string().required().allow([LESSON_TYPE.one, LESSON_TYPE.group]),
                    actionToPerform: Utils.Joi.string().allow(["reject", "refund"]).required(),
                    currentTime: Utils.Joi.number().required(),
                    complaintMessage: Utils.Joi.string().allow('').when("actionToPerform", {
                        is: "reject",
                        then: Utils.Joi.required(),
                        otherwise: Utils.Joi.optional()
                    }),
                    rookieId: Utils.Joi.string().allow('').when("sessionType", {
                        is: LESSON_TYPE.group,
                        then: Utils.Joi.required(),
                        otherwise: Utils.Joi.optional()
                    }),
                },
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {

            request.payload.userId = request.pre.verify._id;
            request.payload.userDetails = request.pre.verify;

            sessionService.guruRespondToComplaint(request.payload, function(err, res) {
                reply(err ? err : res)
            });
        }
    },
    {
        method: 'POST',
        path: '/v1/Sessions/adminRespondToComplaint',
        config: {
            description: 'API for admin to respond to complaints rejcted by guru',
            notes: 'Admin can reject or refund to the complaint.User id is mandatory in group lessons for telling which rookies refund is being initiated',
            pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
            tags: ['api'],
            validate: {
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),
                payload: {
                    sessionId: Utils.Joi.string().required(),
                    sessionType: Utils.Joi.string().required().allow([LESSON_TYPE.one, LESSON_TYPE.group]),
                    actionToPerform: Utils.Joi.string().allow(["reject", "refund"]).required(),
                    currentTime: Utils.Joi.number().required(),
                    complaintMessage: Utils.Joi.string().allow('').when("sessionType", {
                        is: LESSON_TYPE.group,
                        then: Utils.Joi.required(),
                        otherwise: Utils.Joi.optional()
                    }),
                    rookieId: Utils.Joi.string().allow('').when("sessionType", {
                        is: LESSON_TYPE.group,
                        then: Utils.Joi.required(),
                        otherwise: Utils.Joi.optional()
                    }),
                },
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {

            request.payload.userId = request.pre.verify._id;
            request.payload.userDetails = request.pre.verify;

            sessionService.adminRespondToComplaint(request.payload, function(err, res) {
                reply(err ? err : res)
            });
        }
    },
    {
        method: 'POST',
        path: '/v1/Sessions/readComplaintOnSession',
        config: {
            description: 'API for reading getting complaints on a session',
            pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
            tags: ['api'],
            validate: {
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),
                payload: {
                    sessionId: Utils.Joi.string().required(),
                    sessionType: Utils.Joi.string().required().allow([LESSON_TYPE.one, LESSON_TYPE.group])
                },
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {

            request.payload.userId = request.pre.verify._id;

            sessionService.readComplaintOnSession(request.payload, function(err, res) {
                reply(err ? err : res)
            });
        }
    },
    {
        method: 'POST',
        path: '/v1/Sessions/getUsersOnComplaints',
        config: {
            description: 'API for getting users on each complaint',
            notes: "Type 1 to get users who have raised complaints, 2- rejected users , 3 - refunded users",
            pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
            tags: ['api'],
            validate: {
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),
                payload: {
                    sessionId: Utils.Joi.string().required(),
                    sessionType: Utils.Joi.string().required().allow([LESSON_TYPE.one, LESSON_TYPE.group]),
                    type: Utils.Joi.string().required().allow([1, 2, 3])
                },
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {

            var userDetails = request.pre.verify;

            request.payload.userDetails = userDetails

            if (userDetails.userType == "1" && request.payload.sessionType == "group") {
                reply({ statusCode: 401, status: "warning", message: "Please use Sessions/guruGetComplaintsOnGroupLesson" })
            } else {
                sessionService.getUsersOnComplaints(request.payload, function(err, res) {
                    reply(err ? err : res)
                });
            }


        }
    },
    {
        method: 'POST',
        path: '/v1/Sessions/guruGetComplaintsOnGroupLesson',
        config: {
            description: 'API for getting all complaints on group lesson by guru',
            notes: "Type 1 to get users who have raised complaints, 2- rejected users , 3 - refunded users,4-cancelled users",
            pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
            tags: ['api'],
            validate: {
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),
                payload: {
                    sessionId: Utils.Joi.string().required(),
                    sessionType: Utils.Joi.string().required().allow([LESSON_TYPE.one, LESSON_TYPE.group]),
                    type: Utils.Joi.string().required().allow([1, 2, 3,4])
                },
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {

            var userDetails = request.pre.verify;

            request.payload.userDetails = userDetails

            sessionService.guruGetComplaintsOnGroupLesson(request.payload, function(err, res) {
                reply(err ? err : res)
            });
        }
    },

    {
        method: 'POST',
        path: '/v1/Sessions/getStudentListingForGuru',
        config: {
            description: 'API for getting list of students who have taken lessons from guru',
            pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
            tags: ['api'],
            validate: {
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),
                payload: {
                    skip: Utils.Joi.number(),
                    limit: Utils.Joi.number()
                },
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {

            var userDetails = request.pre.verify;

            request.payload.userDetails = userDetails

            sessionService.getStudentListingForGuru(request.payload, function(err, res) {
                reply(err ? err : res)
            });
        }
    },
    {
        method: 'POST',
        path: '/v1/Sessions/getPaymentDetails',
        config: {
            description: 'API for getting list of payment done or received by guru/rookie',
            pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
            tags: ['api'],
            validate: {
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),
                payload: {
                    skip: Utils.Joi.number(),
                    limit: Utils.Joi.number()
                },
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {

            var userDetails = request.pre.verify;

            request.payload.userDetails = userDetails

            sessionService.getPaymentDetails(request.payload, function(err, res) {
                reply(err ? err : res)
            });
        }
    },

    {
        method: 'POST',
        path: '/v1/staticReasons/addReason',
        config: {
            description: 'API to enter reasons for complaint and cancellation',
            notes: "Send type -1 when entering complaint reason and type 2 when entering cancellation reason",
            pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
            tags: ['api'],
            validate: {
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),
                payload: {
                    reason: Utils.Joi.string().required(),
                    type: Utils.Joi.string().required().allow([1, 2]).default(1)
                },
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {

            sessionService.addReason(request.payload, function(err, res) {
                reply(err ? err : res)
            });
        }
    },
    {
        method: 'GET',
        path: '/v1/staticReasons/getReasons',
        config: {
            description: 'API to fetch reasons for complaint and cancellation',
            notes: "Send type -1 when fetching complaint reason and type 2 when fetching cancellation reason",
            pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
            tags: ['api'],
            validate: {
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),
                query: {
                    type: Utils.Joi.string().required().allow([1, 2]).default(1)
                },
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {

            sessionService.getReasons(request.query, function(err, res) {
                reply(err ? err : res)
            });
        }
    },
    {
        method: 'POST',
        path: '/v1/contactUs/contactUs',
        config: {
            description: 'API for contact us',
            notes: "Mail will be sent to admin.",
            tags: ['api'],
            validate: {
                payload: {
                    name : Utils.Joi.string().required(),
                    email : Utils.Joi.string().required(),
                    message : Utils.Joi.string().required()
                },
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {

            sessionService.contactUs(request.payload, function(err, res) {
                reply(err ? err : res)
            });
        }
    },

];