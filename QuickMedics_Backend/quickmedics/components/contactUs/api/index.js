const service = require('../service')

const contactUs = async (request, h) => {
    try {
        const message = await service.contactUs(request.payload)
        return response.success(h, message)
    } catch (err) {
        return response.failure(h, err.message)
    }
}
const fetchContactUs = async (request, h) => {
    try {
        const message = await service.fetchContactUs(request.query)
        return response.paged(h, message)
    } catch (err) {
        return response.failure(h, err.message)
    }
}
const feedback = async (request, h) => {
    try {
        const message = await service.feedback(request.payload)
        return response.success(h, message)
    } catch (err) {
        return response.failure(h, err.message)
    }
}

exports.contactUs = contactUs
exports.fetchContactUs = fetchContactUs
exports.feedback = feedback