'use strict'

const mapper = require('../mapper')
const service = require('../service')
const path = require('path')

const signUp = async (request, h) => {
    try {
        const message = await service.signUp(request.payload)
        return response.success(h, message)
    } catch (err) {
        return response.failure(h, err.message)
    }
}

const login = async (request, h) => {
    const log = logger.start('users:api:login')
    try {
        const user = await service.login(request.payload)
        log.end()

        if (typeof(user) === 'string') {
            return response.failure(h, user)
        }
        return response.success(h, mapper.toModel(user), user.token)
    } catch (err) {
        log.error(err)
        log.end()
        return response.accessDenied(h, err.message)
    }
}

const verifyEmail = async (request, h) => {
    const log = logger.start('users:api:verifyEmail')

    try {
        await service.verifyEmail(request.query.token)
        log.end()
        return h.file(path.join(__dirname, '../../../templates/user-register-success.html'))
    } catch (err) {
        log.error(err)
        log.end()
        return h.file(path.join(__dirname, '../../../templates/user-register-failure.html'))
    }
}

const verifySecondaryEmail = async (request, h) => {
    const log = logger.start('users:api:verifySecondaryEmail')

    try {
        await service.verifySecondaryEmail(request.query)
        log.end()
        return h.file(path.join(__dirname, '../../../templates/user-register-success.html'))
    } catch (err) {
        log.error(err)
        log.end()
        return h.file(path.join(__dirname, '../../../templates/user-register-failure.html'))
    }
}

const checkEmailExists = async (request, h) => {
    const log = logger.start('users:api:checkEmailExists')
    try {
        const message = await service.checkEmailExists(request.payload)
        log.end()
        if (message == 320) {
            return response.failure(h, "Email does not exists")
        }
        return response.success(h, message)
    } catch (err) {
        log.error(err)
        log.end()
        return response.accessDenied(h, err.message)
    }
}

const forgotPassword = async (request, h) => {
    const log = logger.start('users:api:forgotPassword')

    try {
        const message = await service.forgotPassword(request.payload)
        log.end()
        return response.success(h, message)
    } catch (err) {
        log.error(err)
        log.end()
        return response.failure(h, err.message)
    }
}

const resendEmailVerificationLink = async (request, h) => {
    const log = logger.start('users:api:resendEmailVerificationLink')

    try {
        const message = await service.resendEmailVerificationLink(request.payload.email)
        log.end()
        return response.success(h, message)
    } catch (err) {
        log.error(err)
        log.end()
        return response.failure(h, err.message)
    }
}

const resendSecondaryEmailLink = async (request, h) => {
    const log = logger.start('users:api:resendSecondaryEmailLink')
    try {
        request.userInfo = request.userInfo
        const message = await service.resendSecondaryEmailLink(request.userInfo)
        log.end()
        return response.success(h, message)
    } catch (err) {
        log.error(err)
        log.end()
        return response.failure(h, err.message)
    }
}


const resetPasswordToken = async (request, h) => {
    const log = logger.start('users:api:resetPasswordToken')

    try {
        const message = await service.resetPasswordToken(request.query.token)
        log.end()
        return response.success(h, message)
    } catch (err) {
        log.error(err)
        log.end()
        return response.failure(h, err.message)
    }
}

const verifyResetPasswordToken = async (request, h) => {
    const log = logger.start('users:api:verifyResetPasswordToken')

    try {
        await service.verifyResetPasswordToken(request.query.token)
        log.end()
        return h.file(path.join(__dirname, '../../../templates/user-update-password.html'))
    } catch (err) {
        log.error(err)
        log.end()
        return h.file(path.join(__dirname, '../../../templates/user-verify-password-failure.html'))
    }
}

const logout = async (request, h) => {
    const log = logger.start('users:api:logout')

    try {
        const message = await service.logout(request.headers)
        log.end()
        return response.success(h, message)
    } catch (err) {
        log.error(err)
        log.end()
        return response.failure(h, err.message)
    }
}

const changePassword = async (request, h) => {
    const log = logger.start('user:api:changePassword')
    try {
        request.payload.userId = request.userInfo
        const message = await service.changePassword(request.payload)
        log.end()
        return response.success(h, message)
    } catch (err) {
        log.error(err)
        log.end()
        return response.failure(h, err.message)
    }
}

