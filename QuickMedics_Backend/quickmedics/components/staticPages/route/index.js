'use strict'
const api = require('../api')
const specs = require('../specs')

module.exports = [{
        method: 'POST',
        path: '/api/admin/addStaticPageData',
        options: specs.addStaticPageData,
        handler: api.addStaticPageData
    },
    {
        method: 'POST',
        path: '/api/admin/addFaq',
        options: specs.addFaq,
        handler: api.addFaq
    },
    {
        method: 'GET',
        path: '/api/admin/fetchStaticPages',
        options: specs.fetchStaticPages,
        handler: api.fetchStaticPages
    },

]