/**
author : Simran
created_on : 21 Nov 2018
**/
'use strict'
const api = require('../api')
const specs = require('../specs')

module.exports = [{
    method: 'POST',
    path: '/api/contactUs/contactUs',
    options: specs.contactUs,
    handler: api.contactUs
}, {
    method: 'GET',
    path: '/api/contactUs/fetchContactUs',
    options: specs.fetchContactUs,
    handler: api.fetchContactUs
},{
    method: 'POST',
    path: '/api/contactUs/feedback',
    options: specs.feedback,
    handler: api.feedback
}]