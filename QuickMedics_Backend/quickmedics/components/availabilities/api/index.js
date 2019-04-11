'use strict'

const mapper = require('../mapper')
const service = require('../service')
const path = require('path')

const addAvailability = async (request, h) => {
    try {
        request.payload.userInfo = request.userInfo
        const message = await service.addAvailability(request.payload)
        return response.success(h, message)
    } catch (err) {
        return response.failure(h, err.message)
    }
}

const editAvailability = async (request, h) => {
    try {
        request.payload.userInfo = request.userInfo
        const message = await service.editAvailability(request.payload)
        return response.success(h, message)
    } catch (err) {
        return response.failure(h, err.message)
    }
}

const fetchAllAvailabilities = async (request, h) => {
    try {
        const userInfo = request.userInfo
        const message = await service.fetchAllAvailabilities(userInfo)
        return response.data(h, message)
    } catch (err) {
        return response.failure(h, err.message)
    }
}
const fetchAvailabilitiesDateWise = async (request, h) => {
    try {
        const message = await service.fetchAvailabilitiesDateWise(request.query)
        return response.data(h, message)
    } catch (err) {
        return response.failure(h, err.message)
    }
}

exports.addAvailability = addAvailability
exports.editAvailability = editAvailability
exports.fetchAllAvailabilities = fetchAllAvailabilities
exports.fetchAvailabilitiesDateWise = fetchAvailabilitiesDateWise