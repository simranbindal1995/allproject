/** 28 Jan 2019 
Cron Jobs Services 
**/
const notificationService = require("../../notifications/service")
const stripeService = require('../../payments/service')

var ioS;
const setCronIo = function(io) { //to access the io object here in the notificationService
    ioS = io;
}

const reminderNotification = async (params) => {

    let startTime = moment().add(1, "days").unix() //adding 1 day to current time 
    let endTime = moment(startTime * 1000).add(6, "hours").unix() // adding 6 hrs to 1 day
    //If currentTime 6 am then it will return 6am 12pm of next day

    console.log(startTime, endTime)


    const criteria = {
        status: "paymentDone",
        "bookedAt.slotStartDate": { $gte: startTime, $lt: endTime }
    }
    const allBookings = await db.bookings.find(criteria)
        .populate({ "path": "doctorId", select: "firstName lastName deviceDetails" })
        .populate({ "path": "patientId", select: "firstName lastName deviceDetails" })

    for (const index in allBookings) {

        let ntfcn = {
            senderId: allBookings[index].doctorId,
            receiverId: allBookings[index].doctorId,
            bookingId: allBookings[index],
            notificationType: 5
        }
        await notificationService.sendNotification(ntfcn, true)

        ntfcn.senderId = allBookings[index].patientId
        ntfcn.receiverId = allBookings[index].patientId

        await notificationService.sendNotification(ntfcn, true)
    }
}

const payOuts = async (params) => {
    // paying the amounts to the doctors or refund the patients for any incomplete transactions
    const startTime = moment().startOf("day").unix()
    const endTime = moment().endOf("day").unix()

    //Transfer money to doctor on completion of booking
    //"bookedAt.slotStartDate": { $gte: startTime }, "bookedAt.slotEndDate": { lte: endTime }, 
    const all = await db.bookings.find({ status: "completed", isBookingClosed: false })
        .populate({ "path": "doctorId", select: "firstName deviceDetails" })
        .populate({ "path": "patientId", select: "firstName deviceDetails" })

    await transferToDoctors(all)

    //Refund patients for incomplete bookings

    const allRefunds = await db.bookings.find({ status: "expired", isBookingClosed: false })
        .populate({ "path": "patientId", select: "firstName deviceDetails" })


    await refundPatients(allRefunds)

}

const transferToDoctors = async (params) => {

    for (const index in params) {

        const bankDetails = await db.bankDetails.findOne({ userId: params[index].doctorId._id })
        const details = await db.invoices.find({ bookingId: params[index]._id, transactionType: "cardToStripe" })
        let totalBookingAmount = 0
        if (details.length > 0) {
            for (var i = 0; i < details.length; i++) {
                totalBookingAmount += details[i].totalAmountToTransfer
            }
        }

        if (bankDetails) {

            //const comission = Math.round(details.adminPercentage * params[index].totalAmount) / 100

            // const totalAmount = params[index].totalAmount - comission

            const obj = {
                totalAmount: totalBookingAmount,
                stripeBankId: bankDetails.stripeBankId
            }

            const data = await stripeService.transferToBank(obj)

            const obj1 = {
                patientId: params[index].patientId,
                doctorId: params[index].doctorId._id,
                bookingId: params[index]._id,
                chargeId: data ? data.id : "",
                adminPercentage: details[0].adminPercentage,
                totalAmountToTransfer: totalBookingAmount,
                // adminComission: comission,
                metaData: data || {},
                createdAt: moment().unix(),
                transactionType: "stripeToBank",
                requestStatus: "completed"
            }

            const invoice = await db.invoices(obj1).save()

            offline.queue('invoices', 'bank-transfer-invoice', {
                doctorId: params[index].doctorId,
                reason: `for your booking with patient ${params[index].patientId.firstName}`,
                charges: totalAmount
            }, {})



        }

        await refundForFitnotes({ bookingId: params[index]._id })
        await db.bookings.findOneAndUpdate({ _id: params[index]._id }, { isBookingClosed: true })
    }

}

const refundPatients = async (params) => {

    for (const index in params) {

        const detail = await db.invoices.find({ bookingId: params[index]._id, transactionType: "cardToStripe", requestStatus: "ongoing", paymentType: "booking" })
        let totalAmountTransfered = 0
        for (const item in detail) {

            if (detail[item].chargeId != "") {

                const refund = await stripeService.refundFullCharge({ chargeId: detail[item].chargeId })

                const obj = {
                    patientId: params[index].patientId,
                    doctorId: params[index].doctorId,
                    bookingId: params[index]._id,
                    chargeId: refund.id,
                    totalAmountToTransfer: refund.amount / 100,
                    adminPercentage: detail[item].adminComission,
                    metaData: refund,
                    createdAt: moment().unix(),
                    transactionType: "fullRefund",
                    requestStatus: "completed",
                    paymentType: "booking"
                }

                const invoice = await db.invoices(params).save()
                totalAmountTransfered += refund.amount / 100
            }
        }

        await refundForFitnotes({ bookingId: params[index]._id })
        await db.bookings.findOneAndUpdate({ _id: params[index]._id }, { isBookingClosed: true })

        offline.queue('invoices', 'refund-invoice', {
            patientId: params[index].patientId,
            reason: "your booking",
            charges: totalAmountTransfered
        }, {})

    }


}

