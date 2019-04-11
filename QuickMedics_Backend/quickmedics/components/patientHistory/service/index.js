/** PatientHistory Service
Date : 17 Dec 2017
 **/
const request = require("request")
const _ = require('underscore')

const config = require('config').get('stripe')
const stripeService = require('../../payments/service')


const insertActiveProblems = async (params) => {
    logger.start("patientHistory:service:insertActiveProblems")

    const data = await db.bookings.findOne({ _id: params.bookingId, status: "paymentDone" })
    if (data == null) throw new Error("You are not authorised user.")

    // if (data.bookedFor.toString().toLowerCase() != params.relation.toString().toLowerCase())
    //     throw new Error(`Booking was done for ${data.bookedFor} , you cannot modify data for others`)

    await db.patientHistory({
        patientId: data.patientId,
        doctorId: params.userInfo._id,
        bookingId: params.bookingId,
        relation: params.relation,
        problemType: params.problemType,
        diagnosis: params.diagnosis,
        dateOccured: params.dateOccured,
        historyType: 1,
        isActive: true,
        createdBy: params.userInfo._id,
        createdAt: moment().unix()
    }).save()

    return "Saved successfully"
}

const fetchMedicalProblems = async (params) => {
    logger.start("services:patientHistory:fetchMedicalProblems")

    const details = await db.bookings.findOne({ _id: params.bookingId })

    const criteria = { historyType: 1, patientId: details.patientId, relation: params.relation, isActive: params.isActive }
    const data = await db.patientHistory.find(criteria, { dateOccured: 1, createdAt: 1, diagnosis: 1, problemType: 1 }, { sort: { createdAt: -1 }, skip: params.skip, limit: params.limit })
        .populate({ path: "diagnosis ", select: "name" })
    data.totalCount = await db.patientHistory.count(criteria)

    return data;
}
const moveMedicalProblem = async (params) => {
    logger.start(`services:patientHistory:moveMedicalProblem ${params}`)

    const data = await db.patientHistory.findOneAndUpdate({ _id: params.medicalHistoryId }, { isActive: false, updatedBy: params.userInfo._id }, { new: true })

    return "Successfully moved into past"
}
const addUsersAllergy = async (params) => {
    logger.start(`services:patientHistory:addAllergy`)

    const data = await db.bookings.findOne({ _id: params.bookingId, status: "paymentDone" })
    if (data == null) throw new Error("You are not authorised user.")

    if (params.allergyName && params.allergyName != "") {
        const alreadyExists = await db.allergies.findOne({ name: params.allergyName })
        if (alreadyExists == null) {
            const dataSaved = await db.allergies({ name: params.allergyName, addedBy: params.userInfo._id, createdAt: moment().unix() }).save()
            params.allergyId = dataSaved._id
        } else
            params.allergyId = alreadyExists._id
    }

    await db.patientHistory({
        patientId: data.patientId,
        doctorId: params.userInfo._id,
        bookingId: params.bookingId,
        relation: params.relation,
        allergies: params.allergyId,
        dateOccured: params.dateOccured,
        historyType: 2,
        createdBy: params.userInfo._id,
        createdAt: moment().unix()
    }).save()

    return "Allergy saved successfully"

}

const fetchAllergiesOfUser = async (params) => {
    logger.start(`services:patientHistory:fetchAllergies`)

    const details = await db.bookings.findOne({ _id: params.bookingId })

    const criteria = { historyType: 2, patientId: details.patientId, relation: params.relation }
    const data = await db.patientHistory.find(criteria, { dateOccured: 1, createdAt: 1, allergies: 1 }, { sort: { createdAt: -1 }, skip: params.skip, limit: params.limit })
        .populate({ path: "allergies", select: "name" })
    data.totalCount = await db.patientHistory.count(criteria)

    return data;

}

