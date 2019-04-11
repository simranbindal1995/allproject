const service = require('../service')


const fetchNotifications = async (request, h) => {
    try {
        request.query.userInfo = request.userInfo
        const message = await service.fetchNotifications(request.query)
        return response.paged(h, message, message.totalRecords)
    } catch (err) {
        return response.failure(h, err.message)
    }
}
const deleteNotification = async (request, h) => {
    try {
        request.payload.userInfo = request.userInfo
        const message = await service.deleteNotification(request.payload)
        return response.success(h, message)
    } catch (err) {
        return response.failure(h, err.message)
    }
}

const deleteAllNotifications = async(request,h) =>{
    try {
        request.userInfo = request.userInfo
        const message = await service.deleteAllNotifications(request)
        return response.success(h, message)
    } catch (err) {
        return response.failure(h, err.message)
    }
}

exports.fetchNotifications = fetchNotifications
exports.deleteNotification = deleteNotification
exports.deleteAllNotifications = deleteAllNotifications