'use strict'
const sha1 = require('sha1')
const request = require('async-request')
const to_json = require('xmljson').to_json;
const config = require('config').get('stripe')
const stripeService = require('../../payments/service')
const notificationService = require("../../notifications/service")
const bigBlueButtonSecretKey = require('config').get('bigBlueButtonSecretKey')

var serverUrl = "http://10.1.172.245"

var ioS;

const setBookingIo = function(io) { //to access the io object here in the notificationService
    ioS = io;
}

// var link = "hooks/create" + "&callbackURL=https://10.1.172.245:4000/api/bookings/webhooks" + bigBlueButtonSecretKey["key"]

// link = sha1(link);
// console.log('link===========',link)
// 2a499e04c376316c79e392583b8b94db77a3a9e3

const createBooking = async (params) => {
    if (params.makePayment && !params.userInfo.isCardDetailsAdded) {
        throw new Error("Please add the card details first !")
    }

    let notAvailble = false,
        drBooked = false,
        userBooked = false
    logger.start(`bookings:services:createBooking`)
    logger.start("check if doctor has availability for given time.")

    for (const item in params.bookedAt.slotsBooked) {
        const data = params.bookedAt.slotsBooked[item]
        let criteria = {
            dayNumber: { $in: [params.bookedAt.dayNumber] },
            userId: params.doctorId,
            isExpired: false,
            isDeleted: false,
            allAvailabilities: {
                $elemMatch: {
                    startTime: { $lte: data.startTime },
                    endTime: { $gte: data.endTime }
                }
            }
        }
        const checkAvailable = await db.availabilities.find(criteria)
        if (checkAvailable.length == 0) notAvailble = true

        criteria = {
            doctorId: params.doctorId,
            "bookedAt.slotsBooked": {
                $elemMatch: {
                    startTime: { $lte: data.startTime },
                    endTime: { $gte: data.endTime }
                }
            },
            status: "paymentDone"
        }
        const checkBooking = await db.bookings.find(criteria)
        if (checkBooking.length > 0) drBooked = true

        criteria = {
            patientId: params.userInfo._id,
            "bookedAt.slotsBooked": {
                $elemMatch: {
                    startTime: { $lte: data.startTime },
                    endTime: { $gte: data.endTime }
                }
            },
            status: "paymentDone"
        }
        const checkBookingUser = await db.bookings.find(criteria)
        if (checkBookingUser.length > 0) userBooked = true
    }

    if (notAvailble) throw new Error("Sorry! Doctor you are trying to book is not available at the given time slot.")
    if (drBooked) throw new Error("Sorry ! The doctor you are trying to book is already booked for the given time slot.")
    if (userBooked) throw new Error("Sorry ! You already have a booking for the given time slot.")

    const startOfDay = moment(params.bookedAt.date * 1000).tz(params.userInfo.deviceDetails.timeZone).startOf('day').unix()

    const timeOfBooking = moment(startOfDay * 1000).tz(params.userInfo.deviceDetails.timeZone).add(params.bookedAt.slotsBooked[0].startTime, 'seconds').unix()

    params.bookedAt.slotStartDate = timeOfBooking

    const endTimeOfBooking = moment(startOfDay * 1000).tz(params.userInfo.deviceDetails.timeZone).add(params.bookedAt.slotsBooked[params.bookedAt.slotsBooked.length - 1].endTime, 'seconds').unix()
    params.bookedAt.slotEndDate = endTimeOfBooking

    // implement payments
    if (params.makePayment && !params.userInfo.stripeCustomerId) {
        const info = await stripeService.createCustomer(params.userInfo)
        params.userInfo.stripeCustomerId = info.stripeCustomerId
    }
    if (params.makePayment && params.cardToken && params.cardToken != "") {
        const data = await stripeService.createSource(params)
        params.cardId = data.id
    }

    if (params.makePayment) { //will set true when payment gateway is implememented on frontend
        var payment = await stripeService.createCharge(params)
    }

    const obj = {
        doctorId: params.doctorId,
        patientId: params.userInfo._id,
        bookedAt: params.bookedAt,
        bookedFor: params.bookedFor,
        createdAt: moment().unix(),
        consultationFee: params.consultationFee,
        totalSlotsBooked: params.bookedAt.slotsBooked.length,
        totalAmount: params.totalAmount,
        status: "paymentDone"
    }

    const booking = await db.bookings(obj).save();

    const comission = Math.round(config.adminComission * params.totalAmount) / 100

    const totalAmountToTransfer = params.totalAmount - comission


    params.patientId = params.userInfo._id
    params.bookingId = booking._id
    params.chargeId = payment ? payment.id : ""
    params.totalAmountDeducted = params.totalAmount
    params.adminPercentage = config.adminComission
    params.totalAmountToTransfer = totalAmountToTransfer
    params.metaData = payment || {}
    params.createdAt = moment().unix()
    params.transactionType = "cardToStripe"
    params.paymentType = "booking"

    const invoice = await db.invoices(params).save()

    const ntfcn = {
        senderId: params.userInfo,
        receiverId: params.doctorId,
        bookingId: booking,
        notificationType: 1
    }
    await notificationService.sendNotification(ntfcn, true)

    offline.queue('invoices', 'send-invoice', {
        patientId: params.patientId,
        doctorId: params.doctorId,
        charges: params.totalAmount
    }, {})

    return "Booking done successfully";
}

