'use strict'


const feedbacks = new mongoose.Schema({
    subject: { type: String },
    message: { type: String },
    email: { type: String },
    createdAt: { type: Number }
})


module.exports = feedbacks