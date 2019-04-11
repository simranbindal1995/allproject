'use strict'
const validator = require('../validator')
const context = require('../../../utils/context-builder')

module.exports = {
    signUp: {
        description: 'User signUp',
        notes: 'User signUp.send userRole - 1 for doctor , 2 for patient',
        tags: ['api', 'users'],
        plugins: {
            'hapi-swagger': {
                responses: {
                    200: {
                        description: 'Example of response model in return to success request',
                        schema: validator.success
                    },
                    320: {
                        description: 'Example of response model in return to failure request',
                        schema: validator.failure
                    }
                }
            }
        },
        validate: {
            payload: validator.signUp.payload,
            failAction: response.failAction
        }
    },
    login: {
        description: 'User manual login',
        notes: 'User login ',
        tags: ['api', 'users'],
        plugins: {
            'hapi-swagger': {
                responses: {
                    200: {
                        description: 'Example of response model in return to success request',
                        headers: {
                            schema: {
                                'x-access-token': 'string',
                                description: 'x-logintoken is found in response headers'
                            }
                        },
                        schema: validator.accessGranted
                    },
                    406: {
                        description: 'UnAuthorized User',
                        schema: validator.accessDenied
                    }
                }
            }
        },
        validate: {
            payload: validator.login.payload,
            failAction: response.accessDeniedAction
        }
    },
    verifyEmail: {
        description: 'Verify User Email Id',
        notes: 'User Verification',
        tags: ['api', 'users'],
        validate: {
            query: validator.verifyEmail.query,
            failAction: response.failAction
        }
    },

    checkEmailExists: {
        description: 'Check if email exists on login/signup',
        notes: 'check email',
        tags: ['api', 'users'],
        plugins: {
            'hapi-swagger': {
                responses: {
                    200: {
                        description: 'Example of response model in return to success request',
                        schema: validator.success
                    },
                    320: {
                        description: 'Example of response model in return to failure request',
                        schema: validator.failure
                    }
                }
            }
        },
        validate: {
            payload: validator.checkEmailExists.payload,
            failAction: response.failAction
        }
    },

    forgotPassword: {
        description: 'Forgot Password Api',
        notes: 'Verify email to get reset password Details',
        tags: ['api', 'users'],
        plugins: {
            'hapi-swagger': {
                responses: {
                    200: {
                        description: 'Example of response model in return to success request',
                        schema: validator.success
                    },
                    320: {
                        description: 'Example of response model in return to failure request',
                        schema: validator.failure
                    },
                    406: {
                        description: 'invalid token/user',
                        schema: validator.accessDenied
                    }
                }
            }
        },
        validate: {
            payload: validator.forgot.payload,
            failAction: response.failAction
        }
    },

    resendEmailVerificationLink: {
        description: 'User Resend Verification Link',
        notes: 'To get verification link again on your email id',
        tags: ['api', 'users'],
        plugins: {
            'hapi-swagger': {
                responses: {
                    200: {
                        description: 'Example of response model in return to success request',
                        schema: validator.success
                    },
                    320: {
                        description: 'Example of response model in return to failure request',
                        schema: validator.failure
                    },
                    406: {
                        description: 'invalid token/user',
                        schema: validator.accessDenied
                    }
                }
            }
        },
        validate: {
            payload: validator.resendEmailVerificationLink.payload,
            failAction: response.failAction
        }
    },

    resetPasswordToken: {
        description: 'Verify User for password change',
        notes: 'User Verification For password change',
        tags: ['api', 'users'],
        validate: {
            query: validator.verifyResetPasswordToken.query,
            failAction: response.failAction
        }
    },
    verifyResetPasswordToken: {
        description: "Verify user's token for password change",
        notes: 'User token Verification For password change',
        tags: ['api', 'users'],
        validate: {
            query: validator.verifyResetPasswordToken.query,
            failAction: response.failAction
        }
    },

    changePassword: {
        description: 'User Change Password',
        notes: 'Change/Update Own Password',
        tags: ['api', 'users'],
        pre: [{
            method: context.validateToken,
            assign: 'token'
        }],
        plugins: {
            'hapi-swagger': {
                responses: {
                    200: {
                        description: 'Example of response model in return to success request',
                        schema: validator.success
                    },
                    320: {
                        description: 'Example of response model in return to failure request',
                        schema: validator.failure
                    },
                    406: {
                        description: 'invalid token/user',
                        schema: validator.accessDenied
                    }
                }
            }
        },
        validate: {
            payload: validator.changePassword.payload,
            headers: validator.header,
            failAction: response.failAction
        }
    },
    setNewPassword: {
        description: 'User Password Reset',
        notes: 'To reset password via resetPasswordToken',
        tags: ['api', 'users'],
        plugins: {
            'hapi-swagger': {
                responses: {
                    200: {
                        description: 'Example of response model in return to success request',
                        schema: validator.success
                    },
                    320: {
                        description: 'Example of response model in return to failure request',
                        schema: validator.failure
                    }
                }
            }
        },
        validate: {
            payload: validator.setNewPassword.payload,
            failAction: response.failAction
        }
    },
    logout: {
        description: 'User logout',
        notes: 'User log out from system',
        tags: ['api', 'users'],
        plugins: {
            'hapi-swagger': {
                responses: {
                    200: {
                        description: 'Example of response model in return to success request',
                        schema: validator.success
                    },
                    320: {
                        description: 'Example of response model in return to failure request',
                        schema: validator.failure
                    },
                    406: {
                        description: 'invalid token/user',
                        schema: validator.accessDenied
                    }
                }
            }
        },
        pre: [{
            method: context.validateToken,
            assign: 'token'
        }],
        validate: {
            headers: validator.header,
            failAction: response.failAction
        }
    },
    updateProfileStep1: {
        description: 'For saving and updating user basic profile details in step 1',
        notes: 'Use this api both for patient and doctor for add and update profile.For profilePicId first use api files/uploadFile and get a fileId',
        tags: ['api', 'users'],
        plugins: {
            'hapi-swagger': {
                responses: {
                    200: {
                        description: 'Example of response model in return to success request',
                        schema: validator.success
                    },
                    320: {
                        description: 'Example of response model in return to failure request',
                        schema: validator.failure
                    },
                    406: {
                        description: 'invalid token/user',
                        schema: validator.accessDenied
                    }
                }
            }
        },
        pre: [{
            method: context.validateToken,
            assign: 'token'
        }],
        validate: {
            headers: validator.header,
            payload: validator.updateProfileStep1.payload,
            failAction: response.failAction
        }
    },
    verifyOtp: {
        description: 'verify otp',
        notes: 'verifying otp after validating mobile number',
        tags: ['api', 'users'],
        plugins: {
            'hapi-swagger': {
                responses: {
                    200: {
                        description: 'Example of response model in return to success request',
                        schema: validator.success
                    },
                    320: {
                        description: 'Example of response model in return to failure request',
                        schema: validator.failure
                    },
                    406: {
                        description: 'invalid token/user',
                        schema: validator.accessDenied
                    }
                }
            }
        },
        pre: [{
            method: context.validateToken,
            assign: 'token'
        }],
        validate: {
            headers: validator.header,
            payload: validator.verifyOtp.payload,
            failAction: response.failAction
        }
    },
    resendOtp: {
        description: 'resend otp',
        notes: 'resending otp if number not verified',
        tags: ['api', 'users'],
        plugins: {
            'hapi-swagger': {
                responses: {
                    200: {
                        description: 'Example of response model in return to success request',
                        schema: validator.success
                    },
                    320: {
                        description: 'Example of response model in return to failure request',
                        schema: validator.failure
                    },
                    406: {
                        description: 'invalid token/user',
                        schema: validator.accessDenied
                    }
                }
            }
        },
        pre: [{
            method: context.validateToken,
            assign: 'token'
        }],
        validate: {
            headers: validator.header,
            failAction: response.failAction
        }
    },
    addFamilyMembers: {
        description: 'Add family members -patient step 3',
        notes: 'step 3 for patients.Do not send old data(already added relations) in this api',
        tags: ['api', 'users'],
        plugins: {
            'hapi-swagger': {
                responses: {
                    200: {
                        description: 'Example of response model in return to success request',
                        schema: validator.success
                    },
                    320: {
                        description: 'Example of response model in return to failure request',
                        schema: validator.failure
                    },
                    406: {
                        description: 'invalid token/user',
                        schema: validator.accessDenied
                    }
                }
            }
        },
        pre: [{
            method: context.validateToken,
            assign: 'token'
        }],
        validate: {
            headers: validator.header,
            payload: validator.addFamilyMembers.payload,
            failAction: response.failAction
        }
    },
    skipForNow: {
        description: 'To skip any non mandatory profile step',
        notes: 'send the profile step number that is being skipped',
        tags: ['api', 'users'],
        plugins: {
            'hapi-swagger': {
                responses: {
                    200: {
                        description: 'Example of response model in return to success request',
                        schema: validator.success
                    },
                    320: {
                        description: 'Example of response model in return to failure request',
                        schema: validator.failure
                    },
                    406: {
                        description: 'invalid token/user',
                        schema: validator.accessDenied
                    }
                }
            }
        },
        pre: [{
            method: context.validateToken,
            assign: 'token'
        }],
        validate: {
            headers: validator.header,
            payload: validator.skipForNow.payload,
            failAction: response.failAction
        }
    },
    updateProfileStepDoctor2: {
        description: 'Update doctors profile step 2(mandatory)',
        notes: 'Doctos professional details api.Max 20 docs can be uploaded',
        tags: ['api', 'users'],
        plugins: {
            'hapi-swagger': {
                responses: {
                    200: {
                        description: 'Example of response model in return to success request',
                        schema: validator.success
                    },
                    320: {
                        description: 'Example of response model in return to failure request',
                        schema: validator.failure
                    },
                    406: {
                        description: 'invalid token/user',
                        schema: validator.accessDenied
                    }
                }
            }
        },
        pre: [{
            method: context.validateToken,
            assign: 'token'
        }],
        validate: {
            headers: validator.header,
            payload: validator.updateProfileStepDoctor2.payload,
            failAction: response.failAction
        }
    },
    searchDoctors: {
        description: 'To search doctors according to their availability',
        notes: 'Result will be according to availability of that day,ratings,name , specialisation',
        tags: ['api', 'users'],
        plugins: {
            'hapi-swagger': {
                responses: {
                    200: {
                        description: 'Example of response model in return to success request',
                        schema: validator.success
                    },
                    320: {
                        description: 'Example of response model in return to failure request',
                        schema: validator.failure
                    }
                }
            }
        },
        pre: [{
            method: context.validateToken,
            assign: 'token'
        }],
        validate: {
            headers: validator.header,
            payload: validator.searchDoctors.payload,
            failAction: response.failAction
        }
    },
    getProfileStepsPatient: {
        description: 'To get all the profile steps of a patient',
        notes: 'Send the step number to get the data of that particular step.send 1 -fetch personal details,2-my correspondence,3-my family',
        tags: ['api', 'users'],
        plugins: {
            'hapi-swagger': {
                responses: {
                    200: {
                        description: 'Example of response model in return to success request',
                        schema: validator.success
                    },
                    320: {
                        description: 'Example of response model in return to failure request',
                        schema: validator.failure
                    }
                }
            }
        },
        pre: [{
            method: context.validateToken,
            assign: 'token'
        }],
        validate: {
            headers: validator.header,
            query: validator.getProfileStepsPatient.query,
            failAction: response.failAction
        }
    },
    updateFamily: {
        description: 'For updating user family details',
        notes: 'Family .',
        tags: ['api', 'users'],
        plugins: {
            'hapi-swagger': {
                responses: {
                    200: {
                        description: 'Example of response model in return to success request',
                        schema: validator.success
                    },
                    320: {
                        description: 'Example of response model in return to failure request',
                        schema: validator.failure
                    },
                    406: {
                        description: 'invalid token/user',
                        schema: validator.accessDenied
                    }
                }
            }
        },
        pre: [{
            method: context.validateToken,
            assign: 'token'
        }],
        validate: {
            headers: validator.header,
            payload: validator.updateFamily.payload,
            failAction: response.failAction
        }
    },
    fetchDoctorDetails: {
        description: 'Fetch doctor details 1.e. name, specialization, year of practice, degrees, ratings, feePerSlot',
        notes: 'Send doctorid to get details',
        tags: ['api', 'users'],
        plugins: {
            'hapi-swagger': {
                responses: {
                    200: {
                        description: 'Example of response model in return to success request',
                        schema: validator.success
                    },
                    320: {
                        description: 'Example of response model in return to failure request',
                        schema: validator.failure
                    },
                    406: {
                        description: 'invalid token/user',
                        schema: validator.accessDenied
                    }
                }
            }
        },
        pre: [{
            method: context.validateToken,
            assign: 'token'
        }],
        validate: {
            headers: validator.header,
            query: validator.fetchDoctorDetails.query,
            failAction: response.failAction
        }
    },
    fetchProfessionalDetails: {
        description: 'Fetch professional details',
        tags: ['api', 'users'],
        pre: [{
            method: context.validateToken,
            assign: 'token'
        }],
        validate: {
            headers: validator.header,
            failAction: response.failAction
        }
    },
    fetchAllRatingReview: {
        description: 'Fetch all ratings & review of a doctor ',
        tags: ['api', 'users'],
        pre: [{
            method: context.validateToken,
            assign: 'token'
        }],
        validate: {
            query: validator.fetchAllRatingReview.query,
            headers: validator.header,
            failAction: response.failAction
        }
    },
    addCorrespondence: {
        description: 'Add correspondence of patient ',
        tags: ['api', 'users'],
        pre: [{
            method: context.validateToken,
            assign: 'token'
        }],
        validate: {
            payload: validator.addCorrespondence.payload,
            headers: validator.header,
            failAction: response.failAction
        }
    },
    verifySecondaryEmail: {
        description: 'Verify User Secondary Email Id',
        notes: 'User secondary email Verification',
        tags: ['api', 'users'],
        validate: {
            query: validator.verifySecondaryEmail.query,
            failAction: response.failAction
        }
    },
    resendSecondaryEmailLink: {
        description: 'User Resend secondary Verification Link',
        notes: 'To get verification link again on your email id',
        tags: ['api', 'users'],
        pre: [{
            method: context.validateToken,
            assign: 'token'
        }],
        validate: {
            headers: validator.header,
            failAction: response.failAction
        }
    },
    deleteUserAccount: {
        description: 'Delete user account according to GDPR',
        tags: ['api', 'users'],
        pre: [{
            method: context.validateToken,
            assign: 'token'
        }],
        validate: {
            headers: validator.header,
            failAction: response.failAction
        }
    },
    rejectApproveDoctorProfile: {
        description: 'Reject , approve doctor account by admin',
        tags: ['api', 'admin'],
        pre: [{
            method: context.validateToken,
            assign: 'token'
        }],
        validate: {
            headers: validator.header,
            payload: validator.rejectApproveDoctorProfile.payload,
            failAction: response.failAction
        }
    },
    checkDoctorProfileStatus: {
        description: 'Api to check if doctor profile is approved or rejected by admin to show on dashboard',
        tags: ['api', 'admin'],
        pre: [{
            method: context.validateToken,
            assign: 'token'
        }],
        validate: {
            headers: validator.header,
            failAction: response.failAction
        }
    },
    fetchActivityLog: {
        description: 'Api to fetch activity log of the user',
        tags: ['api', 'users'],
        pre: [{
            method: context.validateToken,
            assign: 'token'
        }],
        validate: {
            headers: validator.header,
            failAction: response.failAction
        }
    },
    fetchDoctorDashboard: {
        description: 'Api to fetch doctors dashboard',
        tags: ['api', 'users'],
        pre: [{
            method: context.validateToken,
            assign: 'token'
        }],
        validate: {
            headers: validator.header,
            failAction: response.failAction
        }
    },
    fetchCalendar: {
        description: 'Api to fetch doctors calendar',
        notes : "Send 1 -day,2-week,3-month",
        tags: ['api', 'users'],
        pre: [{
            method: context.validateToken,
            assign: 'token'
        }],
        validate: {
            headers: validator.header,
            query: validator.fetchCalendar.query,
            failAction: response.failAction
        }
    }
}