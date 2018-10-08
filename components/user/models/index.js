/*
 * @file:users.js
 * @description: This file defines the user schema for mongodb
 * @date: 23 March 2018
 * @author: Simran
 * */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var config = require('../../../configs');
var APP_CONSTANTS = config.constants;
var USER_TYPE = APP_CONSTANTS.USER_TYPE;
var USER_STATUS = APP_CONSTANTS.USER_STATUS
var GENDER = APP_CONSTANTS.GENDER


const userModel = new Schema({
    firstName: { type: String },
    lastName: { type: String },
    email: { type: String },
    password: { type: String }, // Encrypted password
    isEmailVerify: { type: Boolean, default: false }, // entered email is verified or not
    googleId: { type: String }, // google Id if login from google
    facebookId: { type: String }, // facebook Id if login from google
    userType: { type: String, enum: [USER_TYPE.guru, USER_TYPE.rookie, USER_TYPE.admin] },
    emailVerificationToken: { type: String }, // token for verifying the email in sign up
    secondaryEmails: [{ type: String }], // temporary emails maintaining all the emails registered
    createdAt: { type: Date }, //User created at date
    updatedAt: { type: Date }, //user profile updated at date
    isTermsAccepted: { type: Boolean, default: false }, //whether profile completed or not
    userStatus: { type: String, enum: [USER_STATUS.active, USER_STATUS.inactive], default: USER_STATUS.active }, // user active / inactive
    resetPasswordToken: { type: String }, //token if user clicks on reset password 
    deviceDetails: [{
        accessToken: { type: String },
        timeStamp: { type: Number },
        socketId: { type: String },
        timeZone: { type: String } // user's timezone
    }],
    dob: { type: Date },
    experienceDescription: { type: String },
    experience: { type: Number },
    gender: { type: String, enum: [GENDER.male, GENDER.female, GENDER.others] },
    profilePic: { type: Schema.Types.ObjectId, ref: "Files" },
    isApproved: { type: Boolean, default: false }, // guru approved or not
    isRejected: { type: Boolean, default: false }, // guru rejected or not
    isAuthorised: { type: Boolean, default: false },
    hourlyRate: { type: Number },
    profileTitle: { type: String },
    bio: { type: String },
    achievements: { type: String },
    skillsGuruTeaches: [{ type: Schema.Types.ObjectId, ref: "SkillsGuruTeaches" }],
    languages: [{ type: String }],
    exampleCourses: [{ type: Schema.Types.ObjectId, ref: "SkillsGuruTeaches" }],
    education: [{
        graduation: { type: String },
        instituteName: { type: String },
        degreeName: { type: String },
        description: { type: String },
        startYear: { type: Number },
        endYear: { type: Number }
    }],
    generalQuestions: [{
        question: { type: Schema.Types.ObjectId, ref: "QuesAns" },
        answer: { type: Schema.Types.ObjectId, ref: "QuesAns" }
    }],
    documents: [{ type: Schema.Types.ObjectId, ref: "Files" }],
    socialToken: { type: String }, // Token for validating the socialLogin session . Expires in 10 mins
    educationRookie: [{ // education for rookie
        //gcse: { type: String },
        skill: { type: String },
        level: { type: String },
        // higherEducation: { type: String },
        // qualification: { type: String }
    }],
    profileStepCompleted: { type: Number, default: 0 }, //number which will tell till what profile steps have been profileStepCompleted
    rating: {
        averageRating: { type: Number, default: 0 },
        totalRating: { type: Number, default: 0 },
        noOfRatings: { type: Number, default: 0 }
    },
    blockedList: [{ type: Schema.Types.ObjectId, ref: "User" }],
    stripeCustomerId: { type: String },
    customAccountDetails: { type: String }, //will carry the stripe account details object in Stringified form
    customAccount: { type: String }, //will carry the Stripe account id
    customAccountStatus: { type: Number, default: 0 }, //0->Requested, 1->Accepted , 2->Rejected
});

module.exports = mongoose.model('User', userModel);