const reScheduleBooking = async (params) => {
    var totalAmount = 0
    var bookingAmount = params.totalAmount
    if (params.makePayment && !params.userInfo.isCardDetailsAdded) {
        throw new Error("Please add the card details first !")
    }
    let notAvailble = false,
        drBooked = false,
        userBooked = false
    logger.start(`bookings:services:createBooking`)
    logger.start("check if doctor has availability for given time.")

    const bookingDetails = await db.bookings.findOne({ _id: params.bookingId })

    params.doctorId = bookingDetails.doctorId

    if (bookingDetails.patientId.toString() != params.userInfo._id.toString())
        throw new Error('You are not authorised user.')

    for (const item in params.bookedAt.slotsBooked) {
        const data = params.bookedAt.slotsBooked[item]
        let criteria = {
            dayNumber: { $in: [params.bookedAt.dayNumber] },
            userId: bookingDetails.doctorId,
            isExpired: false,
            isDeleted: false,
            allAvailabilities: {
                $elemMatch: {
                    startTime: { $lte: data.startTime },
                    endTime: { $gte: data.endTime }
                }
            }
        }
        const checkAvailable = await db.availabilities.find(criteria)
        if (checkAvailable.length == 0) notAvailble = true

        criteria = {
            _id: { $ne: params.bookingId },
            doctorId: params.doctorId,
            "bookedAt.slotsBooked": {
                $elemMatch: {
                    startTime: { $lte: data.startTime },
                    endTime: { $gte: data.endTime }
                }
            },
            status: "paymentDone"
        }
        const checkBooking = await db.bookings.find(criteria)
        if (checkBooking.length > 0) drBooked = true

        criteria = {
            _id: { $ne: params.bookingId },
            patientId: params.userInfo._id,
            "bookedAt.slotsBooked": {
                $elemMatch: {
                    startTime: { $lte: data.startTime },
                    endTime: { $gte: data.endTime }
                }
            },
            status: "paymentDone"
        }
        const checkBookingUser = await db.bookings.find(criteria)
        if (checkBookingUser.length > 0) userBooked = true
    }

    if (notAvailble) throw new Error("Sorry ! The doctor you are trying to book is not available at the given time slot.")
    if (drBooked) throw new Error("Sorry ! The doctor you are trying to book is already booked for the given time slot.")
    if (userBooked) throw new Error("Sorry ! You already have a booking for the given time slot.")

    if (params.makePayment && !params.userInfo.stripeCustomerId) {
        const info = await stripeService.createCustomer(params)
        params.userInfo.stripeCustomerId = info.stripeCustomerId
    }
    if (params.makePayment && params.cardToken && params.cardToken != "") {
        const data = await stripeService.createSource(params)
        params.cardId = data.id
    }


    if (params.makePayment && bookingDetails.totalSlotsBooked > params.bookedAt.slotsBooked.length) {
        console.log('refund')
        //refund
        const slots = bookingDetails.totalSlotsBooked - params.bookedAt.slotsBooked.length
        let amount = parseInt(slots * bookingDetails.consultationFee)
        const detail = await db.invoices.find({ paymentType: "booking", bookingId: params.bookingId, transactionType: "cardToStripe", requestStatus: "ongoing" }, {}, { sort: { createdAt: 1 } })

        for (const index in detail) {

            if (amount >= detail[index].totalAmountDeducted) {

                const refund = await stripeService.refundFullCharge({ chargeId: detail[index].chargeId })

                params.patientId = params.userInfo._id
                params.bookingId = bookingDetails._id
                params.chargeId = refund.id
                params.totalAmountToTransfer = refund.amount / 100
                params.adminPercentage = config.adminComission
                params.metaData = refund
                params.createdAt = moment().unix()
                params.transactionType = "slotRefund"
                params.isRescheduled = true
                params.requestStatus = "completed"
                params.paymentType = "booking"

                const invoice = await db.invoices(params).save()

                amount = amount - detail[0].totalAmountDeducted
                totalAmount += params.totalAmountToTransfer
                console.log('totalAmount=========', totalAmount)
            } else {
                const refund = await stripeService.refundPartialCharge({ chargeId: detail[index].chargeId, amount: amount })

                params.patientId = params.userInfo._id
                params.bookingId = bookingDetails._id
                params.chargeId = refund.id
                params.totalAmountToTransfer = amount
                params.adminPercentage = config.adminComission
                params.metaData = refund
                params.createdAt = moment().unix()
                params.transactionType = "slotRefund"
                params.isRescheduled = true
                params.paymentType = "booking"

                const invoice = await db.invoices(params).save()
                totalAmount += params.totalAmountToTransfer
                console.log('totalAmount=========', totalAmount)
            }
        }
        offline.queue('invoices', 'refund-invoice', {
            patientId: bookingDetails.patientId,
            reason: "your cancelled slots",
            charges: totalAmount
        }, {})

    } else if (params.makePayment && bookingDetails.totalSlotsBooked < params.bookedAt.slotsBooked.length) {
        console.log('charge more')
        //charge more ; Check previous added slots and how much more slots are being booked
        const moreSlots = params.bookedAt.slotsBooked.length - bookingDetails.totalSlotsBooked
        params.totalAmount = parseInt(moreSlots * bookingDetails.consultationFee)
        const payment = await stripeService.createCharge(params)

        params.patientId = params.userInfo._id
        params.bookingId = bookingDetails._id
        params.chargeId = payment.id
        params.totalAmountDeducted = params.totalAmount
        params.adminPercentage = config.adminComission
        params.metaData = payment
        params.createdAt = moment().unix()
        params.transactionType = "cardToStripe"
        params.isRescheduled = true
        params.paymentType = "booking"

        const comission = Math.round(config.adminComission * params.totalAmount) / 100

        params.totalAmountToTransfer = params.totalAmount - comission

        const invoice = await db.invoices(params).save()

        offline.queue('invoices', 'send-invoice', {
            patientId: params.userInfo._id,
            doctorId: bookingDetails.doctorId,
            charges: params.totalAmount
        }, {})


    }

    const startOfDay = moment(params.bookedAt.date * 1000).tz(params.userInfo.deviceDetails.timeZone).startOf('day').unix()
    const timeOfBooking = moment(startOfDay * 1000).tz(params.userInfo.deviceDetails.timeZone).add(params.bookedAt.slotsBooked[0].startTime, 'seconds').unix()
    params.bookedAt.slotStartDate = timeOfBooking

    const endTimeOfBooking = moment(startOfDay * 1000).tz(params.userInfo.deviceDetails.timeZone).add(params.bookedAt.slotsBooked[params.bookedAt.slotsBooked.length - 1].endTime, 'seconds').unix()
    params.bookedAt.slotEndDate = endTimeOfBooking

    params.totalSlotsBooked = params.bookedAt.slotsBooked.length
    params.totalAmount = bookingAmount
    await db.bookings.findOneAndUpdate({ _id: params.bookingId }, params)

    const ntfcn = {
        senderId: params.userInfo,
        receiverId: bookingDetails.doctorId,
        bookingId: bookingDetails,
        notificationType: 3
    }
    await notificationService.sendNotification(ntfcn, true)

    return "Booking re-schedule successfully";
}

