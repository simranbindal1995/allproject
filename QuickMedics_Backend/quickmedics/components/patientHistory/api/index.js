'use strict'

const service = require('../service')

const insertActiveProblems = async (request, h) => {
    try {
        request.payload.userInfo = request.userInfo
        const message = await service.insertActiveProblems(request.payload)
        return response.success(h, message)
    } catch (err) {
        return response.failure(h, err.message)
    }
}
const fetchMedicalProblems = async (request, h) => {
    try {
        request.query.userInfo = request.userInfo
        const message = await service.fetchMedicalProblems(request.query)
        return response.paged(h, message, message.totalCount)
    } catch (err) {
        return response.failure(h, err.message)
    }
}
const moveMedicalProblem = async (request, h) => {
    try {
        request.payload.userInfo = request.userInfo
        const message = await service.moveMedicalProblem(request.payload)
        return response.success(h, message)
    } catch (err) {
        return response.failure(h, err.message)
    }
}

const addUsersAllergy = async (request, h) => {
    try {
        if ((!request.payload.allergyId || request.payload.allergyId == "") && (!request.payload.allergyName || request.payload.allergyName == ""))
            throw new Error("Please pass either allergyName or already Id.")

        request.payload.userInfo = request.userInfo
        const message = await service.addUsersAllergy(request.payload)
        return response.success(h, message)
    } catch (err) {
        return response.failure(h, err.message)
    }
}
const fetchAllergiesOfUser = async (request, h) => {
    try {
        request.query.userInfo = request.userInfo
        const message = await service.fetchAllergiesOfUser(request.query)
        return response.paged(h, message, message.totalCount)
    } catch (err) {
        return response.failure(h, err.message)
    }
}
const insertDiagnosisInDb = async (request, h) => {
    try {
        request.query.userInfo = request.userInfo
        const message = await service.insertDiagnosisInDb(request.query)
        return response.success(h, message)
    } catch (err) {
        return response.failure(h, err.message)
    }
}

const fetchAllDiagnosis = async (request, h) => {
    try {
        request.query.userInfo = request.userInfo
        const message = await service.fetchAllDiagnosis(request.query)
        return response.paged(h, message, message.totalCount)
    } catch (err) {
        return response.failure(h, err.message)
    }
}
const fetchAllVaccines = async (request, h) => {
    try {
        request.query.userInfo = request.userInfo
        const message = await service.fetchAllVaccines(request.query)
        return response.paged(h, message, message.totalCount)
    } catch (err) {
        return response.failure(h, err.message)
    }
}
const fetchAllManufacturers = async (request, h) => {
    try {
        request.query.userInfo = request.userInfo
        const message = await service.fetchAllManufacturers(request.query)
        return response.paged(h, message, message.totalCount)
    } catch (err) {
        return response.failure(h, err.message)
    }
}

const fetchAllAllergies = async (request, h) => {
    try {
        request.query.userInfo = request.userInfo
        const message = await service.fetchAllAllergies(request.query)
        return response.paged(h, message, message.totalCount)
    } catch (err) {
        return response.failure(h, err.message)
    }
}