const fetchAllDiagnosis = async (params) => {
    let criteria = { isDeleted: false }

    if (params.search && params.search != "")
        criteria.name = new RegExp(params.search)

    const data = await db.diagnosis.find(criteria, { name: 1 }, { sort: { name: 1 }, skip: params.skip, limit: params.limit })
    data.totalCount = await db.diagnosis.count(criteria)

    return data;
}
const fetchAllVaccines = async (params) => {
    let criteria = { isDeleted: false }

    if (params.search && params.search != "")
        criteria.name = new RegExp(params.search)

    const data = await db.vaccinations.find(criteria, { name: 1 }, { sort: { name: 1 }, skip: params.skip, limit: params.limit })
    data.totalCount = await db.vaccinations.count(criteria)

    return data;
}
const fetchAllManufacturers = async (params) => {
    let criteria = { isDeleted: false }

    if (params.search && params.search != "")
        criteria.name = new RegExp(params.search)

    const data = await db.manufacturers.find(criteria, { name: 1 }, { sort: { name: 1 }, skip: params.skip, limit: params.limit })
    data.totalCount = await db.manufacturers.count(criteria)

    return data;
}
const fetchAllAllergies = async (params) => {
    let criteria = { isDeleted: false }

    if (params.search && params.search != "")
        criteria.name = new RegExp(params.search)

    const data = await db.allergies.find(criteria, { name: 1 }, { sort: { name: 1 }, skip: params.skip, limit: params.limit })
    data.totalCount = await db.allergies.count(criteria)

    return data;
}

const addCurrentConsult = async (params) => {

    const details = await db.bookings.findOne({ _id: params.bookingId })

    await db.patientHistory({
        patientId: details.patientId,
        doctorId: params.userInfo._id,
        bookingId: params.bookingId,
        relation: params.relation,
        message: params.message,
        historyType: params.type,
        createdBy: params.userInfo._id,
        createdAt: moment().unix()
    }).save()

    return "Added successfully"
}
const fetchCurrentConsult = async (params) => {
    const details = await db.bookings.findOne({ _id: params.bookingId })
    const criteria = {
        patientId: details.patientId,
        relation: params.relation,
        historyType: params.type
    }
    const data = await db.patientHistory.find(criteria, { doctorId: 1, message: 1, createdAt: 1 }, { skip: params.skip || 0, limit: params.limit || 10 })
        .populate({ path: "doctorId", select: "firstName lastName" })

    data.totalCount = await db.patientHistory.count(criteria)
    return data;
}
const addUserDiagnosis = async (params) => {
    const details = await db.bookings.findOne({ _id: params.bookingId })

    await db.patientHistory({
        patientId: details.patientId,
        doctorId: params.userInfo._id,
        bookingId: params.bookingId,
        relation: params.relation,
        diagnosis: params.diagnosis,
        problemType: params.problemType,
        isActive: params.isActive,
        historyType: 5,
        createdBy: params.userInfo._id,
        createdAt: moment().unix(),
        dateOccured: params.dateOccured
    }).save()

    return "Saved successfully"
}

const fetchUserDiagnosis = async (params) => {

    const details = await db.bookings.findOne({ _id: params.bookingId })

    const criteria = {
        patientId: details.patientId,
        relation: params.relation,
        historyType: 5
    }
    const data = await db.patientHistory.find(criteria, { dateOccured: 1, doctorId: 1, problemType: 1, isActive: 1, diagnosis: 1 }, { skip: params.skip || 0, limit: params.limit || 10 })
        .populate({ path: "doctorId", select: "firstName lastName" })
        .populate({ path: "diagnosis", select: "name" })

    data.totalCount = await db.patientHistory.count(criteria)

    return data
}
const enterFamilyHistory = async (params) => {

    const details = await db.bookings.findOne({ _id: params.bookingId })

    await db.patientHistory({
        patientId: details.patientId,
        doctorId: params.userInfo._id,
        bookingId: params.bookingId,
        relation: params.relation,
        diagnosis: params.diagnosis,
        historyType: 9,
        createdBy: params.userInfo._id,
        createdAt: moment().unix(),
        dateOccured: params.dateOccured
    }).save()

    return "Saved successfully"
}
const fetchFamilyHistory = async (params) => {

    const details = await db.bookings.findOne({ _id: params.bookingId })

    const data = await db.patientHistory.find({
            patientId: details.patientId,
            relation: params.relation,
            historyType: 9
        }, { dateOccured: 1, diagnosis: 1, relation: 1 }, { sort: { dateOccured: -1 }, skip: params.skip || 0, limit: params.limit || 10 })
        .populate({ path: "diagnosis", select: "name" })

    data.totalCount = await db.patientHistory.count({
        patientId: details.patientId,
        relation: params.relation,
        historyType: 9
    })
    return data;
}

