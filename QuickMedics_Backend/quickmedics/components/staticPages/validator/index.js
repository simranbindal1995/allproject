'use strict'
const Joi = require('joi')

module.exports = {
    addStaticPageData: {
        payload: {
            content: Joi.string().required(),
            contentType: Joi.number().required()
        }
    },

    fetchStaticPages: {
        query: {
            contentType: Joi.number().required()
        }
    },
    addFaq : {
        payload : {
            questionId : Joi.string().allow(""),
            question : Joi.string().required(),
            answer : Joi.string().required()
        }
    },
    header: Joi.object({
        'x-logintoken': Joi.string().required().trim().description('Provide token to access api')
    }).unknown()
}