const cancelBooking = async (params) => {
    var totalAmount = 0
    const details = await db.bookings.findOne({ _id: params.bookingId, $or: [{ patientId: params.userInfo._id }, { doctorId: params.userInfo._id }] })

    if (details == null) throw new Error("You are not authorised user.")
    if (details && details.bookedAt.date < moment().tz(params.userInfo.deviceDetails.timeZone).unix()) {
        throw new Error("Booking cannot be cancelled now.")
    }

    // Refund the user with the actual amount
    const detail = await db.invoices.find({ bookingId: params.bookingId, transactionType: "cardToStripe", requestStatus: "ongoing" })

    if (params.makePayment) {
        //  detail.forEach(async (item) => {
        for (const item in detail) {
            const refund = await stripeService.refundFullCharge({ chargeId: detail[item].chargeId })

            params.patientId = params.userInfo._id
            params.bookingId = params.bookingId
            params.chargeId = refund.id
            params.totalAmountToTransfer = refund.amount / 100
            params.adminPercentage = config.adminComission
            params.metaData = refund
            params.createdAt = moment().unix()
            params.transactionType = "fullRefund"
            params.paymentType = "booking"

            await db.invoices(params).save()

            totalAmount += refund.amount / 100
        }
        offline.queue('invoices', 'refund-invoice', {
            patientId: details.patientId,
            reason: "your cancelled booking",
            charges: totalAmount
        }, {})
    }

    await db.bookings.findOneAndUpdate({ _id: params.bookingId }, {
        status: "cancelled",
        cancellationDetails: {
            cancelledBy: params.userInfo._id,
            cancellationReason: params.cancellationReason,
            cancellationMessage: params.cancellationMessage,
            cancelledAt: moment().unix()
        }
    })

    //if patient cancelling then send ntfcn to doctor
    params.userInfo._id.toString() == details.patientId.toString() ? params.receiverId = details.doctorId : params.receiverId = details.patientId

    const ntfcn = {
        senderId: params.userInfo,
        receiverId: params.receiverId,
        bookingId: details,
        notificationType: 2
    }
    await notificationService.sendNotification(ntfcn, true)

    return "Booking cancelled successfully"
}

