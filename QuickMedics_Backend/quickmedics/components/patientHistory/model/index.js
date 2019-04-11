/* patienthistory model
author : Simran
date : 17 Dec 2018
*/

const patientHistory = new mongoose.Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "bookings" },
    relation: { type: String }, //(history added for )mom,dad...
    historyType: { type: Number },
    //1-activeProblems ,2 - allergy,3-currentConsultHistory,
    //4-assesmentFinding,5-diagnosis,6-treatment,
    //7-follow up,8-medications,9-family history
    //10-vaccinations,11- FitNote , 12-Referral,13-pathology,14-radiology
    dateOccured: { type: Number },
    createdAt: { type: Number },
    diagnosis: { type: mongoose.Schema.Types.ObjectId, ref: "diagnosis" }, //fever,tonsils....
    allergies: { type: mongoose.Schema.Types.ObjectId, ref: "allergies" }, //tonsils....
    vaccinations: { type: mongoose.Schema.Types.ObjectId, ref: "vaccinations" },
    manufacturers: { type: mongoose.Schema.Types.ObjectId, ref: "manufacturers" },
    prescriptions: { type: mongoose.Schema.Types.ObjectId, ref: "prescriptions" },
    pathology: [{ type: String }],
    radiology: [{
        name: { type: String },
        message: { type: String }
    }],
    batchCode : {type : String},
    problemType: { type: String }, //major,minor,significant...
    message: { type: String },
    isActive: { type: Boolean }, //move active problems to past
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
    isHistory: { type: Boolean, default: false }, //for medication history is prescription is outside this platform
    //For referals
    doctorName: { type: String },
    speciality: { type: String },
    hospital: { type: String }
})

module.exports = patientHistory