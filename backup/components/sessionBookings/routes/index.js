/*
 * @description: This file defines all the make a call routes
 * @date: 5 july 2018
 * @author: Simran
 * */


'use strict';

// include utils module

var Utils = require('../../../utils/index');
var Service = require('../services/index');
var configs = require('../../../configs');
var env = require('../../../env');

var APP_CONSTANTS = configs.constants;
var LESSON_TYPE = APP_CONSTANTS.LESSON_TYPE

module.exports = [{
        method: 'POST',
        path: '/v1/bigBlueButton/makeACall',
        config: {
            description: 'API for guru ti initiate a call',
            pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
            tags: ['api'],
            validate: {
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),
                payload: {
                    sessionId: Utils.Joi.string().allow(''),
                    sessionType: Utils.Joi.string().allow(LESSON_TYPE.one, LESSON_TYPE.group)
                },
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {

            request.payload.userId = request.pre.verify._id;
            request.payload.userDetails = request.pre.verify;

            Service.makeACall(request.payload, function(err, res) {
                reply(err ? err : res)
            });
        }
    }, {
        method: 'POST',
        path: '/v1/bigBlueButton/joinACall',
        config: {
            description: 'API for rookie to join a call',
            pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
            tags: ['api'],
            validate: {
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),
                payload: {
                    sessionId: Utils.Joi.string().allow(''),
                    sessionType: Utils.Joi.string().allow(LESSON_TYPE.one, LESSON_TYPE.group)
                },
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {

            request.payload.userId = request.pre.verify._id;
            request.payload.userDetails = request.pre.verify;

            Service.joinACall(request.payload, function(err, res) {
                reply(err ? err : res)
            });
        }
    },
    {
        method: 'POST',
        path: '/v1/bigBlueButton/webhooks',
        config: {
            description: 'API for getting reslts from webhooks',
            tags: ['api'],
        },
        handler: function(request, reply) {
        console.log('webhook response========', request.payload)
            var obj = JSON.parse(request.payload.event)
            //console.log('webhook event name========',obj.header.name)
            if (obj.header.name == "archive_started") {
                reply(null, null)
            } else {
                Service.webhooks(obj, function(err, res) {
                    reply(err ? err : null, res)
                })
            }
        }
    }

];