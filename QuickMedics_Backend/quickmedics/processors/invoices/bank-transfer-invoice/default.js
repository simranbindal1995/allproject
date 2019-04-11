'use strict'

const communication = require('../../../utils/communication')
const webConfig = require('config').get('webServer')

const process = async (data, context) => {
    const log = logger.start('process')
    const doctor = await db.users.findById(data.doctorId)
    const content = {
        template: 'invoices-bankTransfer',
        data: {
            name: doctor.firstName.charAt(0).toUpperCase() + doctor.firstName.slice(1),
            charges: data.charges,
            reason: data.reason
        }
    }
    context.logger = log
    communication.forward(doctor, content, context)

    log.end()
    return Promise.resolve()
}

exports.process = process