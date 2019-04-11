'use strict'
const Joi = require('joi')

module.exports = {
    signUp: {
        payload: {
            userRole: Joi.string().required().default("1").valid(["1", "2"]).trim(),
            firstName: Joi.string().required().lowercase().trim().description('First name'),
            lastName: Joi.string().required().lowercase().trim().description('Last name'),
            email: Joi.string().email().required().description('Valid email Id'),
            password: Joi.string().regex(/^(?=.*?[a-zA-Z])(?=.*?[a-zA-Z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{6,15}$/).options({ language: { string: { regex: { base: 'must be between 6-15 characters including a number and a special character.is invalid' } } } }).label('Password').required().description('Password:MinLength:6'),
            timeZone: Joi.string().required().default("Asia/Kolkata")
        }
    },
    login: {
        payload: {
            email: Joi.string().email().required().trim().description('Email'),
            password: Joi.string().required(),
            timeZone: Joi.string().required().default("Asia/Kolkata")
        }
    },
    verifyEmail: {
        query: {
            token: Joi.string().required()
        }
    },
    verifySecondaryEmail: {
        query: {
            token: Joi.string().required()
        }
    },
    checkEmailExists: {
        payload: {
            email: Joi.string().email().required().trim().description('Email'),
        }
    },

    resendEmailVerificationLink: {
        payload: {
            email: Joi.string().email().required().trim().description('Email')
        }
    },
    setNewPassword: {
        payload: {
            resetPasswordToken: Joi.string().required(),
            password: Joi.string().regex(/^(?=.*?[a-zA-Z])(?=.*?[a-zA-Z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{6,15}$/).options({ language: { string: { regex: { base: 'must be between 6-15 characters including a number and a special character.is invalid' } } } }).label('Password').required().description('Password:MinLength:6'),
        }
    },
    forgot: {
        payload: {
            email: Joi.string().email().required().trim().description('Email')
        }
    },
    changePassword: {
        payload: {
            oldPassword: Joi.string().required(),
            newPassword: Joi.string().regex(/^(?=.*?[a-zA-Z])(?=.*?[a-zA-Z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{6,15}$/).options({ language: { string: { regex: { base: 'must be between 6-15 characters including a number and a special character.is invalid' } } } }).label('Password').required().description('Password:MinLength:6'),
        }
    },
    verifyResetPasswordToken: {
        query: {
            token: Joi.string().required()
        }
    },
    updateProfileStep1: {
        payload: {
            firstName: Joi.string().required().lowercase().trim(),
            lastName: Joi.string().required().lowercase().trim(),
            middleName: Joi.string().optional().allow(''),
            profilePicId: Joi.string().allow('').optional(),
            dob: Joi.number().required(),
            gender: Joi.string().required().lowercase().valid(["male", "female", "others"]),
            mobileNumber: Joi.number().required().min(7),
            countryCode: Joi.string().required(),
            fullAddress: Joi.string().required(),
            longitude: Joi.number().required(),
            latitude: Joi.number().required(),
            email: Joi.string().optional().allow(''),
            description: Joi.string().optional().allow(""),
            isUpdate: Joi.boolean().default(false)
        }
    },
    verifyOtp: {
        payload: {
            otp: Joi.number().required(),
            verifySecondary: Joi.boolean().default(false)
        }
    },
    addCorrespondence: {
        payload: {
            fileId: Joi.string().required()
        }
    },
    addFamilyMembers: {
        payload: {
            family: Joi.array().items(Joi.object().keys({
                memberName: Joi.string().required().trim(),
                relation: Joi.string().required().lowercase().trim(),
                relationProofId: Joi.array().required(),
                correspondenceId: Joi.array().required()
            })).required().label('family')
        }
    },
    skipForNow: {
        payload: {
            stepNumber: Joi.number().required()
        }
    },
    updateProfileStepDoctor2: {
        payload: {
            specialisationId: Joi.array().required(),
            gmcNumber: Joi.string().required(),
            yearsOfExp: Joi.object().keys({
                year: Joi.number().required(),
                month: Joi.number().required()
            }).required(),
            education: Joi.array().items(Joi.object().keys({
                degree: Joi.string().required(),
                college: Joi.string().required(),
                yearOfCompletion: Joi.number().required()
            })).required(),
            identityProof: Joi.string().required(),
            signature: Joi.string().required(),
            documents: Joi.array().required()
        }
    },
    searchDoctors: {
        payload: {
            name: Joi.string().optional().allow(''),
            specialisationId: Joi.string().allow(''),
            dayNumber: Joi.number().allow(''),
            skip: Joi.number(),
            limit: Joi.number()
        }
    },
    getProfileStepsPatient: {
        query: {
            profileStep: Joi.number().required().default(1),
            patientId: Joi.string().allow("").optional()
        }
    },
    updateFamily: {
        payload: {
            familyId: Joi.string().required().lowercase().trim(),
            memberName: Joi.string().required().lowercase().trim(),
            relation: Joi.string().required().lowercase().trim(),
            correspondenceId: Joi.array().optional()
        }
    },
    fetchDoctorDetails: {
        query: {
            doctorId: Joi.string().required().trim()
        }
    },
    fetchAllRatingReview: {
        query: {
            doctorId: Joi.string().required(),
            skip: Joi.number().default(0),
            limit: Joi.number().default(10)
        }
    },
    rejectApproveDoctorProfile: {
        payload: {
            doctorId: Joi.string().required(),
            isRejected: Joi.boolean().default(false),
            isApproved: Joi.boolean().default(false),
        }
    },
    fetchCalendar : {
        query : {
            day : Joi.number().required().valid([1,2,3])
        }
    },
    accessGranted: Joi.object({
        isSuccess: Joi.boolean(),
        status: Joi.string(),
        statusCode: Joi.number().default(200),
        data: Joi.object({
            _id: Joi.string(),
            firstName: Joi.string(),
            lastName: Joi.string(),
            email: Joi.string(),
            secondaryEmail: Joi.string(),
            role: Joi.number(),
            pic: Joi.string(),
            qualification: Joi.object({
                id: Joi.string(),
                name: Joi.string()
            }),
            gender: Joi.string(),
            dob: Joi.date().default(new Date().toISOString()),
            address: Joi.object({
                street: Joi.string(),
                city: Joi.string(),
                state: Joi.string(),
                country: Joi.string()
            }),
            isCompleted: Joi.boolean(),
            isVerified: Joi.boolean(),
            isSuspended: Joi.boolean(),
            isDeleted: Joi.boolean(),
            createdAt: Joi.date().default(new Date().toISOString()),
            updatedAt: Joi.date().default(new Date().toISOString())
        })
    }),
    accessDenied: Joi.object({
        isSuccess: Joi.boolean().default(false),
        status: Joi.string(),
        statusCode: Joi.number().default(400),
        message: Joi.string()
    }),
    failure: Joi.object({
        isSuccess: Joi.boolean().default(false),
        status: Joi.string(),
        statusCode: Joi.number().default(320),
        message: Joi.string()
    }),
    success: Joi.object({
        isSuccess: Joi.boolean(),
        status: Joi.string(),
        statusCode: Joi.number().default(200),
        message: Joi.string()
    }),
    header: Joi.object({
        'x-logintoken': Joi.string().required().trim().description('Provide token to access api')
    }).unknown()
}