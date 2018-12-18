/*
 * @description: This file defines all the user routes
 * @date: 27 March-2018
 * @author: Himanshi
 * */


// include utils module

var Utils = require('../../../utils/index');
var chatService = require('../services/index');
var configs = require('../../../configs');
var env = require('../../../env');
// var locationModel = require('../../socket/services/index');
var baseUrl = "http://" + configs.app[env.instance].host + ":" + configs.app[env.instance].port;
module.exports = [{

    method: 'POST',
    path: '/v1/chat/fetchInbox',
    config: {
        description: 'Api route to fetch inbox of users.',
        tags: ['api'],
        pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
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
        request.payload.userId = request.pre.verify._id;
        chatService.fetchInbox(request.payload, function(err, res) {
            if (err)
                reply(err);
            else
                reply(res);
        })
    }
}, {

    method: 'POST',
    path: '/v1/chat/fetchMessages',
    config: {
        description: 'Api route to fetch messages of users.',
        tags: ['api'],
        validate: {
            payload: {
                logged_in_user_id: Utils.Joi.string().length(24).required().label('logged in user'),
                user_id: Utils.Joi.string().length(24).label('User id'),
                skip: Utils.Joi.number().required().default(0),
                limit: Utils.Joi.number().required().default(10)
            },
            failAction: Utils.universalFunctions.failActionFunction
        }
    },
    handler: function(request, reply) {

        chatService.fetchMessages(request.payload, function(err, res) {
            if (err)
                reply(err);
            else
                reply(res);
        })
    },
}, {

    method: 'POST',
    path: '/v1/chat/deleteChat',
    config: {
        description: 'Api route to delete chat',
        tags: ['api'],
        pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
        validate: {
            headers: Utils.Joi.object({
                'x-logintoken': Utils.Joi.string().required().trim()
            }).options({ allowUnknown: true }),
            payload: {
                chatRoomId: Utils.Joi.string().required()
            },
            failAction: Utils.universalFunctions.failActionFunction
        }
    },
    handler: function(request, reply) {
        request.payload.userId = request.pre.verify._id;
        chatService.deleteChat(request.payload, function(err, res) {
            reply(err ? err : res)
        })
    },
}, {

    method: 'POST',
    path: '/v1/chat/deleteMessage',
    config: {
        description: 'Api route to delete message',
        tags: ['api'],
        pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
        validate: {
            headers: Utils.Joi.object({
                'x-logintoken': Utils.Joi.string().required().trim()
            }).options({ allowUnknown: true }),
            payload: {
                messageId: Utils.Joi.string().required()
            },
            failAction: Utils.universalFunctions.failActionFunction
        }
    },
    handler: function(request, reply) {
        request.payload.userId = request.pre.verify._id;
        chatService.deleteMessage(request.payload, function(err, res) {
            reply(err ? err : res)
        })
    },
}]