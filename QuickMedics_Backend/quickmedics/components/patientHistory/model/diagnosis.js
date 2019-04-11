/* diagnosis model
author : Simran
date : 24 Dec 2018
*/

const diagnosis = new mongoose.Schema({
    name: { type: String },
    isDeleted: { type: Boolean, default: false }
})

module.exports = diagnosis