const fetchBookings = async (params) => {
    let criteria = {},
        options = {}
    params.status == "upcoming" ? params.status = "paymentDone" : params.status == "past" ? params.status = "completed" : params.status = "cancelled"

    await db.bookings.update({
        status: "paymentDone",
        "bookedAt.slotEndDate": { $lte: moment().tz(params.userInfo.deviceDetails.timeZone).unix() },
        isCallInitiated: false
    }, { status: "expired" }, { multi: true })

    if (params.status == "past" || params.status == "completed") {
        criteria = { $and: [{ $or: [{ status: "completed" }, { status: "expired" }] }, { $or: [{ doctorId: params.userInfo._id }, { patientId: params.userInfo._id }] }] }
        options = { sort: { "bookedAt.slotEndDate": -1 }, skip: params.skip, limit: params.limit, lean: true }
    } else {
        criteria = {
            status: params.status,
            $or: [{ doctorId: params.userInfo._id }, { patientId: params.userInfo._id }]
        }
        options = { sort: { "bookedAt.slotStartDate": 1 }, skip: params.skip, limit: params.limit, lean: true }
    }


    let info = await db.bookings.find(criteria, { isCallInitiated: 1, cancellationDetails: 1, patientId: 1, doctorId: 1, "bookedAt.slotStartDate": 1, actualCallDuration: 1, totalSlotsBooked: 1, rating: 1, review: 1 }, options)
        .populate({ path: "patientId", select: "firstName lastName profilePic" })
        .populate({ path: "doctorId", select: "firstName lastName profilePic" })

    info.totalCount = await db.bookings.count(criteria)

    if (params.status == "cancelled") {
        for (var i = 0; i < info.length; i++) {
            if (info[i].doctorId._id.toString() == info[i].cancellationDetails.cancelledBy.toString()) { //doctor fetching
                params.userInfo.userRole == "1" ? info[i].status = "Cancelled by you" : info[i].status = "Cancelled by doctor"
            } else {
                params.userInfo.userRole == "1" ? info[i].status = "Cancelled by user" : info[i].status = "Cancelled by you"
            }
        }
    }
    return info;
}