const addVaccinations = async (params) => {

    const data = await db.bookings.findOne({ _id: params.bookingId })

    if (params.vaccinationName && params.vaccinationName != "") {
        const alreadyExists = await db.vaccinations.findOne({ name: params.vaccinationName })
        if (alreadyExists == null) {
            const dataSaved = await db.vaccinations({ name: params.vaccinationName, addedBy: params.userInfo._id, createdAt: moment().unix() }).save()
            params.vaccinationId = dataSaved._id
        } else
            params.vaccinationId = alreadyExists._id
    }
    if (params.manufacturerName && params.manufacturerName != "") {
        const alreadyExist = await db.manufacturers.findOne({ name: params.manufacturerName })
        if (alreadyExist == null) {
            const dataSave = await db.manufacturers({ name: params.manufacturerName, addedBy: params.userInfo._id, createdAt: moment().unix() }).save()
            params.manufacturerId = dataSave._id
        } else
            params.manufacturerId = alreadyExist._id
    }

    await db.patientHistory({
        patientId: data.patientId,
        doctorId: params.userInfo._id,
        bookingId: params.bookingId,
        relation: params.relation,
        vaccinations: params.vaccinationId,
        manufacturers: params.manufacturerId,
        dateOccured: params.dateOccured,
        batchCode: params.batchCode,
        historyType: 10,
        createdBy: params.userInfo._id,
        createdAt: moment().unix()
    }).save()

    return "Vaccination saved successfully"

}

const fetchVaccinationsOfUser = async (params) => {

    const details = await db.bookings.findOne({ _id: params.bookingId })

    const data = await db.patientHistory.find({
            patientId: details.patientId,
            relation: params.relation,
            historyType: 10
        }, { dateOccured: 1, vaccinations: 1, manufacturers: 1, batchCode: 1 }, { sort: { dateOccured: -1 }, skip: params.skip || 0, limit: params.limit || 10 })
        .populate({ path: "vaccinations", select: "name" })
        .populate({ path: "manufacturers", select: "name" })

    data.totalCount = await db.patientHistory.count({
        patientId: details.patientId,
        relation: params.relation,
        historyType: 10
    })
    return data;
}
const viewCurrentConsult = async (params) => {
    let history = [],
        findings = [],
        treatment = [],
        followUp = []
    const startTime = moment(params.dateOccured * 1000).startOf('day').unix()
    const endTime = moment(params.dateOccured * 1000).endOf('day').unix()

    const criteria = {
        doctorId: params.doctorId,
        createdAt: { $gte: startTime, $lte: endTime },
        historyType: { $in: [3, 4, 6, 7] }
    }

    const data = await db.patientHistory.find(criteria, { message: 1, historyType: 1 }, { sort: { createdAt: -1 } })
    for (var i = 0; i < data.length; i++) {
        if (data[i].historyType == 3) history.push(data[i].message)
        if (data[i].historyType == 4) findings.push(data[i].message)
        if (data[i].historyType == 6) treatment.push(data[i].message)
        if (data[i].historyType == 7) followUp.push(data[i].message)
    }

    return {
        history: history,
        findings: findings,
        treatment: treatment,
        followUp: followUp
    };

}

