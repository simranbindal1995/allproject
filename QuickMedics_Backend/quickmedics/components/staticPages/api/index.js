'use strict'

const service = require('../service')
const path = require('path')

const addStaticPageData = async (request, h) => {
    try {
        request.payload.userInfo = request.userInfo
        const message = await service.addStaticPageData(request.payload)
        return response.success(h, message)
    } catch (err) {
        return response.failure(h, err.message)
    }
}

const addFaq = async (request, h) => {
    try {
        request.payload.userInfo = request.userInfo
        const message = await service.addFaq(request.payload)
        return response.success(h, message)
    } catch (err) {
        return response.failure(h, err.message)
    }
}

const fetchStaticPages = async (request, h) => {
    const log = logger.start('staticPages:api:fetchStaticPages')
    try {

        const message = await service.fetchStaticPages(request.query)
        log.end()
        return response.success(h, message)
    } catch (err) {
        log.end()
        return response.failure(h, err.message)
    }
}


exports.addStaticPageData = addStaticPageData
exports.fetchStaticPages = fetchStaticPages
exports.addFaq = addFaq