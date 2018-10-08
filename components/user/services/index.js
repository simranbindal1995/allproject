/*
 * @description: This file defines all the user services
 * @date: 26 March 2018
 * @author: Simran
 * */


'use strict';

// include Utils module

var Utils = require('../../../utils/index');
var env = require('../../../env');
var configs = require('../../../configs');
var jwt = require('jsonwebtoken');
var APP_CONSTANTS = configs.constants;
var USER_STATUS = APP_CONSTANTS.USER_STATUS;
var SESSION_STATUS = APP_CONSTANTS.SESSION_STATUS;
var mongoose = require('mongoose');
var fs = require('fs');

var userModel = require('../models/index');
var skillGuruTeachesModel = require('../../skillsGuruTeaches/models/index');
var quesModel = require('../../quesAns/models/index');
var filesModel = require('../../files/models/index');
var sessionModel = require('../../sessions/models/index');
var subjectnskills = require('../../subjectNSkill/models/index');
var availablityModel = require('../../availability/models/index');
var stripeService = require('../../stripe/services/index');
var chatModel = require('../../chat/models/chat');
var notificationModel = require('../../notification/models/index');

module.exports = {

    signUp: function(req, callback) {

        Utils.async.auto({
                checkEmailExists: [function(cb) {

                    Utils.universalFunctions.logger('In Step 1 of user creation -- ++ check email already exists ++')

                    userModel.find({ $or: [{ email: req.email }, { secondaryEmails: { $in: [req.email] } }] }, function(err, res) {

                        cb(err ? err : res.length > 0 ? { statusCode: 401, status: "warning", message: "Email already exist. Please use a different one" } : null, res)

                    })
                }],
                insertIntoDb: ["checkEmailExists", function(data, cb) {

                    Utils.universalFunctions.logger('In Step 2 of hashing user password and creating email verification token ')

                    var password_hash = Utils.md5(req.password)

                    var token = '';

                    var token = Utils.jwt.sign({ //generate token for verifying the email
                            email: req.email,
                            userType: req.userType, // guru , rookie
                        },
                        configs.config.data.jwtkey, { algorithm: configs.config.data.jwtAlgo }
                    );


                    var obj = {
                        email: req.email,
                        password: password_hash,
                        emailVerificationToken: token,
                        userType: req.userType,
                        createdAt: new Date()
                    };


                    Utils.universalFunctions.logger('Because admin will approve the guru')

                    req.userType == "rookie" ? obj.isApproved = true : obj.isApproved = false

                    userModel(obj).save(function(err, res) {
                        cb(err ? err : null, res);
                    })

                }],
                registerClientWithStripe: ["insertIntoDb", function(data, cb) {

                    stripeService.createCustomer(data.insertIntoDb, function(err, result) {
                        (err) ? cb(err): cb(null, null);
                    });
                }],
                sendVerificationEmail: ["insertIntoDb", function(data, cb) {
                    Utils.universalFunctions.logger('In Step 3 of user sending verification mail')

                    var subject = "Welcome to Gurook";

                    var link = 'http://' + configs.app[env.instance].url + ":" + configs.app[env.instance].port + '/emailTemplates/accVerify_logo.html?token=' + data.insertIntoDb.emailVerificationToken

                    var templatepath = Utils.path.join(__dirname, '../../../assets/emailTemplates/');
                    var fileReadStream = Utils.fs.createReadStream(templatepath + 'signup.html');

                    var emailTemplate = '';

                    fileReadStream.on('data', function(buffer) {
                        emailTemplate += buffer.toString();
                    });

                    fileReadStream.on('end', function(res) {

                        var sendStr = emailTemplate.replace('{{verificationLink}}', link).replace('{{link}}', link)

                        Utils.universalFunctions.sendMail(data.insertIntoDb.email, subject, sendStr)

                        cb(null, null)

                    });
                }],

            },
            function(err, res) {
                if (err) {
                    callback(err)
                } else {
                    callback(null, { statusCode: 200, status: 'success', message: "You are successfully registered. Please verify your account using the confirmation link sent to your email." })
                }
            });

    },

    verifyAccount: function(params, callback) {

        Utils.async.auto({
                generatingToken: [function(cb) {

                    Utils.jwt.verify(params.token, configs.config.data.jwtkey, function(err, decode) { // checking token expiry
                        cb(err ? { status: 'warning', statusCode: 401, message: "This link has expired." } : null, params)
                    })

                }],
                updatingDetails: ["generatingToken", function(data, cb) {

                    Utils.universalFunctions.logger('In Step 1 of verify account;if user exists verify account.')

                    userModel.findOneAndUpdate({ emailVerificationToken: params.token }, {
                        isEmailVerify: true,
                        $unset: { emailVerificationToken: 1 }
                    }, { new: true }, function(err, res) {
                        callback(err ? err : res == null ? { status: 'warning', statusCode: 401, message: "This link has expired." } : null, { status: 'success', statusCode: 200, message: "Your account is successfully verified . Please login." })
                    });
                }]

            },
            function(err, res) {
                if (err) {
                    callback(err)
                } else {
                    callback(null, res)
                }
            });

    },

    logIn: function(params, callback) {
        var lessons;
        Utils.async.auto({
                checkingEmail: [function(cb) {

                    Utils.universalFunctions.logger('Step 1 checking if email exists or not and if user is not blocked by admin.')

                    userModel.findOne({ email: params.email, userType: params.userType }, function(err, res) {


                        cb(err ? err :
                            res == null ? { statusCode: 401, status: 'warning', message: "Email does not exist." } :
                            res.isEmailVerify == false ? { statusCode: 401, status: 'warning', message: "Your account is not verified. Please verify your account." } :
                            null, res)
                    });
                }],
                validatingEmailPassword: ["checkingEmail", function(data, cb) {

                    Utils.universalFunctions.logger('Step 2 validating email and password.')

                    params.password = Utils.md5(params.password) // Encrypting password

                    userModel.findOne({ email: params.email, password: params.password }, function(err, res) {

                        cb(err ? err :
                            res == null ? { statusCode: 401, status: 'warning', message: "Invalid password." } :
                            null, res)

                    });
                }],
                generatingAccessToken: ["validatingEmailPassword", function(data, cb) {

                    Utils.universalFunctions.logger('Step 3 Generating access token')

                    params.userId = data.validatingEmailPassword._id

                    Utils.universalFunctions.createLoginToken({ email: params.email, _id: data._id }, function(err, res) {
                        cb(err ? err : null, res)
                    })
                }],
                updatingInDb: ["generatingAccessToken", function(data, cb) {

                    Utils.universalFunctions.logger('Step 4 updating access token in DB')

                    params.accessToken = data.generatingAccessToken

                    var arr = [{ timeZone: params.timeZone, accessToken: data.generatingAccessToken, timeStamp: Utils.moment().unix() }]

                    userModel.findOneAndUpdate({ _id: params.userId }, { deviceDetails: arr }, { new: true }, function(err, res) {
                        cb(err ? err : null, res);
                    });
                }],
                checkIfAnySessionsBooked: ["generatingAccessToken", function(data, cb) {

                    sessionModel.find({ requestedTo: params.userId }, function(err, res) {
                        if (err) cb(err)
                        else {
                            if (res.length > 0) lessons = true
                            else lessons = false
                            cb(null, data)
                        }
                    })
                }],
                getUnreadNotificationCount: ["generatingAccessToken", function(data, cb) {

                    notificationModel.find({ receiverId: params.userId, isRead: false, saveInDb: true }, function(err, res) {
                        if (err) cb(err)
                        else {
                            params.unReadNotifications = res.length
                            cb(null, data)
                        }
                    })
                }],
                getUnreadMessagesCount: ["generatingAccessToken", function(data, cb) {

                    chatModel.find({ to: params.userId, message_read: false }, function(err, res) {
                        if (err) cb(err)
                        else {
                            params.unReadMessagesCount = res.length
                            cb(null, data)
                        }
                    })
                }],
            },
            function(err, res) {
                if (err) callback(err)
                else {
                    var data = {}

                    var rookie, profileSteps

                    // console.log('======',res.updatingInDb.profileStepCompleted != 0 , !res.updatingInDb.profileStepCompleted , res.updatingInDb.userType == "1")

                    // if (!res.updatingInDb.profileStepCompleted && res.updatingInDb.userType == "1") {
                    //     profileSteps = 7
                    // } else 
                    if (res.updatingInDb.profileStepCompleted == 0 && res.updatingInDb.userType == "1") {
                        profileSteps = 1
                    } else if (res.updatingInDb.profileStepCompleted && res.updatingInDb.userType == "1") {
                        profileSteps = res.updatingInDb.profileStepCompleted + 1
                    }
                    // if (!res.updatingInDb.profileStepCompleted && res.updatingInDb.userType == "2") {
                    //     rookie = 3
                    // } else 
                    if (res.updatingInDb.profileStepCompleted == 0 && res.updatingInDb.userType == "2") {
                        rookie = 1
                    } else if (res.updatingInDb.profileStepCompleted && res.updatingInDb.userType == "2") {
                        rookie = res.updatingInDb.profileStepCompleted + 1
                    }

                    callback(null, {
                        statusCode: 200,
                        status: "success",
                        message: "Logged In successfully.",
                        data: {
                            accessToken: params.accessToken,
                            email: res.updatingInDb.email,
                            firstName: res.updatingInDb.firstName || "",
                            lastName: res.updatingInDb.lastName || "",
                            userType: res.updatingInDb.userType,
                            isTermsAccepted: res.updatingInDb.isTermsAccepted,
                            isAuthorised: res.updatingInDb.isAuthorised || false,
                            isApproved: res.updatingInDb.isApproved,
                            isRejected: res.updatingInDb.isRejected ? res.updatingInDb.isRejected : false,
                            userId: res.updatingInDb._id,
                            timeZone: params.timeZone,
                            profilePic: res.updatingInDb.profilePic || "",
                            rating: res.updatingInDb.rating ? res.updatingInDb.rating.averageRating : 0,
                            profileStepCompleted: profileSteps, //7 means redirect to dashboard
                            experience: res.updatingInDb.experience || "",
                            profileTitle: res.updatingInDb.profileTitle || "",
                            profileStepCompletedRookie: rookie,
                            lessons: lessons,
                            hourlyRate: res.updatingInDb.hourlyRate ? res.updatingInDb.hourlyRate : "",
                            isBankDetailsAdded: res.updatingInDb.customAccount ? true : false,
                            unReadNotifications: params.unReadNotifications,
                            unReadMessagesCount: params.unReadMessagesCount
                        }
                    });
                }
            })
    },

    forgotPassword: function(params, callback) {

        Utils.async.auto({
                checkEmailExists: [function(cb) {

                    Utils.universalFunctions.logger('Step 1 checking if email exists or not and if user is not blocked by admin.')

                    userModel.findOne({ email: params.email, userType: params.userType }, function(err, res) {

                        cb(err ? err :
                            res == null ? { statusCode: 401, status: 'warning', message: "Email does not exist." } :
                            res.isEmailVerify == false ? { statusCode: 401, status: 'warning', message: "Your account is not verified. Please verify your account." } :
                            null, res)
                    });

                }],
                generatingToken: ['checkEmailExists', function(data, cb) {

                    Utils.universalFunctions.logger('Step 2 generating resetPasswordToken and updating in db.')

                    var token = Utils.jwt.sign({ //generate token for verifying the email
                            email: params.email,
                            userType: data.userType, // userType - guru,rookie
                        },
                        configs.config.data.jwtkey, { algorithm: configs.config.data.jwtAlgo }
                    );

                    userModel.findOneAndUpdate({ email: params.email }, { resetPasswordToken: token }, { new: true }, function(err, res) {
                        cb(err ? err : null, res)
                    })
                }],
                sendingMail: ['generatingToken', function(data, cb) {

                    Utils.universalFunctions.logger("In step 3 of sending the mail with link to reset the password");

                    // var link = 'http://' + configs.app[env.instance].host + ":" + configs.app[env.instance].port

                    // var path = link + "/emailTemplates/reset_password.html" + "?email=" + params.email + '&emailConfirmToken=' + data.generatingToken.resetPasswordToken

                    if (params.userType == "1")
                        var path = "http://virtualclassroom.ignivastaging.com/teacher-reset-password" + "?email=" + params.email + '&emailConfirmToken=' + data.generatingToken.resetPasswordToken

                    else
                        var path = "http://virtualclassroom.ignivastaging.com/student-reset-password" + "?email=" + params.email + '&emailConfirmToken=' + data.generatingToken.resetPasswordToken


                    var subject = "Reset your password";
                    var templatepath = Utils.path.join(__dirname, '../../../assets/emailTemplates/');
                    var fileReadStream = Utils.fs.createReadStream(templatepath + 'forgot_password.html');

                    var emailTemplate = '';

                    fileReadStream.on('data', function(buffer) {
                        emailTemplate += buffer.toString();
                    });

                    var x;
                    x = data.checkEmailExists.firstName ? x = data.checkEmailExists.firstName : x = "User"
                    data.checkEmailExists.firstName = x.charAt(0).toUpperCase() + x.slice(1)

                    fileReadStream.on('end', function(res) {

                        var sendStr = emailTemplate.replace('{{path}}', path).replace('{{link}}', path).replace('{{firstName}}', data.checkEmailExists.firstName)

                        Utils.universalFunctions.sendMail(params.email, subject, sendStr)
                        cb(null, null);

                    });

                }]

            },
            function(err, res) {
                callback(err ? err : null, {
                    statusCode: 200,
                    status: "success",
                    message: "A link to change password has been sent to the email. Please use the link to reset your password"
                })
            });

    },

    verifyresetpasswordToken: function(params, callback) {
        Utils.universalFunctions.logger("checking if token exists or not");

        userModel.findOne({ $and: [{ resetPasswordToken: params.resetPasswordToken }, { email: params.email }] }, function(err, res) {

            callback(err ? err : res == null ? { statusCode: 401, status: 'warning', message: 'Token expired.' } : null, params)
        })
    },

    resetPassword: function(params, callback) {

        Utils.async.auto({
                validatingToken: [function(cb) {

                    Utils.universalFunctions.logger("In step 3 of validating token corresponding to user's email");

                    userModel.findOne({ email: params.email, resetPasswordToken: params.resetPasswordToken }, function(err, res) {

                        cb(err ? err : res == null ? { statusCode: 401, status: 'warning', message: 'Sorry ! Link expired' } : null, res)
                    })
                }],
                updatingNewPassword: ["validatingToken", function(data, cb) {

                    Utils.universalFunctions.logger("Updating Db with new password");

                    var obj = {
                        $unset: {
                            resetPasswordToken: 1
                        },
                        password: Utils.md5(params.newPassword)
                    }

                    userModel.findOneAndUpdate({ email: params.email }, obj, { new: true }, function(err, res) {
                        callback(err ? err : null, { statusCode: 200, status: 'success', message: "Password successfully changed." })
                    })

                }]

            },
            function(err, res) {
                callback(err ? err : res)
            });

    },

    logout: function(params, callback) {
        Utils.async.auto({
                logout: [function(cb) {

                    Utils.universalFunctions.logger("Checking which token to remove from array tokens of that particular user");

                    var criteria = {
                            "deviceDetails": {
                                "$elemMatch": {
                                    "accessToken": params["x-logintoken"]
                                }
                            }
                        },
                        dataToSet = {
                            $pull: {
                                "deviceDetails": {
                                    accessToken: params["x-logintoken"]
                                }

                            }
                        },
                        options = {
                            new: true
                        }

                    userModel.update(criteria, dataToSet, options, function(err, res) {
                        cb(err ? err : { statusCode: 200, status: 'success', message: "Logged Out successfully" })

                    });
                }],
            },
            function(err, result) {
                callback(err ? err : result)
            });
    },

    updateProfile: function(params, callback) {
        var skills = [];
        var path = Utils.path.join(__dirname, "../../../assets/cdn/" + params.userId);
        var mode = "0777";
        var extension = 'jpg';
        Utils.async.auto({

                updatingFields: [function(cb) {
                    Utils.universalFunctions.logger("Updating all the basic details of the user");
                    var obj = {
                        firstName: params.firstName,
                        lastName: params.lastName,
                        dob: params.dob,
                        gender: params.gender,
                        languages: params.languages,
                        profileStepCompleted: 1,
                        experience: params.experience
                    }

                    Utils.universalFunctions.logger("If user has updated his skills then update in user table");
                    userModel.findOneAndUpdate({ _id: params.userId }, obj, { new: true }, function(err, res) {
                        cb(err ? err : null, res)
                    })
                }],
                uploadingProfilePicCreateUserCdnFolder: ['updatingFields', function(data, cb) {
                    if (params.profilePic && params.profilePic != "") {

                        Utils.fs.mkdir(path, mode, function(err, res) {
                            if (err) {
                                if (err.code == 'EEXIST') {
                                    Utils.universalFunctions.logger("Step 2 of uploading files directory already exists for user");
                                    cb(null, path)
                                } else {
                                    cb(err)
                                }
                            } else {
                                Utils.universalFunctions.logger("Step 2 of uploading files new directory successfully created");
                                cb(null, path)
                            }
                        })
                    } else {
                        console.log("******* inside else.... no image")
                        callback(null, {
                            statusCode: 200,
                            status: 'success',
                            message: "Profile updated successfully",
                            data: {
                                firstName: data.updatingFields.firstName,
                                lastName: data.updatingFields.lastName,
                                dob: data.updatingFields.dob,
                                experience: data.updatingFields.experience,
                                gender: data.updatingFields.gender,
                                email: data.updatingFields.email,
                                profilePic: data.updatingFields.profilePic != null ? data.updatingFields.profilePic : ""
                            }
                        })
                    }
                }],

                uploadUserImage: ['uploadingProfilePicCreateUserCdnFolder', function(data, cb) {
                    console.log("inside nextfunction to upload mage.....")

                    var fileObject = {
                        user_id: params.userId,
                        file_original_name: params.profilePic.file_original_name,
                        file_type: params.profilePic.file_type,
                        file_extension: params.profilePic.file_original_name.split('.').pop(),
                        type: 1,
                        tmp_file: false
                    };

                    filesModel(fileObject).save(function(err, res) {
                        if (err) {
                            Utils.universalFunctions.logger("Step 3 of uploading files error in saving files to the database");
                            cb(err)
                        } else {
                            cb(null, res)
                        }
                    })
                }],

                fileWrite: ['uploadUserImage', function(data, cb) {
                    console.log("last callback to file write to serve")
                    var writePath = path + '/' + data.uploadUserImage._id + '.' + data.uploadUserImage.file_extension;
                    var imageBuffer = new Buffer(params.profilePic.image.split('base64,')[1], 'base64'); // remove data:image/png;base64 text from base64 image
                    fs.writeFile(writePath, imageBuffer, function(err, res) {
                        if (err) {
                            console.log("inside error/.....")
                            console.log(err)
                            cb(err, null)
                        } else {
                            console.log("@@@@@@@ inside success")
                            cb(null, res)
                        }
                    });
                }],

                updateImageInUserModel: ['fileWrite', function(data, cb) {
                    userModel.findOneAndUpdate({ _id: params.userId }, { profilePic: data.uploadUserImage._id }, { new: true }, function(err, res) {
                        cb(err ? err : null, res)
                    })
                }]
            },
            function(err, result) {
                console.log("final callback....")
                callback(err ? err : {
                    statusCode: 200,
                    status: 'success',
                    message: "Profile updated successfully",
                    data: {
                        firstName: result.updatingFields.firstName,
                        lastName: result.updatingFields.lastName,
                        dob: result.updatingFields.dob,
                        experience: result.updatingFields.experience,
                        gender: result.updatingFields.gender,
                        email: result.updatingFields.email,
                        profilePic: result.uploadUserImage._id != null ? result.uploadUserImage._id : ""
                    }
                })
            });
    },
    updateBasicInfo: function(params, callback) {
        var courses = []
        Utils.async.auto({
            // updatingCourses: [function(cb) {

            //     if (params.exampleCourses && params.exampleCourses != "") {
            //         Utils.universalFunctions.logger("Updating age group of the courses guru has added;also can delete the course from here")

            //         Utils.async.eachSeries(params.exampleCourses, function(item, Incb) {

            //                 skillGuruTeachesModel.findOneAndUpdate({ _id: Utils.Mongoose.Types.ObjectId(item.skillId), userId: Utils.Mongoose.Types.ObjectId(params.userId) }, { startAge: item.startAge, endAge: item.endAge, isDeleted: item.isDeleted }, { new: true }, function(err, res) {

            //                     res != null && res.isDeleted == false ? courses.push(res._id) : null
            //                     Incb(err ? err : null, res)
            //                 })
            //             },
            //             function(err, result) {
            //                 cb(err ? err : null, result)
            //             });

            //     } else {
            //         cb(null, params)
            //     }
            // }],
            updatingFields: [function(cb) {

                Utils.universalFunctions.logger("Updating all the basic details of the user");

                var obj = {
                    hourlyRate: params.hourlyRate,
                    profileTitle: params.profileTitle,
                    bio: params.bio,
                    experienceDescription: params.experienceDescription,
                    achievements: params.achievements,
                    profileStepCompleted: 2
                }

                Utils.universalFunctions.logger("If user has updated his course then update in user table");
                params.exampleCourses && params.exampleCourses != "" ? (obj.exampleCourses = courses) : null

                userModel.findOneAndUpdate({ _id: params.userId }, obj, { new: true }, function(err, res) {
                    cb(err ? err : {
                        statusCode: 200,
                        status: 'success',
                        message: "Profile updated successfully",
                        data: {
                            hourlyRate: res.hourlyRate,
                            profileTitle: res.profileTitle,
                            bio: res.bio,
                            experience: res.experience,
                            achievements: res.achievements,
                            experienceDescription: res.experienceDescription
                        }
                    })
                })



            }],
        }, function(err, result) {
            callback(err ? err : result)
        });
    },

    updateEducation: function(params, callback) {

        Utils.async.auto({
            updatingFields: [function(cb) {
                Utils.universalFunctions.logger("Updating education of the user");

                var criteria = { _id: params.userId }
                var dataToSet = {}

                params.education_id == "" ? dataToSet.$push = { education: params.education[0] } : null
                params.education_id && params.education_id != "" ? criteria.education = { $elemMatch: { _id: params.education_id } } : null;
                params.education_id != "" && params.isDeleted == false ? dataToSet.$addToSet = { "education": params.education[0] } : null
                params.education_id != "" && params.isDeleted == true ? dataToSet.$pull = { "education": { _id: params.education_id } } : null;

                dataToSet.profileStepCompleted = 3

                userModel.findOneAndUpdate(criteria, dataToSet, { new: true }, function(err, res) {
                    console.log("error...", err)
                    cb(err ? err : {
                        statusCode: 200,
                        status: 'success',
                        message: "Profile updated successfully",
                        data: res.education
                    })
                })



            }]
        }, function(err, result) {
            callback(err ? err : result)
        });


    },
    generalQuestions: function(params, callback) {

        Utils.async.auto({

            storeUserAnsweredQuestions: [function(cb) {

                userModel.findOneAndUpdate({ _id: params.userId }, { generalQuestions: params.questions, profileStepCompleted: 4 }, { new: true }, function(err, res) {
                    cb(err ? err : null, res)
                })
            }]

        }, function(err, result) {
            callback(err ? err : null, { statusCode: 200, status: 'success', message: "Updated successfully", data: result })
        });
    },

    uploadDocuments: function(params, callback) {

        Utils.async.auto({
                uploadingDocuments: [function(callback) {

                    filesModel.find({ _id: params.fileName, tmp_file: true }, function(err, res) {
                        if (err) {
                            callback(err)
                        } else {
                            if (res.length > 0) {
                                var file = res;
                                userModel.findOneAndUpdate({ _id: params.userId }, { $push: { documents: params.fileName }, profileStepCompleted: 5 }, { new: true }, function(err, res) {
                                    if (err) {
                                        callback(err)
                                    } else {

                                        var oldPath = file[0].tmp_location + "/" + file[0]._id + "." + file[0].file_extension;
                                        var newPath = Utils.path.join(__dirname, "../../../assets/cdn/" + file[0].user_id + "/" + file[0]._id + "." + file[0].file_extension);
                                        var path = Utils.path.join(__dirname, "../../../assets/cdn/" + file[0].user_id);
                                        var mode = "0777";

                                        Utils.fs.mkdir(path, mode, function(err, res) {
                                            if (err) {
                                                if (err.code == 'EEXIST') {
                                                    Utils.universalFunctions.logger("Step 3 for update profile cdn path already existed");
                                                    Utils.universalFunctions.moveFileTmpToCdn(file, oldPath, newPath, params, function(err, res) {

                                                        if (err) {
                                                            callback(err)
                                                        } else {
                                                            callback(null, res);
                                                        }
                                                    });
                                                } else {
                                                    callback(err)
                                                }
                                            } else {
                                                Utils.universalFunctions.logger("Step 3 for update profile cdn path created succesfully");
                                                Utils.universalFunctions.moveFileTmpToCdn(file, oldPath, newPath, params, function(err, res) {

                                                    if (err) {
                                                        callback(err)
                                                    } else {
                                                        callback(null, res);
                                                    }
                                                });
                                            }
                                        })
                                    }
                                });
                            } else {
                                callback({ statusCode: 401, status: "warning", message: "Unable to find the profile pic media source" })
                            }
                        }
                    });

                }]
            },
            function(err, res) {
                callback(err ? err : null, {
                    statusCode: 200,
                    status: "success",
                    message: "File uplaoded",
                    data: res.uploadingDocuments
                })
            });

    },

    deleteDocuments: function(params, callback) {

        Utils.async.auto({
                removeFromDocumentsArray: [function(cb) {
                    Utils.universalFunctions.logger("If user wants to delete the document then remove from array.")

                    var criteria = { _id: params.userId }
                    var dataToSet = { $pull: { documents: params.documentId } }

                    userModel.findOneAndUpdate(criteria, dataToSet, { new: true }, function(err, res) {
                        cb(err ? err : null, res)
                    });

                }],
                setBooleanInFiles: [function(cb) {

                    var criteria = { _id: params.documentId }
                    var dataToSet = { is_deleted: true }

                    filesModel.findOneAndUpdate(criteria, dataToSet, { new: true }, function(err, res) {
                        cb(err ? err : null, res)
                    });

                }]

            },
            function(err, res) {
                callback(err ? err : null, { statusCode: 200, status: 'success', message: "File deleted successfully" })
            });

    },
    viewDocuments: function(params, callback) {

        Utils.async.auto({

                getDocuments: [function(cb) {
                    Utils.universalFunctions.logger("If document id coming then show only that document,else show all the user's docs")
                    var criteria = { type: 2, user_id: params.userId, is_deleted: false, tmp_file: false }

                    params.documentId && params.documentId != "" ? criteria._id = params.documentId : null

                    filesModel.find(criteria, { uploaded_at: 1, title: 1, description: 1, file_original_name: 1, file_extension: 1 }, function(err, res) {
                        cb(err ? err : null, { statusCode: 200, status: 'success', message: "File fetched successfully", data: res.getDocuments })
                    })
                }]

            },
            function(err, res) {
                callback(err ? err : null, res)
            });

    },
    acceptTerms: function(params, callback) {

        Utils.async.auto({

            updateDB: [function(cb) {
                Utils.universalFunctions.logger("Update key is terms accepted true when user has accepted all the terms")

                userModel.findOneAndUpdate({ _id: params.userId }, { isAuthorised: params.isAuthorised, isTermsAccepted: params.isAccepted, profileStepCompleted: 6 }, { new: true }, function(err, res) {
                    cb(err ? err : null, res)
                })
            }]

        }, function(err, result) {
            callback(err ? err : null, { statusCode: 200, status: 'success', message: "Saved successfully" })
        });
    },
    socialLogin: function(params, callback) {

        var final = {}
        Utils.async.auto({

                checkIfParamsAreComplete: [function(cb) {

                    Utils.universalFunctions.logger("Check if params have either google_id or facebook_id");

                    (!params.googleId || params.googleId == "") && (!params.facebookId || params.facebookId == "") ?
                    callback({ statusCode: 401, status: 'warning', message: 'Please enter either google_id or facebook_id' }): cb(null, params);
                }],
                createOrUpdateEntries: ["checkIfParamsAreComplete", function(data, cb) {

                    Utils.universalFunctions.logger("Update google/facebook_id on email or create new user")

                    var obj = {}
                    params.facebookId ? obj.facebookId = params.facebookId : null

                    params.googleId ? obj.googleId = params.googleId : null

                    params.email ? obj.email = params.email : null

                    params.firstName ? obj.firstName = params.firstName : null

                    params.lastName ? obj.lastName = params.lastName : null

                    Utils.universalFunctions.logger("Generating social logij token for validating the session")

                    var token = Utils.jwt.sign({
                            email: params.email
                        },
                        configs.config.data.jwtkey, { algorithm: configs.config.data.jwtAlgo, expiresIn: '10m' }
                    );

                    obj.socialToken = token
                    obj.userType = params.userType
                    obj.isEmailVerify = true
                    params.userType == "rookie" ? obj.isApproved = true : obj.isApproved = false

                    userModel.findOneAndUpdate({ email: params.email }, obj, { new: true, upsert: true, setDefaultsOnInsert: true }, function(err, res) {
                        cb(err ? err : null, res)
                    })

                }]
            },
            function(err, result) {
                callback(err ? err : null, { statusCode: 200, status: "success", message: "Social login successful", data: { socialToken: result.createOrUpdateEntries.socialToken } });
            })
    },
    updateRookieBasicInfo: function(params, callback) { // api to save basic info of rookies
        var path = Utils.path.join(__dirname, "../../../assets/cdn/" + params.userData._id);
        var mode = "0777";
        var extension = 'jpg';

        Utils.async.auto({

            savePersonalInfo: [function(cb) { // first save the basic personal info
                Utils.universalFunctions.logger("Step 1 save the personal info");
                var dataToUpdate = {
                    firstName: params.name,
                    profileTitle: params.profileHeadline,
                    profileStepCompleted: 1
                }
                userModel.findOneAndUpdate({ _id: params.userData._id }, dataToUpdate, { new: true }, function(err, res) {
                    err ? cb(err) : cb(null, res)
                })
            }],

            uploadingProfilePicCreateUserCdnFolder: ['savePersonalInfo', function(data, cb) {
                if (params.profilePic && params.profilePic != "") {

                    Utils.fs.mkdir(path, mode, function(err, res) {
                        if (err) {
                            if (err.code == 'EEXIST') {
                                Utils.universalFunctions.logger("Step 2 of uploading files directory already exists for user");
                                cb(null, path)
                            } else {
                                cb(err)
                            }
                        } else {
                            Utils.universalFunctions.logger("Step 2 of uploading files new directory successfully created");
                            cb(null, path)
                        }
                    })
                } else {
                    console.log("******* inside else.... no image")
                    callback(null, {
                        statusCode: 200,
                        status: 'success',
                        message: "Profile updated successfully",
                        data: {
                            _id: data.savePersonalInfo._id,
                            firstName: data.savePersonalInfo.firstName ? data.savePersonalInfo.firstName : "",
                            lastName: data.savePersonalInfo.lastName ? data.savePersonalInfo.lastName : "",
                            email: data.savePersonalInfo.email,
                            profileTitle: data.savePersonalInfo.profileTitle ? data.savePersonalInfo.profileTitle : "",
                            profilePic: data.savePersonalInfo.profilePic ? data.savePersonalInfo.profilePic : ""
                        }
                    })
                }
            }],

            uploadUserImage: ['uploadingProfilePicCreateUserCdnFolder', function(data, cb) {
                console.log("inside nextfunction to upload mage.....")

                var fileObject = {
                    user_id: params.userData._id,
                    file_original_name: params.profilePic.file_original_name,
                    file_type: params.profilePic.file_type,
                    file_extension: params.profilePic.file_original_name.split('.').pop(),
                    type: 1,
                    tmp_file: false
                };

                filesModel(fileObject).save(function(err, res) {
                    if (err) {
                        Utils.universalFunctions.logger("Step 3 of uploading files error in saving files to the database");
                        cb(err)
                    } else {
                        cb(null, res)
                    }
                })
            }],

            fileWrite: ['uploadUserImage', function(data, cb) {

                var writePath = path + '/' + data.uploadUserImage._id + '.' + data.uploadUserImage.file_extension;
                var imageBuffer = new Buffer(params.profilePic.image.split('base64,')[1], 'base64'); // remove data:image/png;base64 text from base64 image
                fs.writeFile(writePath, imageBuffer, function(err, res) {
                    if (err) {
                        console.log("inside error/.....")
                        console.log(err)
                        cb(err, null)
                    } else {
                        console.log("@@@@@@@ inside success")
                        cb(null, res)
                    }
                });
            }],

            updateImageInUserModel: ['fileWrite', function(data, cb) {
                userModel.findOneAndUpdate({ _id: params.userData._id }, { profilePic: data.uploadUserImage._id }, { new: true }, function(err, res) {
                    cb(err ? err : null, res)
                })
            }]

            // saveProfilePic: ['savePersonalInfo', function(data, cb) {
            //     Utils.universalFunctions.logger("Step 2 update the image");
            //     if (params.profilePic != "" && (params.userData.profilePic == undefined || params.profilePic != params.userData.profilePic)) { // need to update the image

            //         filesModel.find({ _id: params.profilePic, tmp_file: true }, function(err, res) {
            //             if (err) {
            //                 callback(err)
            //             } else {
            //                 if (res.length > 0) {
            //                     var file = res;
            //                     userModel.findOneAndUpdate({ _id: params.userData._id }, { profilePic: params.profilePic, profileStepCompleted: 1 }, { new: true }, function(err, res) {
            //                         if (err) {
            //                             callback(err)
            //                         } else {

            //                             var oldPath = file[0].tmp_location + "/" + file[0]._id + "." + file[0].file_extension;
            //                             var newPath = Utils.path.join(__dirname, "../../../assets/cdn/" + file[0].user_id + "/" + file[0]._id + "." + file[0].file_extension);
            //                             var path = Utils.path.join(__dirname, "../../../assets/cdn/" + file[0].user_id);
            //                             var mode = "0777";

            //                             Utils.fs.mkdir(path, mode, function(err, res) {
            //                                 if (err) {
            //                                     if (err.code == 'EEXIST') {
            //                                         Utils.universalFunctions.logger("Step 3 for update profile cdn path already existed");
            //                                         Utils.universalFunctions.moveFileTmpToCdn(file, oldPath, newPath, function(err, res) {
            //                                             if (err) {
            //                                                 callback(err)
            //                                             } else {
            //                                                 cb(null, res);
            //                                             }
            //                                         });
            //                                     } else {
            //                                         callback(err)
            //                                     }
            //                                 } else {
            //                                     Utils.universalFunctions.logger("Step 3 for update profile cdn path created succesfully");
            //                                     Utils.universalFunctions.moveFileTmpToCdn(file, oldPath, newPath, function(err, res) {
            //                                         if (err) {
            //                                             callback(err)
            //                                         } else {
            //                                             cb(null, res);
            //                                         }
            //                                     });
            //                                 }
            //                             })
            //                         }
            //                     });
            //                 } else {
            //                     callback({ statusCode: 400, status: "warning", message: "Unable to find the profile pic media source" })
            //                 }
            //             }
            //         });
            //     } else {

            //         cb(null, data)
            //     }
            // }]
        }, function(err, result) {
            err ? callback(err) : callback(null, {
                status: "success",
                statusCode: 200,
                message: "Basic information updated successfully",
                data: {
                    //firstame: result.savePersonalInfo.firstName ? result.savePersonalInfo.firstName : "",
                    _id: result.savePersonalInfo._id,
                    firstName: result.savePersonalInfo.firstName ? result.savePersonalInfo.firstName : "",
                    lastName: result.savePersonalInfo.lastName ? result.savePersonalInfo.lastName : "",
                    email: result.savePersonalInfo.email,
                    profileTitle: result.savePersonalInfo.profileTitle ? result.savePersonalInfo.profileTitle : "",
                    profilePic: result.uploadUserImage._id ? result.uploadUserImage._id : ""
                }
            })
        })
    },
    updateRookieEducationalInfo: function(params, callback) { // save educational info of rookie

        Utils.async.auto({

            updateTheSkillAndLevel: [function(cb) { // update any skill and its skill
                var criteria = { _id: params.userData._id }
                var dataToSet = {};

                params.education_id && params.education_id != "" && params.isDeleted == true ? dataToSet.$pull = { "educationRookie": { _id: params.education_id } } : null;
                !params.education_id || params.education_id == "" ? dataToSet.educationRookie = params.education : null;

                dataToSet.profileStepCompleted = 2
                userModel.findOneAndUpdate(criteria, dataToSet, { new: true }, function(err, res) {
                    err ? cb(err) : cb({ status: "success", statusCode: 200, message: "Education updated successfully", data: res.educationRookie.reverse() })
                })
            }]
        }, function(err, result) {
            err ? callback(err) : callback(null, result)
        })
    },

    verifySocialLoginToken: function(params, callback) {

        Utils.async.auto({

                verifyingTokenfromjwt: [function(cb) {
                    Utils.universalFunctions.logger('Step 1 validating accessToken')

                    Utils.jwt.verify(params.token, configs.config.data.jwtkey, function(err, decode) { // checking token expiry
                        cb(err ? { status: 'warning', statusCode: 324, message: "Your session is expired. Please login again to continue" } : null, params)
                    })
                }],
                verifyingTokenInDb: [function(cb) {

                    Utils.universalFunctions.logger('Step 2 validating accessToken in DB')

                    userModel.findOne({ socialToken: params.token }, function(err, res) {
                        cb(err ? err :
                            res == null ? { status: 'warning', statusCode: 324, message: "Your session is expired. Please login again to continue" } : null, res
                        )
                    })
                }],
                createLoginToken: ["verifyingTokenfromjwt", "verifyingTokenInDb", function(data, cb) {
                    Utils.universalFunctions.logger('Step 3 Generating access token')

                    params.userId = data.verifyingTokenInDb._id

                    Utils.universalFunctions.createLoginToken({ email: data.verifyingTokenInDb.email, _id: data.verifyingTokenInDb._id }, function(err, res) {
                        cb(err ? err : null, res)
                    })

                }],
                updatingInDb: ["createLoginToken", function(data, cb) {

                    Utils.universalFunctions.logger('Step 4 updating access token in DB')

                    params.accessToken = data.createLoginToken

                    var arr = [{ timeZone: params.timeZone, accessToken: data.generatingAccessToken, timeStamp: Utils.moment().unix() }]


                    userModel.findOneAndUpdate({ _id: params.userId }, { deviceDetails: arr, $unset: { socialToken: 1 } }, { new: true }, function(err, res) {
                        cb(err ? err : null, res);
                    });
                }]
            },
            function(err, res) {
                callback(err ? err : {
                    statusCode: 200,
                    status: "success",
                    message: "Logged In successfully.",
                    data: {
                        accessToken: params.accessToken,
                        email: res.updatingInDb.email,
                        firstName: res.updatingInDb.firstName || "",
                        userType: res.updatingInDb.userType,
                        isTermsAccepted: res.updatingInDb.isTermsAccepted,
                        isAuthorised: res.updatingInDb.isAuthorised || false,
                        isApproved: res.updatingInDb.isApproved
                    }
                });
            });

    },
    fetchProfile: function(params, callback) {

        Utils.async.auto({
                getData: [function(cb) {

                    Utils.universalFunctions.logger("Fetch data of the logged in user")


                    var match = { $match: { _id: params.userId } }
                    var unwindArr = {
                        "$unwind": "$skillsGuruTeaches"
                    }
                    var objpopulate = {
                        "$lookup": { from: "skillsguruteaches", localField: "skillsGuruTeaches", foreignField: "_id", as: "SkillsGuruTeaches" }
                    }
                    var unwind = { "$unwind": "$SkillsGuruTeaches" }
                    var nestedlookup = {
                        "$lookup": { from: "subjectnskills", localField: "SkillsGuruTeaches.skillId", foreignField: "_id", as: "SkillsGuruTeaches.skillId" }
                    }
                    //                     var projection = {
                    //                         "$project": {
                    //                            "SkillsGuruTeaches.skillId.parent": 0,
                    //                             device_details: 0,
                    // =======
                    var push = {
                        "$group": {
                            "_id": "$_id",
                            "userData": { "$first": "$$ROOT" },
                            "SkillsGuruTeaches": { "$push": "$SkillsGuruTeaches" }
                        }
                    }
                    var projection = {
                        "$project": {
                            "SkillsGuruTeaches.skillId.parent": 0,
                            deviceDetails: 0,
                            "userData.password": 0,
                            createdAt: 0,
                            isApproved: 0,
                            userStatus: 0,
                            secondaryEmails: 0,
                            isEmailVerify: 0,
                            __v: 0,
                            generalQuestions: 0,
                            socialToken: 0,
                            googleId: 0,
                            facebookId: 0,
                            "SkillsGuruTeaches.userId": 0,
                            "SkillsGuruTeaches.isDeleted": 0,
                            "SkillsGuruTeaches.skillId.parent": 0,
                            "SkillsGuruTeaches.skillId.is_approved": 0,
                            "SkillsGuruTeaches.skillId.__v": 0,
                        }
                    }

                    userModel.aggregate([match, unwindArr, objpopulate, unwind, nestedlookup, push, projection]).exec(function(err, res) {

                        cb(null, res[0])
                    })


                }],
            },
            function(err, result) {

                callback(err ? err : null, { statusCode: 200, status: 'success', message: "Fetched successfully", data: result.getData })
            });
    },
    changePassword: function(params, callback) {
        Utils.async.auto({
            checkOldPasswordAndUpdate: [function(cb) {

                userModel.findOneAndUpdate({ _id: params.userId, password: Utils.md5(params.oldPassword) }, { password: Utils.md5(params.newPassword) }, { new: true }, function(err, res) {
                    callback(err ? err : res == null ? { statusCode: 401, status: "warning", message: "Old Password is incorrect" } :
                        null, { statusCode: 200, status: "success", message: "Your password has been successfully saved" })
                })

            }]
        }, function(err, result) {
            callback(err ? err : null, result);
        });
    },

    resendEmailVerificationToken: function(params, callback) {
        Utils.async.auto({
            checkIfEmailAlreadyVerified: [function(cb) {

                Utils.universalFunctions.logger('Checking Email exists or not')

                userModel.findOne({ email: params.email, userType: params.userType }, function(err, res) {
                    cb(err ? err :
                        res == null ? { statusCode: 401, status: "warning", message: "Email does not exist." } :
                        res.isEmailVerify == true ? { statusCode: 402, status: "warning", message: "Your email is already verified , please login" } :
                        null, res)
                })

            }],
            generatingToken: ["checkIfEmailAlreadyVerified", function(data, cb) {

                Utils.universalFunctions.logger('Generating token')

                var token = Utils.jwt.sign({ //generate token for verifying the email
                        email: params.email,
                        userType: data.checkIfEmailAlreadyVerified.userType, // guru , rookie
                    },
                    configs.config.data.jwtkey, { algorithm: configs.config.data.jwtAlgo }
                );

                userModel.findOneAndUpdate({ email: params.email }, { emailVerificationToken: token }, { new: true }, function(err, res) {
                    cb(err ? err : null, res)
                })
            }],
            sendVerificationEmail: ["generatingToken", function(data, cb) {
                Utils.universalFunctions.logger('In Step 3 of user sending verification mail')

                var subject = "Welcome to Gurook";

                var link = 'http://' + configs.app[env.instance].url + ":" + configs.app[env.instance].port + '/emailTemplates/accVerify_logo.html?token=' + data.generatingToken.emailVerificationToken


                var templatepath = Utils.path.join(__dirname, '../../../assets/emailTemplates/');
                var fileReadStream = Utils.fs.createReadStream(templatepath + 'signup.html');

                var emailTemplate = '';

                fileReadStream.on('data', function(buffer) {
                    emailTemplate += buffer.toString();
                });

                fileReadStream.on('end', function(res) {

                    var sendStr = emailTemplate.replace('{{verificationLink}}', link).replace('{{link}}', link)

                    Utils.universalFunctions.sendMail(params.email, subject, sendStr)
                    cb(null, null)
                });
            }]
        }, function(err, result) {
            callback(err ? err : null, { statusCode: 200, status: 'success', message: "Link sent again. Please verify your account using the confirmation link sent to your email." });
        });
    },
    changeEmail: function(params, callback) {

        Utils.async.auto({
            checkNewEmail: [function(cb) {

                userModel.find({ $or: [{ email: params.newEmail }, { secondaryEmails: { $in: [params.newEmail] } }] }, function(err, res) {
                    cb(err ? err : res.length > 0 ? { statusCode: 401, status: "warning", message: "Email already exists.Please use a different one" } : null, res)
                })
            }],
            getOldEmail: [function(cb) {

                userModel.findOne({ _id: params.userId }, function(err, res) {
                    cb(err ? err : null, res)
                })
            }],
            storeEmailInSecondary: ["checkNewEmail", "getOldEmail", function(data, cb) {


                Utils.universalFunctions.logger('Generating token and storing newEmail in secondary email')

                var token = Utils.jwt.sign({ //generate token for verifying the email
                        newEmail: params.newEmail,
                        oldEmail: data.getOldEmail.email
                    },
                    configs.config.data.jwtkey, { algorithm: configs.config.data.jwtAlgo }
                );

                userModel.findOneAndUpdate({ _id: params.userId }, { emailVerificationToken: token, $addToSet: { secondaryEmails: params.newEmail } }, { new: true }, function(err, res) {
                    cb(err ? err : null, res)
                })
            }],
            sendVerificationEmail: ["storeEmailInSecondary", function(data, cb) {
                Utils.universalFunctions.logger('In Step 3 of user sending verification mail on new email')

                var subject = "Confirm Changed Email";

                var link = 'http://' + configs.app[env.instance].url + ":" + configs.app[env.instance].port + '/emailTemplates/verifySecondaryEmail.html?token=' + data.storeEmailInSecondary.emailVerificationToken

                var templatepath = Utils.path.join(__dirname, '../../../assets/emailTemplates/');
                var fileReadStream = Utils.fs.createReadStream(templatepath + 'changeEmail.html');

                var emailTemplate = '';

                fileReadStream.on('data', function(buffer) {
                    emailTemplate += buffer.toString();
                });
                var x = data.storeEmailInSecondary.firstName
                data.storeEmailInSecondary.firstName = x.charAt(0).toUpperCase() + x.slice(1)

                var templateLink = link

                fileReadStream.on('end', function(res) {

                    var sendStr = emailTemplate
                        .replace('{{templateLink}}', templateLink)
                        .replace('{{link}}', link)
                        .replace('{{oldEmail}}', data.storeEmailInSecondary.email)
                        .replace('{{newEmail}}', params.newEmail)
                        .replace('{{firstName}}', data.storeEmailInSecondary.firstName)

                    Utils.universalFunctions.sendMail(params.newEmail, subject, sendStr)
                    cb(null, null)
                });
            }]

        }, function(err, result) {
            callback(err ? err : null, { statusCode: 200, status: 'success', message: "A link to verify your email has been sent to your new email.Please click on the link to verify your account" });
        });
    },
    verifySecondaryEmail: function(params, callback) {
        var decoded
        Utils.async.auto({
                generatingToken: [function(cb) {

                    Utils.jwt.verify(params.token, configs.config.data.jwtkey, function(err, decode) { // checking token expiry
                        cb(err ? { status: 'warning', statusCode: 401, message: "This link has expired." } : null, params)
                    })

                }],
                updatingDetails: ["generatingToken", function(data, cb) {

                    Utils.universalFunctions.logger('In Step 1 of verify account;if user exists verify account.')
                    Utils.universalFunctions.logger("Decode the token to get the old and new email")

                    decoded = jwt.decode(params.token)

                    userModel.findOneAndUpdate({ emailVerificationToken: params.token }, {
                        email: decoded.newEmail,
                        $unset: { emailVerificationToken: 1 },
                        $addToSet: { secondaryEmails: decoded.oldEmail },
                    }, { new: true }, function(err, res) {
                        cb(err ? err : res == null ? { status: 'warning', statusCode: 401, message: "This link has expired." } : null, { status: 'success', statusCode: 200, message: "Your account is successfully verified . Please login." })
                    });
                }],
                RemoveSecondaryEmail: ["updatingDetails", function(data, cb) {

                    Utils.universalFunctions.logger('Remove new primary email from secondary email array.')

                    userModel.findOneAndUpdate({ email: decoded.newEmail }, {
                        email: decoded.newEmail,
                        $pull: { secondaryEmails: decoded.newEmail },
                        $unset: { deviceDetails: 1 }
                    }, { new: true }, function(err, res) {
                        callback(err ? err : res == null ? { status: 'warning', statusCode: 401, message: "This link has expired." } : null, { status: 'success', statusCode: 200, message: "Your account is successfully verified . Please login." })
                    });
                }]
            },
            function(err, res) {
                callback(err ? err : null, res)
            });

    },
    findGuru: function(params, callback) {
        var userIds = [],
            params_array = []

        Utils.async.auto({
            checkAvailabilityInDays: [function(cb) {
                var currentTime = new Date();
                currentTime.setSeconds('00');
                currentTime = Math.round(currentTime.getTime() / 1000)

                var startDate = Utils.moment().startOf('day').unix()


                if (params.days && params.days.length > 0) { // check availablity in days

                    availablityModel.find({
                        $and: [{ day: { $in: params.days } }, { startDateTime: { $gte: startDate } }, { endDatelagTime: { $gte: currentTime } }]

                    }, function(err, res) {
                        if (err) {
                            cb(err)
                        } else {

                            if (res && res.length > 0) {
                                res.forEach(function(user) {
                                    userIds.push(user.userId)
                                })
                                cb(null, params)
                            } else {
                                cb(null, params)
                            }
                        }
                    })
                } else {
                    cb(null, params)
                }
            }],

            checkGuruAvailabilityWithFilters: ['checkAvailabilityInDays', function(data, cb) {
                var skills_array = [],
                    filter_array = []
                if (params.skills && params.skills.length > 0) {
                    params.skills.forEach(function(skills) {
                        skills_array.push(mongoose.Types.ObjectId(skills))
                    })
                }

                if (params.gender && params.gender != '') {
                    var obj = { 'gender': { $in: params.gender } };
                    params_array.push(obj);
                }

                if (params.rating && params.rating) {
                    var obj = { 'rating.averageRating': params.rating };
                    params_array.push(obj);
                }

                if (params.startPrice && params.endPrice) {
                    var obj = { 'hourlyRate': { $gte: params.startPrice, $lt: params.endPrice } };
                    params_array.push(obj);
                }
                if (params.endAge) {
                    var obj = { $gte: ["$$comp.endAge", params.endAge] };
                    filter_array.push(obj);
                }

                if (params.startAge) {
                    var obj = { $lte: ["$$comp.startAge", params.startAge] };
                    filter_array.push(obj);
                }

                if (params.skills && params.skills.length) {
                    var obj = { $in: ["$$comp.skillId", skills_array] };
                    filter_array.push(obj);
                }

                if (params.days && params.days.length > 0 && userIds.length > 0) {
                    var obj = { '_id': { $in: userIds } };
                    params_array.push(obj);
                }

                var obj = { 'userType': '1', 'isApproved': true }
                params_array.push(obj)

                userModel.aggregate([{
                            "$match": {
                                $and: params_array
                            }
                        },
                        {
                            "$project": {
                                "skillsGuruTeaches": 1,
                                "firstName": 1,
                                "lastName": 1,
                                "gender": 1,
                                "hourlyRate": 1,
                                "profilePic": 1,
                                "rating": 1,
                                "email": 1,
                                "profileTitle": 1,
                                "bio": 1
                            }
                        },
                        {
                            "$unwind": {
                                "path": "$skillsGuruTeaches",
                                "preserveNullAndEmptyArrays": false
                            }
                        }, {
                            "$lookup": {
                                "from": 'skillsguruteaches',
                                "localField": 'skillsGuruTeaches',
                                "foreignField": '_id',
                                "as": 'Skills'
                            }
                        },
                        {
                            "$addFields": {
                                "Skills": {
                                    "$arrayElemAt": [{
                                            "$filter": {
                                                "input": "$Skills",
                                                "as": "comp",
                                                cond: {
                                                    $and: filter_array
                                                }
                                            }
                                        },
                                        0
                                    ]
                                }
                            }
                        },

                        {
                            "$unwind": {
                                "path": "$Skills",
                                "preserveNullAndEmptyArrays": false
                            }
                        }, {
                            "$lookup": {
                                from: "subjectnskills",
                                localField: "Skills.skillId",
                                foreignField: "_id",
                                as: "Skills.skillId"
                            }
                        },
                        {
                            "$group": {
                                "_id": "$_id",
                                "firstName": {
                                    "$first": "$firstName",
                                },
                                "lastName": {
                                    "$first": "$lastName",
                                },
                                "profileTitle": {
                                    "$first": "$profileTitle",
                                },
                                "profilePic": {
                                    "$first": "$profilePic"
                                },
                                "bio": {
                                    "$first": "$bio",
                                },
                                "age": {
                                    "$first": "$age",
                                },
                                "gender": {
                                    "$first": "$gender",
                                },
                                "hourlyRate": {
                                    "$first": "$hourlyRate",
                                },
                                "rating": {
                                    "$first": "$rating",
                                },
                                "skills": { $push: "$Skills" }
                            }
                        },
                        // {
                        //     $skip: params.skip
                        // },
                        // {
                        //     $limit: params.limit
                        // }
                    ],
                    function(err, res) {
                        if (err) {
                            cb(err)
                        } else {
                            cb(null, res)
                        }
                    })
            }],
        }, function(err, result) {
            var totalCount = result.checkGuruAvailabilityWithFilters.length
            var a = Utils._.chain(result.checkGuruAvailabilityWithFilters)
                .rest(params.skip || 0)
                .first(params.limit || 10)

            a = a._wrapped


            err ? callback(err) : callback(null, { status: "success", statusCode: 200, message: "Data fetched successfully", totalCount: totalCount, data: a })
        })
    },
    listOneToOneLessonsAsPerStatus: function(params, callback) {
        Utils.universalFunctions.logger("inside fetch all lessons with sttaus api")

        var criteria = { isDeleted: false, sessionType: "one-one", startDateTime: { $gte: params.currentTime } };
        Utils.async.auto({

                prepareSearchCriteriaAsRole: [function(cb) { // for guru, fetch the lessons created for that guru, for student fetch lessons created by that student total count
                    params.userData.userType == 'guru' || params.userData.userType == '1' ?
                        criteria.requestedTo = params.userData._id :
                        criteria.requestedBy = params.userData._id

                    switch (params.status) {
                        case 'accepted':
                            criteria.status = { $in: [SESSION_STATUS.accepted, SESSION_STATUS.expired] }
                            break;
                        case 'rejected':
                            criteria.status = SESSION_STATUS.rejected
                            break;
                        case 'pending':
                            criteria.status = SESSION_STATUS.pending
                            break;
                    }
                    //  Utils.universalFunctions.logger(criteria)

                    sessionModel.find(criteria).sort({ "createdAt": -1 }).count().exec(function(err, res) {
                        err ? cb(err) : cb(null, res)
                    })

                }],

                fetchTheSessions: ['prepareSearchCriteriaAsRole', function(data, cb) { // fetch the session details

                    sessionModel.aggregate([{
                                "$match": criteria
                            },
                            {
                                "$unwind": {
                                    "path": "$skillId",
                                    "preserveNullAndEmptyArrays": false
                                }
                            }, {
                                "$lookup": {
                                    "from": 'subjectnskills',
                                    "localField": 'skillId',
                                    "foreignField": '_id',
                                    "as": 'Skills'
                                }
                            },

                            {
                                "$unwind": {
                                    "path": "$Skills",
                                    "preserveNullAndEmptyArrays": false
                                }
                            },
                            {
                                "$lookup": {
                                    from: "subjectnskills",
                                    localField: "Skills.parent",
                                    foreignField: "_id",
                                    as: "Skills.subject"
                                }
                            },
                            {
                                "$unwind": {
                                    "path": "$comments",
                                    "preserveNullAndEmptyArrays": false
                                }
                            }, {
                                "$lookup": {
                                    "from": 'users',
                                    "localField": 'comments.created_by',
                                    "foreignField": '_id',
                                    "as": 'comments.commentsNew'
                                }
                            },
                            {
                                "$lookup": {
                                    "from": 'users',
                                    "localField": 'requestedTo',
                                    "foreignField": '_id',
                                    "as": 'requestedToUser'
                                }
                            },
                            {
                                "$lookup": {
                                    "from": 'users',
                                    "localField": 'requestedBy',
                                    "foreignField": '_id',
                                    "as": 'requestedByUser'
                                }
                            },
                            {
                                $project: {
                                    "status": 1,
                                    "startDateTime": 1,
                                    "sessionType": 1,
                                    "ratePerHour": 1,
                                    "endDateTime": 1,
                                    "Skills.name": 1,
                                    "Skills.subject": 1,
                                    "requestedToUser.firstName": 1,
                                    "requestedToUser.lastName": 1,
                                    "requestedToUser.bio": 1,
                                    "requestedToUser.profilePic": 1,
                                    "requestedToUser.userType": 1,
                                    "requestedByUser.userType": 1,
                                    "requestedToUser.rating": 1,
                                    "requestedByUser.firstName": 1,
                                    "requestedByUser.lastName": 1,
                                    "requestedByUser.bio": 1,
                                    "requestedByUser.profilePic": 1,
                                    "requestedByUser.rating": 1,
                                    "comments.comment": 1,
                                    "comments.commentsNew.profilePic": 1,
                                    "comments.commentsNew.userType": 1,

                                }
                            },
                            {
                                $sort: {
                                    "createdAt": -1
                                }
                            },
                            {
                                "$group": {
                                    "_id": "$_id",
                                    "status": {
                                        "$first": "$status",
                                    },
                                    "startDateTime": {
                                        "$first": "$startDateTime",
                                    },
                                    "endDateTime": {
                                        "$first": "$endDateTime",
                                    },
                                    "ratePerHour": {
                                        "$first": "$ratePerHour",
                                    },
                                    "profilePic": {
                                        "$first": "$profilePic",
                                    },
                                    "sessionType": {
                                        "$first": "$sessionType",
                                    },
                                    "requestedBy": {
                                        $first: "$requestedByUser"
                                    },
                                    "requestedTo": {
                                        $first: "$requestedToUser"
                                    },
                                    "comments": { "$addToSet": "$comments" },
                                    "Skills": { "$addToSet": "$Skills" }
                                }
                            },

                            {
                                $skip: params.skip || 0
                            },
                            {
                                $limit: params.limit || 10
                            }
                        ],
                        function(err, res) {
                            err ? cb(err) : cb(null, res)
                        })
                }]
            },
            function(err, result) {
                err ? callback(err) : callback(null, { status: "success", statusCode: 200, message: "Lessons Fetched successfully", totalCount: result.prepareSearchCriteriaAsRole, data: result.fetchTheSessions })
            })
    },
    getProfileStepByStep: function(params, callback) { // get steps by steps for profile
        var finalArray;
        var skill_Added = false;

        Utils.async.auto({

            getProfileData: [function(cb) {

                switch (params.type) {
                    case 1: // profile
                        Utils.universalFunctions.logger("Step 1 to fetch the basic profile")
                        userModel.find({ _id: params.userData._id }, { firstName: 1, lastName: 1, dob: 1, email: 1, experience: 1, languages: 1, profilePic: 1, gender: 1, skillsGuruTeaches: 1 }).lean().populate({ path: 'skillsGuruTeaches', populate: { path: 'skillId', populate: { path: 'parent', populate: { path: 'parent' } } } }).exec(function(err, res) {
                            // err ? cb(err) : cb(null, res)
                            if (err) {
                                cb(err)
                            } else {
                                skillGuruTeachesModel.findOne({ type: 1, isDeleted: false, userId: params.userData._id }, function(err, resp) {

                                    if (err) {
                                        cb(err)
                                    } else {
                                        if (resp) {
                                            skill_Added = true
                                        } else {
                                            skill_Added = false
                                        }
                                        res[0].skillAdded = skill_Added

                                        cb(null, res)
                                    }
                                })
                            }
                        })
                        break;

                    case 2: // basic information
                        Utils.universalFunctions.logger("Step 2 to fetch the basic information")
                        userModel.find({ _id: params.userData._id }, { exampleCourses: 1, hourlyRate: 1, profileTitle: 1, bio: 1, achievements: 1, profilePic: 1, experienceDescription: 1 }).lean().populate({ path: 'exampleCourses', populate: { path: 'skillId', populate: { path: 'parent', populate: { path: 'parent' } } } }).exec(function(err, res) {
                            err ? cb(err) : cb(null, res)
                        })
                        break;
                    case 3: // educational
                        Utils.universalFunctions.logger("Step 3 to fetch the educational")
                        userModel.find({ _id: params.userData._id }, { education: 1, profilePic: 1 }, function(err, res) {
                            err ? cb(err) : cb(null, res)
                        })
                        break;

                    case 4: //general questions
                        Utils.universalFunctions.logger("Step 4 to fetch the educational")
                        userModel.find({ _id: params.userData._id }, { generalQuestions: 1, profilePic: 1 }, function(err, res) {
                            err ? cb(err) : cb(null, res)
                        })
                        break;

                    case 5: //documents
                        Utils.universalFunctions.logger("Step 5 to fetch the educational")
                        userModel.find({ _id: params.userData._id }, { documents: 1, profilePic: 1 }).populate({ path: "documents", select: "title description uploaded_at file_original_name" }).exec(function(err, res) {
                            res.length > 0 && res[0].documents.length > 0 ? res[0].documents.reverse() : null
                            err ? cb(err) : cb(null, res)
                        })
                        break;

                    case 6: //terms and conditions
                        Utils.universalFunctions.logger("Step 6 to fetch the terms and conditions")
                        userModel.find({ _id: params.userData._id }, { isAuthorised: 1, isTermsAccepted: 1, profilePic: 1 }, function(err, res) {
                            err ? cb(err) : cb(null, res)
                        })
                        break;
                }
            }],

            modifyData: ['getProfileData', function(data, cb) {
                Utils.universalFunctions.logger("Step 2 to modify data", data)



                var a = [];
                switch (params.type) {
                    case 1:

                        if (data.getProfileData[0].skillsGuruTeaches && data.getProfileData[0].skillsGuruTeaches.length > 0) {

                            data.getProfileData[0].skillsGuruTeaches.forEach(function(guruSkills) {
                                a.push({
                                    category: guruSkills.skillId.parent.parent.name,
                                    subject: {
                                        _id: guruSkills.skillId.parent._id,
                                        name: guruSkills.skillId.parent.name
                                    },
                                    subskill: [{
                                        name: guruSkills.skillId.name,
                                        _id: guruSkills.skillId._id,
                                        startAge: guruSkills.startAge,
                                        endAge: guruSkills.endAge
                                    }]
                                })

                            })
                        }

                        var arr = []

                        var group = Utils._.groupBy(a, function(item) {
                            return item.category
                        });

                        var map = Utils._.map(group, function(num) { return num });
                        var final = []
                        for (var i = 0; i < map.length; i++) {
                            var arr = [],
                                startAge = 0,
                                endAge = 0
                            var group1 = Utils._.groupBy(map[i], function(item) {
                                return item.subject._id
                            });

                            var map2 = Utils._.map(group1, function(num) { return num });

                            for (var j = 0; j < map2.length; j++) {
                                var tmp = []
                                for (var k = 0; k < map2[j].length; k++) {
                                    startAge = map2[j][k].subskill[0].startAge, endAge = map2[j][k].subskill[0].endAge
                                    tmp.push({ _id: map2[j][k].subskill[0]._id, name: map2[j][k].subskill[0].name })

                                }

                                arr.push({ subject: map2[j][0].subject, skills: tmp, startAge: startAge, endAge: endAge })
                            }

                            final.push({ category: map[i][0].category, subjectnskills: arr })
                        }

                        finalArray = Utils._.map(data.getProfileData, function(userdata) {
                            return {
                                _id: userdata._id,
                                firstName: userdata.firstName ? userdata.firstName : "",
                                lastName: userdata.lastName ? userdata.lastName : "",
                                dob: userdata.dob ? userdata.dob : "",
                                email: userdata.email,
                                experience: userdata.experience ? userdata.experience : 0,
                                languages: userdata.languages ? userdata.languages : [],
                                profilePic: userdata.profilePic ? userdata.profilePic : "",
                                gender: userdata.gender ? userdata.gender : "",
                                skillsGuruTeaches: final,
                                skillAdded: userdata.skillAdded
                            }
                        });
                        cb(null, finalArray[0])
                        break;

                    case 2:

                        if (data.getProfileData[0].exampleCourses && data.getProfileData[0].exampleCourses.length > 0) {

                            data.getProfileData[0].exampleCourses.forEach(function(guruSkills) {
                                a.push({
                                    category: guruSkills.skillId.parent.parent.name,
                                    subject: {
                                        _id: guruSkills.skillId.parent._id,
                                        name: guruSkills.skillId.parent.name
                                    },
                                    subskill: [{
                                        name: guruSkills.skillId.name,
                                        startAge: guruSkills.startAge,
                                        endAge: guruSkills.endAge
                                    }],
                                    description: guruSkills.description,
                                    duration: guruSkills.duration,
                                })

                            })
                        }

                        var arr = []

                        var group = Utils._.groupBy(a, function(item) {
                            return item.category
                        });

                        var map = Utils._.map(group, function(num) { return num });
                        var final = []
                        for (var i = 0; i < map.length; i++) {
                            var arr = [],
                                startAge = 0,
                                endAge = 0
                            var group1 = Utils._.groupBy(map[i], function(item) {
                                return item.subject._id
                            });

                            var map2 = Utils._.map(group1, function(num) { return num });

                            for (var j = 0; j < map2.length; j++) {
                                var tmp = []
                                for (var k = 0; k < map2[j].length; k++) {
                                    startAge = map2[j][k].subskill[0].startAge, endAge = map2[j][k].subskill[0].endAge
                                    tmp.push(map2[j][k].subskill[0].name)

                                }

                                arr.push({ subject: map2[j][0].subject, skills: tmp, startAge: startAge, endAge: endAge, description: map2[j][0].description, duration: map2[j][0].duration })
                            }

                            final.push({ category: map[i][0].category, subjectnskills: arr })
                        }

                        finalArray = Utils._.map(data.getProfileData, function(userdata) {
                            return {
                                _id: userdata._id,
                                hourlyRate: userdata.hourlyRate ? userdata.hourlyRate : 0,
                                profileTitle: userdata.profileTitle ? userdata.profileTitle : "",
                                bio: userdata.bio ? userdata.bio : "",
                                achievements: userdata.achievements ? userdata.achievements : "",
                                profilePic: userdata.profilePic ? userdata.profilePic : "",
                                experienceDescription: userdata.experienceDescription ? userdata.experienceDescription : "",
                                exampleCourses: final
                            }
                        });
                        cb(null, finalArray[0])
                        break;

                    case 3:
                        cb(null, data.getProfileData[0])
                        break;

                    case 4:
                        quesModel.find({ isDeleted: false }, { __v: 0, isDeleted: false }, { lean: true }, function(err, res) {
                            if (err) cb(err)
                            else {
                                for (var i = 0; i < res.length; i++) {
                                    for (var j = 0; j < params.userData.generalQuestions.length; j++) {
                                        if (res[i]._id.toString() == params.userData.generalQuestions[j].question.toString()) {
                                            for (var k = 0; k < res[i].answers.length; k++) {
                                                if (res[i].answers[k]._id.toString() == params.userData.generalQuestions[j].answer.toString()) {
                                                    res[i].answers[k].isChecked = true
                                                }
                                            }
                                        }
                                    }
                                }
                                cb(null, {
                                    questions: res,
                                    profilePic: data.getProfileData[0].profilePic ? data.getProfileData[0].profilePic : "",
                                })
                            }
                        })
                        break;

                    case 5:
                        cb(null, data.getProfileData[0])
                        break;

                    case 6:
                        cb(null, data.getProfileData[0])
                        break;
                }
            }]


        }, function(err, result) {
            err ? callback(err) : callback(null, { status: "success", statusCode: 200, message: "Profile fetched successfully", data: result.modifyData })
        })
    },
    getRookieProfileStepByStep: function(params, callback) { // get steps by steps for profile
        var finalArray;

        Utils.async.auto({

            getProfileData: [function(cb) {

                switch (params.type) {
                    case 1:
                        Utils.universalFunctions.logger("Step 1 to fetch the basic profile")
                        userModel.find({ _id: params.userData._id }, { firstName: 1, lastName: 1, email: 1, profileTitle: 1, profilePic: 1 }, function(err, res) {
                            err ? cb(err) : cb(null, res)
                        })
                        break;

                    case 2:
                        Utils.universalFunctions.logger("Step 1 to fetch the basic profile")
                        userModel.find({ _id: params.userData._id }, { educationRookie: 1, profilePic: 1 }, function(err, res) {
                            err ? cb(err) : cb(null, res)
                        })
                        break;
                }
            }],

            modifyData: ['getProfileData', function(data, cb) {
                Utils.universalFunctions.logger("Step 2 to modify data")

                switch (params.type) {
                    case 1:

                        finalArray = Utils._.map(data.getProfileData, function(userdata) {
                            return {
                                _id: userdata._id,
                                firstName: userdata.firstName ? userdata.firstName : "",
                                lastName: userdata.lastName ? userdata.lastName : "",
                                email: userdata.email,
                                profileTitle: userdata.profileTitle ? userdata.profileTitle : "",
                                profilePic: userdata.profilePic ? userdata.profilePic : ""
                            }
                        });
                        cb(null, finalArray[0])
                        break;

                    case 2:

                        finalArray = Utils._.map(data.getProfileData, function(userdata) {

                            return {
                                _id: userdata._id,
                                educationRookie: userdata.educationRookie ? userdata.educationRookie.reverse() : "",
                                profilePic: userdata.profilePic ? userdata.profilePic : ""
                            }
                        });
                        cb(null, finalArray[0])
                        break;

                }
            }]


        }, function(err, result) {
            err ? callback(err) : callback(null, { status: "success", statusCode: 200, message: "Profile fetched successfully", data: result.modifyData })
        })

    },
    skipProfileStep: function(params, callback) {
        Utils.async.auto({
            updatingInDb: [function(cb) {

                var dataToSet = {}

                params.userData.userType == "1" ? dataToSet.profileStepCompleted = params.stepToSkip : dataToSet.profileStepCompleted = params.stepToSkip



                userModel.findOneAndUpdate({ _id: params.userData._id }, dataToSet, { new: true }, function(err, res) {
                    cb(err ? err : null, res)
                })
            }]
        }, function(err, res) {
            var profileSteps = 0,
                rookie = 0
            if (!res.updatingInDb.profileStepCompleted && res.updatingInDb.profileStepCompleted != 0 && res.updatingInDb.userType == "1") {
                profileSteps = 7
            } else if (res.updatingInDb.profileStepCompleted == 0 && res.updatingInDb.userType == "1") {
                profileSteps = 1
            } else if (res.updatingInDb.profileStepCompleted && res.updatingInDb.userType == "1") {
                profileSteps = res.updatingInDb.profileStepCompleted + 1
            }
            if (!res.updatingInDb.profileStepCompleted && res.updatingInDb.profileStepCompleted != 0 && res.updatingInDb.userType == "2") {
                rookie = 3
            } else if (res.updatingInDb.profileStepCompleted == 0 && res.updatingInDb.userType == "2") {
                rookie = 1
            } else if (res.updatingInDb.profileStepCompleted && res.updatingInDb.userType == "2") {
                rookie = res.updatingInDb.profileStepCompleted + 1
            }
            callback(err ? err : {
                statusCode: 200,
                status: "success",
                message: "Updated successfully",
                data: {
                    profileStepCompleted: profileSteps,
                    profileStepCompletedRookie: rookie
                }
            });
        });
    },
    getProfileStepByStepOfSpecificGuru: function(params, callback) { // get steps by steps for profile
        var finalArray;
        var userQuestions;

        Utils.async.auto({

            getProfileData: [function(cb) {

                switch (params.type) {
                    case 1: // profile
                        Utils.universalFunctions.logger("Step 1 to fetch the basic profile")
                        userModel.find({ _id: params.userId }, {
                            firstName: 1,
                            lastName: 1,
                            dob: 1,
                            email: 1,
                            experience: 1,
                            languages: 1,
                            profilePic: 1,
                            gender: 1,
                            skillsGuruTeaches: 1,
                            hourlyRate: 1,
                            bio: 1,
                            achievements: 1,
                            profilePic: 1,
                            experienceDescription: 1,
                            profileTitle: 1,
                            rating: 1
                        }).lean().populate({ path: 'skillsGuruTeaches', populate: { path: 'skillId', populate: { path: 'parent', populate: { path: 'parent' } } } }).exec(function(err, res) {
                            err ? cb(err) : cb(null, res)
                        })
                        break;

                    case 2: // basic information
                        Utils.universalFunctions.logger("Step 2 to fetch the basic information")
                        userModel.find({ _id: params.userId }, { exampleCourses: 1, hourlyRate: 1, profileTitle: 1, bio: 1, achievements: 1, profilePic: 1, experienceDescription: 1, firstName: 1, lastName: 1, experience: 1 }).lean().populate({ path: 'exampleCourses', populate: { path: 'skillId', populate: { path: 'parent', populate: { path: 'parent' } } } }).exec(function(err, res) {
                            err ? cb(err) : cb(null, res)
                        })
                        break;
                    case 3: // educational
                        Utils.universalFunctions.logger("Step 3 to fetch the educational")
                        userModel.find({ _id: params.userId }, { education: 1, profilePic: 1 }, function(err, res) {
                            err ? cb(err) : cb(null, res)
                        })
                        break;

                    case 4: //general questions
                        Utils.universalFunctions.logger("Step 4 to fetch the educational")
                        userModel.find({ _id: params.userId }, { generalQuestions: 1, profilePic: 1 }, function(err, res) {
                            userQuestions = res[0].generalQuestions
                            err ? cb(err) : cb(null, res)
                        })
                        break;

                    case 5: //documents
                        Utils.universalFunctions.logger("Step 5 to fetch the educational")
                        userModel.find({ _id: params.userId }, { documents: 1, profilePic: 1 }).populate({ path: "documents", select: "title description uploaded_at file_original_name" }).exec(function(err, res) {
                            res.length > 0 && res[0].documents.length > 0 ? res[0].documents.reverse() : null
                            err ? cb(err) : cb(null, res)
                        })
                        break;

                    case 6: //terms and conditions
                        Utils.universalFunctions.logger("Step 6 to fetch the terms and conditions")
                        userModel.find({ _id: params.userId }, { isAuthorised: 1, isTermsAccepted: 1, profilePic: 1 }, function(err, res) {
                            err ? cb(err) : cb(null, res)
                        })
                        break;
                }
            }],

            modifyData: ['getProfileData', function(data, cb) {
                Utils.universalFunctions.logger("Step 2 to modify data")

                var a = [];
                switch (params.type) {
                    case 1:

                        if (data.getProfileData[0].skillsGuruTeaches && data.getProfileData[0].skillsGuruTeaches.length > 0) {

                            data.getProfileData[0].skillsGuruTeaches.forEach(function(guruSkills) {
                                a.push({
                                    category: guruSkills.skillId.parent.parent.name,
                                    subject: {
                                        _id: guruSkills.skillId.parent._id,
                                        name: guruSkills.skillId.parent.name
                                    },
                                    subskill: [{
                                        name: guruSkills.skillId.name,
                                        startAge: guruSkills.startAge,
                                        endAge: guruSkills.endAge
                                    }]
                                })

                            })
                        }

                        var arr = []

                        var group = Utils._.groupBy(a, function(item) {
                            return item.category
                        });

                        var map = Utils._.map(group, function(num) { return num });
                        var final = []
                        for (var i = 0; i < map.length; i++) {
                            var arr = [],
                                startAge = 0,
                                endAge = 0
                            var group1 = Utils._.groupBy(map[i], function(item) {
                                return item.subject._id
                            });

                            var map2 = Utils._.map(group1, function(num) { return num });

                            for (var j = 0; j < map2.length; j++) {
                                var tmp = []
                                for (var k = 0; k < map2[j].length; k++) {
                                    startAge = map2[j][k].subskill[0].startAge, endAge = map2[j][k].subskill[0].endAge
                                    tmp.push(map2[j][k].subskill[0].name)

                                }

                                arr.push({ subject: map2[j][0].subject, skills: tmp, startAge: startAge, endAge: endAge })
                            }

                            final.push({ category: map[i][0].category, subjectnskills: arr })
                        }

                        finalArray = Utils._.map(data.getProfileData, function(userdata) {
                            return {
                                _id: userdata._id,
                                firstName: userdata.firstName ? userdata.firstName : "",
                                lastName: userdata.lastName ? userdata.lastName : "",
                                dob: userdata.dob ? userdata.dob : "",
                                email: userdata.email,
                                hourlyRate: userdata.hourlyRate ? userdata.hourlyRate : 0,
                                experience: userdata.experience ? userdata.experience : 0,
                                languages: userdata.languages ? userdata.languages : [],
                                profilePic: userdata.profilePic ? userdata.profilePic : "",
                                gender: userdata.gender ? userdata.gender : "",
                                skillsGuruTeaches: final,
                                bio: userdata.bio ? userdata.bio : "",
                                achievements: userdata.achievements ? userdata.achievements : "",
                                experienceDescription: userdata.experienceDescription ? userdata.experienceDescription : "",
                                profileTitle: userdata.profileTitle ? userdata.profileTitle : "",
                                rating: userdata.rating && userdata.rating.averageRating ? userdata.rating.averageRating : 0
                            }
                        });
                        cb(null, finalArray[0])
                        break;

                    case 2:

                        if (data.getProfileData[0].exampleCourses && data.getProfileData[0].exampleCourses.length > 0) {

                            data.getProfileData[0].exampleCourses.forEach(function(guruSkills) {
                                a.push({
                                    category: guruSkills.skillId.parent.parent.name,
                                    subject: {
                                        _id: guruSkills.skillId.parent._id,
                                        name: guruSkills.skillId.parent.name
                                    },
                                    subskill: [{
                                        name: guruSkills.skillId.name,
                                        startAge: guruSkills.startAge,
                                        endAge: guruSkills.endAge
                                    }],
                                    description: guruSkills.description,
                                    duration: guruSkills.duration,
                                })

                            })
                        }

                        var arr = []

                        var group = Utils._.groupBy(a, function(item) {
                            return item.category
                        });

                        var map = Utils._.map(group, function(num) { return num });
                        var final = []
                        for (var i = 0; i < map.length; i++) {
                            var arr = [],
                                startAge = 0,
                                endAge = 0
                            var group1 = Utils._.groupBy(map[i], function(item) {
                                return item.subject._id
                            });

                            var map2 = Utils._.map(group1, function(num) { return num });

                            for (var j = 0; j < map2.length; j++) {
                                var tmp = []
                                for (var k = 0; k < map2[j].length; k++) {
                                    startAge = map2[j][k].subskill[0].startAge, endAge = map2[j][k].subskill[0].endAge
                                    tmp.push(map2[j][k].subskill[0].name)

                                }

                                arr.push({ subject: map2[j][0].subject, skills: tmp, startAge: startAge, endAge: endAge, description: map2[j][0].description, duration: map2[j][0].duration })
                            }

                            final.push({ category: map[i][0].category, subjectnskills: arr })
                        }

                        finalArray = Utils._.map(data.getProfileData, function(userdata) {
                            return {
                                _id: userdata._id,
                                hourlyRate: userdata.hourlyRate ? userdata.hourlyRate : 0,
                                profileTitle: userdata.profileTitle ? userdata.profileTitle : "",
                                bio: userdata.bio ? userdata.bio : "",
                                achievements: userdata.achievements ? userdata.achievements : "",
                                profilePic: userdata.profilePic ? userdata.profilePic : "",
                                experienceDescription: userdata.experienceDescription ? userdata.experienceDescription : "",
                                exampleCourses: final
                            }
                        });
                        cb(null, finalArray[0])
                        break;

                    case 3:
                        cb(null, data.getProfileData[0])
                        break;

                    case 4:
                        quesModel.find({ isDeleted: false }, { __v: 0, isDeleted: false }, { lean: true }, function(err, res) {
                            if (err) cb(err)
                            else {
                                for (var i = 0; i < res.length; i++) {
                                    for (var j = 0; j < userQuestions.length; j++) {
                                        if (res[i]._id.toString() == userQuestions[j].question.toString()) {
                                            for (var k = 0; k < res[i].answers.length; k++) {
                                                if (res[i].answers[k]._id.toString() == userQuestions[j].answer.toString()) {
                                                    res[i].answers[k].isChecked = true
                                                }
                                            }
                                        }
                                    }
                                }
                                cb(null, {
                                    questions: res,
                                    profilePic: data.getProfileData[0].profilePic ? data.getProfileData[0].profilePic : "",
                                })
                            }
                        })
                        break;

                    case 5:
                        cb(null, data.getProfileData[0])
                        break;

                    case 6:
                        cb(null, data.getProfileData[0])
                        break;
                }
            }]


        }, function(err, result) {
            err ? callback(err) : callback(null, { status: "success", statusCode: 200, message: "Profile fetched successfully", data: result.modifyData })
        })
    },
    fetchBookingsAndAvailability: function(params, callback) {

        var startDate = Utils.moment(params.currentDate * 1000).startOf('day').unix()
        var endDate = Utils.moment(params.currentDate * 1000).endOf('day').unix()
        var date = new Date(params.currentDate * 1000).getDate()

        params.userId && params.userId != "" ? params.userId = params.userId : params.userId = params.loggedUserId

        var isAvailable = false,
            isBooked = false,
            arr = [],
            final = [],
            tmp = [],
            allBookings = [],
            allAvailabilties = []

        Utils.async.auto({
                checkAvailability: [function(cb) {
                    // console.log('===',startDate,'endate---',endDate)
                    availablityModel.find({ isDeleted: false, userId: params.userId, startDateTime: { $gte: startDate }, endDateTime: { $lte: endDate } }, function(err, res) {

                        if (err) cb(err)
                        if (res.length > 0) {
                            isAvailable = true
                            for (var i = 0; i < res.length; i++) {
                                arr.push(res[i])
                            }

                            cb(null, null)
                        } else {
                            cb(null, null)
                        }
                    })
                }],
                checkBookings: [function(cb) {
                    sessionModel.find({ requestedTo: params.userId, isDeleted: false, status: SESSION_STATUS.payment_done, startDateTime: { $gte: startDate }, endDateTime: { $lte: endDate } }, function(err, res) {

                        if (err) cb(err)
                        if (res.length > 0) {
                            isBooked = true
                            for (var i = 0; i < res.length; i++) {
                                if (res[i].sessionType == "group")
                                    tmp.push(res[i])
                                else
                                    arr.push(res[i])
                            }
                            cb(null, null)
                        } else {
                            cb(null, null)
                        }
                    })
                }],
                setData: ["checkAvailability", "checkBookings", function(data, cb) {

                    if (arr.length > 0 || tmp.length > 0) {

                        tmp = Utils._.uniq(tmp, function(obj) {
                            return obj.groupLessonNumber
                        })

                        arr = arr.concat(tmp)

                        arr = Utils._.sortBy(arr, "startDateTime")

                        for (var i = 0; i < arr.length; i++) {
                            // final.push({
                            //     startDate: arr[i].startDateTime,
                            //     endDate: arr[i].endDateTime,
                            //     isBooking: arr[i].sessionType ? true : false
                            // })

                            if (!arr[i].sessionType) {
                                allAvailabilties.push({
                                    startDate: arr[i].startDateTime,
                                    endDate: arr[i].endDateTime,
                                })
                            } else {
                                allBookings.push({
                                    startDate: arr[i].startDateTime,
                                    endDate: arr[i].endDateLagTime,
                                })
                            }

                        }
                    }
                    cb(null, null)
                }],
                getUserDetails: [function(cb) {

                    userModel.findOne({ _id: params.userId }, { firstName: 1, lastName: 1, hourlyRate: 1, profilePic: 1 }, function(err, res) {
                        cb(err ? err : null, res)
                    })
                }],
                makeTheSlots: ["setData", function(data, cb) {
                    var slotsArr = [],
                        finalArr = []
                    for (var i = 0; i < allAvailabilties.length; i++) {
                        var totalSeconds = allAvailabilties[i].endDate - allAvailabilties[i].startDate
                        var timeForSlots = 15 * 60 // bcoz we have slots for 15 mins 

                        var noOfSlots = parseInt(totalSeconds / timeForSlots)

                        var startDate = allAvailabilties[i].startDate

                        for (var j = 0; j < noOfSlots; j++) {

                            slotsArr.push({
                                startTime: startDate,
                                endTime: startDate + (15 * 60), // adding 15 mins to startTime to get each slot of 15 mins
                                isAvailable: true
                            })

                            startDate = startDate + (15 * 60)

                            //Slots will be like 9.00 - 9.15 , 9.15-9.30 ....
                        }

                    }

                   // console.log('before-------',allAvailabilties)

                    // for (var k = 0; k < allAvailabilties.length; k++) {
                    //    allAvailabilties[k].startDate = Utils.moment(allAvailabilties[k].startDate * 1000).format('MMMM Do YYYY, h:mm:ss a');
                    //    allAvailabilties[k].endDate = Utils.moment(allAvailabilties[k].endDate * 1000).format('MMMM Do YYYY, h:mm:ss a');
                    //    }
             //   console.log('allAvailabilties---------------',allAvailabilties)



                    for (var i = 0; i < allBookings.length; i++) {

                        var tmpSlots = [],
                            checkStartTime = true,
                            tmpAvailable = [],
                            bookingFound = false;

                        for (var j = 0; j < slotsArr.length; j++) {

                            // console.log('j============',slotsArr[j])
                            // console.log('j+1============',slotsArr[j+1])

                            if (slotsArr[j+1]!=undefined && checkStartTime == true && slotsArr[j].startTime <= allBookings[i].startDate && slotsArr[j].endTime > allBookings[i].startDate && slotsArr[j + 1].startTime >= allBookings[i].startDate) {

                                if (slotsArr[j].endTime == allBookings[i].endDate) {
                                    bookingFound = true
                                    slotsArr[j].isAvailable = false
                                    break;
                                } else {
                                    bookingFound = true
                                    checkStartTime = false
                                    slotsArr[j].isAvailable = false
                                }
                            } else if (checkStartTime == false && slotsArr[j].startTime < allBookings[i].endDate && slotsArr[j].endTime > allBookings[i].startDate) {

                                if (j + 1 < slotsArr.length && slotsArr[j + 1].startTime >= allBookings[i].startDate) {
                                    bookingFound = true
                                    slotsArr[j].isAvailable = false
                                } else if (slotsArr[j].endTime == allBookings[i].endDate) {
                                    slotsArr[j].isAvailable = false
                                    bookingFound = true
                                }
                            }
                        }

                        if (bookingFound == false) {
                            slotsArr.push({
                                startTime: allBookings[i].startDate,
                                endTime: allBookings[i].endDate, // adding 15 mins to startTime to get each slot of 15 mins
                                isAvailable: false
                            })
                        }

                        finalArr.push(tmpSlots)


                    }


                    // for (var k = 0; k < slotsArr.length; k++) {
                    //     slotsArr[k].startTime = Utils.moment(slotsArr[k].startTime * 1000).format('MMMM Do YYYY, h:mm:ss a');
                    //     slotsArr[k].endTime = Utils.moment(slotsArr[k].endTime * 1000).format('MMMM Do YYYY, h:mm:ss a');
                    // }
                    // console.log('slotsArr---------------',slotsArr)


                    var task = []
                    task = slotsArr
                    var result = []

                   // console.log('task---------', task)

                    if (task.length == 1) {
                        result.push({
                            startDate: task[0].startTime,
                            isBooking: task[0].isAvailable == true ? false : true,
                            endDate: task[0].endTime
                        })
                    } else {

                        for (let k in task) {
                            if (result.length > 0) {
                                if (task[k].isAvailable && !task[k - 1].isAvailable || task[k].startTime != task[k - 1].endTime) {
                                    result[result.length - 1]["endDate"] = task[k - 1].endTime;
                                    result.push({ startDate: task[k].startTime, isBooking: task[k].isAvailable == true ? false : true });
                                    if (task.length - 1 == k && task[k].isAvailable && !task[k - 1].isAvailable) {
                                        result[result.length - 1]["endDate"] = task[k].endTime;
                                    }
                                } else if (!task[k].isAvailable && task[k - 1].isAvailable || task[k].startTime != task[k - 1].endTime) {
                                    result[result.length - 1]["endDate"] = task[k - 1].endTime;
                                    result.push({ startDate: task[k].startTime, isBooking: task[k].isAvailable == true ? false : true });
                                    if (task.length - 1 == k && !task[k].isAvailable && task[k - 1].isAvailable) {
                                        result[result.length - 1]["endDate"] = task[k].endTime;
                                    }
                                }
                                if (task.length - 1 == k && !result[result.length - 1]["endDate"])
                                    result[result.length - 1]["endDate"] = task[k].endTime;
                            } else {
                                result.push({ startDate: task[k].startTime, isBooking: task[k].isAvailable == true ? false : true });
                            }
                        }
                    }

                    // console.log('before==============', result)
                    final = result

                    // for (var k = 0; k < result.length; k++) {
                    //     result[k].startTime = Utils.moment(result[k].startTime * 1000).format('MMMM Do YYYY, h:mm:ss a');
                    //     result[k].endTime = Utils.moment(result[k].endTime * 1000).format('MMMM Do YYYY, h:mm:ss a');
                    // }
                    // console.log('=====', result)


                    cb(null, data)


                }]
            },
            function(err, result) {
                callback(err ? err : {
                    statusCode: 200,
                    status: "success",
                    message: "Fetched successfully",
                    data: {
                        bools: [{ date: date, isBooked: isBooked, isAvailable: isAvailable }],
                        results: final,
                        userDetails: result.getUserDetails
                    }
                });
            });
    },
    checkWhetherApprovedOrNot: function(params, callback) {
        Utils.async.auto({
            checkWhetherApprovedOrNot: [function(cb) {

                userModel.findOne({ _id: params.userId }, { isApproved: 1, isRejected: 1 }, { lean: true }, function(err, res) {
                    if (err) cb(err)
                    else {
                        !res.isRejected ? res.isRejected = false : null
                        callback(null, { statusCode: 200, status: "success", data: res })
                    }
                })
            }],
        }, function(err, result) {
            callback(err ? err : null, result);
        });
    },
    socialSignUp: function(params, callback) {

        var lessons;
        Utils.async.auto({

                checkEmailExists: [function(cb) {

                    userModel.findOne({ email: params.email }, function(err, res) {
                        cb(err ? err : null, res)
                    })
                }],
                updateInsertSocialId: ["checkEmailExists", function(data, cb) {

                    if (data.checkEmailExists == null) { //INSERT NEW USER

                        var obj = {
                            email: params.email,
                            createdAt: new Date(),
                            userType: params.userType,
                            isEmailVerify: true
                        }

                        params.socialId && params.type == 1 ? obj.googleId = params.socialId : obj.facebookId = params.socialId

                        params.userType == "1" ? obj.isApproved = false : obj.isApproved = true;

                        userModel(obj).save(function(err, res) {
                            cb(err ? err : null, res)
                        })
                    } else { // UPDATE USER
                        var obj = {
                            isEmailVerify: true
                        }
                        params.socialId && params.type == 1 ? obj.googleId = params.socialId : obj.facebookId = params.socialId

                        userModel.findOneAndUpdate({ email: params.email }, obj, { new: true }, function(err, res) {
                            cb(err ? err : null, res)
                        })
                    }
                }],
                generatingAccessToken: ["updateInsertSocialId", function(data, cb) {

                    Utils.universalFunctions.logger('Step 3 Generating access token')

                    params.userId = data.updateInsertSocialId._id

                    Utils.universalFunctions.createLoginToken({ email: params.email, _id: params.userId }, function(err, res) {
                        cb(err ? err : null, res)
                    })
                }],
                updatingInDb: ["generatingAccessToken", function(data, cb) {

                    Utils.universalFunctions.logger('Step 4 updating access token in DB')

                    params.accessToken = data.generatingAccessToken

                    var arr = [{ timeZone: params.timeZone, accessToken: data.generatingAccessToken, timeStamp: Utils.moment().unix() }]

                    userModel.findOneAndUpdate({ _id: params.userId }, { deviceDetails: arr }, { new: true }, function(err, res) {
                        cb(err ? err : null, res);
                    });
                }],
                checkIfAnySessionsBooked: ["generatingAccessToken", function(data, cb) {

                    sessionModel.find({ requestedTo: params.userId }, function(err, res) {
                        if (err) cb(err)
                        else {
                            if (res.length > 0) lessons = true
                            else lessons = false
                            cb(null, data)
                        }
                    })
                }],
                getUnreadNotificationCount: ["generatingAccessToken", function(data, cb) {

                    notificationModel.find({ receiverId: params.userId, isRead: false, saveInDb: true }, function(err, res) {
                        if (err) cb(err)
                        else {
                            params.unReadNotifications = res.length
                            cb(null, data)
                        }
                    })
                }],
                getUnreadMessagesCount: ["generatingAccessToken", function(data, cb) {

                    chatModel.find({ to: params.userId, message_read: false }, function(err, res) {
                        if (err) cb(err)
                        else {
                            params.unReadMessagesCount = res.length
                            cb(null, data)
                        }
                    })
                }],
            },
            function(err, res) {
                if (err) callback(err)
                else {
                    var rookie, profileSteps

                    if (res.updatingInDb.profileStepCompleted == 0 && res.updatingInDb.userType == "1") {
                        profileSteps = 1
                    } else if (res.updatingInDb.profileStepCompleted && res.updatingInDb.userType == "1") {
                        profileSteps = res.updatingInDb.profileStepCompleted + 1
                    }

                    if (res.updatingInDb.profileStepCompleted == 0 && res.updatingInDb.userType == "2") {
                        rookie = 1
                    } else if (res.updatingInDb.profileStepCompleted && res.updatingInDb.userType == "2") {
                        rookie = res.updatingInDb.profileStepCompleted + 1
                    }

                    callback(null, {
                        statusCode: 200,
                        status: "success",
                        message: "Logged In successfully.",
                        data: {
                            accessToken: params.accessToken,
                            email: res.updatingInDb.email,
                            firstName: res.updatingInDb.firstName || "",
                            lastName: res.updatingInDb.lastName || "",
                            userType: res.updatingInDb.userType,
                            isTermsAccepted: res.updatingInDb.isTermsAccepted,
                            isAuthorised: res.updatingInDb.isAuthorised || false,
                            isApproved: res.updatingInDb.isApproved,
                            isRejected: res.updatingInDb.isRejected ? res.updatingInDb.isRejected : false,
                            userId: res.updatingInDb._id,
                            timeZone: params.timeZone,
                            profilePic: res.updatingInDb.profilePic || "",
                            rating: res.updatingInDb.rating ? res.updatingInDb.rating.averageRating : 0,
                            profileStepCompleted: profileSteps, //7 means redirect to dashboard
                            experience: res.updatingInDb.experience || "",
                            profileTitle: res.updatingInDb.profileTitle || "",
                            profileStepCompletedRookie: rookie,
                            lessons: lessons,
                            hourlyRate: res.updatingInDb.hourlyRate ? res.updatingInDb.hourlyRate : "",
                            isBankDetailsAdded: res.updatingInDb.customAccount ? true : false,
                            unReadNotifications: params.unReadNotifications,
                            unReadMessagesCount: params.unReadMessagesCount
                        }
                    });
                }
            })
    },

}