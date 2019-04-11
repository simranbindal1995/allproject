'use strict'
const Joi = require('joi')

module.exports = {
    contactUs: {
        payload: {
            fullName: Joi.string().required().lowercase(),
            email: Joi.string().required(),
            message: Joi.string().required()
        }
    },
    fetchContactUs: {
        query: {
            skip: Joi.number(),
            limit: Joi.number()
        }
    },
    feedback: {
        email: Joi.string().required(),
        subject: Joi.string().required(),
        message: Joi.string().required()
    },
    header: Joi.object({
        'x-logintoken': Joi.string().required().trim().description('Provide token to access api')
    }).unknown()
}