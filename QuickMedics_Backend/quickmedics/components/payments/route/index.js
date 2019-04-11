/**
author : Simran
created_on : 21 Nov 2018
**/
'use strict'
const api = require('../api')
const specs = require('../specs')

module.exports = [{
    method: 'POST',
    path: '/api/stripe/addCard',
    options: specs.addCard,
    handler: api.addCard
}, {
    method: 'POST',
    path: '/api/stripe/addBankAccount',
    options: specs.addBankAccount,
    handler: api.addBankAccount
}, {
    method: 'POST',
    path: '/api/stripe/listAllCards',
    options: specs.listAllCards,
    handler: api.listAllCards
}]