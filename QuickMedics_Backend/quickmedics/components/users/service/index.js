'use strict'

const md5 = require('md5')
const _ = require('underscore')

const auth = require('../../../utils/auth')
const fileService = require('../../files/service')
const stripeService = require('../../payments/service')

const jwt = require('jsonwebtoken')
const config = require('config').get('token')

const getUserByEmail = async (emailId) => {
    const log = logger.start(`users:services:getUserByEmail:${emailId}`)

    const user = await db.users.findOne({ $or: [{ email: emailId }, { secondaryEmails: { $in: [emailId] } }], isDeleted: false })

    log.end()

    return user
}

const signUp = async (params) => {
    const log = logger.start('users:service:signUp')

    const oldUser = await getUserByEmail(params.email)

    if (oldUser) {
        log.end()
        throw new Error('Email already registered with us.')
    }

    const userModel = {
        userRole: params.userRole,
        firstName: params.firstName,
        lastName: params.lastName,
        email: params.email,
        password: md5(params.password),
        userRegisterationTime: moment().unix()
    }

    const user = await new db.users(userModel)

    user.emailVerifyToken = auth.randomToken(user.id)
    const x = await user.save()

    offline.queue('user', 'sign-up', {
        id: user.id
    }, {})

    stripeService.createCustomer(x)

    log.end()

    return 'Follow the link in the verification email to start with QuickMedics.'
}

const login = async (params) => {
    const log = logger.start('users:service:login')

    const user = await getUserByEmail(params.email)

    if ((!user) || (user && user.isDeleted)) {
        throw new Error('Invalid credentials')
    }

    if (user && user.isSuspended) {
        throw new Error('Your account is suspended. To login, please contact your administrator.')
    }

    if (user && !user.isEmailVerified) {
        return `Your email address ${user.email} has not been verified. Please check your inbox, then follow the instructions.`
    }

    var isValid = await db.users.findOne({ email: params.email, password: md5(params.password), isDeleted: false })

    if (!isValid || isValid == null)
        throw new Error('Invalid credentials')

    const obj = {
        timeStamp: moment().unix(),
        accessToken: auth.createToken(isValid._id),
        timeZone: params.timeZone
    }

    await db.users.findOneAndUpdate({ email: params.email }, { deviceDetails: obj })
    log.end()

    user.totalUnReadNtfcnCount = await db.notifications.count({ receiverId: isValid._id, isRead: false, isDeleted: false })
    user.totalUnReadMessageCount = await db.chats.findOne({ isDeleted: false, isRead: false, receiverId: isValid._id })

    user.token = obj.accessToken
    return user
}

const verifyEmail = async (token) => {
    const log = logger.start('users:service:verifyEmail')

    const user = await db.users.findOne({
        emailVerifyToken: token,
        isDeleted: false
    })

    if (!user) {
        throw new Error('Link expired.')
    }

    await db.users.findOneAndUpdate({ emailVerifyToken: token, isDeleted: false }, { accountVerificationTime: moment().unix(), isEmailVerified: true, $unset: { emailVerifyToken: 1 } })
}

const verifySecondaryEmail = async (params) => {
    const log = logger.start('users:service:verifySecondaryEmail')

    const check = await jwt.verify(params.token, config.secret)
    if (!check) throw new Error("Sorry ! The link has expired")

    const decoded = await jwt.decode(params.token)

    const user = await db.users.findOneAndUpdate({ emailVerifyToken: params.token }, {
        email: decoded.newEmail,
        $unset: { emailVerifyToken: 1 },
        $addToSet: { secondaryEmails: decoded.oldEmail }
    }, { new: true })
    if (!user) {
        throw new Error('Link expired.')
    }

    await db.users.findOneAndUpdate({ email: user.email }, { $pull: { secondaryEmails: decoded.newEmail }, isSecondaryEmailVerified: true }, { new: true })


    return "Email verified successfully"
    // await db.users.findOneAndUpdate({ emailVerifyToken: token, isDeleted: false, email: user. }, { accountVerificationTime: moment().unix(), isEmailVerified: true, $unset: { emailVerifyToken: 1 } })
}

