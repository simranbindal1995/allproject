'use strict'
const Joi = require('joi')

module.exports = {
    createBooking: {
        payload: {
            doctorId: Joi.string().required(),
            bookedFor: Joi.string().lowercase().required(),
            bookedAt: Joi.object().keys({
                date: Joi.number().required(), //full date
                day: Joi.string().required(), // day in string
                dayNumber: Joi.number().required(), // only day number
                slotsBooked: Joi.array().items(Joi.object().keys({
                    startTime: Joi.number().required(),
                    endTime: Joi.number().required()
                })),
            }).required(),
            totalAmount: Joi.number().required(),
            consultationFee: Joi.number().required(),
            cardId: Joi.string().optional().allow("").default("card_1DpskJDzsYlNh55pjijxX2ei"),
            cardToken: Joi.string().optional().allow(""),
            makePayment: Joi.boolean().default(false)
        }
    },
    reScheduleBooking: {
        payload: {
            bookingId: Joi.string().required(),
            bookedFor: Joi.string().required(),
            bookedAt: Joi.object().keys({
                date: Joi.number().required(), //full date
                day: Joi.string().required(), // day in string
                dayNumber: Joi.number().required(), // only day number
                slotsBooked: Joi.array().items(Joi.object().keys({
                    startTime: Joi.number().required(),
                    endTime: Joi.number().required()
                })),
            }).required(),
            totalAmount: Joi.number().required(),
            consultationFee: Joi.number().required(),
            cardId: Joi.string().optional().allow("").default("card_1DpskJDzsYlNh55pjijxX2ei"),
            cardToken: Joi.string().optional().allow(""),
            makePayment: Joi.boolean().default(false)
        }
    },
    cancelBooking: {
        payload: {
            bookingId: Joi.string().required(),
            cancellationReason: Joi.string().required(),
            cancellationMessage: Joi.string().required(),
            makePayment: Joi.boolean().default(false)
        }
    },
    fetchBookings: {
        query: {
            status: Joi.string().required().valid(["upcoming", "past", "cancelled"]),
            skip: Joi.number().required().default(0),
            limit: Joi.number().required().default(10)
        }
    },
    fetchTodaysBookings: {
        query: {
            currentDate: Joi.number().required(),
            skip: Joi.number().required().default(0),
            limit: Joi.number().required().default(10)
        }
    },
    reviewAndRating: {
        payload: {
            bookingId: Joi.string().required(),
            rating: Joi.number().required(),
            review: Joi.string().required()
        }
    },
    fetchDetailsOfBooking: {
        query: {
            bookingId: Joi.string().required()
        }
    },
    makeCall: {
        payload: {
            bookingId: Joi.string().required()
        }
    },
    joinCall: {
        payload: {
            bookingId: Joi.string().required()
        }
    },
    declineCall: {
        payload: {
            bookingId: Joi.string().required()
        }
    },
    header: Joi.object({
        'x-logintoken': Joi.string().required().trim().description('Provide token to access api')
    }).unknown()
}