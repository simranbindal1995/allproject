'use strict'

const moment = require('moment')

exports.configure = (user) => {
    user.pre('findOneAndUpdate', function(next) {
        this.findOneAndUpdate({}, { lastProfileUpdatedTime: moment().unix() })
        next()
    })

    user.post('save', async (doc) => {})

    user.pre('find', function(next) {
        next()
    })

    user.pre('findOne', function(next) {
        next()
    })
}