const fetchTodaysBookings = async (params) => {
    const startTime = moment(params.currentDate * 1000).tz(params.userInfo.deviceDetails.timeZone).startOf("day").unix()
    const endTime = moment(params.currentDate * 1000).tz(params.userInfo.deviceDetails.timeZone).endOf("day").unix()

    let criteria = {
        "bookedAt.slotStartDate": { $gte: startTime },
        "bookedAt.slotEndDate": { $lte: endTime },
        status: "paymentDone"
    }

    if (params.userInfo.userRole == "1") criteria.doctorId = params.userInfo._id
    else criteria.patientId = params.userInfo._id

    const data = await db.bookings.find(criteria, { isCallInitiated: 1, doctorId: 1, patientId: 1, bookedAt: 1, totalSlotsBooked: 1 }, { sort: { "bookedAt.slotStartDate": 1 }, skip: params.skip, limit: params.limit })
        .populate({ path: 'doctorId', select: "firstName lastName profilePic" })
        .populate({ path: 'patientId', select: "firstName lastName profilePic" })

    data.totalCount = await db.bookings.count(criteria)

    return data;
}

const reviewAndRating = async (params) => {
    const data = await db.bookings.findOneAndUpdate({ _id: params.bookingId }, { rating: params.rating, review: params.review, ratedOn: moment().unix() }, { new: true })

    let getDoctorRating = await db.users.findOne({ _id: data.doctorId }, { rating: 1 })

    getDoctorRating.rating.noOfRatings += 1
    getDoctorRating.rating.totalRating += params.rating
    getDoctorRating.rating.averageRating = parseInt(getDoctorRating.rating.totalRating / getDoctorRating.rating.noOfRatings)

    await db.users.findOneAndUpdate({ _id: data.doctorId }, { rating: getDoctorRating.rating }, { new: true })

    return "Rating & Review done successfully"
}

const fetchDetailsOfBooking = async (params) => {

    const details = await db.bookings.findOne({ _id: params.bookingId })

    let avail = [],
        bookings = [],
        slotsArr = [],
        finalData = {}
    logger.start("users:services:fetchDetailsOfBooking")
    const all = await db.availabilities.find({ userId: details.doctorId, isExpired: false, isDeleted: false, day: { $in: [details.bookedAt.day] }, dayNumber: { $in: [details.bookedAt.dayNumber] } }, { allAvailabilities: 1 })

    for (var i = 0; i < all.length; i++) {
        for (var j = 0; j < all[i].allAvailabilities.length; j++) {
            avail.push(all[i].allAvailabilities[j])
        }
    }

    const booking = await db.bookings.find({
        _id: { $ne: params.bookingId },
        doctorId: details.doctorId,
        status: "paymentDone",
        "bookedAt.dayNumber": details.bookedAt.dayNumber,
        "bookedAt.day": details.bookedAt.day
    })

    for (var i = 0; i < booking.length; i++) {
        for (var j = 0; j < booking[i].bookedAt.slotsBooked.length; j++) {
            bookings.push(booking[i].bookedAt.slotsBooked[j])
        }
    }

    for (var i = 0; i < avail.length; i++) {
        var totalSeconds = avail[i].endTime - avail[i].startTime
        var timeForSlots = 15 * 60 // bcoz we have slots for 15 mins 

        var noOfSlots = parseInt(totalSeconds / timeForSlots)

        var startTime = avail[i].startTime

        for (var j = 0; j < noOfSlots; j++) {
            slotsArr.push({
                startTime: startTime,
                endTime: startTime + (15 * 60), // adding 15 mins to startTime to get each slot of 15 mins
                isBooked: false
            })
            startTime = startTime + (15 * 60)
            //Slots will be like 9.00 - 9.15 , 9.15-9.30 ....
        }
    }


    for (var i = 0; i < slotsArr.length; i++) {
        for (var j = 0; j < bookings.length; j++) {

            if (slotsArr[i].startTime == bookings[j].startTime && slotsArr[i].endTime == bookings[j].endTime) {
                slotsArr[i].isBooked = true
            }
        }
    }

    finalData = {
        dateBookedFor: details.bookedAt.slotStartDate,
        slotsArr: slotsArr,
        relation: details.bookedFor,
        consultationFee: details.consultationFee
    }

    return finalData;


}

