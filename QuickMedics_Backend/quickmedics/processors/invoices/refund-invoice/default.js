'use strict'

const communication = require('../../../utils/communication')
const logger = require('@open-age/logger')('processors:user:crete')
const webConfig = require('config').get('webServer')

const process = async (data, context) => {
    const log = logger.start('process')

    const patient = await db.users.findById(data.patientId)
    const content = {
        template: 'invoices-refund',
        data: {
            name: patient.firstName.charAt(0).toUpperCase() + patient.firstName.slice(1),
            reason: data.reason,
            charges: data.charges
        }
    }
    context.logger = log
    communication.forward(patient, content, context)

    log.end()
    return Promise.resolve()
}

exports.process = process