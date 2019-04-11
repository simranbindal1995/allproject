'use strict'

const communication = require('../../../utils/communication')
const logger = require('@open-age/logger')('processors:user:crete')
const webConfig = require('config').get('webServer')

const process = async (data, context) => {
    const log = logger.start('process')

    const patient = await db.users.findById(data.patientId)
    const doctor = await db.users.findById(data.doctorId)

    const content = {
        template: 'patientHistory-radiology',
        data: {
            name: patient.firstName.charAt(0).toUpperCase() + patient.firstName.slice(1) + " " + patient.lastName,
            dob: patient.dob ? moment(patient.dob * 1000).format("MMM Do YY") : "-",
            address: patient.fullAddress,
            nhsNumber: patient.nhsNumber ? patient.nhsNumber : "-",
            test: data.test,
            clinicalInfo: clinicalInfo,
            doctorName: doctor.firstName.charAt(0).toUpperCase() + doctor.firstName.slice(1) + " " + doctor.lastName,
            gmcNumber: doctor.gmcNumber,
        }
    }
    context.logger = log
    communication.forward(patient, content, context)

    log.end()
    return Promise.resolve()
}

exports.process = process