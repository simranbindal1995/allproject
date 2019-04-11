/* allergies model
author : Simran
date : 24 Dec 2018
*/

const allergies = new mongoose.Schema({
    name: { type: String },
    isDeleted: { type: Boolean, default: false },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
    createdAt: { type: Number }
})

module.exports = allergies