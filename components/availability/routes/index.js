/*
 * @description: This file defines all the availability routes
 * @date: 5 april 2018
 * @author: Simran
 * */


'use strict';

// include utils module

var Utils = require('../../../utils/index');
var availabilityService = require('../services/index');
var configs = require('../../../configs');
var env = require('../../../env');



module.exports = [
    // {
    //         method: 'POST',
    //         path: '/v1/availability/addAvailability',
    //         config: {
    //             description: 'API for inserting availability of the user',
    //             notes: "You can add date and time multiple.Date and time must be timestamps.",
    //             pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
    //             tags: ['api'],
    //             validate: {
    //                 headers: Utils.Joi.object({
    //                     'x-logintoken': Utils.Joi.string().required().trim()
    //                 }).options({ allowUnknown: true }),
    //                 payload: {
    //                     startTime: Utils.Joi.number().required(),
    //                     endTime: Utils.Joi.number().required()
    //                 },
    //                 failAction: Utils.universalFunctions.failActionFunction
    //             }
    //         }, 
    //         handler: function(request, reply) {

    //             request.payload.userId = request.pre.verify._id;

    //             request.pre.verify.userStatus == "inactive" ? reply({ statusCode: 401, status: 'warning', message: "Your account is deactivated. Please contact admin at abc@test.com" }) : null

    //             availabilityService.addAvailability(request.payload, function(err, res) {
    //                 reply(err ? err : res)
    //             });
    //         }
    //     },
    {
        method: 'POST',
        path: '/v1/availability/addAvailability',
        config: {
            description: 'API for inserting availability of the user',
            notes: "You can add date and time multiple.Date and time must be timestamps.",
            pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
            tags: ['api'],
            validate: {
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),
                payload: {
                    dateAndTime: Utils.Joi.array().items(Utils.Joi.object().keys({
                        startTime: Utils.Joi.number().required(),
                        endTime: Utils.Joi.number().required()
                    })).required().label('Date & Time')
                },
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {

            request.payload.userId = request.pre.verify._id;

            request.pre.verify.userStatus == "inactive" ? reply({ statusCode: 401, status: 'warning', message: "Your account is deactivated. Please contact admin at abc@test.com" }) : null

            availabilityService.addAvailability(request.payload, function(err, res) {
                reply(err ? err : res)
            });
        }
    },
    {
        method: 'POST',
        path: '/v1/availability/fetchAvailability',
        config: {
            description: 'API for getting the availability of the loggedIn user or other user',
            notes: "Send userId if you want to access availability of any other user.In date send date to check availability for",
            pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
            tags: ['api'],
            validate: {
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),
                payload: {
                    userId: Utils.Joi.string().allow('').optional(),
                    date: Utils.Joi.number().required()
                },
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {

            request.payload.userDetails = request.pre.verify;

            availabilityService.fetchAvailability(request.payload, function(err, res) {
                reply(err ? err : res)
            });
        }
    },
    {
        method: 'GET',
        path: '/v1/availability/checkAvailability',
        config: {
            description: 'API to check if a guru is available at a specific time',
            notes: "API to check if a guru is available at a specific time <br> for each given time pair it will return true or false",
            tags: ['api'],
            validate: {
                query: {
                    guruId: Utils.Joi.string().required().label('Guru Id'),
                    startTime: Utils.Joi.number().required().label('Start Date Time'),
                    endTime: Utils.Joi.number().required().label('End Date Time')
                },
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {

            availabilityService.checkAvailability(request.query, function(err, res) {
                reply(err ? err : res)
            });
        }
    },
    {
        method: 'GET',
        path: '/v1/availability/checkAvailabilityFor1Lesson',
        config: {
            description: 'API to check if a guru is available at a specific time',
            notes: "API to check if a guru is available at a specific time <br> for each given time pair it will return true or false",
            pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
            tags: ['api'],
            validate: {
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),
                query: {
                    guruId: Utils.Joi.string().required().label('Guru Id'),
                    startTime: Utils.Joi.number().required().label('Start Date Time'),
                    endTime: Utils.Joi.number().required().label('End Date Time')
                },
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {
             request.query.userId = request.pre.verify._id;
            availabilityService.checkAvailabilityFor1Lesson(request.query, function(err, res) {
                reply(err ? err : res)
            });
        }
    }

];