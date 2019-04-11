'use strict'
const api = require('../api')
const specs = require('../specs')

module.exports = [{
        method: 'POST',
        path: '/api/history/insertActiveProblems',
        options: specs.insertActiveProblems,
        handler: api.insertActiveProblems
    }, {
        method: 'GET',
        path: '/api/history/fetchMedicalProblems',
        options: specs.fetchMedicalProblems,
        handler: api.fetchMedicalProblems
    }, {
        method: 'POST',
        path: '/api/history/moveMedicalProblem',
        options: specs.moveMedicalProblem,
        handler: api.moveMedicalProblem
    }, {
        method: 'POST',
        path: '/api/history/addUsersAllergy',
        options: specs.addUsersAllergy,
        handler: api.addUsersAllergy
    }, {
        method: 'GET',
        path: '/api/history/fetchAllergiesOfUser',
        options: specs.fetchAllergiesOfUser,
        handler: api.fetchAllergiesOfUser
    },
    {
        method: 'GET',
        path: '/api/history/fetchAllDiagnosis',
        options: specs.fetchAllDiagnosis,
        handler: api.fetchAllDiagnosis
    },
    {
        method: 'GET',
        path: '/api/history/fetchAllAllergies',
        options: specs.fetchAllAllergies,
        handler: api.fetchAllAllergies
    },
    {
        method: 'GET',
        path: '/api/history/fetchAllVaccines',
        options: specs.fetchAllVaccines,
        handler: api.fetchAllVaccines
    },
    {
        method: 'GET',
        path: '/api/history/fetchAllManufacturers',
        options: specs.fetchAllManufacturers,
        handler: api.fetchAllManufacturers
    },
    {
        method: 'POST',
        path: '/api/history/addCurrentConsult',
        options: specs.addCurrentConsult,
        handler: api.addCurrentConsult
    },
    {
        method: 'GET',
        path: '/api/history/fetchCurrentConsult',
        options: specs.fetchCurrentConsult,
        handler: api.fetchCurrentConsult
    },
    {
        method: 'POST',
        path: '/api/history/addUserDiagnosis',
        options: specs.addUserDiagnosis,
        handler: api.addUserDiagnosis
    },
    {
        method: 'GET',
        path: '/api/history/fetchUserDiagnosis',
        options: specs.fetchUserDiagnosis,
        handler: api.fetchUserDiagnosis
    },
    {
        method: 'POST',
        path: '/api/history/enterFamilyHistory',
        options: specs.enterFamilyHistory,
        handler: api.enterFamilyHistory
    },
    {
        method: 'GET',
        path: '/api/history/fetchFamilyHistory',
        options: specs.fetchFamilyHistory,
        handler: api.fetchFamilyHistory
    },
    {
        method: 'POST',
        path: '/api/history/addVaccinations',
        options: specs.addVaccinations,
        handler: api.addVaccinations
    },
    {
        method: 'GET',
        path: '/api/history/fetchVaccinationsOfUser',
        options: specs.fetchVaccinationsOfUser,
        handler: api.fetchVaccinationsOfUser
    },
    {
        method: 'GET',
        path: '/api/history/viewCurrentConsult',
        options: specs.viewCurrentConsult,
        handler: api.viewCurrentConsult
    },
    {
        method: 'POST',
        path: '/api/history/addNewPrescription',
        options: specs.addNewPrescription,
        handler: api.addNewPrescription
    },
    {
        method: 'GET',
        path: '/api/history/fetchAllMedicines',
        options: specs.fetchAllMedicines,
        handler: api.fetchAllMedicines
    },
    {
        method: 'GET',
        path: '/api/history/fetchAllMedicinesOfUser',
        options: specs.fetchAllMedicinesOfUser,
        handler: api.fetchAllMedicinesOfUser
    },
    {
        method: 'GET',
        path: '/api/history/fetchAllPrescriptionsOfUser',
        options: specs.fetchAllPrescriptionsOfUser,
        handler: api.fetchAllPrescriptionsOfUser
    },
    {
        method: 'POST',
        path: '/api/history/addMedicationHistory',
        options: specs.addMedicationHistory,
        handler: api.addMedicationHistory
    },
    {
        method: 'GET',
        path: '/api/history/fetchAllMedicationHistory',
        options: specs.fetchAllMedicationHistory,
        handler: api.fetchAllMedicationHistory
    },
    {
        method: 'POST',
        path: '/api/history/addFitNote',
        options: specs.addFitNote,
        handler: api.addFitNote
    },
    {
        method: 'POST',
        path: '/api/history/addReferrals',
        options: specs.addReferrals,
        handler: api.addReferrals
    },
    {
        method: 'POST',
        path: '/api/history/addPathology',
        options: specs.addPathology,
        handler: api.addPathology
    },
    {
        method: 'POST',
        path: '/api/history/addRadiology',
        options: specs.addRadiology,
        handler: api.addRadiology
    },
    {
        method: 'GET',
        path: '/api/history/fetchAllCorrespondence',
        options: specs.fetchAllCorrespondence,
        handler: api.fetchAllCorrespondence
    }, {
        method: 'GET',
        path: '/api/history/fetchChargesStatus',
        options: specs.fetchChargesStatus,
        handler: api.fetchChargesStatus
    },
    {
        method: 'POST',
        path: '/api/history/makePaymentForPrescriptionFitNoteReferral',
        options: specs.makePaymentForFitNoteReferral,
        handler: api.makePaymentForFitNoteReferral
    }
    // {
    //     method: 'POST',
    //     path: '/api/history/insertMedicinesInDb',
    //     options: specs.insertMedicinesInDb,
    //     handler: api.insertMedicinesInDb
    // }
    // {
    //     method: 'POST',
    //     path: '/api/history/insertDiagnosisInDb',
    //     options: specs.insertDiagnosisInDb,
    //     handler: api.insertDiagnosisInDb
    // }
]