const checkEmailExists = async (params) => {

    const user = await db.users.findOne({ $or: [{ email: params.email }, { secondaryEmails: { $in: [params.email] } }], isDeleted: false })

    if (!user)
        return 320;
    // throw new Error("Email not exists")

    if (user && !user.isEmailVerified) throw new Error(`Your email address has not been verified. Please check your inbox, then follow the instructions.`)

    return "Email exists"

}

const forgotPassword = async (params) => {
    const log = logger.start('users:service:forgotPassword')

    const user = await getUserByEmail(params.email)

    if (!user)
        throw new Error('This email is not registered with us.')

    if (!user.isEmailVerified)
        throw new Error(`Your email address ${user.email} has not been verified. Please check your inbox, then follow the instructions.`)

    user.resetPasswordToken = auth.randomToken(user.id)
    await user.save()

    offline.queue('user', 'forgot-password', {
        id: user.id
    }, {})

    log.end()

    return 'Please check your email to update your password.'
}

const resetPasswordToken = async (token) => {
    const log = logger.start('users:service:resetPasswordToken')

    const user = await db.users.findOne({
        resetPasswordToken: token
    })

    if (!user) {
        throw new Error('Link expired.')
    }
    log.end()
    return 'user verified to password update'
}

const verifyResetPasswordToken = async (token) => {

    const log = logger.start('users:service:verifyResetPasswordToken')

    const user = await db.users.findOne({
        resetPasswordToken: token
    })

    if (!user) throw new Error('Link expired.')
    log.end()
    return 'Valid link'
}

const logout = async (params) => {
    const log = logger.start('users:service:logout')

    await db.users.update({
        "deviceDetails": { "$elemMatch": { "accessToken": params["x-logintoken"] } }
    }, {
        $pull: { "deviceDetails": { accessToken: params["x-logintoken"] } }
    })

    log.end()

    return 'Logged out successfully.'
}

const resendEmailVerificationLink = async (email) => {
    const log = logger.start('users:service:resendEmailVerificationLink')

    const user = await getUserByEmail(email)

    if (!user) throw new Error('Email not registered with QuickMedics')
    if (user.isEmailVerified) throw new Error(`Email ${user.email} is already verified , Please login !`)

    user.emailVerifyToken = auth.randomToken(user.id)
    var x = await user.save()
    offline.queue('user', 'sign-up', {
        id: user.id
    }, {})

    log.end()

    return `A link to verify the email has been sent to ${user.email}. Please check your inbox, then follow the instructions.`
}

const resendSecondaryEmailLink = async (params) => {

    if (params.isSecondaryEmailVerified == true)
        throw new Error("Your email is already verified")

    params.emailVerifyToken = jwt.sign({
        oldEmail: params.email,
        newEmail: params.secondaryEmails[params.secondaryEmails.length - 1]
    }, config.secret)

    await db.users.findOneAndUpdate({ _id: params._id }, { emailVerifyToken: params.emailVerifyToken }, { new: true })

    offline.queue('user', 'change-email', {
        id: params._id
    }, {})

}

const changePassword = async (params) => {
    const log = logger.start('user:service:changePassword')

    if (params.userId.password.toString() == md5(params.newPassword).toString()) {
        throw new Error("New password must be different from the old password")
    }

    var user = await db.users.findOneAndUpdate({ _id: params.userId._id, password: md5(params.oldPassword) }, { password: md5(params.newPassword), lastProfileUpdatedTime: moment().unix() })

    if (!user) throw new Error("Invalid old password")

    return 'Password changed successfully'
}


const setNewPassword = async (params) => {
    const log = logger.start('user:service:setNewPassword')

    const user = await db.users.findOne({
        resetPasswordToken: params.resetPasswordToken
    })
    if (!user) throw new Error('Link expired.')

    await db.users.findOneAndUpdate({ _id: user._id }, { password: md5(params.password), $unset: { resetPasswordToken: 1 }, lastProfileUpdatedTime: moment().unix() })
    log.end()
    return 'Password updated successfully.'
}

