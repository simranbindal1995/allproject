'use strict'
const Joi = require('joi')

module.exports = {
    enterSpecialisation: {
        payload: {
            name: Joi.string().required().lowercase(),
            isChild: Joi.boolean().required().default(true),
            parentId: Joi.string().when("isChild", {
                is: true,
                then: Joi.required(),
                otherwise: Joi.optional().allow('')
            })
        }
    },
    header: Joi.object({
        'x-logintoken': Joi.string().required().trim().description('Provide token to access api')
    }).unknown()
}