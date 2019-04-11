/* medicines model
author : Simran
date : 28 Dec 2018
*/

const medicines = new mongoose.Schema({
    name: { type: String },
    isDeleted: { type: Boolean, default: false },
    referenceObject: { type: Object }
})

module.exports = medicines