const addNewPrescription = async (params) => {
    const details = await db.bookings.findOne({ _id: params.bookingId })

    if (params.makePayment == true) {
        const checkIfAlreadyPaid = await db.invoices.findOne({ bookingId: params.bookingId, paymentType: "prescription" })

        if (!checkIfAlreadyPaid) throw new Error("Presription can't be prescribed till the patient pay for it")

        const sendTobank = await db.invoices.findOne({ bookingId: params.bookingId, paymentType: "prescription", transactionType: "stripeToBank" })

        if (!sendTobank && params.makePayment) { //transfer amount to doctor
            let doc = await db.bankDetails.findOne({ userId: details.doctorId }, { stripeBankId: 1 })

            if (!doc) throw new Error("Please add your bank details first,to receive the transfered amounts")
            params.stripeBankId = doc.stripeBankId

            const data = await db.invoices.findOne({ bookingId: params.bookingId, paymentType: "prescription", transactionType: "cardToStripe" })

            const actualAmount = data.totalAmountDeducted

            //Calculate amount to be transfered to the doctor after 15% comission of admin

            const comission = Math.round(data.adminPercentage * data.totalAmountDeducted) / 100

            params.totalAmount = data.totalAmountDeducted - comission

            const bankPayment = await stripeService.transferToBank(params)

            params.chargeId = bankPayment ? bankPayment.id : ""
            params.totalAmountDeducted = actualAmount
            params.totalAmountToTransfer = params.totalAmount
            params.metaData = bankPayment || {}
            params.transactionType = "stripeToBank"
            params.paymentType = "prescription"
            params.requestStatus = "completed"
            params.adminPercentage = data.adminPercentage
            params.createdAt = moment().unix()

            await db.invoices(params).save()

            offline.queue('invoices', 'bank-transfer-invoice', {
                doctorId: details.doctorId,
                reason: `for referring the prescriptions`,
                charges: params.totalAmount
            }, {})

        }
    }
    params.createdBy = params.userInfo._id
    params.createdAt = moment().unix()
    params.patientId = details.patientId
    const data = await db.prescriptions(params).save()

    params.historyType = 8
    params.prescriptions = data._id

    await db.patientHistory(params).save()

    return "Presription added successfully"
}
const fetchAllMedicines = async (params) => {
    let criteria = { isDeleted: false }

    if (params.search && params.search != "")
        criteria.name = new RegExp(params.search)

    const data = await db.medicines.find(criteria, { name: 1 }, { sort: { name: 1 }, skip: params.skip, limit: params.limit })
    data.totalCount = await db.medicines.count(criteria)

    return data;
}
const fetchAllMedicinesOfUser = async (params) => {
    let arr = []
    const details = await db.bookings.findOne({ _id: params.bookingId })

    const criteria = { patientId: details.patientId, relation: params.relation, isHistory: false }

    const data = await db.prescriptions.find(criteria, { medicationData: 1 }, { sort: { name: -1 } })
        .populate({ path: "medicationData.medicineId", select: "name" })

    for (var i = 0; i < data.length; i++) {
        for (var j = 0; j < data[i].medicationData.length; j++) {
            arr.push(data[i].medicationData[j])
        }
    }

    return arr;
}

const fetchAllPrescriptionsOfUser = async (params) => {
    const details = await db.bookings.findOne({ _id: params.bookingId })

    const criteria = { patientId: details.patientId, relation: params.relation, isHistory: false }

    const data = await db.prescriptions.find(criteria, { "medicationData.medicineId": 1, createdBy: 1, prescriptionNumber: 1, createdAt: 1, }, { sort: { createdAt: -1 }, skip: params.skip || 0, limit: params.limit || 10 })
        .populate({ path: "createdBy", select: "firstName lastName middleName" })

    data.totalCount = await db.prescriptions.count(criteria)
    return data;
}

