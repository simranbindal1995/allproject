'use strict'
const Joi = require('joi')

module.exports = {
    fetchNotifications: {
        query: {
            skip: Joi.number().default(0),
            limit: Joi.number().default(10)
        }
    },
    deleteNotification: {
        payload: {
            notificationId: Joi.string().required()
        }
    },
    header: Joi.object({
        'x-logintoken': Joi.string().required().trim().description('Provide token to access api')
    }).unknown()
}