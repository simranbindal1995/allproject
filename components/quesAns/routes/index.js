/*
 * @description: This file defines all the user routes
 * @date: 26 March 2018
 * @author: Simran
 * */


'use strict';

// include utils module

var Utils = require('../../../utils/index');
var userService = require('../services/index');
var configs = require('../../../configs');
var env = require('../../../env');
var APP_CONSTANTS = configs.constants;
var USER_TYPE = APP_CONSTANTS.USER_TYPE;
var GENDER = APP_CONSTANTS.GENDER

var Extension = require('joi-date-extensions')
var BaseJoi = Utils.Joi.extend(Extension)

module.exports = [{
        method: 'POST',
        path: '/v1/quesAns/insertQuesAns',
        config: {
            description: 'API to insert question answer in DB',
            pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
            tags: ['api'],
            validate: {
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),
                payload: {
                    question: Utils.Joi.string().required(),
                    answers: Utils.Joi.array().items(Utils.Joi.object().keys({
                        name: Utils.Joi.string().required()
                    })).required()
                },
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {

            request.payload.userId = request.pre.verify._id;

            userService.insertQuesAns(request.payload, function(err, res) {
                reply(err ? err : res)
            });
        }
    },
    {
        method: 'GET',
        path: '/v1/quesAns/getAllQuesAns',
        config: {
            description: 'API to get all ques ans including which are marked by the user',
            pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
            tags: ['api'],
            validate: {
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),
                query: {},
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {

            request.query.userId = request.pre.verify._id;
            request.query.quesAlreadyAns = request.pre.verify.generalQuestions;

            userService.getAllQuesAns(request.query, function(err, res) {
                reply(err ? err : res)
            });
        }
    },

];