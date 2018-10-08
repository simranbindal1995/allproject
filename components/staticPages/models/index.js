
var Mongoose = require('mongoose'),
    Schema = Mongoose.Schema

const env = require('../../../env');


var StaticPagesSchema = new Schema({
    content_type: { type: Number }, // 1- about us   2- terms and conditions  3- privacy policy 4 how it works guru, 5-how it works rookie 6 faq
    content: { type: String }, // in case of about us, privacy policy and terms and conditions
    updated_at: { type: Number },
    questions_answers: [{ // in case of FAQ's
        question: { type: String },
        answer: { type: String }
    }]
});
var static_pages = Mongoose.model('static_pages', StaticPagesSchema);

module.exports = {
    static_pages: static_pages
};