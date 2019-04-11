'use strict'
const validator = require('../validator')
const context = require('../../../utils/context-builder')

module.exports = {
    addCard: {
        description: 'Add new card.',
        notes: 'Send stripe token for saving the card details obtained from frontend or stripe dashboard',
        tags: ['api', 'payment'],
        pre: [{
            method: context.validateToken,
            assign: 'token'
        }],
        validate: {
            headers: validator.header,
            payload: validator.addCard.payload,
            failAction: response.failAction
        }
    },
    addBankAccount: {
        description: 'Add bank details.',
        notes: 'Send all the required information',
        tags: ['api', 'payment'],
        pre: [{
            method: context.validateToken,
            assign: 'token'
        }],
        validate: {
            headers: validator.header,
            payload: validator.addBankAccount.payload,
            failAction: response.failAction
        }
    },
    listAllCards: {
        description: 'List all cards of user.',
        notes: 'List all cards from payment gateway',
        tags: ['api', 'payment'],
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