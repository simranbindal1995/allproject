/*
 * @description: This file defines all the admin services
 * @date: 29 March 2018
 * @author: Simran
 * */


'use strict';

// include Utils module

var Utils = require('../../../utils/index');
var env = require('../../../env');
var configs = require('../../../configs');
var jwt = require('jsonwebtoken');
var _ = require('underscore');
var md5 = require('md5');

var userModel = require('../../user/models/index');
var subjectNSkillModel = require('../../subjectNSkill/models/index');
var bookingsModel = require('../../sessionBookings/models/index');
var transactionsModel = require('../../sessionBookings/models/transactions');
var sessionsModel = require('../../sessions/models/index');

var APP_CONSTANTS = configs.constants;
var USER_TYPE = APP_CONSTANTS.USER_TYPE;
var REQUEST_STATUS = APP_CONSTANTS.REQUEST_STATUS
var NOTIFICATION_TYPE = APP_CONSTANTS.NOTIFICATION_TYPE


module.exports = {
    login: function(request, callback) { // admin login api
        var token;

        Utils.async.auto({
            checkEmailPasswordCombination: [function(cb) { // check email and password and role for admin
                Utils.universalFunctions.logger('Step 1 Verifying email and password')
                userModel.findOne({ password: md5(request.password), email: request.email, userType: '3' }, function(err, res) {
                    err ? cb(err) : (res ? cb(null, res) : cb({ status: 'warning', statusCode: 401, message: "Please enter valid credentials" }))
                })
            }],

            generateLoginToken: ['checkEmailPasswordCombination', function(data, cb) {
                Utils.universalFunctions.logger('Step 2 generate login token')
                Utils.universalFunctions.createLoginToken({ email: request.email, _id: data.checkEmailPasswordCombination._id, role: data.checkEmailPasswordCombination.userType }, function(err, res) {
                    token = res;
                    cb(err ? err : null, res)
                })
            }],

            updateTokenInDb: ['generateLoginToken', function(data, cb) {
                Utils.universalFunctions.logger('Step 3 Update token in db')
                var arr = [{ accessToken: data.generateLoginToken, timeStamp: Utils.moment().unix() }]
                userModel.findOneAndUpdate({ _id: data.checkEmailPasswordCombination._id }, { deviceDetails: arr }, { new: true }, function(err, res) {
                    cb(err ? err : null, res);
                });
            }]
        }, function(err, result) {
            err ? callback(err) : callback(null, {
                status: 'success',
                statusCode: 200,
                message: "Login successful",
                data: {
                    firstName: result.checkEmailPasswordCombination.firstName,
                    lastName: result.checkEmailPasswordCombination.lastName
                }
            }, token)
        })
    },
    newSubjectRequest: function(request, callback) { // list all new subject request

        var finalResult;
        Utils.async.auto({

            getNewRequestedSubjects: [function(cb) { // check email and password and role for admin

                Utils.universalFunctions.logger('Step 1 fetch the new requested subjects')
                subjectNSkillModel.find({ is_approved: false, level: { $ne: 0 } }).populate({ path: 'parent', select: 'name' }).sort({ "created_at": -1 }).skip(request.skip).limit(request.limit).exec(function(err, res) {
                    err ? cb(err) : cb(null, res)
                })
            }],

            modifyData: ['getNewRequestedSubjects', function(data, cb) { // modify data accordingly

                Utils.universalFunctions.logger('Step 2 modify the response')

                if (data.getNewRequestedSubjects.length > 0) {
                    finalResult = _.map(data.getNewRequestedSubjects, function(skills) {
                        return {
                            subject_id: skills.parent._id,
                            subject: Utils.universalFunctions.capitalizeFirstLetter(skills.parent.name),
                            skill_id: skills._id,
                            skill_name: Utils.universalFunctions.capitalizeFirstLetter(skills.name),
                            description: skills.description
                        }
                    })
                    cb(null, finalResult)
                } else {
                    cb(null, data.getNewRequestedSubjects)
                }
            }]
        }, function(err, result) {
            err ? callback(err) : callback(null, { status: "success", statusCode: 200, message: "Result fetched successfully", data: result.modifyData })
        })
    },
    approveRejectSubject: function(request, callback) { // api to approve or reject a skill

        var child_exist = false;
        Utils.async.auto({

            checkSkillExist: [function(cb) { //check if skill exist
                Utils.universalFunctions.logger('Step 1 Check skill exist')
                subjectNSkillModel.findOne({ _id: request.skill_id }, function(err, res) {
                    err ? (err.name == "CastError" ? cb({ status: "warning", statusCode: 401, message: "Skill id does not exist" }) : cb(err)) : (cb(null, res))
                })
            }],

            checkAnyChildExistOfTheSubject: ['checkSkillExist', function(data, cb) { // we need to check if any child exist for the immediate parent of this skill, when to reject any skill under this subject only reject the skill, otherwise reject both subject and skill
                Utils.universalFunctions.logger('Step 2 Check any child for that ')
                subjectNSkillModel.find({ parent: data.checkSkillExist.parent, _id: { $nin: [request.skill_id] }, is_approved: true }, function(err, res) {
                    if (err) {
                        cb(err)
                    } else {
                        err ?
                            cb(err) :
                            (res.length > 0 ? (child_exist = true, cb(null, res)) : (child_exist = false, cb(null, res)))
                    }

                })
            }],

            ifApproveSubject: ['checkAnyChildExistOfTheSubject', function(data, cb) {

                if (request.type == 'approve') { // approve both skill and its subject or immediate parent
                    Utils.universalFunctions.logger('Step 3 Approve the skill ')
                    subjectNSkillModel.update({ _id: { $in: [request.skill_id, data.checkSkillExist.parent] } }, { is_approved: true }, { multi: true }, function(err, res) {
                        err ? cb(err) : cb(null, res)
                    })
                } else if (request.type == 'reject') {
                    cb(null, data)
                }
            }],

            ifRejectSubject: ['ifApproveSubject', function(data, cb) {

                if (request.type == 'reject' && child_exist == false) {
                    Utils.universalFunctions.logger('Step 4 Reject the skill ');
                    subjectNSkillModel.update({ _id: { $in: [request.skill_id, data.checkSkillExist.parent] } }, { is_approved: false }, { multi: true }, function(err, res) {
                        err ? cb(err) : cb(null, res)
                    })
                } else if (request.type == 'reject' && child_exist == true) {
                    Utils.universalFunctions.logger('Step 4 Reject the skill ');
                    subjectNSkillModel.findOneAndUpdate({ _id: request.skill_id }, { is_approved: false }, function(err, res) {
                        err ? cb(err) : cb(null, res)
                    })
                } else {
                    cb(null, data)
                }
            }],
            sendNotificationToUser: ["ifRejectSubject", function(data, cb) {
                if (data.checkSkillExist.requestedBy) {
                    var x = data.checkSkillExist.name
                    x = x.charAt(0).toUpperCase() + x.slice(1)

                    var keyword
                    request.type == 'approve' ? keyword = "approved" : keyword = "rejected"

                    var message = "Admin has " + keyword + " the skill " + x + " you requested for."

                    var obj = {
                        senderId: data.checkSkillExist.requestedBy,
                        receiverId: data.checkSkillExist.requestedBy,
                        notificationEventType: NOTIFICATION_TYPE.approve_skill,
                        createdAt: Utils.moment().unix(),
                        saveInDb: true,
                        message: message
                    }

                    Utils.universalFunctions.sendNotification(obj, "notification", function(err, res) {
                        cb(err, data)
                    })
                } else {
                    cb(null, data)
                }
            }]

        }, function(err, result) {
            err ? callback(err) : callback(null, { status: "success", statusCode: 200, message: "Action performed successfully" })
        })


    },
    approveGuru: function(request, callback) { // approve any guru
        Utils.async.auto({

            checkUserExists: [function(cb) {
                userModel.findOne({ _id: request.user_id, userType: 'rookie' }, function(err, res) {
                    err ? (err.name == "CastError" ? cb({ status: "warning", statusCode: 401, message: "user does not exist" }) : cb(err)) : (cb(null, res))
                })
            }],

            approveOrRejectGuru: ['checkUserExists', function(data, cb) {
                var dataToUpdate = {};

                if (request.type == 'approve') {
                    dataToUpdate.isApproved = true,
                        dataToUpdate.isRejected = false
                } else {
                    dataToUpdate.isApproved = false,
                        dataToUpdate.isRejected = true
                }
                userModel.findOneAndUpdate({ _id: request.user_id }, dataToUpdate, function(err, res) {
                    err ? cb(err) : cb(null, res)
                })
            }]

        }, function(err, result) {
            err ? callback(err) : callback(null, { status: "success", statusCode: 200, message: "Action performed successfully" })
        })
    },


    forgotPassword: function(params, callback) {

        Utils.async.auto({
                checkEmailExists: [function(cb) {

                    Utils.universalFunctions.logger('Step 1 checking if email exists or not and if user is not blocked by admin.')

                    userModel.findOne({ email: params.email, userType: USER_TYPE.admin }, function(err, res) {
                        cb(err ? err :
                            res == null ? { statusCode: 401, status: 'warning', message: "Email does not exist." } :
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

                    console.log('data.checkEmailExists', data.checkEmailExists)

                    Utils.universalFunctions.logger("In step 3 of sending the mail with link to reset the password");

                    var link = 'http://' + configs.app[env.instance].url + ":" + configs.app[env.instance].port

                    var path = link + "/emailTemplates/reset_password_old.html" + "?email=" + params.email + '&emailConfirmToken=' + data.generatingToken.resetPasswordToken

                    var subject = "Reset your password";
                    var templatepath = Utils.path.join(__dirname, '../../../assets/emailTemplates/');
                    var fileReadStream = Utils.fs.createReadStream(templatepath + 'forgot_password.html');

                    var emailTemplate = '';

                    fileReadStream.on('data', function(buffer) {
                        emailTemplate += buffer.toString();
                    });

                    if (data.checkEmailExists.firstName) {
                        var x = data.checkEmailExists.firstName
                        data.checkEmailExists.firstName = x.charAt(0).toUpperCase() + x.slice(1)
                    } else {
                        data.checkEmailExists.firstName = "Admin"
                    }


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

    fetchAllUsers: function(params, callback) {
        Utils.async.auto({
            getAllUsersWithPagination: [function(cb) {

                var criteria = {}
                if (params.search && params.search != "") {
                    criteria.$or = [{ firstName: new RegExp(params.search) }, { lastName: new RegExp(params.search) }]
                }

                criteria.userType = params.userType

                userModel.find(criteria, { userStatus: 1, skillsGuruTeaches: 1, email: 1, firstName: 1, lastName: 1, profilePic: 1, isApproved: 1, documents: 1 }, { lean: true, sort: { firstName: 1 }, skip: params.skip || 0, limit: params.limit || 10 })
                    .populate({ path: "skillsGuruTeaches", select: "skillId", populate: { path: "skillId" } })
                    .exec(function(err, res) {
                        cb(err ? err : null, res)
                    })
            }],
            getAllUsers: [function(cb) {

                var criteria = {}
                if (params.search && params.search != "") {
                    criteria.$or = [{ firstName: new RegExp(params.search) }, { lastName: new RegExp(params.search) }]
                }

                criteria.userType = params.userType

                userModel.find(criteria, { firstName: 1, lastName: 1, profilePic: 1, isApproved: 1, documents: 1 }, { sort: { firstName: -1 } }, function(err, res) {
                    cb(err ? err : null, res.length)
                })

            }],
            getSubjectsGuruTeaches: ['getAllUsersWithPagination', function(data, cb) {

                Utils.async.eachSeries(data.getAllUsersWithPagination, function(item, Incb) {
                        var subjects = []
                        Utils.async.eachSeries(item.skillsGuruTeaches, function(Innitem, Inncb) {
                                subjectNSkillModel.findOne({ _id: Innitem.skillId.parent }, { name: 1 }, function(err, res) {
                                    if (err) Inncb(err)
                                    else {
                                        subjects.push(res.name)
                                        Inncb()
                                    }
                                })
                            },
                            function(err, result) {
                                if (err) Incb(err);
                                else {
                                    subjects = Utils._.uniq(subjects)
                                    item.subjects = subjects
                                    delete item.skillsGuruTeaches
                                    Incb(null, data);
                                }
                            });

                    },
                    function(err, result) {
                        if (err) cb(err);
                        cb(null, data);
                    });
            }]
        }, function(err, result) {
            callback(err ? err : {
                statusCode: 200,
                status: "success",
                message: "Users fetched successfully",
                totalRecords: result.getAllUsers,
                data: result.getAllUsersWithPagination
            });
        });
    },

    activeInactiveUser: function(request, callback) { // approve any guru
        Utils.async.auto({

            approveOrRejectGuru: [function(cb) {
                var dataToUpdate = {};

                if (request.type == 'active') {
                    dataToUpdate.userStatus = "active"
                } else {
                    dataToUpdate.userStatus = "inactive"
                }
                userModel.findOneAndUpdate({ _id: request.userId }, dataToUpdate, function(err, res) {
                    err ? cb(err) : cb(null, res)
                })
            }]

        }, function(err, result) {
            err ? callback(err) : callback(null, { status: "success", statusCode: 200, message: "Action performed successfully" })
        })
    },

    skillManagement: function(request, callback) { // approve any guru
        Utils.async.auto({

            getAllSkills: [function(cb) {

                var criteria = {}
                if (request.type == "added") {
                    criteria.is_approved = true
                } else {
                    criteria.is_approved = false
                }
                criteria.level = 2

                subjectNSkillModel.find(criteria, { is_approved: 1, parent: 1, name: 1, description: 1 }, { sort: { name: 1 }, lean: true, skip: request.skip || 0, limit: request.limit || 10 })
                    .populate({ path: "parent", select: "name" })
                    .exec(function(err, res) {
                        cb(err ? err : null, res)
                    })
            }],
            getTotalSkills: [function(cb) {

                var criteria = {}
                if (request.type == "added") {
                    criteria.is_approved = true
                } else {
                    criteria.is_approved = false
                }
                criteria.level = 2

                subjectNSkillModel.find(criteria, { parent: 1, name: 1, description: 1 })
                    .populate({ path: "parent", select: "name" })
                    .exec(function(err, res) {
                        cb(err ? err : null, res.length)
                    })
            }]

        }, function(err, result) {
            err ? callback(err) : callback({
                status: "success",
                statusCode: 200,
                message: "Fetched successfully",
                totalRecords: result.getTotalSkills,
                data: result.getAllSkills
            })
        })
    },

    disputeManagement: function(request, callback) {
        var groupLessons = [],
            oneLessons = [],
            final = []
        Utils.async.auto({

            getAllDisputes: [function(cb) {

                bookingsModel.find({ paymentStatus: "payment done", $where: "this.complaints.length >0" }, {}, { lean: true })
                    .populate({ path: "paymentDoneBy", select: "firstName lastName" })
                    .populate({ path: 'paymentDoneTo', select: "firstName lastName" })
                    .exec(function(err, res) {
                        cb(null, res)
                    })
            }],
            getComplaintsForAdmin: ["getAllDisputes", function(data, cb) {

                Utils.async.eachSeries(data.getAllDisputes, function(item, Incb) {

                        if (item.complaints.length > 0) {

                            var obj = Utils._.sortBy(item.complaints, function(obj) {
                                return obj.status
                            }).reverse()

                            if (obj[0].status == 2) {
                                if (item.groupLessonNumber != 0) {
                                    groupLessons.push(item)
                                } else {
                                    oneLessons.push(item)
                                }
                            }
                            if (obj[0].status == 1) {
                                var complaintTime = obj[0].createdAt
                                var endTime = Utils.moment(complaintTime * 1000).add(24, "hours").unix()

                                if (endTime <= Utils.moment().unix()) {
                                    if (item.groupLessonNumber != 0) {
                                        groupLessons.push(item)
                                    } else {
                                        oneLessons.push(item)
                                    }
                                }
                            }
                            Incb()
                        } else {
                            Incb()
                        }
                    },
                    function(err, result) {
                        if (err) cb(err);
                        cb(null, data);
                    });
            }],
            manageData: ["getComplaintsForAdmin", function(data, cb) {

                if (groupLessons && groupLessons.length > 0) {

                    var group = Utils._.groupBy(groupLessons, function(obj) {
                        return obj.groupLessonNumber
                    })

                    var map = Utils._.map(group, function(obj) {
                        return obj
                    })

                    for (var i = 0; i < map.length; i++) {
                        for (var j = 0; j < map[i].length; j++) {
                            final.push({
                                ticketNumber: map[i][j].complaints[0].ticketNumber ? map[i][j].complaints[0].ticketNumber : "",
                                typeOfSession: "Group Lesson",
                                guru: map[i][j].paymentDoneTo,
                                rookie: map[i][j].paymentDoneBy,
                                reason: map[i][j].complaints[0].reason ? map[i][j].complaints[0].reason : "",
                                message: map[i][j].complaints[0].message,
                                status: "Open - Rejected by Guru",
                                createdAt: map[i][j].complaints[0].createdAt,
                                groupLessonNumber: map[i][j].groupLessonNumber
                            })
                            break;
                        }
                    }


                }
                if (oneLessons && oneLessons.length > 0) {
                    for (var i = 0; i < oneLessons.length; i++) {
                        final.push({
                            ticketNumber: oneLessons[i].complaints[0].ticketNumber ? oneLessons[i].complaints[0].ticketNumber : "",
                            typeOfSession: "One to One",
                            guru: oneLessons[i].paymentDoneTo,
                            rookie: oneLessons[i].paymentDoneBy,
                            reason: oneLessons[i].complaints[0].reason ? oneLessons[i].complaints[0].reason : "",
                            message: oneLessons[i].complaints[0].message,
                            status: "Open - Rejected by Guru",
                            createdAt: oneLessons[i].complaints[0].createdAt,
                            sessionId: oneLessons[i].sessionId
                        })
                    }
                }
                cb(null, null)
            }],
            sortingAndPagination: ["manageData", function(data, cb) {

                request.totalRecords = final.length;

                final = Utils._.sortBy(final, function(obj) {
                    return obj.createdAt
                }).reverse()

                final = Utils._.chain(final)
                    .rest(request.skip || 0)
                    .first(request.limit || 10)

                final = final._wrapped

                cb(null, null)

            }],
            getSubjects: ["sortingAndPagination", function(data, cb) {

                Utils.async.eachSeries(final, function(item, Incb) {
                        var criteria = {}
                        item.groupLessonNumber ? criteria.groupLessonNumber = item.groupLessonNumber : criteria._id = item.sessionId;

                        sessionsModel.findOne(criteria)
                            .populate({
                                path: "skillId",
                                select: "name parent",
                                populate: { path: "parent", select: "name" }
                            })
                            .exec(function(err, res) {
                                if (err) Incb(err)
                                else {
                                    item.skills = res.skillId[0].parent.name
                                    Incb();

                                }
                            })
                    },
                    function(err, result) {
                        if (err) cb(err);
                        cb(null, data);
                    });
            }]

        }, function(err, result) {
            err ? callback(err) : callback(null, {
                status: "success",
                statusCode: 200,
                message: "Data fetched successfully",
                totalRecords: request.totalRecords,
                data: final
            })
        })
    },

    paymentManagement: function(params, callback) {
        var final = [],
            totaltutorEarning = 0,
            totalrookiePaid = 0,
            totaladminEarning = 0,
            graphData = []

        var totalTransactions = []

        if (params.typeOfTransaction == 1) {
            var startDate = 0
            var endDate = Utils.moment().unix()
        }
        if (params.typeOfTransaction == 2) {
            var startDate = Utils.moment().startOf('month').unix()
            var endDate = Utils.moment().unix()
        }
        if (params.typeOfTransaction == 3) {
            var startDate = Utils.moment().startOf('week').unix()
            var endDate = Utils.moment().unix()
        }


        Utils.async.auto({
            getTotalTransactions: [function(cb) {

                var criteria = {
                    requestStatus: REQUEST_STATUS.completed,
                    transactionType: 2,
                    transactionDate: { $gte: startDate, $lte: endDate }
                }

                params.typeOfLesson == "group" ? criteria.groupLessonNumber = { $exists: true } : criteria.sessionId = { $exists: true }


                transactionsModel.find(criteria).exec(function(err, res) {
                    if (err) cb(err)
                    else {
                        for (var i = 0; i < res.length; i++) {
                            totalTransactions.push({ lessonId: res[i].groupLessonNumber ? res[i].groupLessonNumber : res[i].sessionId })
                        }
                        cb(null, res.length)
                    }

                })
            }],
            getTransactions: [function(cb) {

                var criteria = {
                    requestStatus: REQUEST_STATUS.completed,
                    transactionType: 2,
                    transactionDate: { $gte: startDate, $lte: endDate }
                }

                params.typeOfLesson == "group" ? criteria.groupLessonNumber = { $exists: true } : criteria.sessionId = { $exists: true }


                transactionsModel.find(criteria, {}, { sort: { transactionDate: -1 }, skip: params.skip || 0, limit: params.limit || 10 }).exec(function(err, res) {
                    if (err) cb(err)
                    else {
                        for (var i = 0; i < res.length; i++) {
                            final.push({
                                transactionDate: res[i].transactionDate,
                                lessonId: res[i].groupLessonNumber ? res[i].groupLessonNumber : res[i].sessionId,
                                typeOfLesson: params.typeOfLesson,
                            })
                        }
                        cb(null, res)
                    }

                })
            }],
            getSubjects: ["getTransactions", function(data, cb) {

                Utils.async.eachSeries(final, function(item, Incb) {

                        Utils.async.auto({
                            getSubject: [function(cb) {
                                var criteria = {}

                                params.typeOfLesson == "group" ? criteria.groupLessonNumber = item.lessonId : criteria._id = item.lessonId

                                sessionsModel.findOne(criteria)
                                    .populate({
                                        path: "skillId",
                                        select: "name parent",
                                        populate: { path: "parent", select: "name" }
                                    })
                                    .exec(function(err, res) {
                                        if (err) Incb(err)
                                        else {
                                            item.subject = res.skillId[0].parent.name
                                            cb(null, null)
                                        }
                                    })
                            }],
                            getPayments: [function(cb) {

                                var criteria = {
                                    transactionType: 1
                                }
                                params.typeOfLesson == "group" ? criteria.groupLessonNumber = item.lessonId : criteria.sessionId = item.lessonId

                                transactionsModel.findOne(criteria, function(err, res) {
                                    if (err) cb(err)
                                    else {
                                        item.tutorEarning = res.finalAmountToTransfer ? res.finalAmountToTransfer : 0
                                        item.rookiePaid = res.metaData.stripeCharge.amount ? res.metaData.stripeCharge.amount / 100 : 0
                                        item.adminEarning = parseFloat(item.rookiePaid - item.tutorEarning).toFixed(2)

                                        // totalrookiePaid += item.rookiePaid
                                        // totaltutorEarning += item.tutorEarning
                                        // totaladminEarning += parseFloat(item.adminEarning)

                                        cb(null, null)
                                    }
                                })

                            }]
                        }, function(err, result) {
                            Incb(err ? err : null, true)
                        })
                    },
                    function(err, result) {
                        if (err) cb(err);
                        cb(null, data);
                    });
            }],
            getGraphData: ["getTotalTransactions", function(data, cb) {

                Utils.async.eachSeries(totalTransactions, function(item, Incb) {

                    var criteria = {
                        transactionType: 1
                    }
                    params.typeOfLesson == "group" ? criteria.groupLessonNumber = item.lessonId : criteria.sessionId = item.lessonId

                    transactionsModel.findOne(criteria, function(err, res) {
                        if (err) Incb(err)
                        else {
                            item.tutorEarning = res.finalAmountToTransfer ? res.finalAmountToTransfer : 0
                            item.rookiePaid = res.metaData.stripeCharge.amount ? res.metaData.stripeCharge.amount / 100 : 0
                            item.adminEarning = parseFloat(item.rookiePaid - item.tutorEarning).toFixed(2)

                            totalrookiePaid += item.rookiePaid
                            totaltutorEarning += item.tutorEarning
                            totaladminEarning += parseFloat(item.adminEarning)

                            Incb(null, null)
                        }
                    })

                }, function(err, result) {
                    cb(err ? err : null, data)
                })

            }]
        }, function(err, result) {
            callback(err ? err : {
                statusCode: 200,
                message: "Fetched successfully",
                status: "success",
                totalRecords: result.getTotalTransactions,
                data: final,
                graphData: {
                    labels: ["Total Rookie Paid","Total Tutor Earning","Total Admin Earning"],
                    datasets: [{
                        label: "Total Earnings",
                        data: [totalrookiePaid, totaltutorEarning, totaladminEarning]
                    }]
                }
            });
        });
    }


};