'use strict'
const validator = require('../validator')
const context = require('../../../utils/context-builder')

module.exports = {
    addAvailability: {
        description: 'Doctor add availability',
        notes: 'Doctor add availability, send time in number of seconds,daynumber array must be sorted',
        tags: ['api', 'availability'],
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
            payload: validator.addAvailability.payload,
            failAction: response.failAction
        }
    },
    editAvailability: {
        description: 'To edit the availabilities added by the doctor.',
        notes: 'send the _id of the session to be edited.isDeleted -true whwn user deselected all the days.',
        tags: ['api', 'availability'],
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
        validate: {
            headers: validator.header,
            payload: validator.editAvailability.payload,
            failAction: response.failAction
        }
    },
    fetchAllAvailabilities: {
        description: 'To fetch the availabilities of a doctor',
        notes: 'For showing the availabilities added by doctor to himself',
        tags: ['api', 'availability'],
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
            failAction: response.failAction
        }
    },
    fetchAvailabilitiesDateWise: {
        description: 'To fetch the availabilities of a doctor on a particular date.',
        notes: 'For showing the availabilities of a doctor on particular day.',
        tags: ['api', 'availability'],
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
            query: validator.fetchAvailabilitiesDateWise.query,
            failAction: response.failAction
        }
    }
}