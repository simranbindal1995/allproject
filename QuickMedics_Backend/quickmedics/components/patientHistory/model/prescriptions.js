/* prescriptions model
author : Simran
date : 28 Dec 2018
*/

const prescriptions = new mongoose.Schema({
    prescriptionNumber: { type: String },
    medicationData: [{
        medicineId: { type: mongoose.Schema.Types.ObjectId, ref: "medicines" },
        medicationType: { type: String }, //capsules,tablet..
        strength: { type: String }, //100mg,125mg..
        quantity: { type: Number },
        timePerDay: { type: Number },
        startDate: { type: Number }
    }],
    createdAt: { type: Number },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "bookings" },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
    relation: { type: String },
    isHistory: { type: Boolean, default: false }
})

module.exports = prescriptions