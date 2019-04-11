/**
author : Simran
created_on : 21 Nov 2018
**/
'use strict'
const api = require('../api')
const specs = require('../specs')

module.exports = [{
    method: 'POST',
    path: '/api/degree/addDegree',
    options: specs.addDegree,
    handler: api.addDegree
}, {
    method: 'GET',
    path: '/api/degree/fetchDegrees',
    options: specs.fetchDegrees,
    handler: api.fetchDegrees
}]