const addCurrentConsult = async (request, h) => {
    try {
        request.payload.userInfo = request.userInfo
        const message = await service.addCurrentConsult(request.payload)
        return response.success(h, message)
    } catch (err) {
        return response.failure(h, err.message)
    }
}
const fetchCurrentConsult = async (request, h) => {
    try {
        request.query.userInfo = request.userInfo
        const message = await service.fetchCurrentConsult(request.query)
        return response.paged(h, message, message.totalCount)
    } catch (err) {
        return response.failure(h, err.message)
    }
}
const addUserDiagnosis = async (request, h) => {
    try {
        request.payload.userInfo = request.userInfo
        const message = await service.addUserDiagnosis(request.payload)
        return response.success(h, message)
    } catch (err) {
        return response.failure(h, err.message)
    }
}
const fetchUserDiagnosis = async (request, h) => {
    try {
        request.query.userInfo = request.userInfo
        const message = await service.fetchUserDiagnosis(request.query)
        return response.paged(h, message, message.totalCount)
    } catch (err) {
        return response.failure(h, err.message)
    }
}
const enterFamilyHistory = async (request, h) => {
    try {
        request.payload.userInfo = request.userInfo
        const message = await service.enterFamilyHistory(request.payload)
        return response.success(h, message)
    } catch (err) {
        return response.failure(h, err.message)
    }
}
const fetchFamilyHistory = async (request, h) => {
    try {
        request.query.userInfo = request.userInfo
        const message = await service.fetchFamilyHistory(request.query)
        return response.paged(h, message, message.totalCount)
    } catch (err) {
        return response.failure(h, err.message)
    }
}
const addVaccinations = async (request, h) => {
    try {
        if ((!request.payload.vaccinationName || request.payload.vaccinationName == "") && (!request.payload.vaccinationId || request.payload.vaccinationId == ""))
            throw new Error("Please pass either vaccination name or vaccination Id.")

        if ((!request.payload.manufacturerName || request.payload.manufacturerName == "") && (!request.payload.manufacturerId || request.payload.manufacturerId == ""))
            throw new Error("Please pass either manufacturer name or manufacturer Id.")

        request.payload.userInfo = request.userInfo
        const message = await service.addVaccinations(request.payload)
        return response.success(h, message)
    } catch (err) {
        return response.failure(h, err.message)
    }
}
const fetchVaccinationsOfUser = async (request, h) => {
    try {
        request.query.userInfo = request.userInfo
        const message = await service.fetchVaccinationsOfUser(request.query)
        return response.paged(h, message, message.totalCount)
    } catch (err) {
        return response.failure(h, err.message)
    }
}
const viewCurrentConsult = async (request, h) => {
    try {
        request.query.userInfo = request.userInfo
        const message = await service.viewCurrentConsult(request.query)
        return response.data(h, message)
    } catch (err) {
        return response.failure(h, err.message)
    }
}
const insertMedicinesInDb = async (request, h) => {
    try {
        const message = await service.insertMedicinesInDb(request.payload)
        return response.success(h, message)
    } catch (err) {
        return response.failure(h, err.message)
    }
}

const addNewPrescription = async (request, h) => {
    try {
        request.payload.userInfo = request.userInfo
        const message = await service.addNewPrescription(request.payload)
        return response.success(h, message)
    } catch (err) {
        return response.failure(h, err.message)
    }
}

const fetchAllMedicines = async (request, h) => {
    try {
        request.query.userInfo = request.userInfo
        const message = await service.fetchAllMedicines(request.query)
        return response.paged(h, message, message.totalCount)
    } catch (err) {
        return response.failure(h, err.message)
    }
}
const fetchAllMedicinesOfUser = async (request, h) => {
    try {
        request.query.userInfo = request.userInfo
        const message = await service.fetchAllMedicinesOfUser(request.query)
        return response.paged(h, message, message.totalCount)
    } catch (err) {
        return response.failure(h, err.message)
    }
}
const fetchAllPrescriptionsOfUser = async (request, h) => {
    try {
        request.query.userInfo = request.userInfo
        const message = await service.fetchAllPrescriptionsOfUser(request.query)
        return response.paged(h, message, message.totalCount)
    } catch (err) {
        return response.failure(h, err.message)
    }
}
const addMedicationHistory = async (request, h) => {
    try {
        request.payload.userInfo = request.userInfo
        const message = await service.addMedicationHistory(request.payload)
        return response.success(h, message)
    } catch (err) {
        return response.failure(h, err.message)
    }
}
const fetchAllMedicationHistory = async (request, h) => {
    try {
        request.query.userInfo = request.userInfo
        const message = await service.fetchAllMedicationHistory(request.query)
        return response.success(h, message)
    } catch (err) {
        return response.failure(h, err.message)
    }
}
const addFitNote = async (request, h) => {
    try {
        request.payload.userInfo = request.userInfo
        const message = await service.addFitNote(request.payload)
        return response.success(h, message)
    } catch (err) {
        return response.failure(h, err.message)
    }
}
const addReferrals = async (request, h) => {
    try {
        request.payload.userInfo = request.userInfo
        const message = await service.addReferrals(request.payload)
        return response.success(h, message)
    } catch (err) {
        return response.failure(h, err.message)
    }
}

