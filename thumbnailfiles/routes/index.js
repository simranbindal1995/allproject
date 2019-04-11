/*
 * @description: This file defines all the files routes
 * @date: 13-July-2017
 * @author: Nitin Padgotra
 * */


'use strict';

// include utils module

var Utils = require('../../../utils/index');
var fileService = require('../services/index');
var configs = require('../../../configs');
var env = require('../../../env');


module.exports = [

    {
        method: 'POST',
        path: '/v1/Files/uploadCdn',
        config: {
            description: 'API for file uploading of skint user',
            notes: 'API for file uploading of skint user',
            tags: ['api'],
            pre: [
                { method: Utils.universalFunctions.verifyLoginToken, assign: "userDetails" }
            ],
            validate: {
                payload: {
                    file: Utils.Joi.any()
                        .meta({ swaggerType: 'file' })
                        .description('file to upload')
                },
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true })
            },
            payload: {
                maxBytes: 3000000000,
                parse: true,
                output: 'stream',
                timeout: false
            }
        },
        handler: function(request, reply) {
            fileService.fileUpload(request, function(err, res) {
                if (err) {
                    Utils.response.error(reply);
                } else {
                    Utils.response.success(reply, res.message, res.data);
                }
            })
        }
    },
    {
        method: 'POST',
        path: '/v1/Files/uploadTmp',
        config: {
            description: 'API for file uploading of skint user to temp first',
            notes: 'API for file uploading of skint user to temp first',
            tags: ['api'],
            pre: [
                { method: Utils.universalFunctions.verifyLoginToken, assign: "userDetails" }
            ],
            validate: {
                payload: {
                    file: Utils.Joi.any()
                        .meta({ swaggerType: 'file' })
                        .description('file to upload'),
                    is_video: Utils.Joi.string().default('false').required().label('is_video'),
                    chat_media: Utils.Joi.string().default('false').optional().label('chat_media')
                },
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true })
            },
            payload: {
                maxBytes: 3000000000,
                parse: true,
                output: 'stream',
                timeout: false
            }
        },
        handler: function(request, reply) {
            fileService.fileUploadTmp(request, function(err, res) {
                if (err) {
                    Utils.response.error(reply);
                } else {
                    Utils.response.success(reply, res.message, res.data);
                }
            })
        }
    },
    {
        method: 'GET',
        path: '/v1/Files/{name}',
        config: {
            description: 'API for fetching files from the skint',
            notes: 'API for fetching files from the skint',
            tags: ['api'],
            validate: {
                params: {
                    name: Utils.Joi.string().required()
                },
                query: {
                    thumbnail: Utils.Joi.boolean().optional().default(false),
                    chat_thumb: Utils.Joi.boolean().optional().default(false),
                    fbclid: Utils.Joi.string().allow('').optional()
                }
            }
        },
        handler: function(request, reply) {

            fileService.findFile(request, function(err, res) {
                if (err) {
                    Utils.response.error(reply);
                } else {
                    if (res.status == "warning") {
                        Utils.response.warning(reply, res.message);
                    } else {

                        if (request.query.thumbnail) {
                            var file = Utils.path.join(__dirname, '../../../assets/cdn/' + res.data[0].user_id + "/" + res.data[0]._id + ".png");
                        } else if (request.query.chat_thumb) {
                            var file = Utils.path.join(__dirname, '../../../assets/cdn/' + res.data[0].user_id + "/" + res.data[0]._id + "_thumb" + "." + res.data[0].file_extension);
                        } else {
                            var file = Utils.path.join(__dirname, '../../../assets/cdn/' + res.data[0].user_id + "/" + res.data[0]._id + "." + res.data[0].file_extension);
                        }

                        console.log(file);
                        reply.file(file);
                    }
                }
            })
        }
    },
    {
        method: 'POST',
        path: '/v1/Files/userMedia',
        config: {
            description: 'API for fetching all user user media collection',
            notes: 'API for fetching all user user media collection',
            tags: ['api'],
            pre: [
                { method: Utils.universalFunctions.verifyLoginToken, assign: "userDetails" }
            ],
            validate: {
                params: {
                    name: Utils.Joi.string().required()
                },
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true })
            }
        },
        handler: function(request, reply) {

            fileService.findFile(request, function(err, res) {
                if (err) {
                    Utils.response.error(reply);
                } else {
                    if (res.status == "warning") {
                        Utils.response.warning(reply, res.message);
                    } else {
                        var file = Utils.path.join(__dirname, '../../../assets/cdn/' + res.data[0].user_id + "/" + res.data[0]._id + "." + res.data[0].file_extension);
                        reply.file(file);
                    }
                }
            })
        }
    }
];