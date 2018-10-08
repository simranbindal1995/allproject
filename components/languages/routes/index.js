/*
 * @description: This file defines all the languages routes
 * @date: 17 april 2018
 * @author: Simran
 * */


'use strict';

// include utils module

var Utils = require('../../../utils/index');
var langService = require('../services/index');


module.exports = [{
        method: 'POST',
        path: '/v1/languages/saveLanguage',
        config: {
            description: 'API for saving language',
            tags: ['api'],
            pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
            validate: {
                payload: {
                    name: Utils.Joi.string().required().lowercase()
                },
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true })
            }
        },
        handler: function(request, reply) {
            langService.saveLanguage(request.payload, function(err, res) {
                reply(err ? err : res)
            })
        }
    },
    {
        method: 'GET',
        path: '/v1/languages/getLanguage',
        config: {
            description: 'API for getting language according to keyword',
            tags: ['api'],
            pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
            validate: {
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true })
            }
        },
        handler: function(request, reply) {
            langService.getLanguage(request, function(err, res) {
                reply(err ? err : res)
            })
        }
    }
];