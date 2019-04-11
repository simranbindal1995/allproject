'use strict'

const service = require('../service')
const path = require('path')

const createBooking = async (request, h) => {
    try {
        request.payload.userInfo = request.userInfo
        const message = await service.createBooking(request.payload)
        return response.success(h, message)
    } catch (err) {
        return response.failure(h, err.message)
    }
}
const reScheduleBooking = async (request, h) => {
    try {
        request.payload.userInfo = request.userInfo
        const message = await service.reScheduleBooking(request.payload)
        return response.success(h, message)
    } catch (err) {
        return response.failure(h, err.message)
    }
}
const cancelBooking = async (request, h) => {
    try {
        request.payload.userInfo = request.userInfo
        const message = await service.cancelBooking(request.payload)
        return response.success(h, message)
    } catch (err) {
        return response.failure(h, err.message)
    }
}
const fetchBookings = async (request, h) => {
    try {
        request.query.userInfo = request.userInfo
        const message = await service.fetchBookings(request.query)
        return response.paged(h, message, message.totalCount)
    } catch (err) {
        return response.failure(h, err.message)
    }
}
const fetchTodaysBookings = async (request, h) => {
    try {
        request.query.userInfo = request.userInfo
        const message = await service.fetchTodaysBookings(request.query)
        return response.paged(h, message, message.totalCount)
    } catch (err) {
        return response.failure(h, err.message)
    }
}
const reviewAndRating = async (request, h) => {
    try {
        request.payload.userInfo = request.userInfo
        const message = await service.reviewAndRating(request.payload)
        return response.success(h, message)
    } catch (err) {
        return response.failure(h, err.message)
    }
}
const fetchDetailsOfBooking = async (request, h) => {
    try {
        request.query.userInfo = request.userInfo
        const message = await service.fetchDetailsOfBooking(request.query)
        return response.success(h, message)
    } catch (err) {
        return response.failure(h, err.message)
    }
}

const makeCall = async (request, h) => {
    try {
        request.payload.userInfo = request.userInfo
        const message = await service.makeCall(request.payload)
        return response.success(h, message)
    } catch (err) {
        return response.failure(h, err.message)
    }
}
const joinCall = async (request, h) => {
    try {
        request.payload.userInfo = request.userInfo
        const message = await service.joinCall(request.payload)
        return response.success(h, message)
    } catch (err) {
        return response.failure(h, err.message)
    }
}

const declineCall = async (request, h) => {
    try {
        request.payload.userInfo = request.userInfo
        const message = await service.declineCall(request.payload)
        return response.success(h, message)
    } catch (err) {
        return response.failure(h, err.message)
    }
}

const webhooks = async (request, h) => {
    try {
        const message = await service.webhooks(request)
        return response.success(h, message)
    } catch (err) {
        return response.failure(h, err.message)
    }
}


exports.createBooking = createBooking
exports.reScheduleBooking = reScheduleBooking
exports.cancelBooking = cancelBooking
exports.fetchBookings = fetchBookings
exports.fetchTodaysBookings = fetchTodaysBookings
exports.reviewAndRating = reviewAndRating
exports.fetchDetailsOfBooking = fetchDetailsOfBooking
exports.makeCall = makeCall
exports.joinCall = joinCall
exports.declineCall = declineCall
exports.webhooks = webhooks