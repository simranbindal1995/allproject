var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var jwt = require('jsonwebtoken')
var async = require('async')
var path = require('path')
var fs = require('fs')
var md5 = require('md5')
var exec = require('child_process').exec
var async = require('async')
var sha1 = require('sha1');


const env = require('../env');
const configs = require('../configs');
const chatModel = require('../components/chat/models/chat');
const userModel = require('../components/user/models/index');
var filesModel = require('../components/files/models/index');
const notificationModel = require('../components/notification/models/index');


var APP_CONSTANTS = configs.constants;
var USER_STATUS = APP_CONSTANTS.USER_STATUS



module.exports = {
    setIo: function(data) {
        console.log('SOCKET CONNECTED+++++++')
        ioS = data
    },
    logger: function(args) {
        if (configs.app[env.instance].debug) {
            console.log(args)
        }
    },
    createLoginToken: function(payload, cb) {
        jwt.sign(payload, configs.config.data.jwtkey, { algorithm: 'HS512' }, function(err, token) {
            cb(err ? err : null, token)
        })
    },
    createHash: function(params) {

        var data = sha1(params);
        return data;

    },
    failActionFunction: function(request, reply, source, error) { // to modify the payload error messages

        var customErrorMessage = '';
        if (error.output.payload.message.indexOf("[") > -1) {
            customErrorMessage = error.output.payload.message.substr(error.output.payload.message.indexOf("["));
        } else {
            customErrorMessage = error.output.payload.message;
        }
        customErrorMessage = customErrorMessage.replace(/"/g, '');
        customErrorMessage = customErrorMessage.replace('[', '');
        customErrorMessage = customErrorMessage.replace(']', '');
        error.output.payload.message = customErrorMessage;
        delete error.output.payload.validation
        return reply(error);
    },
    sendMail: function(to, subject, message) {
        var mailTransporter = nodemailer.createTransport(smtpTransport({
            service: "Gmail",
            auth: {
                user: "ignivatesting2017@gmail.com",
                pass: "igniva2017testing"
            }
        }));

        var mailOptions = {
            from: '"Gurook" <admin@noreply.com>', // sender address
            to: to, // list of receivers
            subject: subject, // Subject line
            text: message, // plain text body
            html: message, // html body
        };

        mailTransporter.sendMail(mailOptions, function(err, res) {
            console.log('mail sent to===', mailOptions.to, err)
            return (err ? err : null, "Mail sent")
        });
    },

    verifyLoginToken: function(request, reply) {

        var token = request.headers['x-logintoken']

        async.waterfall([
            function(cb) {
                jwt.verify(token, configs.config.data.jwtkey, { algorithm: 'HS512' }, function(err, decode) { // checking token expiry

                    err ? reply({ status: 'warning', statusCode: 324, message: "Your session is expired. Please login again to continue" }).takeover() : cb(null, decode)
                })
            },
            function(data, cb) {
                var criteria = {
                    "deviceDetails": {
                        "$elemMatch": {
                            "accessToken": token
                        }
                    }
                }
                userModel.findOne(criteria, function(err, res) {

                    err || res == null ? reply({ status: 'warning', statusCode: 324, message: "Your session is expired. Please login again to continue" }).takeover() : cb(null, res)
                });
            }
        ], function(err, result) {

            err ? reply(err).takeover() : reply(result);
        })
    },
    uploadDocument: function(data, cb) {

        var ext = data.file.hapi.filename.substr(data.file.hapi.filename.lastIndexOf('.') + 1);
        var filename = data.userId + "_" + generateRandomString(4) + Math.floor(Date.now() / 1000) + "." + ext.substr(0, ext.length); // generating image name and date

        var dest = path.join('./assets/documents', filename); // destination folder to write file

        fs.writeFile(dest, data.file['_data'], function(err) { // write the stream to file at a dest(path where to be stored)
            cb(err ? { statusCode: 401, status: 'warning', message: "File write error ,please try again" } : null, filename)
        });
    },
    capitalizeFirstLetter: function(string) { // capitalize the first letter of the strings

        var firstname;
        var secondname;
        var name = string.split(' ')

        if (name.length > 1) { // first name and second name both
            var username = "";
            for (var i = 0; i < name.length; i++) {
                //console.log('name',name[0])
                firstname = name[i].charAt(0).toUpperCase() + name[i].slice(1);
                if (i != 0) {
                    username = username + ' ' + firstname;
                } else {
                    username = firstname;
                }
            }
            return username
        } else if (name.length == 1) { // only first name
            firstname = name[0].charAt(0).toUpperCase() + name[0].slice(1);
            username = firstname;
            return username
        }
    },
    insert_admin: function(callback) { // insert admin in case no admin exist in db, when starting server
        async.waterfall([

            function(cb) {
                userModel.find({ userType: "admin" }, function(err, res) {
                    if (err) {
                        cb(err)
                    } else {
                        if (res.length > 0) { // admin already exists
                            callback(null, { 'message': "Admin already exists" })
                        } else {
                            var objToSave = { // admin record
                                email: 'virtualclassroom@yopmail.com',
                                password: md5('admin123'),
                                userType: 'admin',
                                isEmailVerify: true
                            }
                            userModel(objToSave).save(function(err, res) {
                                if (err) {
                                    cb(err)
                                } else {
                                    console.log("&&&&&&&", res)
                                    cb(null, { 'message': "Admin added Successfully" })
                                }
                            })
                        }
                    }
                })
            }
        ], function(err, result) {
            if (err) {
                callback(err)
            } else {
                callback(null, result)
            }
        })
    },
    verifyadminLoginToken: function(request, reply) {

        var token = request.headers['x-logintoken']

        async.waterfall([
            function(cb) {
                jwt.verify(token, configs.config.data.jwtkey, { algorithm: 'HS512' }, function(err, decode) { // checking token expiry
                    err ? reply({ status: 'warning', statusCode: 324, message: "Your session is expired. Please login again to continue" }).takeover() : cb(null, decode)
                })
            },
            function(data, cb) {
                var criteria = {
                    "deviceDetails": {
                        "$elemMatch": {
                            "accessToken": token
                        }
                    },
                    userType: "3"
                }
                userModel.findOne(criteria, function(err, res) {
                    err ? cb(err) : (res ? cb(null, res) : reply({ status: 'warning', statusCode: 324, message: "Your session is expired. Please login again to continue" }).takeover())
                });
            }
        ], function(err, result) {
            err ? reply(err).takeover() : reply(result);
        })
    },

    moveFileTmpToCdn: function(data, oldPath, newPath, params, cb) {

        params.title ? null : params.title = ""
        params.description ? null : params.description = ""

        fs.rename(oldPath, newPath, function(err, res) {
            if (err) {
                if (err.code == 'EXDEV') {
                    var execStatement = 'mv ' + oldPath + '  ' + newPath;

                    exec(execStatement, function(err) {
                        if (err) {
                            cb(err)
                        } else {
                            filesModel.findOneAndUpdate({ _id: data[0]._id }, { tmp_file: false, title: params.title, description: params.description }, { new: true }, function(err, res) {
                                if (err) {
                                    cb(err)
                                } else {
                                    cb(null, res)
                                }
                            })
                        }
                    })
                } else {
                    cb(err)
                }

            } else {
                filesModel.findOneAndUpdate({ _id: data[0]._id }, { tmp_file: false, title: params.title, description: params.description }, { new: true }, function(err, res) {
                    if (err) {
                        cb(err)
                    } else {
                        cb(null, res)
                    }
                })
            }
        })
    },

    sendNotification: function(dataToSave, eventName, cb) {
        var deviceDetails
        async.auto({
            saveNotification: [function(cb) {
                if (dataToSave.saveInDb == true) {
                    notificationModel(dataToSave).save(function(err, res) { 
                        cb(err ? err : null, res)
                    })
                } else {
                    cb(null, null)
                }
            }],
            getSocketOfReceiver: ["saveNotification", function(data, cb) {

                if (!dataToSave.receiverId._id) {
                    userModel.findOne({ _id: dataToSave.receiverId }, { deviceDetails: 1, firstName: 1, lastName: 1, profilePic: 1 }, function(err, res) {
                        res ? deviceDetails = res.deviceDetails : null
                        res ? dataToSave.receiverId = res : null
                        
                        cb(err ? err : null, res)
                    })
                } else {
                    deviceDetails = dataToSave.receiverId.deviceDetails
                    cb(null, data)
                }
            }],
            getSocketOfSender: ["saveNotification", function(data, cb) {

                if (!dataToSave.senderId._id && dataToSave.senderId != "") {
                    userModel.findOne({ _id: dataToSave.senderId }, { firstName: 1, lastName: 1, profilePic: 1 }, function(err, res) {
                        res ? dataToSave.senderId = res : null
                       
                        cb(err ? err : null, res)
                    })
                } else {
                    cb(null, data)
                }
            }],
            getUnreadNotificationCount: ["getSocketOfReceiver", "getSocketOfSender", function(data, cb) {

                notificationModel.find({ receiverId: dataToSave.receiverId._id, isRead: false, saveInDb: true }, function(err, res) {
                   
                    if (err) cb(err)
                    else {
                        dataToSave.unReadNotifications = res.length
                        cb(null, data)
                    }
                })
            }],
            getUnreadMessagesCount: ["getUnreadNotificationCount", function(data, cb) {

                chatModel.find({ to: dataToSave.receiverId._id, message_read: false }, function(err, res) {
                   
                    if (err) cb(err)
                    else {
                        dataToSave.unReadMessagesCount = res.length
                        cb(null, data)
                    }
                })
            }],
            emitData: ["getUnreadMessagesCount", function(data, cb) {
               
                if (deviceDetails.length > 0) {
                    for (var i = 0; i < deviceDetails.length; i++) {
                        if (deviceDetails[i].socketId) {
                            var socketId = deviceDetails[i].socketId
                            ioS.to(socketId).emit(eventName, {
                                data: dataToSave
                            });
                        }
                    }
                }
                cb(null, null)

            }]

        }, function(err, result) {
            cb(err ? err : null, null);
        });

    },

    notifiyForLesson: function(data, eventName, socketId, cb) {
        //console.log('notifu====socket=', data, eventName, socketId)

        ioS.to(socketId).emit(eventName, {
            data: data
        });
        cb(null, null)
    }


};

function generateRandomString(length) {
    var data = "";
    var stringkey = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz";
    for (var i = 0; i < length; i++)
        data += stringkey.charAt(Math.floor(Math.random() * stringkey.length));
    return data;
};