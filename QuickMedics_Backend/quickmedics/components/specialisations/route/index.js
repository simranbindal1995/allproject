/**
author : Simran
created_on : 21 Nov 2018
**/
'use strict'
const api = require('../api')
const specs = require('../specs')

module.exports = [{
    method: 'POST',
    path: '/api/specialisation/enterSpecialisation',
    options: specs.enterSpecialisation,
    handler: api.enterSpecialisation
}, {
    method: 'GET',
    path: '/api/specialisation/fetchSpecialisations',
    options: specs.fetchSpecialisations,
    handler: api.fetchSpecialisations
}]