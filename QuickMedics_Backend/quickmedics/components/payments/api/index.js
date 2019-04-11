const service = require('../service')


const addCard = async (request, h) => {
    try {
        request.payload.userInfo = request.userInfo
        const message = await service.addCard(request.payload)
        return response.success(h, message)
    } catch (err) {
        return response.failure(h, err.message)
    }
}
const addBankAccount = async (request, h) => {
    try {
        request.payload.userInfo = request.userInfo
        const message = await service.addBankAccount(request.payload)
        return response.success(h, message)
    } catch (err) {
        return response.failure(h, err.message)
    }
}
const listAllCards = async (request, h) => {
    try {
        request.userInfo = request.userInfo
        const message = await service.listAllCards(request)
        return response.data(h, message)
    } catch (err) {
        return response.failure(h, err.message)
    }
}

exports.addCard = addCard
exports.addBankAccount = addBankAccount
exports.listAllCards = listAllCards