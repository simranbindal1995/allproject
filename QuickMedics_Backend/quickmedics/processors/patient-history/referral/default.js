'use strict'

const communication = require('../../../utils/communication')
const logger = require('@open-age/logger')('processors:user:crete')
const webConfig = require('config').get('webServer')

const process = async (data, context) => {
    const log = logger.start('process')

    const patient = await db.users.findById(data.patientId)
    const doctor = await db.users.findById(data.doctorId)

    const content = {
        template: 'patientHistory-referral',
        data: {
            doctorName: data.doctorName,
            hospital: data.hospital,
            name: patient.firstName.charAt(0).toUpperCase() + patient.firstName.slice(1) + " " + patient.lastName,
            dob: patient.dob ? moment(patient.dob * 1000).format("MMM Do YY") : "-",
            address: patient.fullAddress,
            nhsNumber: patient.nhsNumber ? patient.nhsNumber : "-",
            message: data.message,
            doctorName: doctor.firstName.charAt(0).toUpperCase() + doctor.firstName.slice(1) + " " + doctor.lastName,
            gmcNumber: doctor.gmcNumber,
            currentConsult: data.currentConsult ? data.currentConsult : "-",
            medications: data.medications ? data.medications : "-",
            medicalHistory: data.medicalHistory ? data.medicalHistory : "-",
            allergies: data.allergies ? data.allergies : "-"
        }
    }
    console.log('context=======', content)
    context.logger = log
    communication.forward(patient, content, context)

    log.end()
    return Promise.resolve()
}

exports.process = process