const setNewPassword = async (request, h) => {
    const log = logger.start('user:api:changeEmail')
    try {
        const message = await service.setNewPassword(request.payload)
        log.end()
        return response.success(h, message)
    } catch (err) {
        log.error(err)
        log.end()
        return response.failure(h, err.message)
    }
}

const updateProfileStep1 = async (request, h) => {
    const log = logger.start("user:api:updateProfileStep1")
    try {
        request.payload.userInfo = request.userInfo
        const data = await service.updateProfileStep1(request.payload)
        log.end()
        return response.success(h, mapper.toModel(data))
    } catch (err) {
        log.error(err)
        log.end()
        return response.failure(h, err.message)
    }
}
const verifyOtp = async (request, h) => {
    const log = logger.start("user:api:verifyOtp")
    try {
        request.payload.userId = request.userInfo
        const data = await service.verifyOtp(request.payload)
        log.end()
        return response.success(h, data)
    } catch (err) {
        log.error(err)
        log.end()
        return response.failure(h, err.message)
    }
}

const resendOtp = async (request, h) => {
    const log = logger.start("user:api:resendOtp")
    try {
        if (request.userInfo.isPhoneNumberConfirmed) throw new Error("Mobile number already confirmed.")
        if (!request.userInfo.mobileNumber) throw new Error("Phone number not registered.")

        request.userInfo = request.userInfo
        const data = await service.resendOtp(request)
        log.end()
        return response.data(h, data)
    } catch (err) {
        log.error(err)
        log.end()
        return response.failure(h, err.message)
    }
}

const addFamilyMembers = async (request, h) => {
    const log = logger.start("user:api:addFamilyMembers")
    try {
        const total = request.userInfo.family.length + request.payload.family.length
        if (total > 8) throw new Error(`Maximum 8 family members can be added and you have already added ${request.userInfo.family.length} members `)

        request.payload.userInfo = request.userInfo
        const data = await service.addFamilyMembers(request.payload)
        log.end()
        return response.data(h, data)
    } catch (err) {
        log.error(err)
        log.end()
        return response.failure(h, err.message)
    }
}
const skipForNow = async (request, h) => {
    const log = logger.start("user:api:skipForNow")
    try {
        request.payload.userInfo = request.userInfo
        const data = await service.skipForNow(request.payload)
        log.end()
        return response.data(h, data)
    } catch (err) {
        log.error(err)
        log.end()
        return response.failure(h, err.message)
    }
}
const updateProfileStepDoctor2 = async (request, h) => {
    const log = logger.start("user:api:updateProfileStepDoctor2")
    try {
        if (request.userInfo.userRole == 2) {
            throw new Error("You are not authorised")
        }
        request.payload.userInfo = request.userInfo
        const data = await service.updateProfileStepDoctor2(request.payload)
        log.end()
        return response.data(h, mapper.toModel(data))
    } catch (err) {
        log.error(err)
        log.end()
        return response.failure(h, err.message)
    }
}
const searchDoctors = async (request, h) => {
    const log = logger.start("user:api:searchDoctors")
    try {
        request.payload.userInfo = request.userInfo
        const data = await service.searchDoctors(request.payload)
        log.end()
        return response.paged(h, data, data.total)
    } catch (err) {
        log.error(err)
        log.end()
        return response.failure(h, err.message)
    }
}
const getProfileStepsPatient = async (request, h) => {
    const log = logger.start("user:api:getProfileStepsPatient")
    try {
        request.query.userInfo = request.userInfo
        const data = await service.getProfileStepsPatient(request.query)
        log.end()
        return response.data(h, data)
    } catch (err) {
        log.error(err)
        log.end()
        return response.failure(h, err.message)
    }
}

const updateFamily = async (request, h) => {
    const log = logger.start("user:api:updateFamily")
    try {
        request.payload.userInfo = request.userInfo
        const data = await service.updateFamily(request.payload)
        log.end()
        return response.data(h, data)
    } catch (err) {
        log.error(err)
        log.end()
        return response.failure(h, err.message)
    }
}

