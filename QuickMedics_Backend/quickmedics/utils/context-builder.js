// File for validating acess token
'use strict'
const auth = require('./auth')
const response = require('./responses')


exports.validateToken = async (request, h) => {
    logger.start("Check accessToken", h)
    const token = request.headers['x-logintoken']

    if (!token) {
        return response.accessRevoked(h, 'user token is required')
    }

    const userId = await auth.verifyToken(token)

    if (!userId) {
        return response.accessRevoked(h, 'Session expired ! Please login again')
    }
    const user = await db.users.findById(userId.id)

    if ((!user) || (user && !user.isEmailVerified) || (user && user.isDeleted)) {
        return response.accessRevoked(h, 'Session expired ! Please login again')
    }

    const tokenExists = user.deviceDetails.accessToken === token


    if (!tokenExists) {
        return response.accessRevoked(h, 'Session expired ! Please login again')
    }

    request.userInfo = user

    return h
}

exports.validateWithSocket = async (request, socket) => {
    console.log('socket===', socket.id)

    const token = request.query['x-logintoken']

    console.log('token================', token)

    if (!token) {
        throw new Error('user token is required')
    }

    const userId = await auth.verifyToken(token)

    if (!userId) {
        throw new Error('invalid token')
    }

    const user = await db.users.findById(userId.id)

    if ((!user) || (user && !user.isEmailVerified) || (user && user.isDeleted)) {
        throw new Error('Session expired ! Please login again')
    }

    const tokenExists = user.deviceDetails.accessToken === token

    if (!tokenExists) {
        throw new Error('token expired')
    }
    request.userInfo = user
    request.socketId = socket.id

    await db.users.findOneAndUpdate({ _id: user._id }, { "deviceDetails.socketId": socket.id }, { new: true })

    return request.userInfo
}