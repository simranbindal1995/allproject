'use strict'
const Joi = require('joi')

module.exports = {
    insertActiveProblems: {
        payload: {
            bookingId: Joi.string().required(),
            relation: Joi.string().lowercase().required(),
            diagnosis: Joi.string().required(),
            problemType: Joi.string().valid(["major", "minor", "significant"]).lowercase().required(),
            dateOccured: Joi.number().required()
        }
    },
    fetchMedicalProblems: {
        query: {
            bookingId: Joi.string().required(),
            relation: Joi.string().lowercase().required(),
            isActive: Joi.boolean().default(true),
            skip: Joi.number().default(0),
            limit: Joi.number().default(10)
        }
    },
    moveMedicalProblem: {
        payload: {
            medicalHistoryId: Joi.string().required()
        }
    },
    addUsersAllergy: {
        payload: {
            bookingId: Joi.string().required(),
            relation: Joi.string().lowercase().required(),
            allergyId: Joi.string().optional().allow(""),
            allergyName: Joi.string().lowercase().optional().allow(""),
            dateOccured: Joi.number().required()
        }
    },
    fetchAllergiesOfUser: {
        query: {
            bookingId: Joi.string().required(),
            relation: Joi.string().lowercase().required(),
            skip: Joi.number().default(0),
            limit: Joi.number().default(10)
        }
    },
    fetchAllDiagnosis: {
        query: {
            search: Joi.string().optional().allow(''),
            skip: Joi.number().default(0),
            limit: Joi.number().default(20)
        }
    },
    fetchAllAllergies: {
        query: {
            search: Joi.string().optional().allow(''),
            skip: Joi.number().default(0),
            limit: Joi.number().default(20)
        }
    },
    fetchAllVaccines: {
        query: {
            search: Joi.string().optional().allow(''),
            skip: Joi.number().default(0),
            limit: Joi.number().default(20)
        }
    },
    fetchAllManufacturers: {
        query: {
            search: Joi.string().optional().allow(''),
            skip: Joi.number().default(0),
            limit: Joi.number().default(20)
        }
    },
    addCurrentConsult: {
        payload: {
            bookingId: Joi.string().required(),
            relation: Joi.string().lowercase().required(),
            type: Joi.number().required().valid([3, 4, 6, 7]),
            message: Joi.string().required()
        }
    },
    fetchCurrentConsult: {
        query: {
            bookingId: Joi.string().required(),
            relation: Joi.string().lowercase().required(),
            type: Joi.number().required().valid([3, 4, 6, 7]),
            skip: Joi.number().default(0),
            limit: Joi.number().default(10)
        }
    },
    addUserDiagnosis: {
        payload: {
            bookingId: Joi.string().required(),
            relation: Joi.string().lowercase().required(),
            diagnosis: Joi.string().required(),
            isActive: Joi.boolean().required().default(true),
            problemType: Joi.string().valid(["major", "minor", "significant"]).lowercase().required(),
            dateOccured: Joi.number().required()
        }
    },
    fetchUserDiagnosis: {
        query: {
            bookingId: Joi.string().required(),
            relation: Joi.string().lowercase().required(),
            skip: Joi.number().default(0),
            limit: Joi.number().default(10)
        }
    },
    enterFamilyHistory: {
        payload: {
            bookingId: Joi.string().required(),
            relation: Joi.string().lowercase().required(),
            diagnosis: Joi.string().required(),
            dateOccured: Joi.number().required()
        }
    },
    fetchFamilyHistory: {
        query: {
            bookingId: Joi.string().required(),
            relation: Joi.string().lowercase().required(),
            skip: Joi.number().default(0),
            limit: Joi.number().default(10)
        }
    },
    addVaccinations: {
        payload: {
            bookingId: Joi.string().required(),
            relation: Joi.string().lowercase().required(),
            vaccinationName: Joi.string().lowercase().optional().allow(''),
            vaccinationId: Joi.string().optional().allow(""),
            batchCode: Joi.string().required(),
            manufacturerName: Joi.string().optional().lowercase().allow(""),
            manufacturerId: Joi.string().optional().allow(""),
            dateOccured: Joi.number().required()
        }
    },
    fetchVaccinationsOfUser: {
        query: {
            bookingId: Joi.string().required(),
            relation: Joi.string().lowercase().required(),
            skip: Joi.number().default(0),
            limit: Joi.number().default(10)
        }
    },
    viewCurrentConsult: {
        query: {
            doctorId: Joi.string().required(),
            dateOccured: Joi.number().required()
        }
    },
    addNewPrescription: {
        payload: {
            bookingId: Joi.string().required(),
            relation: Joi.string().lowercase().required(),
            prescriptionNumber: Joi.string().required(),
            medicationData: Joi.array().items(Joi.object().keys({
                medicineId: Joi.string().required(),
                medicationType: Joi.string().required(),
                strength: Joi.string().required(),
                quantity: Joi.number().required(),
                timePerDay: Joi.number().required(),
                startDate: Joi.number().required()
            })),
            makePayment: Joi.boolean().default(false)
        }
    },
    fetchAllMedicines: {
        query: {
            search: Joi.string().optional().allow(''),
            skip: Joi.number().default(0),
            limit: Joi.number().default(20)
        }
    },
    fetchAllMedicinesOfUser: {
        query: {
            bookingId: Joi.string().required(),
            relation: Joi.string().lowercase().required()
        }
    },
    fetchAllPrescriptionsOfUser: {
        query: {
            bookingId: Joi.string().required(),
            relation: Joi.string().lowercase().required(),
            skip: Joi.number().default(0),
            limit: Joi.number().default(10)
        }
    },
    addMedicationHistory: {
        payload: {
            bookingId: Joi.string().required(),
            relation: Joi.string().lowercase().required(),
            medicineId: Joi.string().required(),
            medicationType: Joi.string().required(),
            strength: Joi.string().required(),
            quantity: Joi.number().required(),
            startDate: Joi.number().required()
        }
    },
    fetchAllMedicationHistory: {
        query: {
            bookingId: Joi.string().required(),
            relation: Joi.string().lowercase().required(),
            skip: Joi.number().default(0),
            limit: Joi.number().default(10)
        }
    },
    addFitNote: {
        payload: {
            bookingId: Joi.string().required(),
            relation: Joi.string().lowercase().required(),
            message: Joi.string().required(),
            makePayment: Joi.boolean().default(false),
        }
    },
    addReferrals: {
        payload: {
            bookingId: Joi.string().required(),
            relation: Joi.string().lowercase().required(),
            message: Joi.string().required(),
            doctorName: Joi.string().required(),
            speciality: Joi.string().required(),
            hospital: Joi.string().required(),
            makePayment: Joi.boolean().default(false),
        }
    },
    addPathology: {
        payload: {
            bookingId: Joi.string().required(),
            relation: Joi.string().lowercase().required(),
            message: Joi.string().optional().allow(""),
            pathologyNames: Joi.array().required()
        }
    },
    addRadiology: {
        payload: {
            bookingId: Joi.string().required(),
            relation: Joi.string().lowercase().required(),
            radiology: Joi.array().items(Joi.object().keys({
                message: Joi.string().optional().allow(""),
                name: Joi.string().required()
            }))
        }
    },
    fetchAllCorrespondence: {
        query: {
            bookingId: Joi.string().required(),
            relation: Joi.string().lowercase().required(),
            skip: Joi.number().default(0),
            limit: Joi.number().default(10)
        }
    },
    fetchChargesStatus: {
        query: {
            bookingId: Joi.string().required()
        }
    },
    makePaymentForFitNoteReferral: {
        payload: {
            bookingId: Joi.string().required(),
            paymentType: Joi.string().required().valid(["fitnote", "referral", "prescription"]),
            cardId: Joi.string().optional().allow("").default("card_1DpskJDzsYlNh55pjijxX2ei"),
            cardToken: Joi.string().optional().allow(""),
            makePayment: Joi.boolean().default(false),
            totalAmount: Joi.number().required().default(5),
        }
    },
    header: Joi.object({
        'x-logintoken': Joi.string().required().trim().description('Provide token to access api')
    }).unknown()
}