const makeCall = async (params) => {

    const data = await db.bookings.findOne({ _id: params.bookingId, doctorId: params.userInfo._id }).populate({ path: "patientId" })

    if (!data) throw new Error("This booking does not belong to you")
    if (data.status == "expired") throw new Error("The booking has already expired")
    if (data.status == "completed") throw new Error("The booking has been completed,can't make call now.")
    if (data.bookedAt.slotEndDate <= moment().unix()) throw new Error("Booking time ended can't make call now.")

    var moderatorPW = data.doctorId
    var attendeePW = data.patientId._id

    var name = "booking"

    var url = serverUrl + "/bigbluebutton/api/"
    var link = "create" + "name=" + name + "&meetingID=" + params.bookingId + "&attendeePW=" + attendeePW + "&moderatorPW=" + moderatorPW + bigBlueButtonSecretKey["key"]

    link = sha1(link);

    const finalCreationLink = url + "create?" + "name=" + name + "&meetingID=" + params.bookingId + "&attendeePW=" + attendeePW + "&moderatorPW=" + moderatorPW + "&checksum=" + link

    const info = await request(finalCreationLink)
    
    to_json(info.body, function(error, data) {
        if (error) throw new Error(error)
        if (data.response.returncode == "SUCCESS") { 
            params.meetingID = data.response.internalMeetingID
        } else {
            return data.response.message
        }
    });

    var url = serverUrl + "/bigbluebutton/api/"
    var link = "join" + "&meetingID=" + params.bookingId + "&password=" + moderatorPW + "&fullName=" + params.userInfo.firstName + "&userID=" + params.userInfo._id + bigBlueButtonSecretKey["key"]
    link = sha1(link);

    var finalJoinLink = url + "join?" + "&meetingID=" + params.bookingId + "&password=" + moderatorPW + "&fullName=" + params.userInfo.firstName + "&userID=" + params.userInfo._id + "&checksum=" + link

    //emit socket to patient to let him join call

    if (data.patientId.deviceDetails && data.patientId.deviceDetails.socketId) {
        const final = {
            bookingId: data._id,
            doctorDetails: {
                _id: params.userInfo._id,
                firstName: params.userInfo.firstName || "",
                lastName: params.userInfo.lastName || "",
                profilePic: params.userInfo.profilePic || "",
            }
        }

        ioS.to(data.patientId.deviceDetails.socketId).emit("incomingCall", {
            data: final
        });

    }


    await db.bookings.findOneAndUpdate({ _id: params.bookingId }, { isCallInitiated: true, "callDetails.doctorConnectedTime": moment().unix() }, { new: true })

    return finalJoinLink

}

const joinCall = async (params) => {

    //  var link = "hooks/create?" + bigBlueButtonSecretKey["key"]

    // var url = serverUrl + "/bigbluebutton/api/" + "hooks/create?" + "&checksum=" + link

    // console.log('url========', url)

    // http: //yourserver.com/bigbluebutton/api/hooks/create?[parameters]&checksum=[checksum]

    //     "hooks/create" + "&callbackURL=https://10.1.172.245:4000/api/bookings/webhooks" + bigBlueButtonSecretKey["key"]

    const data = await db.bookings.findOne({ _id: params.bookingId, $or: [{ doctorId: params.userInfo._id }, { patientId: params.userInfo._id }] })
    if (!data) throw new Error("This booking does not belong to you")
    if (data.status == "expired") throw new Error("The booking has already expired")
    if (data.status == "completed") throw new Error("The booking has been completed,can't join call now.")


    var url = serverUrl + "/bigbluebutton/api/"
    var link = "getMeetingInfo" + "&meetingID=" + params.bookingId + bigBlueButtonSecretKey["key"]

    link = sha1(link);

    var finalJoinLink = url + "getMeetingInfo?" + "&meetingID=" + params.bookingId + "&checksum=" + link

    const info = await request(finalJoinLink)

    to_json(info.body, function(error, data) {
        if (error) throw new Error(error)
        if (data.response.returncode == "SUCCESS") {
            params.meetingID = data.response.internalMeetingID
        } else {
            throw new Error("The call must have been expired or ended.")
        }
    });
    var attendeePW = params.userInfo._id
    var url = serverUrl + "/bigbluebutton/api/"
    var link = "join" + "&meetingID=" + params.bookingId + "&password=" + attendeePW + "&fullName=" + params.userInfo.firstName + "&userID=" + params.userInfo._id + bigBlueButtonSecretKey["key"]

    link = sha1(link);

    finalJoinLink = url + "join?" + "&meetingID=" + params.bookingId + "&password=" + attendeePW + "&fullName=" + params.userInfo.firstName + "&userID=" + params.userInfo._id + "&checksum=" + link

    if (!data.callDetails.patientConnectedTime)
        await db.bookings.findOneAndUpdate({ _id: params.bookingId }, { "callDetails.patientConnectedTime": moment().unix() })


    return finalJoinLink

}