const addMedicationHistory = async (params) => {
    const details = await db.bookings.findOne({ _id: params.bookingId })

    params.createdAt = moment().unix()
    params.createdBy = params.userInfo._id
    params.patientId = details.patientId
    params.isHistory = true
    params.medicationData = {
        medicineId: params.medicineId,
        medicationType: params.medicationType,
        strength: params.strength,
        quantity: params.quantity,
        startDate: params.startDate
    }

    const data = await db.prescriptions(params).save()

    params.historyType = 8
    params.prescriptions = data._id

    await db.patientHistory(params).save()

    return "Presription added successfully"
}

const fetchAllMedicationHistory = async (params) => {
    const details = await db.bookings.findOne({ _id: params.bookingId })

    const criteria = { patientId: details.patientId, relation: params.relation, isHistory: true }

    const data = await db.prescriptions.find(criteria, { "medicationData": 1, createdBy: 1, prescriptionNumber: 1, createdAt: 1, }, { sort: { createdAt: -1 }, lean: true, skip: params.skip || 0, limit: params.limit || 10 })
        .populate({ path: "medicationData.medicineId", select: "name" })

    for (var i = 0; i < data.length; i++) {
        if (data[i].createdBy.toString() == params.userInfo._id.toString()) {
            data[i].addedByMe = true
        } else {
            data[i].addedByMe = false
        }
    }

    data.totalCount = await db.prescriptions.count(criteria)
    return data;
}

const addFitNote = async (params) => {
    let doc
    const details = await db.bookings.findOne({ _id: params.bookingId })

    const checkIfAlreadyPaid = await db.invoices.findOne({ bookingId: params.bookingId, paymentType: "fitnote" })

    if (!checkIfAlreadyPaid && params.makePayment) throw new Error("Fitnote can't be referred till patient pay for it")

    const sendTobank = await db.invoices.findOne({ bookingId: params.bookingId, paymentType: "fitnote", transactionType: "stripeToBank" })

    if (!sendTobank && params.makePayment) { //transfer amount to doctor
        let doc = await db.bankDetails.findOne({ userId: details.doctorId }, { stripeBankId: 1 })

        if (!doc) throw new Error("Please add your bank details first,to receive the transfered amounts")
        params.stripeBankId = doc.stripeBankId

        const data = await db.invoices.findOne({ bookingId: params.bookingId, paymentType: "fitnote", transactionType: "cardToStripe" })

        const actualAmount = data.totalAmountDeducted

        //Calculate amount to be transfered to the doctor after 15% comission of admin

        const comission = Math.round(data.adminPercentage * data.totalAmountDeducted) / 100

        params.totalAmount = data.totalAmountDeducted - comission

        const bankPayment = await stripeService.transferToBank(params)

        params.chargeId = bankPayment ? bankPayment.id : ""
        params.totalAmountDeducted = actualAmount
        params.totalAmountToTransfer = params.totalAmount
        params.metaData = bankPayment || {}
        params.transactionType = "stripeToBank"
        params.paymentType = "fitnote"
        params.requestStatus = "completed"
        params.adminPercentage = data.adminPercentage
        params.createdAt = moment().unix()

        await db.invoices(params).save()

        offline.queue('invoices', 'bank-transfer-invoice', {
            doctorId: details.doctorId,
            reason: `for referring the fit note`,
            charges: params.totalAmount
        }, {})

    }

    const obj = {
        patientId: details.patientId,
        doctorId: details.doctorId,
        bookingId: params.bookingId,
        relation: params.relation,
        historyType: 11,
        message: params.message,
        createdBy: params.userInfo._id,
        createdAt: moment().unix()
    }
    await db.patientHistory(obj).save()

    //Send email to patient
    offline.queue('patient-history', 'fitnote', {
        patientId: details.patientId,
        doctorId: details.doctorId,
        message: params.message
    }, {})


    return "FitNote referred successfully.Patient will get it on the registered mail account."

}

