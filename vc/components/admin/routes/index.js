/*
 * @description: This file defines all the admin routes
 * @date: 29 March 2018
 * @author: Nidhi
 * */


// include utils module

var Utils = require('../../../utils/index');
var adminService = require('../services/index');
var configs = require('../../../configs');
var env = require('../../../env');

var APP_CONSTANTS = configs.constants;
var USER_TYPE = APP_CONSTANTS.USER_TYPE;



module.exports = [{ // admin login
        method: 'PUT',
        path: '/v1/admin/login',
        config: {
            description: 'API for admin to login',
            notes: 'API for admin to login',
            tags: ['api'],
            validate: {
                payload: {
                    email: Utils.Joi.string().email().lowercase().trim().required().label('Email'),
                    password: Utils.Joi.string().required().label('Password')
                },
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {
            adminService.login(request.payload, function(err, res, token) {
                err ? reply(err) : reply(res).header('X-logintoken', token)
            });
        }
    },
    { // forgot password in api
        method: 'POST',
        path: '/v1/admin/forgotPassword',
        config: {
            description: 'API for forgotPassword for admin',
            notes: 'API for user forgotPassword for admin',
            tags: ['api', 'admin'],
            validate: {
                payload: {
                    email: Utils.Joi.string().email().lowercase().trim().required().label('Email'),
                },
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {
            adminService.forgotPassword(request.payload, function(err, res) {
                reply(err ? err : res)
            });
        }
    },
    {
        method: 'PUT',
        path: '/v1/admin/resetPassword',
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
            adminService.resetPassword(request.payload, function(err, res) {
                reply(err ? err : res)
            });
        }
    },
    {
        method: 'PUT',
        path: '/v1/admin/changePassword',
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
            adminService.changePassword(request.payload, function(err, res) {
                reply(err ? err : res)
            })
        }
    },
    { //list all new requestes subject
        method: 'GET',
        path: '/v1/admin/newSubjectRequest',
        config: {
            description: 'API for admin to list all request that have come to add a new subject',
            notes: 'API for admin to list all request that have come to add a new subject',
            tags: ['api'],
            pre: [{ method: Utils.universalFunctions.verifyadminLoginToken, assign: "verify" }],
            validate: {
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),
                query: {
                    skip: Utils.Joi.number().default(0).label('Skip'),
                    limit: Utils.Joi.number().default(0).label('Limit')
                }
            }
        },
        handler: function(request, reply) {
            adminService.newSubjectRequest(request.query, function(err, res) {
                err ? reply(err) : reply(res)
            });
        }
    },
    { //approve or reject new skill or subject
        method: 'PUT',
        path: '/v1/admin/approveRejectSubject',
        config: {
            description: 'API for admin to approve any skill or subject',
            notes: 'API for admin to approve any skill or subject; <br> Skill_id is required, that is fetched using "newSubjectRequest" api  <br> action type is required either approve,reject',
            tags: ['api'],
            pre: [{ method: Utils.universalFunctions.verifyadminLoginToken, assign: "verify" }],
            validate: {
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),
                query: {
                    skill_id: Utils.Joi.string().required().label('Skill id'),
                    type: Utils.Joi.string().valid('approve', 'reject').default('approve').required().label('Action type')
                }
            }
        },
        handler: function(request, reply) {
            adminService.approveRejectSubject(request.query, function(err, res) {
                err ? reply(err) : reply(res)
            });
        }
    },
    { //approve reject a guru
        method: 'PUT',
        path: '/v1/admin/approveRejectGuru',
        config: {
            description: 'API for admin to approve any guru',
            notes: 'API for admin to approve any guru <br> user_id is required <br> Actio type either "approve" "reject" is required',
            tags: ['api'],
            pre: [{ method: Utils.universalFunctions.verifyadminLoginToken, assign: "verify" }],
            validate: {
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),
                payload: {
                    user_id: Utils.Joi.string().required().label('User id'),
                    type: Utils.Joi.string().valid('approve', 'reject').default('approve').required().label('Action type')
                }
            }
        },
        handler: function(request, reply) {
            adminService.approveGuru(request.payload, function(err, res) {
                err ? reply(err) : reply(res)
            });
        }
    },
    {
        method: 'GET',
        path: '/v1/admin/fetchAllUsers',
        config: {
            description: 'API for admin to fetch al users',
            notes: 'Send userType 1 for fetching all gurus , 2 for fetching all rookies',
            tags: ['api'],
            pre: [{ method: Utils.universalFunctions.verifyadminLoginToken, assign: "verify" }],
            validate: {
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),
                query: {
                    userType: Utils.Joi.string().allow([USER_TYPE.guru, USER_TYPE.rookie]).default(USER_TYPE.guru),
                    skip: Utils.Joi.number(),
                    limit: Utils.Joi.number(),
                    search: Utils.Joi.string().optional().allow('')
                }
            }
        },
        handler: function(request, reply) {
            adminService.fetchAllUsers(request.query, function(err, res) {
                err ? reply(err) : reply(res)
            });
        }
    },
    { //block unblock a user
        method: 'PUT',
        path: '/v1/admin/activeInactiveUser',
        config: {
            description: 'API for admin to active inactive a user',
            notes: 'Send active for activating a user and inactive for deactivating a user',
            tags: ['api'],
            pre: [{ method: Utils.universalFunctions.verifyadminLoginToken, assign: "verify" }],
            validate: {
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),
                query: {
                    userId: Utils.Joi.string().required().label('User'),
                    type: Utils.Joi.string().valid('active', 'inactive').default('active').required()
                }
            }
        },
        handler: function(request, reply) {
            adminService.activeInactiveUser(request.query, function(err, res) {
                err ? reply(err) : reply(res)
            });
        }
    },

    {
        method: 'GET',
        path: '/v1/admin/skillManagement',
        config: {
            description: 'API for admin to fetch all users',
            notes: 'Send userType 1 for fetching all gurus , 2 for fetching all rookies',
            tags: ['api'],
            pre: [{ method: Utils.universalFunctions.verifyadminLoginToken, assign: "verify" }],
            validate: {
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),
                query: {
                    skip: Utils.Joi.number(),
                    limit: Utils.Joi.number(),
                    type: Utils.Joi.string().allow('added', 'new').required()
                }
            }
        },
        handler: function(request, reply) {
            adminService.skillManagement(request.query, function(err, res) {
                err ? reply(err) : reply(res)
            });
        }
    },
    {
        method: 'GET',
        path: '/v1/admin/disputeManagement',
        config: {
            description: 'API for admin to fetch all disputes',
            tags: ['api'],
            pre: [{ method: Utils.universalFunctions.verifyadminLoginToken, assign: "verify" }],
            validate: {
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),
                query: {
                    skip: Utils.Joi.number(),
                    limit: Utils.Joi.number(),
                    search: Utils.Joi.number().optional()
                }
            }
        },
        handler: function(request, reply) {
            adminService.disputeManagement(request.query, function(err, res) {
                err ? reply(err) : reply(res)
            });
        }
    },
    {
        method: 'GET',
        path: '/v1/admin/paymentManagement',
        config: {
            description: 'API for admin to fetch all payments',
            notes: "Type 1 - for total , 2 - this month , 3 - this week",
            tags: ['api'],
            pre: [{ method: Utils.universalFunctions.verifyadminLoginToken, assign: "verify" }],
            validate: {
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),
                query: {
                    skip: Utils.Joi.number(),
                    limit: Utils.Joi.number(),
                    typeOfLesson: Utils.Joi.string().allow('one-one', 'group'),
                    typeOfTransaction: Utils.Joi.number().allow(1, 2, 3)
                }
            }
        },
        handler: function(request, reply) {
            adminService.paymentManagement(request.query, function(err, res) {
                err ? reply(err) : reply(res)
            });
        }
    },


];