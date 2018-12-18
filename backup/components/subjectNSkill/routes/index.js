/*
 * @description: This file defines all the user routes
 * @date: 26 March 2018
 * @author: Simran
 * */


'use strict';

// include utils module

var Utils = require('../../../utils/index');
var subjectNSkillService = require('../services/index');
var configs = require('../../../configs');
var env = require('../../../env');

module.exports = [{ // save category and skills and sub-skills
        method: 'POST',
        path: '/v1/subjectNSkill/saveCategory',
        config: {
            description: 'API for user to save any category at root level',
            notes: 'API for user to save any category at root level',
            tags: ['api'],
            validate: {
                payload: {
                    name: Utils.Joi.string().lowercase().trim().required().label('Name')
                },
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {
            subjectNSkillService.saveCategory(request.payload, function(err, res) {
                reply(err ? err : res)
            });
        }
    },
    { // save skills and sub-skills
        method: 'POST',
        path: '/v1/subjectNSkill/saveSubjectAndSKill',
        config: {
            description: 'API for user to save anysubject or skill, parent id is must i.e id of category',
            notes: 'API for user to save anysubject or skill, parent id is must i.e id of category',
            tags: ['api'],
            pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
            validate: {
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),
                payload: {
                    parent_id: Utils.Joi.string().trim().required().label('Parent id'),
                    subject: Utils.Joi.string().required().label('Subject'),
                    skill: Utils.Joi.string().required().lowercase().label('Skill'),
                    description: Utils.Joi.string().lowercase().optional().label('Description')
                },
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {

            request.payload.userId = request.pre.verify._id;

            request.payload.userDetails = request.pre.verify;
            subjectNSkillService.saveSubjectAndSKill(request.payload, function(err, res) {
                reply(err ? err : res)
            });
        }
    },
    { // fetch all the categories
        method: 'GET',
        path: '/v1/subjectNSkill/getCategories',
        config: {
            description: 'API for user to fetch all the root categories',
            notes: 'API for user to fetch all the root categories',
            tags: ['api']
        },
        handler: function(request, reply) {
            subjectNSkillService.getCategories(request.payload, function(err, res) {
                reply(err ? err : res)
            });
        }
    },
    { // fetch all the skill with subjects
        method: 'GET',
        path: '/v1/subjectNSkill/getAllCategoriesAndSubjects',
        config: {
            description: 'API for user to fetch all the categories with subjects and skills',
            notes: 'API for user to fetch all the categories with subjects and skills',
            tags: ['api']
        },
        handler: function(request, reply) {
            subjectNSkillService.getAllCategoriesAndSubjects(request.payload, function(err, res) {
                reply(err ? err : res)
            });
        }
    },
    { // fetch all the sub categories of a category
        method: 'GET',
        path: '/v1/subjectNSkill/getSubCategoriesOfCategory/{category_id}',
        config: {
            description: 'API for user to the sub categories of a specific category',
            notes: 'API for user to the sub categories of a specific category',
            tags: ['api'],
            validate: {
                params: {
                    category_id: Utils.Joi.string().trim().required().label('Parent id')
                },
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {
            subjectNSkillService.getSubCategoriesOfCategory(request.params, function(err, res) {
                reply(err ? err : res)
            });
        }
    },
    { // fetch all the skills under sub category
        method: 'GET',
        path: '/v1/subjectNSkill/getSkillsOfSubCategories/{subcategoryId}',
        config: {
            description: 'API for user to fetch all the skills under sub category',
            notes: 'API for user to fetch all the skills under sub category',
            tags: ['api'],
            validate: {
                params: {
                    subcategoryId: Utils.Joi.string().trim().required().label('Parent id')
                },
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {
            subjectNSkillService.getSkillsOfSubCategories(request.params, function(err, res) {
                reply(err ? err : res)
            });
        }
    },
    { // fetch all the skills under sub category
        method: 'GET',
        path: '/v1/subjectNSkill/getAddedSkillsOfUser/{subcategoryId}',
        config: {
            description: 'API for user to fetch all the added skills according to the selected subject',
            tags: ['api'],
            pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
            validate: {
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),
                params: {
                    subcategoryId: Utils.Joi.string().trim().required().label('Parent id')
                },
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {

            request.params.userId = request.pre.verify._id;

            subjectNSkillService.getAddedSkillsOfUser(request.params, function(err, res) {
                reply(err ? err : res)
            });
        }
    },
    { // fetch all the skills
        method: 'GET',
        path: '/v1/subjectNSkill/getAllAvailableSkills',
        config: {
            description: 'API for user to fetch all available skills',
            tags: ['api'],
            validate: {
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {
            subjectNSkillService.getAllAvailableSkills(request.params, function(err, res) {
                reply(err ? err : res)
            });
        }
    },
    { // fetch all the categories
        method: 'GET',
        path: '/v1/subjectNSkill/getAllSubjects',
        config: {
            description: 'API for user to fetch all the subjects',
            notes: 'API for user to fetch all the subjects',
            tags: ['api']
        },
        handler: function(request, reply) {
            subjectNSkillService.getAllSubjects(request.payload, function(err, res) {
                reply(err ? err : res)
            });
        }
    },
    { // fetch all the categories
        method: 'GET',
        path: '/v1/subjectNSkill/getCategoriesGuruTeaches',
        config: {
            description: 'API for user to fetch categories that guru teachers',
            notes: 'guruId is user id for which subjects need to be fetched',
            tags: ['api'],
            pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
            validate: {
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),
                query: {
                    guruId: Utils.Joi.string().allow('')
                },
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {
            var userDetails = request.pre.verify;

            subjectNSkillService.getCategoriesGuruTeaches(request.query, userDetails, function(err, res) {
                reply(err ? err : res)
            });
        }
    },
    {
        method: 'GET',
        path: '/v1/subjectNSkill/getSubjectsGuruTeaches',
        config: {
            description: 'API for user to fetch subejcts that guru teachers for particular category',
            notes: 'guruId is user id for which skills need to be fetched',
            tags: ['api'],
            pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
            validate: {
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),
                query: {
                    guruId: Utils.Joi.string().allow(''),
                    categoryId: Utils.Joi.string().required()
                },
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {
            var userDetails = request.pre.verify;

            subjectNSkillService.getSubjectsGuruTeaches(request.query, userDetails, function(err, res) {
                reply(err ? err : res)
            });
        }
    },

    {
        method: 'GET',
        path: '/v1/subjectNSkill/getSkillsGuruTeaches',
        config: {
            description: 'API for user to fetch skills that guru teachers for particular subject',
            notes: 'guruId is user id for which skills need to be fetched',
            tags: ['api'],
            pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
            validate: {
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),
                query: {
                    guruId: Utils.Joi.string().allow(''),
                    subjectId: Utils.Joi.string().required()
                },
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {
            var userDetails = request.pre.verify;

            subjectNSkillService.getSkillsGuruTeaches(request.query, userDetails, function(err, res) {
                reply(err ? err : res)
            });
        }
    },


    { // fetch all the categories
        method: 'GET',
        path: '/v1/subjectNSkill/getSubjectsForFilters',
        config: {
            description: 'API for user to get only subjects that they have given/taken lessons for',
            notes: "api used for scheduled/completed lessons subject filters",
            tags: ['api'],
            pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
            validate: {
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {
            var userDetails = request.pre.verify;

            subjectNSkillService.getSubjectsForFilters(request.query, userDetails, function(err, res) {
                reply(err ? err : res)
            });
        }
    },

    { // fetch all the categories
        method: 'GET',
        path: '/v1/subjectNSkill/searchSkill',
        config: {
            description: 'API for user to search skill on index page',
            tags: ['api'],
            validate: {
                query: {
                    search: Utils.Joi.string().optional()
                },
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {
            var userDetails = request.pre.verify;

            subjectNSkillService.searchSkill(request.query, function(err, res) {
                reply(err ? err : res)
            });
        }
    },

];