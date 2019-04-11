/* Bookings model*/

const bookings = new mongoose.Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "users" }, //patient
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "users" }, //doctor
    bookedAt: {
        slotStartDate: { type: Number }, //full date
        slotEndDate: { type: Number },
        day: { type: String }, // day in string
        dayNumber: { type: Number }, // only day number
        slotsBooked: [{
            startTime: { type: Number }, //only time in seconds
            endTime: { type: Number }
        }]
    },
    bookedFor: { type: String }, //relation booking done for.
    createdAt: { type: Number },
    status: { type: String }, //paymentDone,cancelled,completed,expired(when call was not connected and time expired)
    consultationFee: { type: Number },
    totalSlotsBooked: { type: Number },
    totalAmount: { type: Number },
    transactionDetails: { type: String },
    cancellationDetails: {
        cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
        cancellationReason: { type: String },
        cancellationMessage: { type: String },
        cancelledAt: { type: Number }
    },
    actualCallDuration: { type: Number },
    rating: { type: Number, default: 0 },
    review: { type: String },
    ratedOn: { type: Number },
    isBookingClosed: { type: Boolean, default: false }, //closed all transactions are completed
    isCallInitiated: { type: Boolean, default: false }, //true when doctor has initiated call 
    callDetails: {
        doctorConnectedTime: { type: Number },
        callDisconnectedTime: { type: Number },
        patientConnectedTime: { type: Number },
        disconnectedBy: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
        numberCallDisconnected: { type: Number, default: 0 } //number of times call disconnected by patient
        //If it is more than 3 booking will be marked completed
        //If patient dont pick call in 2 mins then also mark call completed
    }
})

module.exports = bookings