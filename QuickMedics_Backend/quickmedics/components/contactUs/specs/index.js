'use strict'
const validator = require('../validator')
const context = require('../../../utils/context-builder')

module.exports = {
    contactUs: {
        description: 'Add query for contact us',
        tags: ['api', 'contactUs'],
        validate: {
            payload: validator.contactUs.payload,
            failAction: response.failAction
        }
    },
    fetchContactUs: {
        description: 'Fetch contact us queries',
        tags: ['api', 'contactUs'],
        pre: [{
            method: context.validateToken,
            assign: 'token'
        }],
        validate: {
            headers: validator.header,
            query: validator.fetchContactUs.query,
            failAction: response.failAction
        }
    },
    feedback: {
        description: 'Give feedback',
        tags: ['api', 'contactUs'],
        validate: {
            headers: validator.header,
            payload: validator.feedback.payload,
            failAction: response.failAction
        }
    }
}