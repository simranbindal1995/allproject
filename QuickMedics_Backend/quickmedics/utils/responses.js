// Common file for sending and calling responses
'use strict'

const success = (h, message) => {
    const res = h.response({
        isSuccess: true,
        status: 'success',
        statusCode: 200,
        message: message
    })
    res.code(200)
    return res
}

const data = (h, item) => {
    const res = h.response({
        isSuccess: true,
        status: 'success',
        statusCode: 200,
        data: item
    })
    res.code(200)
    return res
}
const paged = (h, item, totalRecords) => {
    const res = h.response({
        isSuccess: true,
        status: 'success',
        statusCode: 200,
        totalRecords: totalRecords,
        data: item
    })
    res.code(200)
    return res
}
const failure = (h, message) => {
    const res = h.response({
        isSuccess: false,
        status: 'failure',
        statusCode: 320,
        message: message
    })
    res.code(200)
    res.takeover()
    return res
}
const accessDenied = (h, message) => {
    const res = h.response({
        isSuccess: false,
        status: 'failure',
        statusCode: 400,
        message: message
    })
    res.code(200)
    res.takeover()
    return res
}
const accessRevoked = (h, message) => {
    const res = h.response({
        isSuccess: false,
        status: 'failure',
        statusCode: 406,
        message: message
    })
    res.code(200)
    res.takeover()
    return res
}

const accessGranted = (h, user, token) => {
    const res = h.response({
        status: 'success',
        statusCode: 200,
        message: 'Successfully Login',
        data: user
    })
    res.header('x-access-token', token)
    return res
}
const error = (h) => {
    const res = h.response({
        status: 'error',
        statusCode: 500,
        message: 'Technical Error! Please try again later.'
    })
    res.code(200)
    res.takeover()
    return res
}
const failAction = (request, h, error) => {
    let customErrorMessage = ''
    if (error.output.payload.message.indexOf('[') > -1) {
        customErrorMessage = error.output.payload.message.substr(error.output.payload.message.lastIndexOf('['))
    } else {
        customErrorMessage = error.output.payload.message
    }
    customErrorMessage = customErrorMessage.replace(/"/g, '')
    customErrorMessage = customErrorMessage.replace('[', '')
    customErrorMessage = customErrorMessage.replace(']', '')
    customErrorMessage = customErrorMessage.replace(']', '')
    const res = h.response({
        isSuccess: false,
        status: 'failure',
        statusCode: 320,
        message: customErrorMessage
    })
    res.code(200)
    res.takeover()
    return res
}
const accessDeniedAction = (request, h, error) => {
    let customErrorMessage = ''
    if (error.output.payload.message.indexOf('[') > -1) {
        customErrorMessage = error.output.payload.message.substr(error.output.payload.message.lastIndexOf('['))
    } else {
        customErrorMessage = error.output.payload.message
    }
    customErrorMessage = customErrorMessage.replace(/"/g, '')
    customErrorMessage = customErrorMessage.replace('[', '')
    customErrorMessage = customErrorMessage.replace(']', '')
    customErrorMessage = customErrorMessage.replace(']', '')
    const res = h.response({
        isSuccess: false,
        status: 'failure',
        statusCode: 400,
        message: customErrorMessage
    })
    res.code(200)
    res.takeover()
    return res
}

exports.paged = paged
exports.data = data
exports.error = error
exports.failure = failure
exports.success = success
exports.failAction = failAction
exports.accessDenied = accessDenied
exports.accessRevoked = accessRevoked
exports.accessGranted = accessGranted
exports.accessDeniedAction = accessDeniedAction