'use strict'

const staticPages = new mongoose.Schema({
    contentType: { type: Number }, // 1- about us  2-FAQ,3-privacy policy,4-copyright policy,5-user agreement,6-terms & conditions,7-deleteAccountTerms,8-user concent
    content: { type: String },
    questionsAnswers: [{ // in case of FAQ's
        question: { type: String },
        answer: { type: String }
    }],
    updatedAt: { type: Number }
})

module.exports = staticPages