const addReferrals = async (params) => {
    const details = await db.bookings.findOne({ _id: params.bookingId })
    console.log('details===', details)
    //Charge patient for the referal
    const checkIfAlreadyPaid = await db.invoices.findOne({ bookingId: params.bookingId, paymentType: "referral" })

    // if (!checkIfAlreadyPaid) throw new Error("Referrals can't be referred till patient pay for it")

    // if (checkIfAlreadyPaid == null) {
    //     if (params.makePayment) {
    //         doc = await db.bankDetails.findOne({ userId: details.doctorId }, { stripeBankId: 1 })

    //         if (!doc) throw new Error("Please ask doctor to add the bank details first.")
    //         params.stripeBankId = doc.stripeBankId
    //     }

    //     if (params.makePayment && !params.userInfo.stripeCustomerId) {
    //         const info = await stripeService.createCustomer(params.userInfo)
    //         params.userInfo.stripeCustomerId = info.stripeCustomerId
    //     }
    //     if (params.makePayment && params.cardToken && params.cardToken != "") {
    //         const data = await stripeService.createSource(params)
    //         params.cardId = data.id
    //     }

    //     if (params.makePayment) { //will set true when payment gateway is implememented on frontend
    //         var payment = await stripeService.createCharge(params)

    //         params.patientId = details.patientId
    //         params.doctorId = details.doctorId
    //         params.bookingId = details._id
    //         params.chargeId = payment ? payment.id : ""
    //         params.totalAmountDeducted = params.totalAmount
    //         params.adminPercentage = config.adminComission
    //         params.metaData = payment || {}
    //         params.createdAt = moment().unix()
    //         params.transactionType = "cardToStripe"
    //         params.paymentType = "referral"

    //         const invoice = await db.invoices(params).save()

    //         const actualAmount = params.totalAmount

    //         //Calculate amount to be transfered to the doctor after 15% comission of admin

    //         const comission = Math.round(config.adminComission * params.totalAmount) / 100

    //         params.totalAmount = params.totalAmount - comission

    //         const bankPayment = await stripeService.transferToBank(params)

    //         params.chargeId = bankPayment ? bankPayment.id : ""
    //         params.totalAmountDeducted = actualAmount
    //         params.totalAmountToTransfer = params.totalAmount
    //         params.metaData = bankPayment || {}
    //         params.transactionType = "stripeToBank"
    //         params.paymentType = "referral"
    //         params.requestStatus = "completed"

    //         await db.invoices(params).save()

    //     }
    // }

    // const sendTobank = await db.invoices.findOne({ bookingId: params.bookingId, paymentType: "referral", transactionType: "stripeToBank" })

    // if (!sendTobank && params.makePayment) { //transfer amount to doctor
    //     let doc = await db.bankDetails.findOne({ userId: details.doctorId }, { stripeBankId: 1 })

    //     if (!doc) throw new Error("Please add your bank details first,to receive the transfered amounts.")
    //     params.stripeBankId = doc.stripeBankId

    //     const data = await db.invoices.findOne({ bookingId: params.bookingId, paymentType: "referral", transactionType: "cardToStripe" })

    //     const actualAmount = data.totalAmountDeducted

    //     //Calculate amount to be transfered to the doctor after 15% comission of admin

    //     const comission = Math.round(data.adminPercentage * data.totalAmountDeducted) / 100

    //     params.totalAmount = data.totalAmountDeducted - comission

    //     const bankPayment = await stripeService.transferToBank(params)

    //     params.chargeId = bankPayment ? bankPayment.id : ""
    //     params.totalAmountDeducted = actualAmount
    //     params.totalAmountToTransfer = params.totalAmount
    //     params.metaData = bankPayment || {}
    //     params.transactionType = "stripeToBank"
    //     params.paymentType = "referral"
    //     params.requestStatus = "completed"
    //     params.adminPercentage = data.adminPercentage
    //     params.createdAt = moment().unix()

    //     await db.invoices(params).save()

    //     offline.queue('invoices', 'bank-transfer-invoice', {
    //         doctorId: details.doctorId,
    //         reason: `for your referrals`,
    //         charges: params.totalAmount
    //     }, {})

    // }

    const obj = {
        patientId: details.patientId,
        doctorId: details.doctorId,
        bookingId: params.bookingId,
        relation: params.relation,
        doctorName: params.doctorName,
        speciality: params.speciality,
        hospital: params.hospital,
        historyType: 12,
        message: params.message,
        createdBy: params.userInfo._id,
        createdAt: moment().unix()
    }
    await db.patientHistory(obj).save()


    const data = await db.patientHistory.find({ bookingId: params.bookingId, relation: params.relation, historyType: { $in: [2, 3] } }, { historyType: 1, message: 1, allergies: 1 })
        .populate({ path: "allergies", select: "name" })

    let finalCurrentConsult = "",
        finalAllergies = ""

    for (var i = 0; i < data.length; i++) {
        if (data[i].historyType == 3)
            finalCurrentConsult += '<tr> <td>' + data[i].message + '</td></tr>'
        else
            finalAllergies += '<tr> <td>' + data[i].allergies.name + '</td></tr>'
    }

    const past = await db.patientHistory.find({ bookingId: params.bookingId, relation: params.relation, historyType: 1, isActive: false }, { message: 1 })
        .populate({ path: "diagnosis", select: "name" })

    let medicalHistory = ""
    for (var i = 0; i < past.length; i++) {
        medicalHistory += '<tr> <td>' + past[i].diagnosis.name + '</td></tr>'
    }

    const prescription = await db.prescriptions.find({ bookingId: params.bookingId, relation: params.relation }, { medicationData: 1 })
        .populate({ path: "medicationData.medicineId", select: "name" })

    let finalPrescriptions = ""
    for (var i = 0; i < prescription.length; i++) {
        for (var j = 0; j < prescription[i].medicationData.length; j++) {
            finalPrescriptions += '<tr> <td>' + prescription[i].medicationData[j].medicineId.name + '</td></tr>'
        }
    }


    //Send email to user
    offline.queue('patient-history', 'referral', {
        patientId: details.patientId,
        doctorId: details.doctorId,
        doctorName: params.doctorName,
        hospital: params.hospital,
        message: params.message,
        currentConsult: finalCurrentConsult,
        allergies: finalAllergies,
        medications: finalPrescriptions,
        medicalHistory: medicalHistory
    }, {})


    return "Referral added successfully.Patient will get it on the registered mail account."
}

