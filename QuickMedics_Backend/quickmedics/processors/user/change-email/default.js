'use strict'

const communication = require('../../../utils/communication')
const logger = require('@open-age/logger')('processors:user:crete')
const webConfig = require('config').get('webServer')

const process = async (data, context) => {
    const log = logger.start('process')

    const user = await db.users.findById(data.id)

    const content = {
        template: 'user-change-email',
        data: {
            name: user.firstName,
            email: user.secondaryEmails[user.secondaryEmails.length - 1],
            link: `${webConfig.url}/api/users/secondaryEmail/verify?token=${user.emailVerifyToken}`
        }
    }
    context.logger = log

    user.email = user.secondaryEmails[user.secondaryEmails.length - 1]

    communication.forward(user, content, context)

    log.end()
    return Promise.resolve()
}

exports.process = process