const fetchDoctorDetails = async (request, h) => {
    const log = logger.start("user:api:fetchDoctorDetails")
    try {
        const data = await service.fetchDoctorDetails(request.query)
        log.end()
        return response.data(h, data)
    } catch (err) {
        log.error(err)
        log.end()
        return response.failure(h, err.message)
    }
}

const fetchProfessionalDetails = async (request, h) => {
    const log = logger.start("user:api:fetchProfessionalDetails")
    try {
        request.query.userInfo = request.userInfo
        const data = await service.fetchProfessionalDetails(request.query)
        log.end()
        return response.data(h, data)
    } catch (err) {
        log.error(err)
        log.end()
        return response.failure(h, err.message)
    }
}

const fetchAllRatingReview = async (request, h) => {
    try {
        request.query.userInfo = request.userInfo
        const data = await service.fetchAllRatingReview(request.query)
        return response.paged(h, data, data.totalCount)
    } catch (err) {
        log.error(err)
        return response.failure(h, err.message)
    }
}

const addCorrespondence = async (request, h) => {
    try {
        request.payload.userInfo = request.userInfo
        const data = await service.addCorrespondence(request.payload)
        return response.success(h, data)
    } catch (err) {

        return response.failure(h, err.message)
    }
}

const deleteUserAccount = async (request, h) => {

    try {
        const data = await service.deleteUserAccount(request.userInfo)
        return response.success(h, data)
    } catch (err) {

        return response.failure(h, err.message)
    }

}

const rejectApproveDoctorProfile = async (request, h) => {

    try {
        const data = await service.rejectApproveDoctorProfile(request.payload)
        return response.success(h, data)
    } catch (err) {

        return response.failure(h, err.message)
    }
}

const checkDoctorProfileStatus = async (request, h) => {
    try {
        const data = await service.checkDoctorProfileStatus(request.userInfo)
        return response.success(h, data)
    } catch (err) {

        return response.failure(h, err.message)
    }
}

const fetchActivityLog = async (request, h) => {
    try {
        const data = await service.fetchActivityLog(request.userInfo)
        return response.success(h, data)
    } catch (err) {

        return response.failure(h, err.message)
    }
}

const fetchDoctorDashboard = async (request, h) => {
    try {
        const data = await service.fetchDoctorDashboard(request.userInfo)
        return response.success(h, data)
    } catch (err) {

        return response.failure(sim, err.message)
    }
}

const fetchCalendar = async (request, h) => {
    try {
        request.query.userInfo=request.userInfo
        const data = await service.fetchCalendar(request.query)
        return response.success(h, data)
    } catch (err) {

        return response.failure(h, err.message)
    }
}


exports.signUp = signUp
exports.checkEmailExists = checkEmailExists
exports.login = login
exports.verifyEmail = verifyEmail
exports.logout = logout
exports.setNewPassword = setNewPassword
exports.resetPasswordToken = resetPasswordToken
exports.verifyResetPasswordToken = verifyResetPasswordToken
exports.forgotPassword = forgotPassword
exports.changePassword = changePassword
exports.resendEmailVerificationLink = resendEmailVerificationLink
exports.updateProfileStep1 = updateProfileStep1
exports.verifyOtp = verifyOtp
exports.resendOtp = resendOtp
exports.addFamilyMembers = addFamilyMembers
exports.skipForNow = skipForNow
exports.updateProfileStepDoctor2 = updateProfileStepDoctor2
exports.searchDoctors = searchDoctors
exports.getProfileStepsPatient = getProfileStepsPatient
exports.updateFamily = updateFamily
exports.fetchDoctorDetails = fetchDoctorDetails
exports.fetchProfessionalDetails = fetchProfessionalDetails
exports.fetchAllRatingReview = fetchAllRatingReview
exports.addCorrespondence = addCorrespondence
exports.verifySecondaryEmail = verifySecondaryEmail
exports.resendSecondaryEmailLink = resendSecondaryEmailLink
exports.deleteUserAccount = deleteUserAccount
exports.rejectApproveDoctorProfile = rejectApproveDoctorProfile
exports.checkDoctorProfileStatus = checkDoctorProfileStatus
exports.fetchActivityLog = fetchActivityLog
exports.fetchDoctorDashboard = fetchDoctorDashboard
exports.fetchCalendar = fetchCalendar