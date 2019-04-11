'use strict'
const validator = require('../validator')
const context = require('../../../utils/context-builder')

module.exports = {
    enterSpecialisation: {
        description: 'Enter specialisation',
        notes: 'Enter specialisation',
        tags: ['api', 'specialisation'],
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
                        description: 'UnAuthorized User',
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
            payload: validator.enterSpecialisation.payload,
            failAction: response.failAction
        }
    },
    fetchSpecialisations: {
        description: 'Fetch specialisations',
        notes: 'Fetch specialisations',
        tags: ['api', 'specialisation'],
        plugins: {
            'hapi-swagger': {}
        },
        pre: [{
            method: context.validateToken,
            assign: 'token'
        }],
        validate: {
            headers: validator.header,
            failAction: response.failAction
        }
    }
}