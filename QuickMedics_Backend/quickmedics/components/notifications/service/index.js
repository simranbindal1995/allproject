/* Sevices */

var ioS;

const settingIo = function(io) { //to access the io object here in the notificationService
    ioS = io;
}

const sendNotification = async (params, saveInDb) => {
    logger.start(`notifications:services:sendNotification`)
    params.createdAt = moment().unix()

    if (!params.senderId._id || !params.senderId.email) {
        params.senderId = await db.users.findOne({ _id: params.senderId })
    }
    if (!params.receiverId._id || !params.receiverId.email) {
        params.receiverId = await db.users.findOne({ _id: params.receiverId })
    }
    if (params.bookingId && !params.bookingId._id) {
        params.bookingId = await db.bookings.findOne({ _id: params.bookingId })
    }
    //get total unread notifications count
    params.unReadCount = await db.notifications.count({ receiverId: params.receiverId._id, isRead: false })


    params.senderId.firstName = params.senderId.firstName.charAt(0).toUpperCase() + params.senderId.firstName.slice(1)
    let timeZone, time
    if (saveInDb) {
        timeZone = params.receiverId.deviceDetails && params.receiverId.deviceDetails.timeZone ? params.receiverId.deviceDetails.timeZone : "Asia/Kolkata"
        time = moment(params.bookingId.bookedAt.slotStartDate * 1000).tz(timeZone).format('LLLL')
    }

    if (params.notificationType == 1) { //new booking
        params.message = `You have a new booking from ${params.senderId.firstName} for ${time}`
    }
    if (params.notificationType == 2) { //cancel booking
        params.message = `${params.senderId.firstName} has cancelled a booking scheduled for ${time}`
    }
    if (params.notificationType == 3) { //Re-schedule booking
        params.message = `${params.senderId.firstName} has made changes in the booking scheduled at ${time}`
    }
    if (params.notificationType == 4) { //chat message
        params.message = `${params.senderId.firstName} has sent you a message`
    }
    if (params.notificationType == 5) { //reminder notification
        params.message = `Booking reminder - You have a upcoming booking scheduled at ${time}`
    }
    if (params.notificationType == 6) { //when call declined and booking marked completed
        params.message = params.message
    }
    if (saveInDb) {
        await db.notifications(params).save();
    }

    const ntfcnCount = await db.notifications.count({ receiverId: params.receiverId._id, isRead: false, isDeleted: false })
    const msgCount = await db.chats.findOne({ isDeleted: false, isRead: false, receiverId: params.receiverId })

    if (params.receiverId.deviceDetails && params.receiverId.deviceDetails.socketId) {
        const final = {
            senderId: { _id: params.senderId._id, firstName: params.senderId.firstName, profilePic: params.senderId.profilePic || "" },
            receiverId: params.receiverId._id,
            bookingId: params.bookingId && params.bookingId._id ? params.bookingId._id : "",
            notificationType: params.notificationType,
            message: params.message,
            createdAt: params.createdAt,
            totalUnReadNtfcnCount: ntfcnCount || 0,
            totalUnReadMessageCount: msgCount || 0
        }

        ioS.to(params.receiverId.deviceDetails.socketId).emit("notification", {
            data: final
        });

    }
    return true;

}

const fetchNotifications = async (params) => {

    const data = await db.notifications.find({ receiverId: params.userInfo._id, isDeleted: false }, { isRead: 0, isDeleted: 0, receiverId: 0, bookingId: 0, __v: 0 }, { sort: { createdAt: -1 }, skip: params.skip, limit: params.limit })
        .populate({ path: "senderId", select: "firstName lastName profilePic" })

    data.totalRecords = await db.notifications.count({ receiverId: params.userInfo._id, isDeleted: false })

    await db.notifications.update({ receiverId: params.userInfo._id }, { isRead: true }, { multi: true })

    return data;
}

const deleteNotification = async (params) => {
    await db.notifications.findOneAndUpdate({ _id: params.notificationId }, { isDeleted: true }, { new: true })

    return "Deleted successfully"
}
const deleteAllNotifications = async (params) => {
    await db.notifications.update({ receiverId: params.userInfo._id }, { isDeleted: true }, { multi: true, new: true })

    return "Deleted successfully"
}

exports.settingIo = settingIo
exports.sendNotification = sendNotification
exports.fetchNotifications = fetchNotifications
exports.deleteNotification = deleteNotification
exports.deleteAllNotifications = deleteAllNotifications