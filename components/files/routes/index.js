/*
 * @description: This file defines all the files routes
 * @date: 29 march 2018
 * @author: Simran
 * */


'use strict';

// include utils module

var Utils = require('../../../utils/index');
var fileService = require('../services/index');
var configs = require('../../../configs');
var env = require('../../../env');


module.exports = [{
        method: 'POST',
        path: '/v1/Files/uploadTmpSTEP-5',
        config: {
            description: 'API for file uploading of user to temp first',
            notes: 'API for file uploading of user to temp first. 1 -profilePic , 2 - documents.Guru can uplaod docs from here for update profile',
            tags: ['api'],
            pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
            validate: {
                payload: {
                    file: Utils.Joi.any().required(),
                    type: Utils.Joi.number().required().valid([1, 2]),
                    currentTime : Utils.Joi.number().optional()
                    // title: Utils.Joi.string().when('type', { is: 2, then: Utils.Joi.required(), otherwise: Utils.Joi.optional().allow('') }),
                    // description: Utils.Joi.string().when('type', { is: 2, then: Utils.Joi.required(), otherwise: Utils.Joi.optional().allow('') })
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
                console.log(err)
                if (err) {
                    reply(err)
                } else {
                    reply(res)
                }
            })
        }
    },
    {
        method: 'GET',
        path: '/v1/Files/{name}',
        config: {
            description: 'API for fetching files.',
            notes: 'API for fetching files. <br> For fetching the user image, name is required that will be fetched as profilePic from v1/Users/profile api <br> When fetching the user image,thumbnail will always be false ',
            tags: ['api'],
            validate: {
                params: {
                    name: Utils.Joi.string().required()
                }
            }
        },
        handler: function(request, reply) {

            fileService.findFile(request, function(err, res) {
                if (err) {
                    reply(err)
                } else {
                    var file = Utils.path.join(__dirname, '../../../assets/cdn/' + res.data[0].user_id + "/" + res.data[0]._id + "." + res.data[0].file_extension);
                    reply.file(file);
                }
            })
        }
    },
    {
        method: 'PUT',
        path: '/v1/Files/deleteFile',
        config: {
            description: 'API for deleting a file.',
            tags: ['api'],
            pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
            validate: {
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),
                payload: {
                    fileId: Utils.Joi.string().required()
                }
            }
        },
        handler: function(request, reply) {
            
            request.payload.userId = request.pre.verify._id;

            fileService.deleteFile(request.payload, function(err, res) {
                reply(err ? err : res)
            })
        }
    }
];