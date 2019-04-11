'use strict'
const validator = require('../validator')
const context = require('../../../utils/context-builder')

module.exports = {
    addStaticPageData: {
        description: 'API for admin to add/update content of static pages',
        notes: ' API to add  update all the static pages except FAQ 1- about us ,3-privacy policy,4-copyright policy,5-user agreement,6-terms & conditions,7-deleteAccountTerms,8-user concent',
        tags: ['api', 'admin'],
        pre: [{
            method: context.validateToken,
            assign: 'token'
        }],
        validate: {
            headers: validator.header,
            payload: validator.addStaticPageData.payload,
            failAction: response.failAction
        }
    },
    addFaq : {
        description: 'API for adding updating FAQ',
        notes : "Pass question id in case of update",
        tags: ['api', 'admin'],
        pre: [{
            method: context.validateToken,
            assign: 'token'
        }],
        validate: {
            headers: validator.header,
            payload: validator.addFaq.payload,
            failAction: response.failAction
        }
    },
    fetchStaticPages: {
        description: 'API for fetching static data content',
        notes: ' API for all to fetch static Data 1- about us,2-FAQ ,3-privacy policy,4-copyright policy,5-user agreement,6-terms & conditions,7-deleteAccountTerms,8-user concent',
        tags: ['api', 'admin'],
        validate: {
            query: validator.fetchStaticPages.query,
            failAction: response.failAction
        }
    }
}