const addPathology = async (request, h) => {
    try {
        request.payload.userInfo = request.userInfo
        const message = await service.addPathology(request.payload)
        return response.success(h, message)
    } catch (err) {
        return response.failure(h, err.message)
    }
}

const addRadiology = async (request, h) => {
    try {
        request.payload.userInfo = request.userInfo
        const message = await service.addRadiology(request.payload)
        return response.success(h, message)
    } catch (err) {
        return response.failure(h, err.message)
    }
}

const fetchAllCorrespondence = async (request, h) => {
    try {
        request.query.userInfo = request.userInfo
        const message = await service.fetchAllCorrespondence(request.query)
        return response.paged(h, message, message.totalCount)
    } catch (err) {
        return response.failure(h, err.message)
    }
}

const fetchChargesStatus = async (request, h) => {
    try {
        request.query.userInfo = request.userInfo
        const message = await service.fetchChargesStatus(request.query)
        return response.data(h, message)
    } catch (err) {
        return response.failure(h, err.message)
    }
}

const makePaymentForFitNoteReferral = async (request, h) => {
    try {
        request.payload.userInfo = request.userInfo
        const message = await service.makePaymentForFitNoteReferral(request.payload)
        return response.data(h, message)
    } catch (err) {
        return response.failure(h, err.message)
    }
}

exports.fetchChargesStatus = fetchChargesStatus
exports.makePaymentForFitNoteReferral = makePaymentForFitNoteReferral
exports.insertActiveProblems = insertActiveProblems
exports.fetchMedicalProblems = fetchMedicalProblems
exports.moveMedicalProblem = moveMedicalProblem
exports.addUsersAllergy = addUsersAllergy
exports.fetchAllergiesOfUser = fetchAllergiesOfUser
exports.insertDiagnosisInDb = insertDiagnosisInDb
exports.fetchAllDiagnosis = fetchAllDiagnosis
exports.fetchAllAllergies = fetchAllAllergies
exports.addCurrentConsult = addCurrentConsult
exports.fetchCurrentConsult = fetchCurrentConsult
exports.addUserDiagnosis = addUserDiagnosis
exports.fetchUserDiagnosis = fetchUserDiagnosis
exports.enterFamilyHistory = enterFamilyHistory
exports.fetchFamilyHistory = fetchFamilyHistory
exports.addVaccinations = addVaccinations
exports.fetchVaccinationsOfUser = fetchVaccinationsOfUser
exports.viewCurrentConsult = viewCurrentConsult
exports.insertMedicinesInDb = insertMedicinesInDb
exports.fetchAllManufacturers = fetchAllManufacturers
exports.fetchAllVaccines = fetchAllVaccines
exports.addNewPrescription = addNewPrescription
exports.fetchAllMedicines = fetchAllMedicines
exports.fetchAllMedicinesOfUser = fetchAllMedicinesOfUser
exports.fetchAllPrescriptionsOfUser = fetchAllPrescriptionsOfUser
exports.addMedicationHistory = addMedicationHistory
exports.fetchAllMedicationHistory = fetchAllMedicationHistory
exports.addFitNote = addFitNote
exports.addReferrals = addReferrals
exports.addPathology = addPathology
exports.addRadiology = addRadiology
exports.fetchAllCorrespondence = fetchAllCorrespondence