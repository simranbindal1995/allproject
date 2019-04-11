/* Degrees model*/

const degree = new mongoose.Schema({
    name: { type: String },
    isDeleted: { type: Boolean, default: false }
})

module.exports = degree