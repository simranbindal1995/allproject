var Utils = require('../../../utils/index');
var staticPageService = require('../services/index');
var configs = require('../../../configs');



module.exports = [{ // update,add about us, privacy policy and terms nd conditions
        method: 'POST',
        path: '/v1/admin/add_update_static_pages',
        config: {
            description: 'API for admin to add/update content of static pages',
            notes: 'API to add  update all the static pages except faqs 1- about us   2- terms and conditions  3- privacy policy,4-how it works guru,5-how it works rookie ',
            tags: ['api'],
            pre: [{ method: Utils.universalFunctions.verifyadminLoginToken, assign: "verify" }],
            validate: {
                payload: {
                    content: Utils.Joi.string().required(),
                    content_type: Utils.Joi.number().required().valid(1, 2, 3,4,5)
                },
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {
            request.payload.userDetails = request.pre.userDetails
            staticPageService.add_update_static_pages(request.payload, function(err, res) {
                if (err) {
                    reply(err)
                } else {
                    reply(res)
                }
            });
        }
    },
    { // update,add faqs
        method: 'PUT',
        path: '/v1/admin/update_faq',
        config: {
            description: 'API for admin to update FAQ',
            notes: 'API for admin to update FAQ ',
            tags: ['api'],
            pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
            validate: {
                payload: {
                    question_id: Utils.Joi.string().optional().allow(''),
                    question: Utils.Joi.string().optional(),
                    answer: Utils.Joi.string().optional(),
                },
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {
            staticPageService.update_faq(request.payload, function(err, res) {
                if (err) {
                    reply(err)
                } else {
                    reply(res)
                }
            });
        }
    },
    { // update,add faqs
        method: 'GET',
        path: '/v1/admin/static_pages_content',
        config: {
            description: 'API for admin to get static pages content',
            notes: 'API for admin to get static pages content 1- about us 2- terms and conditions  3- privacy policy 4-how it works guru,5 how it works rookie 6 -faq',
            tags: ['api'],
            validate: {
                query: {
                    page_type: Utils.Joi.number().required().valid(1, 2, 3, 4,5,6)
                },
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {
            staticPageService.static_pages_content(request.query, function(err, res) {
                if (err) {
                    reply(err)
                } else {
                    reply(res)
                }
            });
        }
    },
    { // update,add faqs
        method: 'PUT',
        path: '/v1/admin/delete_faq',
        config: {
            description: 'API for admin to delete FAQ',
            notes: 'API for admin to delete FAQ',
            tags: ['api'],
            pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
            validate: {
                payload: {
                    question_id: Utils.Joi.string().required()
                },
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {
            staticPageService.delete_faq(request.payload, function(err, res) {
                if (err) {
                    reply(err)
                } else {
                    reply(res)
                }
            });
        }
    },
     { // update,add faqs
        method: 'GET',
        path: '/v1/admin/fetch_particular_question',
        config: {
            description: 'API for admin to fetch particular question',
            tags: ['api'],
            pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
            validate: {
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),
                query: {
                    question_id : Utils.Joi.string().required()
                },
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) { 
            staticPageService.fetch_particular_question(request.query, function(err, res) {
                if (err) {
                    reply(err)
                } else {
                    reply(res)
                }
            });
        }
    },
];