const refundForFitnotes = async (params) => {

    const data = await db.invoices.find({ bookingId: params.bookingId, transactionType: "stripeToBank", paymentType: { $in: ["fitnote", "referral", "prescription"] }, requestStatus: "completed" }, {}, { lean: true })

    if (data.length == 0) {
        const types = ["fitnote", "referral", "prescription"]
        for (var i = 0; i < types.length; i++) {
            data.push({ paymentType: types[i] })
        }
    }
    for (const index in data) {

        const check = await db.invoices.findOne({ bookingId: params.bookingId, transactionType: "cardToStripe", paymentType: data[index].paymentType })

        if (check) {
            const refund = await stripeService.refundFullCharge({ chargeId: check.chargeId })

            const obj = {
                patientId: check.patientId,
                doctorId: check.doctorId,
                bookingId: check.bookingId,
                chargeId: refund.id,
                totalAmountToTransfer: refund.amount / 100,
                adminPercentage: check.adminComission,
                metaData: refund,
                createdAt: moment().unix(),
                transactionType: "fullRefund",
                requestStatus: "completed",
                paymentType: "fitnote"
            }

            const invoice = await db.invoices(obj).save()

            offline.queue('invoices', 'refund-invoice', {
                patientId: check.patientId,
                reason: `your payment on ${data[index]}`,
                charges: refund.amount / 100
            }, {})


        }


    }

}

const checkBookingToStart = async (params) => {

    const data = await db.bookings.find({
        status: "paymentDone",
        "bookedAt.slotStartDate": { $gte: moment().startOf("day").unix() },
        "bookedAt.slotEndDate": { $lte: moment().endOf("day").unix() },
        isCallInitiated: false
    }).populate({ path: "patientId" }).populate({ path: "doctorId" })

    for (let index in data) {

        let diff = data[index].bookedAt.slotStartDate - moment().unix()

        diff = diff / 60 // In minutes
        if (diff <= 5) { //if diff is less than or equal 5 enable button for call

            await db.bookings.findOneAndUpdate({ _id: data[index]._id }, { isCallInitiated: true })
            //emit socket to patient
            console.log('checkBookingToStart Emitting to doctor=========', data[index].doctorId._id)
            if (data[index].doctorId.deviceDetails && data[index].doctorId.deviceDetails.socketId) {
                const final = {
                    statusCode : 200,
                    bookingId: data[index]._id,
                    isCallInitiated : true
                }

                ioS.to(data[index].doctorId.deviceDetails.socketId).emit("enableCall", {
                    data: final
                });

            }



        }

    }
}

const markBookingsComplete = async (params) => {

    await db.bookings.update({
        status: "paymentDone",
        "bookedAt.slotEndDate": { $lte: moment().unix() },
        isCallInitiated: true
    }, { status: "completed" }, { new: true, multi: true })

}

const checkCallNotJoinedByPatient = async (params) => {

    const data = await db.bookings.find({
        status: "paymentDone",
        isCallInitiated: true,
        "callDetails.patientConnectedTime": { $exists: false },
    })

    for (let index in data) {
        const currentTime = moment().unix()
        const connectedTime = data[index].callDetails.doctorConnectedTime

        if (connectedTime <= currentTime) {

            let diff = currentTime - connectedTime

            if (diff >= 120) { //120 in seconds because diff is in seconds ;Call will be completed after patient doesn't pick till 2 mins 

                await db.bookings.findOneAndUpdate({ _id: data[index] }, { status: "completed" }, { new: true })

                var messageDoctor = "Patient didn't responded to the call in 2 minutes therefore, booking has been marked completed and transfer will be made to you according to Quickmedics norms"
                var messagePatient = "You haven't responded to the call in 2 minutes therefore, booking has been marked completed and no refund will be initiated to you."

                const ntfcn = {
                    senderId: data[index].patientId,
                    receiverId: data[index].doctorId,
                    bookingId: data[index].bookingId,
                    notificationType: 6,
                    message: messageDoctor
                }

                await notificationService.sendNotification(ntfcn, true)

                const ntfcn1 = {
                    senderId: data[index].doctorId,
                    receiverId: data[index].patientId,
                    bookingId: data[index].bookingId,
                    notificationType: 6,
                    message: messagePatient
                }

                await notificationService.sendNotification(ntfcn1, true)


            }
        }
    }



}



exports.payOuts = payOuts
exports.reminderNotification = reminderNotification
exports.transferToDoctors = transferToDoctors
exports.refundPatients = refundPatients
exports.refundForFitnotes = refundForFitnotes
exports.checkBookingToStart = checkBookingToStart
exports.markBookingsComplete = markBookingsComplete
exports.checkCallNotJoinedByPatient = checkCallNotJoinedByPatient
exports.setCronIo = setCronIo