/* Availabilities model
author : Simran
date : 22 Nov 2018
updatedOn : 10 Dec 2018
*/

const availabilities = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
    day: [{ type: String }],
    dayNumber: [{ type: Number }],
    createdAt: { type: Number },
    startRange: { type: Number }, //startdate of next coming week
    endRange: { type: Number }, //end date after 12 weeks for that particular day
    allAvailabilities: [{
        startTime: { type: Number },
        endTime: { type: Number }
    }],
    isDeleted: { type: Boolean, default: false },
    isExpired: { type: Boolean, default: false }, // will get expired after 12 weeks of startRange
    consultationFee: { type: Number }
})

module.exports = availabilities