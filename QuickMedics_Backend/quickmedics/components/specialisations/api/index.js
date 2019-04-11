const service = require('../service')

const enterSpecialisation = async (request, h) => {
    try {
        const message = await service.enterSpecialisation(request.payload)
        return response.success(h, message)
    } catch (err) {
        return response.failure(h, err.message)
    }
}
const fetchSpecialisations = async (request, h) => {
    try {
        const message = await service.fetchSpecialisations(request.payload)
        return response.data(h, message)
    } catch (err) {
        return response.failure(h, err.message)
    }
}

exports.enterSpecialisation = enterSpecialisation
exports.fetchSpecialisations = fetchSpecialisations