const addPathology = async (params) => {
    const details = await db.bookings.findOne({ _id: params.bookingId })

    const obj = {
        patientId: details.patientId,
        doctorId: params.userInfo._id,
        bookingId: params.bookingId,
        relation: params.relation,
        historyType: 13,
        pathology: params.pathologyNames,
        createdBy: params.userInfo._id,
        createdAt: moment().unix()
    }

    if (params.message && params.message != "")
        obj.message = params.message

    await db.patientHistory(obj).save()
    //Send email to user
    return "Pathology referred successfully.Patient will get the referral details in the mailer."
}

const addRadiology = async (params) => {
    const details = await db.bookings.findOne({ _id: params.bookingId })

    const obj = {
        patientId: details.patientId,
        doctorId: params.userInfo._id,
        bookingId: params.bookingId,
        relation: params.relation,
        historyType: 14,
        radiology: params.radiology,
        createdBy: params.userInfo._id,
        createdAt: moment().unix()
    }

    await db.patientHistory(obj).save()



    //Send email to user
    return "Radiology referred successfully.Patient will get the referral details in the mailer."
}
const fetchAllCorrespondence = async (params) => {
    let arr = []
    const details = await db.bookings.findOne({ _id: params.bookingId })

    const data = await db.users.findOne({ _id: details.patientId }, { family: 1 })

    data.family.forEach((item) => {

        if (item.relation.toString() == params.relation.toString()) {
            item.correspondenceId.forEach((obj) => {
                arr.push(obj)
            })
        }
    })

    totalCount = arr.length
    arr = _.chain(arr)
        .rest(params.skip || 0)
        .first(params.limit || 10)

    arr.totalCount = totalCount

    return arr;
}