const updateProfileStep1 = async (params) => {
    const log = logger.start("service:updateProfileStep1")

    if (params.mobileNumber != "" && params.mobileNumber != params.userInfo.mobileNumber) {
        console.log('if if of check mobileNumber')
        await checkMobileNumberExists(params)
        const otp = await auth.generateOtp();
        params.otp = otp
        if (params.isUpdate == true) {
            params.secondaryMobileNumber = params.mobileNumber
            params.isSecondaryPhoneVerified = false
            delete params.mobileNumber
        }
        // SEND SMS TO USER (TO BE DONE)
    }

    if (params.email && params.email != "" && params.email.toString() != params.userInfo.email.toString()) {
        params.sendEmail = true
        const check = await getUserByEmail(params.email)
        if (check) throw new Error("Email already registered with us.")

        params.$addToSet = { secondaryEmails: params.email }
        params.isSecondaryEmailVerified = false
        params.emailVerifyToken = jwt.sign({
            oldEmail: params.userInfo.email,
            newEmail: params.email
        }, config.secret)

        delete params.email
    }

    if (params.profilePicId && params.profilePicId != "") {
        params.imageId = params.profilePicId
        const record = await fileService.moveFileFromTempToCdn(params)
        params.profilePic = record._id
    }


    params.isUpdate ? null : params.profileStepCompleted = 1;
    params.lastProfileUpdatedTime = moment().unix()
    const data = await db.users.findOneAndUpdate({ _id: params.userInfo._id }, params, { new: true })
    if (params.sendEmail == true) {
        offline.queue('user', 'change-email', {
            id: params.userInfo._id
        }, {})
    }
    return data;
}

const checkMobileNumberExists = async (params) => {
    logger.start("user:service:checkMobileNumberExists")
    const check = await db.users.findOne({ countryCode: params.countryCode, mobileNumber: params.mobileNumber, isDeleted: false })

    if (check != null && params.userInfo._id.toString() != check._id.toString()) {
        throw new Error("Phone number already registered with us.")
    }
    return true;
}

const verifyOtp = async (params) => {

    logger.start("users:services:verifyOtp")
    let dataToSet = { $unset: { otp: 1, secondaryMobileNumber: 1 } }

    if (params.verifySecondary == true) {
        dataToSet.mobileNumber = params.userId.secondaryMobileNumber
        dataToSet.isSecondaryPhoneVerified = true
    }

    const check = await db.users.findOneAndUpdate({ _id: params.userId._id, otp: params.otp }, dataToSet, { new: true })
    if (check == null) {
        throw new Error("Invalid OTP")
    }
    return "Otp verified successfully";
}

const resendOtp = async (params) => {
    logger.start("users:services:resendotp")

    const otp = await auth.generateOtp();
    params.otp = otp
    // SEND SMS TO USER (TO BE DONE)

    const data = await db.users.findOneAndUpdate({ _id: params.userInfo._id }, { otp: otp }, { new: true })
    return otp
}

const addFamilyMembers = async (params) => {
    logger.start("users:services:addFamilyMembers")

    for (var i = 0; i < params.family.length; i++) {
        let relationArr = [],
            correspondenceArr = []
        if (params.family[i].relationProofId.length > 0) {
            for (let j = 0; j < params.family[i].relationProofId.length; j++) {
                params.imageId = params.family[i].relationProofId[j]
                const record = await fileService.moveFileFromTempToCdn(params)
                relationArr.push(record._id)
            }
        }
        if (params.family[i].correspondenceId.length > 0) {
            for (let j = 0; j < params.family[i].correspondenceId.length; j++) {
                params.imageId = params.family[i].correspondenceId[j]
                const record = await fileService.moveFileFromTempToCdn(params)
                correspondenceArr.push(record._id)
            }
        }
        params.relationProofId = relationArr
        params.correspondenceId = correspondenceArr
    }

    const data = await db.users.findOneAndUpdate({ _id: params.userInfo._id }, { profileStepCompleted: 3, $push: { family: params.family }, profileCompletionTime: moment().unix(), lastProfileUpdatedTime: moment().unix() }, { new: true })
    return data.family;
}

