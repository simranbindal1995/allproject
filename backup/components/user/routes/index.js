/*
 * @description: This file defines all the user routes
 * @date: 26 March 2018
 * @author: Simran
 * */


'use strict';

// include utils module

var Utils = require('../../../utils/index');
var userService = require('../services/index');
var configs = require('../../../configs');
var env = require('../../../env');
var APP_CONSTANTS = configs.constants;
var USER_TYPE = APP_CONSTANTS.USER_TYPE;
var GENDER = APP_CONSTANTS.GENDER;
var STATUS = APP_CONSTANTS.SESSION_STATUS;


module.exports = [{ // sign up api
        method: 'POST',
        path: '/v1/Users/signUp',
        config: {
            description: 'API for user sign up',
            notes: 'API for user sign up.Password can be any string of minimum 6 characters.1 - guru , 2-rookie',
            tags: ['api'],
            validate: {
                payload: {
                    email: Utils.Joi.string().email().lowercase().trim().required().label('Email'),
                    password: Utils.Joi.string().trim().required().min(6).regex(/^(?=.*[A-Za-z0-9])(?=.*\d)(?=.*[$@$!%*#?&])[A-Za-z\d$@$!%*#?&.]{6,}$/).options({ language: { string: { regex: { base: 'must contain at least 6 characters including a number , character and a special character' } } } }).label('Password'),
                    userType: Utils.Joi.string().required().allow([USER_TYPE.guru, USER_TYPE.rookie]).valid([USER_TYPE.guru, USER_TYPE.rookie])
                },
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {
            userService.signUp(request.payload, function(err, res) {
                reply(err ? err : res)
            });
        }
    },
    { // api for account verification using the link received on email
        method: 'GET',
        path: '/v1/Users/verifyAccount',
        config: {
            description: 'API for verification of the user account when user registers first on the app via the link received on email',
            notes: 'API for verification of the user account when user registers first on the app via th elink received on email',
            tags: ['api'],
            validate: {
                query: {
                    token: Utils.Joi.string().required().label('Token')
                }
            }
        },
        handler: function(request, reply) {
            userService.verifyAccount(request.query, function(err, res) {
                reply(err ? err : res)
            });
        }
    },
    { // login in api
        method: 'POST',
        path: '/v1/Users/logIn',
        config: {
            description: 'API for user login',
            notes: 'API for user manual login.Timezone is optional (required for not getting any conflictions of time in bookings.).UserType can be 1- guru or 2-rookie',
            tags: ['api'],
            validate: {
                payload: {
                    email: Utils.Joi.string().email().lowercase().trim().required().label('Email'),
                    password: Utils.Joi.string().trim().required(), //.min(6).regex(/^(?=.*[A-Za-z0-9])(?=.*\d)(?=.*[$@$!%*#?&])[A-Za-z\d$@$!%*#?&.]{6,}$/).options({ language: { string: { regex: { base: 'must contain at least 6 characters including a number , character and a special character' } } } }).label('Password'),
                    timeZone: Utils.Joi.string().allow('').required(),
                    userType: Utils.Joi.string().required().allow([USER_TYPE.guru, USER_TYPE.rookie]).valid([USER_TYPE.guru, USER_TYPE.rookie])
                },
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {
            userService.logIn(request.payload, function(err, res) {
                err ? reply(err) : reply(res) //.header("x-logintoken" , res.data.accessToken)
            });
        }
    },
    { // forgot password in api
        method: 'POST',
        path: '/v1/Users/forgotPassword',
        config: {
            description: 'API for forgotPassword',
            notes: 'API for user forgotPassword',
            tags: ['api'],
            validate: {
                payload: {
                    email: Utils.Joi.string().email().lowercase().trim().required().label('Email'),
                    userType: Utils.Joi.string().required().allow([USER_TYPE.guru, USER_TYPE.rookie]).valid([USER_TYPE.guru, USER_TYPE.rookie])
                },
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {
            userService.forgotPassword(request.payload, function(err, res) {
                reply(err ? err : res)
            });
        }
    },
    {
        method: 'GET',
        path: '/v1/Users/verifyresetpasswordToken',
        config: {
            description: 'Api to verify reset password token.',
            notes: 'Api Route to verify reset password token of user after forgot password request received.',
            tags: ['api'],
            validate: {
                query: {
                    resetPasswordToken: Utils.Joi.string().required(),
                    email: Utils.Joi.string().trim().required().lowercase()
                },
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {
            userService.verifyresetpasswordToken(request.query, function(err, res) {
                reply(err ? err : { statusCode: 200, status: "success", message: "Token has been verified." })
            })
        }
    },
    {
        method: 'PUT',
        path: '/v1/Users/resetPassword',
        config: {
            description: 'API for reset password',
            notes: 'API for setting new password',
            tags: ['api'],
            validate: {
                payload: {
                    email: Utils.Joi.string().required().lowercase(),
                    newPassword: Utils.Joi.string().trim().required().min(6).regex(/^(?=.*[A-Za-z0-9])(?=.*\d)(?=.*[$@$!%*#?&])[A-Za-z\d$@$!%*#?&.]{6,}$/).options({ language: { string: { regex: { base: 'must contain at least 6 characters including a number , character and a special character' } } } }).label('Password'),
                    resetPasswordToken: Utils.Joi.string().trim().required(),
                },
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {
            userService.resetPassword(request.payload, function(err, res) {
                reply(err ? err : res)
            });
        }
    },
    {
        method: 'POST',
        path: '/v1/Users/logout',
        config: {
            description: 'API for logout',
            // pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
            tags: ['api'],
            validate: {
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {
            userService.logout(request.headers, function(err, res) {
                reply(err ? err : res)
            });
        }
    },
    {
        method: 'POST',
        path: '/v1/Users/updateGuruProfileSTEP-1',
        config: {
            description: 'API to update only basic information and skills that guru teaches',
            notes: 'languages is the array of string seperated by commas,skillId is _id of trigno,calculus etc.',
            pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
            tags: ['api'],
            validate: {
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),
                payload: {
                    firstName: Utils.Joi.string().required().lowercase(),
                    lastName: Utils.Joi.string().required().lowercase(),
                    dob: Utils.Joi.date().required(),
                    experience: Utils.Joi.number().optional().default(0),
                    gender: Utils.Joi.string().valid([GENDER.male, GENDER.female, GENDER.others]).required(),
                    languages: Utils.Joi.array().required(),
                    profilePic: Utils.Joi.object().keys({
                        image: Utils.Joi.string(),
                        file_original_name: Utils.Joi.string(),
                        file_type: Utils.Joi.string()
                    })
                },
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {

            request.payload.userId = request.pre.verify._id;

            userService.updateProfile(request.payload, function(err, res) {
                reply(err ? err : res)
            });
        }
    },
    {
        method: 'POST',
        path: '/v1/Users/updateGuruBasicInfoSTEP-2',
        config: {
            description: 'API to update only basic information and example courses',
            pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
            tags: ['api'],
            validate: {
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),
                payload: {
                    hourlyRate: Utils.Joi.number().required(),
                    profileTitle: Utils.Joi.string().required(),
                    bio: Utils.Joi.string().required(),
                    experienceDescription: Utils.Joi.string().optional().default(0),
                    achievements: Utils.Joi.string().required(),
                    // exampleCourses: Utils.Joi.array().items(Utils.Joi.object().keys({
                    //     skillId: Utils.Joi.string().required(),
                    //     startAge: Utils.Joi.number().required(),
                    //     endAge: Utils.Joi.number().required(),
                    //     isDeleted: Utils.Joi.boolean().default(false)
                    // })).optional().label('Example Courses').allow(''),
                },
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {
            request.payload.userId = request.pre.verify._id;

            userService.updateBasicInfo(request.payload, function(err, res) {
                reply(err ? err : res)
            });
        }
    },
    {
        method: 'POST',
        path: '/v1/Users/updateGuruEducationSTEP-3',
        config: {
            description: 'API to update/add/delete education of the user.',
            notes: "If wants to add education don't pass education_id and isDeleted:false ; to update education pass education_id of that object,to delete pass education_id and isDeleted true",
            pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
            tags: ['api'],
            validate: {
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),
                payload: {
                    education_id: Utils.Joi.string().optional().allow(''),
                    education: Utils.Joi.array().items(Utils.Joi.object().keys({
                        graduation: Utils.Joi.string().optional().allow(''),
                        instituteName: Utils.Joi.string().optional().allow(''),
                        degreeName: Utils.Joi.string().optional().allow(''),
                        description: Utils.Joi.string().optional().allow(''),
                        startYear: Utils.Joi.number().optional().allow(""),
                        endYear: Utils.Joi.number().optional().allow("")
                    })).optional().label('Education').allow(''),
                    isDeleted: Utils.Joi.boolean().default(false)
                },
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {
            request.payload.userId = request.pre.verify._id;

            userService.updateEducation(request.payload, function(err, res) {
                reply(err ? err : res)
            });
        }
    },
    {
        method: 'POST',
        path: '/v1/Users/generalQuestionsGuruSTEP-4',
        config: {
            description: 'API to update question answer of the user.',
            notes: "Pass question id and answer id",
            pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
            tags: ['api'],
            validate: {
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),
                payload: {
                    questions: Utils.Joi.array().items(Utils.Joi.object().keys({
                        question: Utils.Joi.string().required(),
                        answer: Utils.Joi.string().required()
                    })).required().label('Questions'),
                },
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {
            request.payload.userId = request.pre.verify._id;

            userService.generalQuestions(request.payload, function(err, res) {
                reply(err ? err : res)
            });
        }
    },
    {
        method: 'PUT',
        path: '/v1/Users/uploadDocuments',
        config: {
            description: 'Api Route to upload documents by the user.Move the file from tmp to cdn',
            notes: "First Run api v1/Files/uploadTmp",
            tags: ['api'],
            pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
            validate: {
                payload: {
                    fileName: Utils.Joi.string().required(),
                    title: Utils.Joi.string().allow(''),
                    description: Utils.Joi.string().allow('')
                },
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),

                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {
            request.payload.userId = request.pre.verify._id;
            userService.uploadDocuments(request.payload, function(err, res) {
                reply(err ? err : res)
            })
        }
    }, {
        method: 'PUT',
        path: '/v1/Users/deleteDocuments',
        config: {
            description: 'Api Route to delete the documents.',
            tags: ['api'],
            pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
            validate: {
                payload: {
                    isDeleted: Utils.Joi.boolean().default(true).required(),
                    documentId: Utils.Joi.string().required()
                },
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),

                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {
            request.payload.userId = request.pre.verify._id;
            userService.deleteDocuments(request.payload, function(err, res) {
                reply(err ? err : res)
            })
        }
    },
    {
        method: 'GET',
        path: '/v1/Users/viewDocuments',
        config: {
            description: 'Api Route to view the documents.',
            tags: ['api'],
            pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
            validate: {
                query: {
                    documentId: Utils.Joi.string().optional().allow('')
                },
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),

                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {
            request.query.userId = request.pre.verify._id;
            userService.viewDocuments(request.query, function(err, res) {
                reply(err ? err : res)
            })
        }
    },
    {
        method: 'POST',
        path: '/v1/Users/acceptTermsGuruSTEP-6',
        config: {
            description: 'API to accept terms & conditions.',
            pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
            tags: ['api'],
            validate: {
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),
                payload: {
                    isAccepted: Utils.Joi.boolean().default(true).required(),
                    isAuthorised: Utils.Joi.boolean().default(true).required()
                },
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {
            request.payload.userId = request.pre.verify._id;

            userService.acceptTerms(request.payload, function(err, res) {
                reply(err ? err : res)
            });
        }
    },
   /* {
        method: 'GET',
        path: '/v1/Users/googleLogin/{userType}',
        config: {
            //auth: "google",
            description: 'Api to login/signup to the application using google account of the user.',
            notes: "Api to login/signup to the application using google account of the user.Run api Users/verifySocialLoginToken after this to verify the social token got in response.",
            tags: ['api'],
            validate: {
                params: {
                    userType: Utils.Joi.string().required().allow([USER_TYPE.guru, USER_TYPE.rookie]).valid([USER_TYPE.guru, USER_TYPE.rookie])
                }
            },
            handler: function(request, reply) {
                if (!request.auth.isAuthenticated) {
                    return reply('Authentication failed due to: ', request.auth.error.message);
                } else {
                    var profile = request.auth.credentials.profile,
                        name = profile.raw.name.split(' ')

                    profile.email ? null : reply({ statusCode: 401, status: "warning", message: "We couldn't locate your email .Please use manual process or change your google account settings." })

                    var requestObj = {
                        firstName: name[0],
                        lastName: name[1] || "",
                        googleId: profile.id,
                        email: profile.email,
                        userType: request.params.userType
                    };

                    userService.socialLogin(requestObj, function(err, res) {
                        reply(err ? err : res)
                    });
                }
            }

        }
    },
    {
        method: 'GET',
        path: '/v1/Users/facebookLogin/{userType}',
        config: {
            // auth: "facebook",
            tags: ['api'],
            description: 'Api to login/signup to the application using google account',
            notes: "Api to login/signup to the application using google account of the user.Run api Users/verifySocialLoginToken after this to verify the social token got in response.",
            validate: {
                params: {
                    userType: Utils.Joi.string().required().allow([USER_TYPE.guru, USER_TYPE.rookie]).valid([USER_TYPE.guru, USER_TYPE.rookie])
                }
            },
            handler: function(request, reply) {
                if (!request.auth.isAuthenticated) {
                    return reply('Authentication failed due to: ', request.auth.error.message);
                } else {
                    var profile = request.auth.credentials.profile,
                        name = profile.raw.name.split(' ')

                    profile.email ? null : reply({ statusCode: 401, status: "warning", message: "We couldn't locate your email .Please use manual process or change your google account settings." })

                    var requestObj = {
                        firstName: name[0].toLowerCase(),
                        lastName: name[1].toLowerCase() || "",
                        googleId: profile.id,
                        email: profile.email,
                        userType: request.params.userType
                    };

                    userService.socialLogin(requestObj, function(err, res) {
                        reply(err ? err : res)
                    });
                }
            }

        }
    }, 
    {
        method: 'GET',
        path: '/v1/Users/verifySocialLoginToken',
        config: {
            description: 'Api to check login token for social login.',
            tags: ['api'],
            validate: {
                query: {
                    token: Utils.Joi.string().required()
                }
            }
        },
        handler: function(request, reply) {

            userService.verifySocialLoginToken(request.query, function(err, res) {
                reply(err ? err : res)
            });
        }
    }, */
    {
        method: 'PUT',
        path: '/v1/Users/updateRookieBasicInfoSTEP-1',
        config: {
            description: 'Api Route to save and edit the basic info of rookie',
            notes: "Api Route to save and edit the basic info of rookie <br> Profile pic contains the file_id that is returned using 'fileUploadTmp' api ",
            tags: ['api'],
            pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
            validate: {
                payload: {
                    name: Utils.Joi.string().required().label('Name'),
                    profileHeadline: Utils.Joi.string().label('profileHeadline'),
                    profilePic: Utils.Joi.object().keys({
                        image: Utils.Joi.string(),
                        file_original_name: Utils.Joi.string(),
                        file_type: Utils.Joi.string()
                    })
                },
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),

                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {
            request.payload.userData = request.pre.verify;
            userService.updateRookieBasicInfo(request.payload, function(err, res) {
                reply(err ? err : res)
            })
        }
    },
    {
        method: 'PUT',
        path: '/v1/Users/updateRookieEducationalInfoSTEP-2',
        config: {
            description: 'Api Route to save/edit/delete the educational info of a rookie',
            notes: "Api Route to save and edit the educational info of a rookie <br> When to edit a a particular existing info or save send the education array. <br> When to delete any existing one educational_id and isDeleted is must",
            tags: ['api'],
            pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
            validate: {
                payload: {
                    education_id: Utils.Joi.string().optional().label('Education id').allow(''),
                    education: Utils.Joi.array().items(Utils.Joi.object().keys({
                        level: Utils.Joi.string().label('Level').required(),
                        skill: Utils.Joi.string().required()
                        // gcse: Utils.Joi.string().label('gcse'),
                        // level: Utils.Joi.string().label('Level'),
                        // higherEducation: Utils.Joi.string().label('higherEducation'),
                        // qualification: Utils.Joi.string().label('qualification')
                    })).label('Education'),
                    isDeleted: Utils.Joi.boolean().default(false)
                },
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {
            request.payload.userData = request.pre.verify;
            userService.updateRookieEducationalInfo(request.payload, function(err, res) {
                reply(err ? err : res)
            })
        }
    },
    // {
    //     method: 'GET',
    //     path: '/v1/Users/fetchProfile',
    //     config: {
    //         description: 'Api to check login token for social login.',
    //         tags: ['api'],
    //         pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
    //         validate: {
    //             headers: Utils.Joi.object({
    //                 'x-logintoken': Utils.Joi.string().required().trim()
    //             }).options({ allowUnknown: true }),
    //         }
    //     },
    //     handler: function(request, reply) {
    //         request.query.userId = request.pre.verify._id;
    //         userService.fetchProfile(request.query, function(err, res) {
    //             reply(err ? err : res)
    //         });
    //     }
    // },
    {
        method: 'PUT',
        path: '/v1/Users/changePassword',
        config: {
            description: 'Api Route to change password ',
            tags: ['api'],
            pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
            validate: {
                payload: {
                    oldPassword: Utils.Joi.string().required(),
                    newPassword: Utils.Joi.string().trim().required().min(6).regex(/^(?=.*[A-Za-z0-9])(?=.*\d)(?=.*[$@$!%*#?&])[A-Za-z\d$@$!%*#?&.]{6,}$/).options({ language: { string: { regex: { base: 'must contain at least 6 characters including a number , character and a special character' } } } }).label('Password'),
                },
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {
            request.payload.userId = request.pre.verify._id;
            userService.changePassword(request.payload, function(err, res) {
                reply(err ? err : res)
            })
        }
    },
    { // resend email verification token password in api
        method: 'POST',
        path: '/v1/Users/resendEmailVerificationToken',
        config: {
            description: 'API for sending again the verification token',
            tags: ['api'],
            validate: {
                payload: {
                    email: Utils.Joi.string().email().lowercase().trim().required().label('Email'),
                    userType: Utils.Joi.string().required().allow([USER_TYPE.guru, USER_TYPE.rookie]).valid([USER_TYPE.guru, USER_TYPE.rookie])
                },
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {
            userService.resendEmailVerificationToken(request.payload, function(err, res) {
                reply(err ? err : res)
            });
        }
    },
    {
        method: 'PUT',
        path: '/v1/Users/changeEmail',
        config: {
            description: 'Api Route to change email ',
            tags: ['api'],
            pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
            validate: {
                payload: {
                    newEmail: Utils.Joi.string().email().lowercase().trim().required().label('Email'),
                },
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {
            request.payload.userId = request.pre.verify._id;
            userService.changeEmail(request.payload, function(err, res) {
                reply(err ? err : res)
            })
        }
    },
    { // api for secondary email verification using the link received on email
        method: 'GET',
        path: '/v1/Users/verifySecondaryEmail',
        config: {
            description: 'API for verification of secondary email.',
            tags: ['api'],
            validate: {
                query: {
                    token: Utils.Joi.string().required().label('Token')
                }
            }
        },
        handler: function(request, reply) {
            userService.verifySecondaryEmail(request.query, function(err, res) {
                reply(err ? err : res)
            });
        }
    },
    {
        method: 'PUT',
        path: '/v1/Users/findGuru',
        config: {
            description: 'Api Route find guru',
            notes: "Api Route find guru",
            tags: ['api'],
            validate: {
                payload: {
                    startPrice: Utils.Joi.number().label('Start Price'),
                    endPrice: Utils.Joi.number().label('End Price'),
                    startAge: Utils.Joi.number().label('Start Age'),
                    endAge: Utils.Joi.number().label('End Age'),
                    gender: Utils.Joi.array().label('Gender'),
                    rating: Utils.Joi.number().valid(0, 1, 2, 3, 4, 5),
                    skip: Utils.Joi.number().default(0).label('Skip'),
                    limit: Utils.Joi.number().label('Limit'),
                    skills: Utils.Joi.array(),
                    days: Utils.Joi.array().label('Days'),
                },
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {

            userService.findGuru(request.payload, function(err, res) {
                reply(err ? err : res)
            })
        }
    },
    {
        method: 'GET',
        path: '/v1/Users/listOneToOneLessonsAsPerStatus',
        config: {
            description: 'Api for guru or student to list one to one lessons with different status as "accepted","requested","rejected"',
            notes: 'Api for guru or student to list one to one lessons with different stattus as "accepted","requested","rejected" <br> Status is mandatory <br> If to list the lessons requested by rookie send the logintoken of rookie <br> If to list the sessions at guru end send guru"s logintoken',
            tags: ['api'],
            pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
            validate: {
                query: {
                    status: Utils.Joi.string().required().valid([STATUS.accepted, STATUS.rejected, STATUS.pending]),
                    skip: Utils.Joi.number().default(0).optional().label('Skip'),
                    limit: Utils.Joi.number().default(10).optional().label('Limit'),
                    currentTime: Utils.Joi.number().required()
                },
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {

            request.query.userData = request.pre.verify;
            userService.listOneToOneLessonsAsPerStatus(request.query, function(err, res) {
                reply(err ? err : res)
            })
        }
    },
    {
        method: 'GET',
        path: '/v1/Users/getProfileStepByStepOfGuru/{type}',
        config: {
            description: 'Api to fetch profile in steps',
            notes: 'Api to fetch profile in steps <br> For each tab give the step number 1-Profile, 2-Basic, 3-Educational, 4-General Questions, 5-Documents Upload, 6- Terms & conditions',
            tags: ['api'],
            pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
            validate: {
                params: {
                    type: Utils.Joi.number().required().default(1).valid(1, 2, 3, 4, 5, 6)
                },
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {

            request.params.userData = request.pre.verify;

            if (request.params.userData.userType == '1') { // if guru
                userService.getProfileStepByStep(request.params, function(err, res) {
                    reply(err ? err : res)
                })
            } else {
                reply({ status: "warning", statusCode: 401, message: 'Unauthorized user' })
            }

        }
    },
    {
        method: 'GET',
        path: '/v1/Users/getRookieProfileStepByStep/{type}',
        config: {
            description: 'Api to fetch rookie profile in steps',
            notes: 'Api to fetch profile in steps <br> For each tab give the step number 1-Personal, 2-Educational,',
            tags: ['api'],
            pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
            validate: {
                params: {
                    type: Utils.Joi.number().required().default(1).valid(1, 2)
                },
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {

            request.params.userData = request.pre.verify;
            if (request.params.userData.userType == '2') { // if rookie
                userService.getRookieProfileStepByStep(request.params, function(err, res) {
                    reply(err ? err : res)
                })
            } else {
                reply({ status: "warning", statusCode: 401, message: 'Unauthorized user' })
            }
        }
    },
    {
        method: 'PUT',
        path: '/v1/Users/skipProfileStep',
        config: {
            description: 'Api Route to skip profile step and save the step in db',
            tags: ['api'],
            pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
            validate: {
                payload: {
                    stepToSkip: Utils.Joi.number().required()
                },
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {
            request.payload.userData = request.pre.verify
            userService.skipProfileStep(request.payload, function(err, res) {
                reply(err ? err : res)
            })
        }
    },
    {
        method: 'GET',
        path: '/v1/Users/getProfileStepByStepOfSpecificGuru/{type}/{userId}',
        config: {
            description: 'Api to fetch profile in steps of  aguru',
            notes: 'Api to fetch profile in steps <br> For each tab give the step number 1-Profile, 2-Basic, 3-Educational, 4-General Questions, 5-Documents Upload, 6- Terms & conditions',
            tags: ['api'],
            pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
            validate: {
                params: {
                    type: Utils.Joi.number().required().default(1).valid(1, 2, 3, 4, 5, 6),
                    userId: Utils.Joi.string().required().label('Guru Id')
                },
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {
            userService.getProfileStepByStepOfSpecificGuru(request.params, function(err, res) {
                reply(err ? err : res)
            })
        }
    },
    {
        method: 'GET',
        path: '/v1/Users/fetchBookingsAndAvailability',
        config: {
            description: 'Api to fetch user is booked or available at particular date',
            notes: 'Api to fetch if user is booked or available at given date on differenet time slots.',
            tags: ['api'],
            pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
            validate: {
                query: {
                    currentDate: Utils.Joi.number().required(),
                    userId: Utils.Joi.string().optional().allow("")
                },
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {
            request.query.loggedUserId = request.pre.verify._id;
            userService.fetchBookingsAndAvailability(request.query, function(err, res) {
                reply(err ? err : res)
            })
        }
    },
    { // api for checking whether user approved or not
        method: 'GET',
        path: '/v1/Users/checkWhetherApprovedOrNot',
        config: {
            description: 'API for checking whether user approved or not',
            pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
            tags: ['api'],
            validate: {
                query: {},
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),
            }
        },
        handler: function(request, reply) {

            request.query.userId = request.pre.verify._id;
            userService.checkWhetherApprovedOrNot(request.query, function(err, res) {
                reply(err ? err : res)
            });
        }
    },
    { // social signup api
        method: 'POST',
        path: '/v1/Users/socialSignUp',
        config: {
            description: 'API for social signup',
            notes: 'API for user social sign up.Send userType  1 - guru , 2-rookie.Send loginType 1 - google , 2-facebook',
            tags: ['api'],
            validate: {
                payload: {
                    email: Utils.Joi.string().email().lowercase().trim().required().label('Email'),
                    socialId: Utils.Joi.string().required(),
                    userType: Utils.Joi.string().allow([USER_TYPE.guru, USER_TYPE.rookie]).required(),
                    type: Utils.Joi.number().default(1).required(),
                    timeZone : Utils.Joi.string().required()
                },
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {
            userService.socialSignUp(request.payload, function(err, res) {
                reply(err ? err : res)
            });
        }
    },

];