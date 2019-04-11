/* Notifications model
Simran
16 Jan 2019
*/

const notifications = new mongoose.Schema({
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "bookings" },
    message: { type: String },
    createdAt: { type: Number },
    isRead: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    //saveInDb: { type: Boolean, default: true },
    notificationType: { type: Number }
    //1-New booking, 2- cancel booking , 3- Re-schedule , 4-chat messages,
    //5 - Reminder notification
    //6 - call decline notification
})

module.exports = notifications