const skipForNow = async (params) => {
    logger.start("users:services:skipForNow")

    await db.users.findOneAndUpdate({ _id: params.userInfo._id }, { profileStepCompleted: params.stepNumber }, { new: true })
    return params.stepNumber;
}

const updateProfileStepDoctor2 = async (params) => {
    logger.start("users:services:updateProfileStepDoctor2")

    if (params.identityProof && params.identityProof != "") {
        params.imageId = params.identityProof
        const record = await fileService.moveFileFromTempToCdn(params)
        params.identityProof = record._id
    }
    if (params.signature && params.signature != "") {
        params.imageId = params.signature
        const record = await fileService.moveFileFromTempToCdn(params)
        params.signature = record._id
    }
    if (params.documents.length > 0) {
        let docArr = []
        for (var i = 0; i < params.documents.length; i++) {
            params.imageId = params.documents[i]
            const record = await fileService.moveFileFromTempToCdn(params)
            docArr.push(record._id)
        }
        params.documents = docArr
    }

    const obj = {
        gmcNumber: params.gmcNumber,
        yearsOfExp: params.yearsOfExp,
        $push: { education: params.education, documents: params.documents, specialisationId: params.specialisationId },
        identityProof: params.identityProof,
        signature: params.signature,
        profileStepCompleted: 2,
        lastProfileUpdatedTime: moment().unix()
    }

    const data = await db.users.findOneAndUpdate({ _id: params.userInfo._id }, obj, { new: true })
    return data;
}

const searchDoctors = async (params) => {
    logger.start("users:services:searchDoctors")
    let criteria = {}
    if (params.dayNumber && params.dayNumber != "") {
        let drAvailable = await db.availabilities.find({ dayNumber: params.dayNumber, isExpired: false, isDeleted: false })
        drAvailable = _.pluck(drAvailable, 'userId');
        // isApproved: true,
        criteria = { _id: { $in: drAvailable }, isDeleted: false, userRole: "1" }
    } else criteria = { isDeleted: false, userRole: "1" }
    params.name && params.name != "" ? criteria.$or = [{ firstName: new RegExp(params.name) }, { lastName: new RegExp(params.name) }, { middleName: new RegExp(params.name) }] : null
    params.specialisationId && params.specialisationId != "" ? criteria.specialisationId = params.specialisationId : null

    const data = await db.users.find(criteria, { firstName: 1, lastName: 1, middleName: 1, profilePic: 1, "rating.averageRating": 1, specialisationId: 1 }, { sort: { "rating.averageRating": -1 }, skip: params.skip || 0, limit: params.limit || 10 })
        .populate({ path: "specialisationId", select: "name" })
    data.total = await db.users.count(criteria)
    return data;

}
const getProfileStepsPatient = async (params) => {

    switch (params.profileStep) {

        case 1:
            let email
            if (params.userInfo.isSecondaryEmailVerified == true) {
                email = params.userInfo.email
            } else email = params.userInfo.email = params.userInfo.secondaryEmails[params.userInfo.secondaryEmails.length - 1]

            const info = {
                email: email, //params.userInfo.secondaryEmails.length > 0 ? params.userInfo.secondaryEmails[params.userInfo.secondaryEmails.length - 1] : params.userInfo.email,
                firstName: params.userInfo.firstName || "",
                lastName: params.userInfo.lastName || "",
                middleName: params.userInfo.middleName || "",
                gender: params.userInfo.gender || "",
                dob: params.userInfo.dob || "",
                fullAddress: params.userInfo.fullAddress || "",
                mobileNumber: params.userInfo.secondaryMobileNumber ? params.userInfo.secondaryMobileNumber : params.userInfo.mobileNumber,
                countryCode: params.userInfo.countryCode || "",
                isPhoneNumberConfirmed: params.userInfo.isPhoneNumberConfirmed,
                isSecondaryEmailVerified: params.userInfo.isSecondaryEmailVerified == true ? true : false,
                isSecondaryPhoneVerified: params.userInfo.isSecondaryPhoneVerified == true ? true : false,
                profilePicId: params.userInfo.profilePic || "",
                description: params.userInfo.description || ""
            }
            return info;
            break;

        case 2:
            const files = await db.files.find({ _id: { $in: params.userInfo.correspondence }, type: 2, isDeleted: false, tmpFile: false }, { fileExtension: 1, fileOriginalName: 1 })
            return files;
            break;

        case 3:
            let family
            if (!params.patientId || params.patientId == "")
                family = params.userInfo.family
            else {
                family = await db.users.findOne({ _id: params.patientId }, { family: 1 })
            }
            return family;
            break;
    }

}