const declineCall = async (params) => {
    var messageDoctor = "Call declined by patient .If he declines 3 times booking will be marked completed and transfer will be made to you according to Quickmedics norms"
    var messagePatient = "If you decline the call thrice, booking will be marked completed, and no refund will be initiated to you."

    const data = await db.bookings.findOneAndUpdate({ _id: params.bookingId, patientId: params.userInfo._id }, { $inc: { "callDetails.numberCallDisconnected": 1 } }, { new: true })

    if (!data) throw new Error("The booking doesn't belong to you.")

    if (data.callDetails.numberCallDisconnected >= 3) {

        await db.bookings.findOneAndUpdate({ _id: params.bookingId }, { status: "completed" })
        var messageDoctor = "Patient declined the call thrice therefore, booking has been marked completed and transfer will be made to you according to Quickmedics norms"
        var messagePatient = "You have declined the call thrice therefore, booking has been marked completed and no refund will be initiated to you."

        const ntfcn = {
            senderId: data.patientId,
            receiverId: data.doctorId,
            bookingId: params.bookingId,
            notificationType: 6,
            message: messageDoctor
        }

        await notificationService.sendNotification(ntfcn, true)

        const ntfcn1 = {
            senderId: data.doctorId,
            receiverId: data.patientId,
            bookingId: params.bookingId,
            notificationType: 6,
            message: messagePatient
        }

        await notificationService.sendNotification(ntfcn1, true)

    } else {
        const doctorId = await db.users.findOne({ _id: data.doctorId })

        //emit socket to doctor
        if (doctorId.deviceDetails && doctorId.deviceDetails.socketId) {
            const final = {
                bookingId: data._id,
                message: messageDoctor
            }

            ioS.to(data.patientId.deviceDetails.socketId).emit("declinedCall", {
                data: final
            });
        }
    }

    return messagePatient;

}

const createWebhook = async (params) => {

    var url = serverUrl + "/bigbluebutton/api/"
    var link = "hooks/create" + "&callbackURL=https://10.1.172.245:4000/api/bookings/webhooks" + bigBlueButtonSecretKey["key"]

    link = sha1(link);

    var finalJoinLink = url + "hooks/create?" + "&callbackURL=https://10.1.172.245:4000/api/bookings/webhooks" + "&checksum=" + link

    const info = await request(finalJoinLink)

    to_json(info.body, function(error, data) {
        if (error) throw new Error(error)
        if (data.response.returncode == "SUCCESS") {
            console.log('data-----', data.response)
        } else {
            console.log('2================', data.response)
        }
    });
}

const webhooks = async (params) => {

    console.log('webhooks=============', params)

}

exports.createBooking = createBooking
exports.reScheduleBooking = reScheduleBooking
exports.cancelBooking = cancelBooking
exports.fetchBookings = fetchBookings
exports.fetchTodaysBookings = fetchTodaysBookings
exports.reviewAndRating = reviewAndRating
exports.fetchDetailsOfBooking = fetchDetailsOfBooking
exports.makeCall = makeCall
exports.joinCall = joinCall
exports.declineCall = declineCall
exports.webhooks = webhooks
exports.setBookingIo = setBookingIo