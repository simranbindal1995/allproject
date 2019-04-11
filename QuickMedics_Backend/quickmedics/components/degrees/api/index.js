const service = require('../service')

const addDegree = async (request, h) => {
    try {
        const message = await service.addDegree(request.payload)
        return response.success(h, message)
    } catch (err) {
        return response.failure(h, err.message)
    }
}
const fetchDegrees = async (request, h) => {
    try {
        const message = await service.fetchDegrees(request.payload)
        return response.data(h, message)
    } catch (err) {
        return response.failure(h, err.message)
    }
}

exports.addDegree = addDegree
exports.fetchDegrees = fetchDegrees