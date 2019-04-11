'use strict'


const contactUs = new mongoose.Schema({
    message: { type: String },
    fullName: { type: String },
    email: { type: String },
    createdAt: { type: Number }
})


module.exports = contactUs