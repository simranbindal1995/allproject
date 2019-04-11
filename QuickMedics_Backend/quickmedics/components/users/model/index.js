'use strict'
const hooks = require('../hooks')

const users = new mongoose.Schema({
    firstName: { type: String },
    lastName: { type: String },
    middleName: { type: String },
    email: { type: String },
    password: { type: String },
    userRole: { type: String, enum: ["1", "2", "3"] }, //1 - doctor , 2- patient , 3 - admin
    gender: { type: String, enum: ["male", "female", "others"] },
    dob: { type: Number },
    mobileNumber: { type: Number },
    countryCode: { type: String },
    fullAddress: { type: String },
    profilePic: { type: mongoose.Schema.Types.ObjectId, ref: "files" },
    family: [{
        memberName: { type: String },
        relation: { type: String },
        relationProofId: [{ type: mongoose.Schema.Types.ObjectId, ref: "files" }],
        correspondenceId: [{ type: mongoose.Schema.Types.ObjectId, ref: "files" }]
    }],
    rating: {
        averageRating: { type: Number, default: 0 },
        totalRating: { type: Number, default: 0 },
        noOfRatings: { type: Number, default: 0 }
    },
    correspondence: [{ type: mongoose.Schema.Types.ObjectId, ref: "files" }],
    description: { type: String },
    specialisationId: [{ type: mongoose.Schema.Types.ObjectId, ref: "specialisations" }],
    gmcNumber: { type: String },
    yearsOfExp: {
        month: { type: Number },
        year: { type: Number }
    },
    identityProof: { type: mongoose.Schema.Types.ObjectId, ref: "files" },
    signature: { type: mongoose.Schema.Types.ObjectId, ref: "files" },
    documents: [{ type: mongoose.Schema.Types.ObjectId, ref: "files" }],
    education: [{
        degree: { type: mongoose.Schema.Types.ObjectId, ref: "degrees" },
        college: { type: String },
        yearOfCompletion: { type: String }
    }],
    isApproved: { type: Boolean, default: false },
    isRejected: { type: Boolean, default: false },
    isblocked: { type: Boolean, default: false },
    isEmailVerified: { type: Boolean, default: false },

    userRegisterationTime: { type: Number },
    profileCompletionTime: { type: Number },
    lastProfileUpdatedTime: { type: Number },
    accountVerificationTime: { type: Number },

    deviceDetails: {
        accessToken: { type: String },
        timeStamp: { type: Number },
        socketId: { type: String },
        timeZone: { type: String } // user's timezone
    },
    profileStepCompleted: { type: Number, default: 0 },
    emailVerifyToken: { type: String },
    resetPasswordToken: { type: String },
    isDeleted: { type: Boolean, default: false },
    accountDeletionTime: { type: Number },
    consultationFee: { type: Number, default: 0 },
    userAddress: {
        'type': { type: String, enum: "Point", default: "Point" },
        coordinates: {
            type: [Number]
        }
    },
    otp: { type: Number },
    isPhoneNumberConfirmed: { type: Boolean, default: false },
    //consultantFee: { type: Number, default: 0 },
    allReviewRatings: [{
        reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
        review: { type: String, default: "" },
        rating: { type: Number }
    }],
    stripeCustomerId: { type: String },
    stripeBankId: { type: String },
    isCardDetailsAdded: { type: Boolean, default: false },
    secondaryMobileNumber: { type: Number },
    secondaryEmails: [{ type: String }],
    isSecondaryEmailVerified: { type: Boolean, default: true },
    isSecondaryPhoneVerified: { type: Boolean, default: true }
})





// users.index({ userAddress: '2dsphere' });
hooks.configure(users)
module.exports = users