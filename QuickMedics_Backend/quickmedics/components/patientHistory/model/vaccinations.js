/* vaccinations model
author : Simran
date : 27 Dec 2018
*/

const vaccinations = new mongoose.Schema({
    name: { type: String },
    isDeleted: { type: Boolean, default: false },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "users" }
})

module.exports = vaccinations