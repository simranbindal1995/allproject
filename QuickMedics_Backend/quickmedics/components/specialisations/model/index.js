/* Specialisation model*/

const specialisations = new mongoose.Schema({
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: "specialisations" },
    name: { type: String },
    isChild: { type: Boolean, default: true }
})

module.exports = specialisations