'use strict'
const validator = require('../validator')
const context = require('../../../utils/context-builder')

module.exports = {
    addDegree: {
        description: 'Add new degree',
        notes: 'add degrees',
        tags: ['api', 'degree'],
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
            payload: validator.addDegree.payload,
            failAction: response.failAction
        }
    },
    fetchDegrees: {
        description: 'Fetch degrees',
        notes: 'fetch degress',
        tags: ['api', 'degree'],
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