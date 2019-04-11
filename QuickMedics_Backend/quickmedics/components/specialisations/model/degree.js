/* Degrees model*/

const degree = new mongoose.Schema({
    name: { type: String },
    isDeleted: { type: Boolean, default: false }
})

var degree = nongoose.model('degree', degree);
module.exports = degree