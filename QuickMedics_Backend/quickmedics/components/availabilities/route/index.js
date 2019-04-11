/**
author : Simran
created_on : 27 Nov 2018
**/

'use strict'
const api = require('../api')
const specs = require('../specs')

module.exports = [{
    method: 'POST',
    path: '/api/availability/addAvailability',
    options: specs.addAvailability,
    handler: api.addAvailability
}, {
    method: 'POST',
    path: '/api/availability/editAvailability',
    options: specs.editAvailability,
    handler: api.editAvailability
}, {
    method: 'GET',
    path: '/api/availability/fetchAllAvailabilities',
    options: specs.fetchAllAvailabilities,
    handler: api.fetchAllAvailabilities
}, {
    method: 'GET',
    path: '/api/availability/fetchAvailabilitiesDateWise',
    options: specs.fetchAvailabilitiesDateWise,
    handler: api.fetchAvailabilitiesDateWise
}]