const fetchFitNoteStatus = async (params) => {
    let arr = [{
        name: "prescription",
        pressCharge: true,
        issue: false
    }, {
        name: "fitnote",
        pressCharge: true,
        issue: false
    }, {
        name: "referral",
        pressCharge: true,
        issue: false
    }]
    const data = await db.invoices.find({ bookingId: params.bookingId, paymentType: ["fitnote", "referral", "prescription"] })

    for (var i = 0; i < data.length; i++) {
        if (data[i].paymentType == "prescription") {
            arr[0].pressCharge = false
            arr[0].issue = true
            break;
        } else if (data[i].paymentType == "fitnote") {
            arr[1].pressCharge = false
            arr[1].issue = true
            break;
        } else {
            arr[2].pressCharge = false
            arr[2].issue = true
            break;
        }
    }
    return arr;

}

const makePaymentForFitNoteReferral = async (params) => {
    let doc
    const details = await db.bookings.findOne({ _id: params.bookingId }).populate({ path: "doctorId", select: "deviceDetails" })

    const checkIfAlreadyPaid = await db.invoices.findOne({ bookingId: params.bookingId, paymentType: params.paymentType })
    //Charge patient for the Fit note or referral

    if (checkIfAlreadyPaid == null && params.makePayment) { //will set true when payment gateway is implememented on frontend

        if (!params.userInfo.stripeCustomerId) {
            const info = await stripeService.createCustomer(params.userInfo)
            params.userInfo.stripeCustomerId = info.stripeCustomerId
        }
        if (params.cardToken && params.cardToken != "") {
            const data = await stripeService.createSource(params)
            params.cardId = data.id
        }


        var payment = await stripeService.createCharge(params)

        params.patientId = details.patientId
        params.doctorId = details.doctorId
        params.bookingId = details._id
        params.chargeId = payment ? payment.id : ""
        params.totalAmountDeducted = params.totalAmount
        params.adminPercentage = config.adminComission
        params.metaData = payment || {}
        params.createdAt = moment().unix()
        params.transactionType = "cardToStripe"
        params.paymentType = params.paymentType

        const invoice = await db.invoices(params).save()
    } else {
        throw new Error("Payment already done")
    }
    details.paymentType = params.paymentType
    eventEmitter.emit("acknowledgeDoctorPaymentDone", details);

    offline.queue('invoices', 'send-invoice', {
        patientId: details.patientId,
        doctorId: details.doctorId,
        charges: params.totalAmount
    }, {})

    return "Payment successfully done"
}

exports.makePaymentForFitNoteReferral = makePaymentForFitNoteReferral
exports.insertActiveProblems = insertActiveProblems
exports.fetchFitNoteStatus = fetchFitNoteStatus
exports.fetchMedicalProblems = fetchMedicalProblems
exports.moveMedicalProblem = moveMedicalProblem
exports.addUsersAllergy = addUsersAllergy
exports.fetchAllergiesOfUser = fetchAllergiesOfUser
exports.fetchAllDiagnosis = fetchAllDiagnosis
exports.addCurrentConsult = addCurrentConsult
exports.fetchAllAllergies = fetchAllAllergies
exports.fetchCurrentConsult = fetchCurrentConsult
exports.addUserDiagnosis = addUserDiagnosis
exports.fetchUserDiagnosis = fetchUserDiagnosis
exports.enterFamilyHistory = enterFamilyHistory
exports.fetchFamilyHistory = fetchFamilyHistory
exports.addVaccinations = addVaccinations
exports.fetchVaccinationsOfUser = fetchVaccinationsOfUser
exports.viewCurrentConsult = viewCurrentConsult
exports.fetchAllVaccines = fetchAllVaccines
exports.fetchAllManufacturers = fetchAllManufacturers
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