const updateFamily = async (params) => {
    logger.start("users:service:updateFamily")
    const data = await db.users.findOneAndUpdate({ "_id": params.userInfo._id, "family._id": params.familyId }, { $set: { "family.$.memberName": params.memberName, "family.$.relation": params.relation, "family.$.correspondenceId": params.correspondenceId }, lastProfileUpdatedTime: moment().unix() });

    return data;
}

const fetchDoctorDetails = async (params) => {
    logger.start("users:service:fetchDoctorDetails")

    let populate = [{
        path: "specialisationId",
        select: "name"
    }, {
        path: "education.degree",
        select: "name"
    }]
    const data = await db.users.findOne({ _id: params.doctorId }, { "family.relation": 1, profilePic: 1, description: 1, "rating.averageRating": 1, consultationFee: 1, firstName: 1, lastName: 1, middleName: 1, specialisationId: 1, yearsOfExp: 1, "education.degree": 1 }).populate(populate);
    return data;
}

const fetchProfessionalDetails = async (params) => {
    const data = await db.users.findOne({ _id: params.userInfo._id }, { specialisationId: 1, gmcNumber: 1, yearsOfExp: 1, identityProof: 1, signature: 1, documents: 1, education: 1 })
        .populate({ path: "education.degree", select: "name" })
        .populate({ path: "specialisationId", select: "name" })
        .populate({ path: "documents", select: "fileOriginalName" })

    return data;
}
const fetchAllRatingReview = async (params) => {
    logger.start("users:services:fetchAllRatingReview")

    const data = await db.bookings.find({ doctorId: params.doctorId, review: { $exists: true } }, { rating: 1, review: 1, patientId: 1, ratedOn: 1 }, { sort: { ratedOn: -1 }, skip: params.skip || 0, limit: params.limit || 10 })
        .populate({ path: "patientId", select: "firstName lastName" })

    data.totalCount = await db.bookings.count({ doctorId: params.doctorId, review: { $exists: true } })

    return data;
}

const addCorrespondence = async (params) => {

    params.imageId = params.fileId
    const record = await fileService.moveFileFromTempToCdn(params)

    await db.users.findOneAndUpdate({ _id: params.userInfo._id }, { $push: { correspondence: params.fileId }, lastProfileUpdatedTime: moment().unix() })

    return "File uploaded successfully"

}

const deleteUserAccount = async (params) => {

    await db.users.findOneAndUpdate({ _id: params._id }, {
        isDeleted: true,
        firstName: "XXXXX",
        lastName: "XXXXX",
        email: "XXXX@XXXX.XXXX",
        mobileNumber: 0,
        accountDeletionTime: moment().unix(),
        $unset: { profilePic: 1 }
    })

    return "Account Deleted successfully"

}

const rejectApproveDoctorProfile = async (params) => {

    await db.users.findOneAndUpdate({ _id: params.doctorId }, params)

    return "Updated successfully"

}

const checkDoctorProfileStatus = async (params) => {

    const data = await db.users.findOne({ _id: params._id }, { isApproved: 1, isRejected: 1 })

    return data;

}

const fetchActivityLog = async (params) => {

    let data = await db.users.findOne({ _id: params._id }, { userRegisterationTime: 1, profileCompletionTime: 1, lastProfileUpdatedTime: 1, accountVerificationTime: 1 }, { lean: true })
    const staticData = await db.staticPages.find({}, { updatedAt: 1, contentType: 1 })

    for (var i = 0; i < staticData.length; i++) {

        if (staticData[i].contentType == 6)
            data.termsConditionsTime = staticData[i].updatedAt

        if (staticData[i].contentType == 3)
            data.privacyPolicyTime = staticData[i].updatedAt

        if (staticData[i].contentType == 8)
            data.userConsent = staticData[i].updatedAt

    }
    return data;
}


