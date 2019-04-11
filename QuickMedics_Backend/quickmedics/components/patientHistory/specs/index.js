'use strict'
const validator = require('../validator')
const context = require('../../../utils/context-builder')

module.exports = {
    insertActiveProblems: {
        description: 'Insert active problems of the patient.Step-1 during call',
        notes: 'insert active problems,problem must be Id of the diagnosis,problemType is major,minor..',
        tags: ['api', 'patientHistory'],
        pre: [{
            method: context.validateToken,
            assign: 'token'
        }],
        validate: {
            headers: validator.header,
            payload: validator.insertActiveProblems.payload,
            failAction: response.failAction
        }
    },
    fetchMedicalProblems: {
        description: 'Fetch active problems of the patient.Step-1 during call',
        notes: 'fetch active problems.isActive -true to fetch active history,false to fetch past medical history',
        tags: ['api', 'patientHistory'],
        pre: [{
            method: context.validateToken,
            assign: 'token'
        }],
        validate: {
            headers: validator.header,
            query: validator.fetchMedicalProblems.query,
            failAction: response.failAction
        }
    },
    moveMedicalProblem: {
        description: 'To move the medical problem in past',
        notes: 'Move the history in the past.Send the corresponding id of the history',
        tags: ['api', 'patientHistory'],
        pre: [{
            method: context.validateToken,
            assign: 'token'
        }],
        validate: {
            headers: validator.header,
            payload: validator.moveMedicalProblem.payload,
            failAction: response.failAction
        }
    },
    addUsersAllergy: {
        description: 'To add allergies of the user.',
        notes: 'add allergies',
        tags: ['api', 'patientHistory'],
        pre: [{
            method: context.validateToken,
            assign: 'token'
        }],
        validate: {
            headers: validator.header,
            payload: validator.addUsersAllergy.payload,
            failAction: response.failAction
        }
    },
    fetchAllergiesOfUser: {
        description: 'To fetch all the allergies of a user',
        notes: 'fetch allergies',
        tags: ['api', 'patientHistory'],
        pre: [{
            method: context.validateToken,
            assign: 'token'
        }],
        validate: {
            headers: validator.header,
            query: validator.fetchAllergiesOfUser.query,
            failAction: response.failAction
        }
    },
    insertDiagnosisInDb: {
        description: 'Insert all diagnosis from NHS to db.',
        notes: 'One time use only.',
        tags: ['api', 'patientHistory'],
        pre: [{
            method: context.validateToken,
            assign: 'token'
        }],
        validate: {
            headers: validator.header,
            failAction: response.failAction
        }
    },
    fetchAllDiagnosis: {
        description: 'Fetch all diagnosis that are in DB.',
        notes: 'user can also search for diagnosis.',
        tags: ['api', 'patientHistory'],
        pre: [{
            method: context.validateToken,
            assign: 'token'
        }],
        validate: {
            headers: validator.header,
            query: validator.fetchAllDiagnosis.query,
            failAction: response.failAction
        }
    },
    fetchAllAllergies: {
        description: 'Fetch all allergies that are in DB.',
        notes: 'user can also search for allergies.',
        tags: ['api', 'patientHistory'],
        pre: [{
            method: context.validateToken,
            assign: 'token'
        }],
        validate: {
            headers: validator.header,
            query: validator.fetchAllAllergies.query,
            failAction: response.failAction
        }
    },
    fetchAllVaccines: {
        description: 'Fetch all vaccines that are in DB.',
        notes: 'user can also search for vaccines.',
        tags: ['api', 'patientHistory'],
        pre: [{
            method: context.validateToken,
            assign: 'token'
        }],
        validate: {
            headers: validator.header,
            query: validator.fetchAllVaccines.query,
            failAction: response.failAction
        }
    },
    fetchAllManufacturers: {
        description: 'Fetch all manufacturers that are in DB.',
        notes: 'user can also search for manufacturers.',
        tags: ['api', 'patientHistory'],
        pre: [{
            method: context.validateToken,
            assign: 'token'
        }],
        validate: {
            headers: validator.header,
            query: validator.fetchAllManufacturers.query,
            failAction: response.failAction
        }
    },
    addCurrentConsult: {
        description: 'Add current consult.',
        notes: 'Send type 3-current consult history,4-assesment findings,6-treatment,7-follow up.',
        tags: ['api', 'patientHistory'],
        pre: [{
            method: context.validateToken,
            assign: 'token'
        }],
        validate: {
            headers: validator.header,
            payload: validator.addCurrentConsult.payload,
            failAction: response.failAction
        }
    },
    fetchCurrentConsult: {
        description: 'Fetch current consult.',
        notes: 'Send type 3-current consult history,4-assesment findings,6-treatment,7-follow up.',
        tags: ['api', 'patientHistory'],
        pre: [{
            method: context.validateToken,
            assign: 'token'
        }],
        validate: {
            headers: validator.header,
            query: validator.fetchCurrentConsult.query,
            failAction: response.failAction
        }
    },
    addUserDiagnosis: {
        description: 'Add users diagnosis under current consult.',
        notes: 'Add users diagnosis under current consult.',
        tags: ['api', 'patientHistory'],
        pre: [{
            method: context.validateToken,
            assign: 'token'
        }],
        validate: {
            headers: validator.header,
            payload: validator.addUserDiagnosis.payload,
            failAction: response.failAction
        }
    },
    fetchUserDiagnosis: {
        description: 'Fetch users diagnosis under current consult.',
        notes: 'Fetch users diagnosis under current consult.',
        tags: ['api', 'patientHistory'],
        pre: [{
            method: context.validateToken,
            assign: 'token'
        }],
        validate: {
            headers: validator.header,
            query: validator.fetchUserDiagnosis.query,
            failAction: response.failAction
        }
    },
    enterFamilyHistory: {
        description: 'Add family history under current consult.',
        notes: 'Add family history under current consult.',
        tags: ['api', 'patientHistory'],
        pre: [{
            method: context.validateToken,
            assign: 'token'
        }],
        validate: {
            headers: validator.header,
            payload: validator.enterFamilyHistory.payload,
            failAction: response.failAction
        }
    },
    fetchFamilyHistory: {
        description: 'Fetch family history under current consult.',
        notes: 'Fetch family history under current consult.',
        tags: ['api', 'patientHistory'],
        pre: [{
            method: context.validateToken,
            assign: 'token'
        }],
        validate: {
            headers: validator.header,
            query: validator.fetchFamilyHistory.query,
            failAction: response.failAction
        }
    },
    addVaccinations: {
        description: 'Add vaccination under current consult.',
        notes: 'vaccination is free text.',
        tags: ['api', 'patientHistory'],
        pre: [{
            method: context.validateToken,
            assign: 'token'
        }],
        validate: {
            headers: validator.header,
            payload: validator.addVaccinations.payload,
            failAction: response.failAction
        }
    },
    fetchVaccinationsOfUser: {
        description: 'Fetch vaccinations under current consult.',
        notes: 'Fetch vaccinations under current consult.',
        tags: ['api', 'patientHistory'],
        pre: [{
            method: context.validateToken,
            assign: 'token'
        }],
        validate: {
            headers: validator.header,
            query: validator.fetchVaccinationsOfUser.query,
            failAction: response.failAction
        }
    },
    viewCurrentConsult: {
        description: 'Fetch all history,findings.. under current consult for that day and doctor.',
        notes: 'Fetch all history,findings.. under current consult for that day and doctor',
        tags: ['api', 'patientHistory'],
        pre: [{
            method: context.validateToken,
            assign: 'token'
        }],
        validate: {
            headers: validator.header,
            query: validator.viewCurrentConsult.query,
            failAction: response.failAction
        }
    },
    insertMedicinesInDb: {
        description: 'Insert medicines from NHS to db',
        tags: ['api', 'patientHistory'],
        pre: [{
            method: context.validateToken,
            assign: 'token'
        }],
        validate: {
            headers: validator.header,
            failAction: response.failAction
        }
    },
    addNewPrescription: {
        description: 'Add new prescription.',
        tags: ['api', 'patientHistory'],
        pre: [{
            method: context.validateToken,
            assign: 'token'
        }],
        validate: {
            headers: validator.header,
            payload: validator.addNewPrescription.payload,
            failAction: response.failAction
        }
    },
    fetchAllMedicines: {
        description: 'Fetch and search medicines stored in DB.',
        tags: ['api', 'patientHistory'],
        pre: [{
            method: context.validateToken,
            assign: 'token'
        }],
        validate: {
            headers: validator.header,
            query: validator.fetchAllMedicines.query,
            failAction: response.failAction
        }
    },
    fetchAllMedicinesOfUser: {
        description: 'Fetch all medicines that are prescribed to the user.',
        notes: "To show in previous prescriptions tab",
        tags: ['api', 'patientHistory'],
        pre: [{
            method: context.validateToken,
            assign: 'token'
        }],
        validate: {
            headers: validator.header,
            query: validator.fetchAllMedicinesOfUser.query,
            failAction: response.failAction
        }
    },
    fetchAllPrescriptionsOfUser: {
        description: 'Fetch all prescriptions that are prescribed to the user.',
        notes: "To show in previous prescriptions tab",
        tags: ['api', 'patientHistory'],
        pre: [{
            method: context.validateToken,
            assign: 'token'
        }],
        validate: {
            headers: validator.header,
            query: validator.fetchAllPrescriptionsOfUser.query,
            failAction: response.failAction
        }
    },
    addMedicationHistory: {
        description: 'Doctor will add medications that are assigned outside the platform.',
        notes: "Medication history Tab 3 under medications",
        tags: ['api', 'patientHistory'],
        pre: [{
            method: context.validateToken,
            assign: 'token'
        }],
        validate: {
            headers: validator.header,
            payload: validator.addMedicationHistory.payload,
            failAction: response.failAction
        }
    },
    fetchAllMedicationHistory: {
        description: 'Fetch medications that are assigned outside the platform.',
        notes: "Medication history Tab 3 under medications",
        tags: ['api', 'patientHistory'],
        pre: [{
            method: context.validateToken,
            assign: 'token'
        }],
        validate: {
            headers: validator.header,
            query: validator.fetchAllMedicationHistory.query,
            failAction: response.failAction
        }
    },
    addFitNote: {
        description: 'Api to refer a new fit note to the user.',
        notes: "Email will be sent to the patient",
        tags: ['api', 'patientHistory'],
        pre: [{
            method: context.validateToken,
            assign: 'token'
        }],
        validate: {
            headers: validator.header,
            payload: validator.addFitNote.payload,
            failAction: response.failAction
        }
    },
    addReferrals: {
        description: 'Api to add specialist referals.',
        notes: "Email will be sent to the patient",
        tags: ['api', 'patientHistory'],
        pre: [{
            method: context.validateToken,
            assign: 'token'
        }],
        validate: {
            headers: validator.header,
            payload: validator.addReferrals.payload,
            failAction: response.failAction
        }
    },
    addPathology: {
        description: 'Api to add pathology - investigations.',
        tags: ['api', 'patientHistory'],
        pre: [{
            method: context.validateToken,
            assign: 'token'
        }],
        validate: {
            headers: validator.header,
            payload: validator.addPathology.payload,
            failAction: response.failAction
        }
    },
    addRadiology: {
        description: 'Api to add radiology - investigations.',
        tags: ['api', 'patientHistory'],
        pre: [{
            method: context.validateToken,
            assign: 'token'
        }],
        validate: {
            headers: validator.header,
            payload: validator.addRadiology.payload,
            failAction: response.failAction
        }
    },
    fetchAllCorrespondence: {
        description: 'Api to fetch all correspondence of the user to this relation',
        tags: ['api', 'patientHistory'],
        pre: [{
            method: context.validateToken,
            assign: 'token'
        }],
        validate: {
            headers: validator.header,
            query: validator.fetchAllCorrespondence.query,
            failAction: response.failAction
        }
    },
    fetchChargesStatus: {
        description: 'Api to fetch the status of buttons on prescriptions, fitnote and referrals',
        notes: "use this api whenever user visits any of the page",
        tags: ['api', 'patientHistory'],
        pre: [{
            method: context.validateToken,
            assign: 'token'
        }],
        validate: {
            headers: validator.header,
            query: validator.fetchChargesStatus.query,
            failAction: response.failAction
        }
    },
    makePaymentForFitNoteReferral: {
        description: 'Api for making payments for referring prescriptions fitnote,referrals',
        notes: "Only payment will be credited from here no amount will be transfered to doctor till this time.",
        tags: ['api', 'patientHistory'],
        pre: [{
            method: context.validateToken,
            assign: 'token'
        }],
        validate: {
            headers: validator.header,
            payload: validator.makePaymentForFitNoteReferral.payload,
            failAction: response.failAction
        }
    }
}