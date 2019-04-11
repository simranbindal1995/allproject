'use strict'
const Joi = require('joi')

module.exports = {
    fetchMessages: {
        payload: {
            senderId: Joi.string().required(),
            receiverId: Joi.string().required()
        }
    },
    fetchInbox: {
        payload: {
            senderId: Joi.string().required()
        }
    },
    sendMessage: {
        payload: {
            senderId: Joi.string().required(),
            receiverId: Joi.string().required(),
            message: Joi.string().required()
        }
    },
    uploadAttachment: {
        payload: {
            file: Joi.any().meta({
                swaggerType: 'file'
            }).required().description('File'),
            receiverId: Joi.string().required(),
        },
        formPayload: {
            maxBytes: 3145728,
            output: 'stream',
            parse: true,
            allow: 'multipart/form-data'
        }
    },
    header: Joi.object({
        'x-logintoken': Joi.string().required().trim().description('Provide token to access api')
    }).unknown()
}