const fetchDoctorDashboard = async (params) => {
    var obj = {}
    //Total Earnings till date
    const all = await db.invoices.aggregate()
        .match({ doctorId: params._id, transactionType: "stripeToBank", requestStatus: "completed" })
        .group({ _id: "$transactionType", "totalAmount": { $sum: "$totalAmountToTransfer" } })

    obj.totalEaring = all.length > 0 ? Math.round(all[0].totalAmount) : 0

    //total slots booked till date
    const slotsBooked = await db.bookings.aggregate()
        .match({ doctorId: params._id, status: "paymentDone" })
        .group({ _id: "$status", "totalSlotsBooked": { $sum: "$totalSlotsBooked" } })

    obj.totalSlotsBooked = slotsBooked.length > 0 ? Math.round(slotsBooked[0].totalSlotsBooked) : 0

    //total hours worked
    obj.totalHoursWorked = obj.totalSlotsBooked * 0.25 //each slot is of 15 mins thus coverted 15mins to hours

    //get month of first booking to get work average monthly and weeklystatus: { $ne: "expired" }
    let startDate = await db.bookings.findOne({ doctorId: params._id, }, { "bookedAt.slotStartDate": 1 }, { sort: { "bookedAt.slotStartDate": 1 } })
    startDate = startDate ? startDate.bookedAt.slotStartDate : moment().startOf("day").unix()
    const endDate = moment().endOf("day").unix()

    //get number of months,weeks bet start and end date
    var totalMonths = moment(endDate * 1000).diff(moment(startDate * 1000), 'months')
    var totalWeeks = moment(endDate * 1000).diff(moment(startDate * 1000), 'weeks')

    if (totalMonths == 0) totalMonths = 1
    if (totalWeeks == 0) totalWeeks = 1


    obj.AverageSlotsMonthly = Math.round(obj.totalSlotsBooked / totalMonths)
    obj.AverageSlotsWeekly = Math.round(obj.totalSlotsBooked / totalWeeks)

    obj.AverageHoursMonthly = Math.round(obj.totalHoursWorked / totalMonths)
    obj.AverageHoursWeekly = Math.round(obj.totalHoursWorked / totalWeeks)

    return obj;

}

const fetchCalendar = async (params) => {
    let startDate, endDate
    var arr = []
    // 1 -day,2-week,3-month
    if (params.day == 1) {
        startDate = moment().startOf('day').unix()
        endDate = moment().endOf("day").unix()
    }
    if (params.day == 2) {
        startDate = moment().startOf('week').unix()
        endDate = moment().endOf("week").unix()
    }
    if (params.day == 3) {
        startDate = moment().startOf('month').unix()
        endDate = moment().endOf("month").unix()
    }

    console.log(startDate, endDate)

    let data = await db.bookings.find({ doctorId: params.userInfo._id, "bookedAt.slotStartDate": { $gte: startDate }, "bookedAt.slotEndDate": { $lte: endDate } }, {}, { sort: { "bookedAt.slotStartDate": -1 } })
        .populate({ path: "patientId", select: "firstName lastName" })

    for (var i = 0; i < data.length; i++) {
        arr.push({
            title: data[i].patientId.firstName,
            startDate: data[i].bookedAt.slotStartDate,
            endDate: data[i].bookedAt.slotEndDate
        })
    }

    return arr;

}



exports.login = login
exports.checkEmailExists = checkEmailExists
exports.checkMobileNumberExists = checkMobileNumberExists
exports.logout = logout
exports.signUp = signUp
exports.verifyEmail = verifyEmail
exports.setNewPassword = setNewPassword
exports.resetPasswordToken = resetPasswordToken
exports.getUserByEmail = getUserByEmail
exports.forgotPassword = forgotPassword
exports.changePassword = changePassword
exports.verifyResetPasswordToken = verifyResetPasswordToken
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