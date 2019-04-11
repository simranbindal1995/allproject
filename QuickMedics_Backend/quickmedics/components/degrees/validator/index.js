'use strict'
const Joi = require('joi')

module.exports = {
    addDegree: {
        payload: {
            name: Joi.string().required().lowercase()
        }
    },
    header: Joi.object({
        'x-logintoken': Joi.string().required().trim().description('Provide token to access api')
    }).unknown()
}