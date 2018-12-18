/*
 * @description: This file defines skills that guru teaches including example courses
 * @date: 28 March 2018
 * @author: Simran
 * */


'use strict';

// include utils module

var Utils = require('../../../utils/index');
var skillsService = require('../services/index');


module.exports = [{ // add skills that guru teaches
        method: 'POST',
        path: '/v1/SkillsGuruTeaches/addSkilsInProfile',
        config: {
            description: 'API to update the skills that guru teachs in the profile',
            //notes: "<b> Type -1 if adding skill , type-2 if adding example courses </b>",
            pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
            tags: ['api'],
            validate: {
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),
                payload: {
                    skillId: Utils.Joi.array().required()
                },
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {

            request.payload.userId = request.pre.verify._id;

            skillsService.addSkilsInProfile(request.payload, function(err, res) {
                reply(err ? err : res)
            });
        }
    },
    { // add example courses of the guru
        method: 'POST',
        path: '/v1/SkillsGuruTeaches/addExampleCourses',
        config: {
            description: 'API to add the example courses of the guru.',
            //notes: "<b> Type -1 if adding skill , type-2 if adding example courses </b>",
            pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
            tags: ['api'],
            validate: {
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),
                payload: {
                    skillId: Utils.Joi.array().required(),
                    description : Utils.Joi.string().required(),
                    duration : Utils.Joi.string().required()
                },
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {

            request.payload.userId = request.pre.verify._id;

            skillsService.addExampleCourses(request.payload, function(err, res) {
                reply(err ? err : res)
            });
        }
    },
    { // add skills that guru teaches
        method: 'PUT',
        path: '/v1/SkillsGuruTeaches/deleteSkillsFromProfile',
        config: {
            description: 'API to delete the skills that guru teachs in the profile',
            pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
            tags: ['api'],
            validate: {
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),
                payload: {
                    subjectId: Utils.Joi.string().required()
                },
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {

            request.payload.userId = request.pre.verify._id;

            skillsService.deleteSkillsFromProfile(request.payload, function(err, res) {
                reply(err ? err : res)
            });
        }
    },
     { // add skills that guru teaches
        method: 'PUT',
        path: '/v1/SkillsGuruTeaches/updateSkillAgeRange',
        config: {
            description: 'API to edit the age range of the skill guru teaches',
            pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
            tags: ['api'],
            validate: {
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),
                payload: {
                    subjectId: Utils.Joi.string().required(),
                    startAge: Utils.Joi.number().required(),
                    endAge: Utils.Joi.number().required()
                },
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {

            request.payload.userId = request.pre.verify._id;

            skillsService.updateSkillAgeRange(request.payload, function(err, res) {
                reply(err ? err : res)
            });
        }
    },
    { // add skills that guru teaches
        method: 'PUT',
        path: '/v1/SkillsGuruTeaches/updateExampleCourseAgeRange',
        config: {
            description: 'API to edit the age range of the example course',
            pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
            tags: ['api'],
            validate: {
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),
                payload: {
                    subjectId: Utils.Joi.string().required(),
                    startAge: Utils.Joi.number().required(),
                    endAge: Utils.Joi.number().required()
                },
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {

            request.payload.userId = request.pre.verify._id;

            skillsService.updateExampleCourseAgeRange(request.payload, function(err, res) {
                reply(err ? err : res)
            });
        }
    },
    { // add skills that guru teaches
        method: 'PUT',
        path: '/v1/SkillsGuruTeaches/deleteExampleCourse',
        config: {
            description: 'API to delete the example courses',
            pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
            tags: ['api'],
            validate: {
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),
                payload: {
                    subjectId: Utils.Joi.string().required()
                },
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {

            request.payload.userId = request.pre.verify._id;

            skillsService.deleteExampleCourse(request.payload, function(err, res) {
                reply(err ? err : res)
            });
        }
    },
     { // add skills that guru teaches
        method: 'PUT',
        path: '/v1/SkillsGuruTeaches/deleteParticularSkillFromProfile',
        config: {
            description: 'API to delete a particular skill from skills guru teaches ',
            pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
            tags: ['api'],
            validate: {
                headers: Utils.Joi.object({
                    'x-logintoken': Utils.Joi.string().required().trim()
                }).options({ allowUnknown: true }),
                payload: {
                    skillId: Utils.Joi.string().required()
                },
                failAction: Utils.universalFunctions.failActionFunction
            }
        },
        handler: function(request, reply) {

            request.payload.userId = request.pre.verify._id;

            skillsService.deleteParticularSkillFromProfile(request.payload, function(err, res) {
                reply(err ? err : res)
            });
        }
    },
];