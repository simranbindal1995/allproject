'use strict'
const validator = require('../validator')
const context = require('../../../utils/context-builder')

module.exports = {
    createBooking: {
        description: 'For booking a doctor for a timeslot',
        notes: 'A patient can book doctor for the availabilities.bookedFor is relation booking for.Send startTime n endTime as no. of seconds;slotsBooked array must always be sorted',
        tags: ['api', 'bookings'],
        pre: [{
            method: context.validateToken,
            assign: 'token'
        }],
        validate: {
            headers: validator.header,
            payload: validator.createBooking.payload,
            failAction: response.failAction
        }
    },
    reScheduleBooking: {
        description: 'Re-schedule a meeting',
        notes: 'Send booking id to be reschedule;slotsBooked array must always be sorted',
        tags: ['api', 'bookings'],
        pre: [{
            method: context.validateToken,
            assign: 'token'
        }],
        validate: {
            headers: validator.header,
            payload: validator.reScheduleBooking.payload,
            failAction: response.failAction
        }
    },
    cancelBooking: {
        description: 'Cancel a booking',
        notes: 'Doctor and patient both can cancel the booking anytime before start of call.',
        tags: ['api', 'bookings'],
        pre: [{
            method: context.validateToken,
            assign: 'token'
        }],
        validate: {
            headers: validator.header,
            payload: validator.cancelBooking.payload,
            failAction: response.failAction
        }
    },
    fetchBookings: {
        description: 'Fetch bookings according to the status',
        notes: 'Send status-upcoming,past,cancelled.',
        tags: ['api', 'bookings'],
        pre: [{
            method: context.validateToken,
            assign: 'token'
        }],
        validate: {
            headers: validator.header,
            query: validator.fetchBookings.query,
            failAction: response.failAction
        }
    },
    fetchTodaysBookings: {
        description: "Fetch bookings according to the date.Send today's date to access today's bookings",
        notes: 'To fetch todays bookings.Send time as unix timestamp',
        tags: ['api', 'bookings'],
        pre: [{
            method: context.validateToken,
            assign: 'token'
        }],
        validate: {
            headers: validator.header,
            query: validator.fetchTodaysBookings.query,
            failAction: response.failAction
        }
    },
    reviewAndRating: {
        description: "Review and Rate the doctor after call end",
        tags: ['api', 'bookings'],
        pre: [{
            method: context.validateToken,
            assign: 'token'
        }],
        validate: {
            headers: validator.header,
            payload: validator.reviewAndRating.payload,
            failAction: response.failAction
        }
    },
    fetchDetailsOfBooking: {
        description: "Api to fetch all information of a booking",
        tags: ['api', 'bookings'],
        pre: [{
            method: context.validateToken,
            assign: 'token'
        }],
        validate: {
            headers: validator.header,
            query: validator.fetchDetailsOfBooking.query,
            failAction: response.failAction
        }
    },
    makeCall: {
        description: "Api for making call using big blue button by doctor",
        tags: ['api', 'bookings'],
        pre: [{
            method: context.validateToken,
            assign: 'token'
        }],
        validate: {
            headers: validator.header,
            payload: validator.makeCall.payload,
            failAction: response.failAction
        }
    },
    joinCall: {
        description: "Api for joining call using big blue button by patient",
        tags: ['api', 'bookings'],
        pre: [{
            method: context.validateToken,
            assign: 'token'
        }],
        validate: {
            headers: validator.header,
            payload: validator.joinCall.payload,
            failAction: response.failAction
        }
    },
    declineCall: {
        description: "Api for declining call by patient",
        tags: ['api', 'bookings'],
        pre: [{
            method: context.validateToken,
            assign: 'token'
        }],
        validate: {
            headers: validator.header,
            payload: validator.declineCall.payload,
            failAction: response.failAction
        }
    },
    webhooks : {
        description: "Api for getting data from big blue button using webhooks",
        tags: ['api', 'bookings']
    }
}