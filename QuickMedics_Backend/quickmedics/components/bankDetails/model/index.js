/* BANK DETAILS*/

const bank = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users"
    },
    stripeBankId: {
        type: String
    },
    metaData: {
        type: Object
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Number
    }
});

module.exports = bank