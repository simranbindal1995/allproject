'use strict'
const Joi = require('joi')

module.exports = {
    addAvailability: {
        payload: {
            consultationFee: Joi.number().required(),
            availabilityDetails: Joi.array().items(Joi.object().keys({
                day: Joi.array().required(),
                dayNumber: Joi.array().required(),
                allAvailabilities: Joi.array().items(Joi.object().keys({
                    startTime: Joi.number().required(),
                    endTime: Joi.number().required()
                }))
            })),
        }
    },
    editAvailability: {
        payload: {
            consultationFee: Joi.number().required(),
            availabilityDetails: Joi.array().items(Joi.object().keys({
                sessionId: Joi.string().required(),
                day: Joi.array().required(),
                dayNumber: Joi.array().required(),
                allAvailabilities: Joi.array().items(Joi.object().keys({
                    startTime: Joi.number().required(),
                    endTime: Joi.number().required()
                })),
                isDeleted: Joi.boolean().default(false).required()
            })),
        }
    },
    fetchAvailabilitiesDateWise: {
        query: {
            doctorId: Joi.string().required(),
            day: Joi.string().required(),
            dayNumber: Joi.number().required()
        }
    },
    accessGranted: Joi.object({
        isSuccess: Joi.boolean(),
        status: Joi.string(),
        statusCode: Joi.number().default(200),
        data: Joi.object({
            _id: Joi.string(),
            firstName: Joi.string(),
            lastName: Joi.string(),
            email: Joi.string(),
            secondaryEmail: Joi.string(),
            role: Joi.number(),
            pic: Joi.string(),
            qualification: Joi.object({
                id: Joi.string(),
                name: Joi.string()
            }),
            gender: Joi.string(),
            dob: Joi.date().default(new Date().toISOString()),
            address: Joi.object({
                street: Joi.string(),
                city: Joi.string(),
                state: Joi.string(),
                country: Joi.string()
            }),
            isCompleted: Joi.boolean(),
            isVerified: Joi.boolean(),
            isSuspended: Joi.boolean(),
            isDeleted: Joi.boolean(),
            createdAt: Joi.date().default(new Date().toISOString()),
            updatedAt: Joi.date().default(new Date().toISOString())
        })
    }),
    accessDenied: Joi.object({
        isSuccess: Joi.boolean().default(false),
        status: Joi.string(),
        statusCode: Joi.number().default(400),
        message: Joi.string()
    }),
    failure: Joi.object({
        isSuccess: Joi.boolean().default(false),
        status: Joi.string(),
        statusCode: Joi.number().default(320),
        message: Joi.string()
    }),
    success: Joi.object({
        isSuccess: Joi.boolean(),
        status: Joi.string(),
        statusCode: Joi.number().default(200),
        message: Joi.string()
    }),
    header: Joi.object({
        'x-logintoken': Joi.string().required().trim().description('Provide token to access api')
    }).unknown()
}