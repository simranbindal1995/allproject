/* Invoices model
Simran - 7 Jan 2019
*/


const invoices = new mongoose.Schema({
    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "bookings"
    },
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users"
    }, //patient
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users"
    }, //doctor
    chargeId: {
        type: String
    },
    totalAmountDeducted: {
        type: Number
    }, //from patient
    totalAmountToTransfer: {
        type: Number
    }, // to doctor
    // adminComission: {
    //     type: Number
    // }, // amount transfered to admin
    adminPercentage: {
        type: Number
    }, // % amount transfered to admin ; Currently 15%
    metaData: {
        type: Object
    },
    createdAt: {
        type: Number
    },
    transactionType: {
        type: String,
        enum: ["cardToStripe", "stripeToBank", "fullRefund", "slotRefund"]
    },
    requestStatus: {
        type: String,
        enum: ["ongoing", "completed"],
        default: "ongoing"
    },
    isRescheduled: {
        type: Boolean,
        default: false
    },
    paymentType: {
        type: String,
        enum: ["booking", "fitnote", "referral", "prescription"]
    }
})

module.exports = invoices