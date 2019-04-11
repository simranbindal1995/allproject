/**
author : Simran
created_on : 12 Nov 2018
**/
'use strict'
const api = require('../api')
const specs = require('../specs')

module.exports = [{
        method: 'POST',
        path: '/api/users/signUp',
        options: specs.signUp,
        handler: api.signUp
    }, {
        method: 'POST',
        path: '/api/users/login',
        options: specs.login,
        handler: api.login
    }, {
        method: 'GET',
        path: '/api/users/email/verify',
        options: specs.verifyEmail,
        handler: api.verifyEmail
    }, {
        method: 'POST',
        path: '/api/users/checkEmailExists',
        options: specs.checkEmailExists,
        handler: api.checkEmailExists
    }, {
        method: 'POST',
        path: '/api/users/forgotPassword',
        options: specs.forgotPassword,
        handler: api.forgotPassword
    }, {
        method: 'GET',
        path: '/api/users/verifyResetPasswordToken',
        options: specs.verifyResetPasswordToken,
        handler: api.verifyResetPasswordToken
    }, {
        method: 'GET',
        path: '/api/users/resetPasswordToken',
        options: specs.resetPasswordToken,
        handler: api.resetPasswordToken
    }, {
        method: 'POST',
        path: '/api/users/setNewPassword',
        options: specs.setNewPassword,
        handler: api.setNewPassword
    }, {
        method: 'POST',
        path: '/api/users/resendEmailVerificationLink',
        options: specs.resendEmailVerificationLink,
        handler: api.resendEmailVerificationLink
    }, {
        method: 'POST',
        path: '/api/users/logout',
        options: specs.logout,
        handler: api.logout
    }, {
        method: 'POST',
        path: '/api/users/changePassword',
        options: specs.changePassword,
        handler: api.changePassword
    }, {
        method: 'POST',
        path: '/api/users/updateProfileStep-1',
        options: specs.updateProfileStep1,
        handler: api.updateProfileStep1
    }, {
        method: 'POST',
        path: '/api/users/verifyOtp',
        options: specs.verifyOtp,
        handler: api.verifyOtp
    }, {
        method: 'POST',
        path: '/api/users/resendOtp',
        options: specs.resendOtp,
        handler: api.resendOtp
    }, {
        method: 'POST',
        path: '/api/users/addFamilyMembers',
        options: specs.addFamilyMembers,
        handler: api.addFamilyMembers
    }, {
        method: 'POST',
        path: '/api/users/skipForNow',
        options: specs.skipForNow,
        handler: api.skipForNow
    },
    {
        method: 'POST',
        path: '/api/users/updateProfileStepDoctor-2',
        options: specs.updateProfileStepDoctor2,
        handler: api.updateProfileStepDoctor2
    }, {
        method: 'POST',
        path: '/api/users/searchDoctors',
        options: specs.searchDoctors,
        handler: api.searchDoctors
    }, {
        method: 'GET',
        path: '/api/users/getProfileStepsPatient',
        options: specs.getProfileStepsPatient,
        handler: api.getProfileStepsPatient
    }, {
        method: 'PUT',
        path: '/api/users/updateFamily',
        options: specs.updateFamily,
        handler: api.updateFamily
    }, {
        method: 'GET',
        path: '/api/users/fetchDoctorDetails',
        options: specs.fetchDoctorDetails,
        handler: api.fetchDoctorDetails
    }, {
        method: 'GET',
        path: '/api/users/fetchProfessionalDetails',
        options: specs.fetchProfessionalDetails,
        handler: api.fetchProfessionalDetails
    },
    {
        method: 'GET',
        path: '/api/users/fetchAllRatingReview',
        options: specs.fetchAllRatingReview,
        handler: api.fetchAllRatingReview
    }, {
        method: 'PUT',
        path: '/api/users/addCorrespondence',
        options: specs.addCorrespondence,
        handler: api.addCorrespondence
    }, {
        method: 'GET',
        path: '/api/users/secondaryEmail/verify',
        options: specs.verifySecondaryEmail,
        handler: api.verifySecondaryEmail
    }, {
        method: 'POST',
        path: '/api/users/resendSecondaryEmailLink',
        options: specs.resendSecondaryEmailLink,
        handler: api.resendSecondaryEmailLink
    }, {
        method: 'DELETE',
        path: '/api/users/deleteUserAccount',
        options: specs.deleteUserAccount,
        handler: api.deleteUserAccount
    }, {
        method: 'DELETE',
        path: '/api/admin/rejectApproveDoctorProfile',
        options: specs.rejectApproveDoctorProfile,
        handler: api.rejectApproveDoctorProfile
    }, {
        method: 'GET',
        path: '/api/admin/checkDoctorProfileStatus',
        options: specs.checkDoctorProfileStatus,
        handler: api.checkDoctorProfileStatus
    }, {
        method: 'GET',
        path: '/api/users/fetchActivityLog',
        options: specs.fetchActivityLog,
        handler: api.fetchActivityLog
    },
    {
        method: 'GET',
        path: '/api/users/fetchDoctorDashboard',
        options: specs.fetchDoctorDashboard,
        handler: api.fetchDoctorDashboard
    },
    {
        method: 'GET',
        path: '/api/users/fetchCalendar',
        options: specs.fetchCalendar,
        handler: api.fetchCalendar
    }

]