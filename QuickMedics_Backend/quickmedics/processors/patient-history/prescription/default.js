'use strict'

const communication = require('../../../utils/communication')
const logger = require('@open-age/logger')('processors:user:crete')
const webConfig = require('config').get('webServer')

const process = async (data, context) => {
    const log = logger.start('process')

    const patient = await db.users.findById(data.patientId)
    const doctor = await db.users.findById(data.doctorId)

    const content = {
        template: 'patientHistory-prescription',
        data: {
            prescriptionId: data.prescriptionId,
            allPrescription: data.allPrescription,
            doctorName: doctor.firstName.charAt(0).toUpperCase() + doctor.firstName.slice(1) + " " + doctor.lastName,
            gmcNumber: doctor.gmcNumber,
            address: doctor.fullAddress ? doctor.fullAddress : "-"
        }
    }
    context.logger = log
    communication.forward(patient, content, context)

    log.end()
    return Promise.resolve()
}

exports.process = process