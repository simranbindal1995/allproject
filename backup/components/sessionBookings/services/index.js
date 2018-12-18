 /*
  * @description: This file defines the availability of the user
  * @date: 5 april 2018
  * @author: Simran
  * */


 'use strict';

 // include Utils module

 var Utils = require('../../../utils/index');
 var env = require('../../../env');
 var configs = require('../../../configs');

 var sessionBookingsModel = require('../models/index');
 var bigBlueButtonEventsHistory = require('../models/bigBlueButtonEventsHistory')
 var sessionsModel = require('../../sessions/models/index');
 var APP_CONSTANTS = configs.constants

 var to_json = require('xmljson').to_json;


 // var link = "hooks/list" + APP_CONSTANTS.secretHashKeyForBigBlueButton

 // var data = Utils.universalFunctions.createHash(link)

 // console.log('checksum---', data)


 var serverUrl = "http://10.1.173.125"

 var makeACall = function(params, callback) {

     var startDate = Utils.moment().startOf('day').unix()
     var endDate = Utils.moment().endOf('day').unix()
     var finalJoinLink, moderatorPW, attendeePW, finalCreationLink, details, finalJoinLink1

     if (params.sessionType == "one-one") {


         Utils.async.auto({

                 checkSessionAndGuru: [function(cb) {
                     var criteria = {
                         requestedTo: params.userId,
                         _id: params.sessionId,
                         startDateTime: { $gte: startDate, $lte: endDate }
                     }

                     sessionsModel.findOne(criteria)
                         .populate({ path: "requestedBy", select: "firstName lastName deviceDetails" })
                         .exec(function(err, res) {
                             cb(err ? err : res == null ? { statusCode: 401, status: "warning", message: "Invalid user/session Id" } : null, res)
                         })
                 }],
                 createLink: ["checkSessionAndGuru", function(data, cb) {
                     details = data.checkSessionAndGuru
                     moderatorPW = details.requestedTo
                     attendeePW = details.requestedBy._id

                     var name = "one_one_lesson"

                     var url = serverUrl + "/bigbluebutton/api/"
                     var link = "create" + "name=" + name + "&meetingID=" + params.sessionId + "&attendeePW=" + attendeePW + "&moderatorPW=" + moderatorPW + "&logo=http://virtualclassroom.ignivastaging.com:8066/emailTemplates/logo.png&redirect=true&copyright=VirtualClassroom" + "&logoutURL=http://" + configs.app[env.instance].url + APP_CONSTANTS.secretHashKeyForBigBlueButton

                     var data = Utils.universalFunctions.createHash(link)

                     finalCreationLink = url + "create?" + "name=" + name + "&meetingID=" + params.sessionId + "&attendeePW=" + attendeePW + "&moderatorPW=" + moderatorPW + "&logo=http://virtualclassroom.ignivastaging.com:8066/emailTemplates/logo.png&redirect=true&copyright=VirtualClassroom" + "&logoutURL=http://" + configs.app[env.instance].url + "&checksum=" + data

                     //console.log(finalCreationLink)

                     cb(null, null)
                 }],
                 requestTheLink: ["createLink", function(data, cb) {

                     Utils.request(finalCreationLink, function(error, response, body) {
                         if (error) cb(error)
                         if (response && body) {

                             to_json(body, function(error, data) {
                                 if (error) cb(error)
                                 if (data.response.returncode == "SUCCESS") {
                                     params.meetingID = data.response.internalMeetingID
                                     cb(null, data)
                                 } else {
                                     cb({ statusCode: 401, status: "warning", message: data.response.message })
                                 }
                             });
                         } else {
                             cb({ statusCode: 401, status: "warning", message: "Something went wrong ! Please try again" })
                         }
                     });
                 }],
                 joinLesson: ["requestTheLink", function(data, cb) {

                     params.userDetails.firstName = params.userDetails.firstName.replace(/ /g, '')


                     var url = serverUrl + "/bigbluebutton/api/"
                     var link = "join" + "&meetingID=" + params.sessionId + "&password=" + moderatorPW + "&fullName=" + params.userDetails.firstName + "&userID=" + params.userDetails._id + APP_CONSTANTS.secretHashKeyForBigBlueButton

                     var data = Utils.universalFunctions.createHash(link)

                     finalJoinLink = url + "join?" + "&meetingID=" + params.sessionId + "&password=" + moderatorPW + "&fullName=" + params.userDetails.firstName + "&userID=" + params.userDetails._id + "&checksum=" + data

                     cb(null, null)
                 }],
                 emitSocket: ["joinLesson", function(data, cb) {

                     if (details.requestedBy.deviceDetails && details.requestedBy.deviceDetails.length > 0) {

                         var obj = {
                             sessionId: params.sessionId,
                             status: "Join Call"
                         }

                         Utils.async.eachSeries(details.requestedBy.deviceDetails, function(item, Incb) {

                                 if (item.socketId) {
                                     Utils.universalFunctions.notifiyForLesson(obj, "rookieJoinCall", item.socketId, function(err, res) {
                                         Incb()
                                     })
                                 } else Incb()
                             },
                             function(err, result) {
                                 if (err) cb(err);
                                 cb(null, data);
                             });
                     } else {
                         cb(null, null)
                     }
                 }],
                 updateDb: ["emitSocket", function(data, cb) {

                     //update in db to show Join Call status to everyone
                     var criteria = {
                         requestedTo: params.userId,
                         _id: params.sessionId,
                         startDateTime: {
                             $gte: startDate,
                             $lte: endDate
                         }
                     }

                     sessionsModel.findOneAndUpdate(criteria, {
                             $addToSet: { joinedUsersInSession: params.userId },
                             externalMeetingId: params.meetingID,
                             isCallInitiatedRookie: true,
                             isCallInitiatedGuru: true,
                             callStatus: "Join Call"
                         }, { new: true },
                         function(err, res) {
                             cb(null, null)
                         })


                 }]
             },
             function(err, result) {
                 callback(err ? err : null, {
                     statusCode: 200,
                     status: "success",
                     message: "Redirection successful",
                     data: {
                         status: "Join Call",
                         joinUrl: finalJoinLink
                     }
                 })
             });
     } else {
         //group lesson 

         console.log('group make call')
         Utils.async.auto({

             checkSessionAndGuru: [function(cb) {
                 var criteria = {
                     requestedTo: params.userId,
                     groupLessonNumber: params.sessionId,
                     startDateTime: { $gte: startDate, $lte: endDate }
                 }

                 sessionsModel.findOne(criteria)
                     .populate({ path: "joinees", select: "firstName lastName deviceDetails" })
                     .exec(function(err, res) {
                         cb(err ? err : res == null ? { statusCode: 401, status: "warning", message: "Invalid user/session Id" } : null, res)
                     })
             }],
             createLink: ["checkSessionAndGuru", function(data, cb) {
                 details = data.checkSessionAndGuru
                 var name = details.title


                 moderatorPW = details.requestedTo

                 name = name.replace(/ /g, '')

                 var attendeePW = params.sessionId + moderatorPW + name

                 //console.log('attendeePW=========',attendeePW)

                 var url = serverUrl + "/bigbluebutton/api/"
                 var link = "create" + "name=" + name + "&meetingID=" + params.sessionId + "&attendeePW=" + attendeePW + "&moderatorPW=" + moderatorPW + "&logo=http://virtualclassroom.ignivastaging.com:8066/emailTemplates/logo.png&redirect=true&copyright=VirtualClassroom" + "&logoutURL=http://" + configs.app[env.instance].url + APP_CONSTANTS.secretHashKeyForBigBlueButton

                 var data = Utils.universalFunctions.createHash(link)

                 finalCreationLink = url + "create?" + "name=" + name + "&meetingID=" + params.sessionId + "&attendeePW=" + attendeePW + "&moderatorPW=" + moderatorPW + "&logo=http://virtualclassroom.ignivastaging.com:8066/emailTemplates/logo.png&redirect=true&copyright=VirtualClassroom" + "&logoutURL=http://" + configs.app[env.instance].url + "&checksum=" + data

                 cb(null, null)
             }],
             requestTheLink: ["createLink", function(data, cb) {
                 Utils.request(finalCreationLink, function(error, response, body) {
                     if (error) cb(error)
                     if (response && body) {

                         to_json(body, function(error, data) {
                             console.log('create meeting response==', data)
                             if (error) cb(error)
                             if (data.response.returncode == "SUCCESS") {
                                 params.meetingID = data.response.internalMeetingID
                                 console.log('===========meeting id in creating meeting===', params.meetingID)
                                 cb(null, data)
                             } else {
                                 cb({ statusCode: 401, status: "warning", message: data.response.message })
                             }
                         });
                     } else {
                         cb({ statusCode: 401, status: "warning", message: "Something went wrong ! Please try again" })
                     }
                 });
             }],
             joinLessonGuru: ['requestTheLink', function(data, cb) {

                 params.userDetails.firstName = params.userDetails.firstName.replace(/ /g, '')

                 var url = serverUrl + "/bigbluebutton/api/"
                 var link = "join" + "&meetingID=" + params.sessionId + "&password=" + moderatorPW + "&fullName=" + params.userDetails.firstName + "&userID=" + params.userDetails._id + APP_CONSTANTS.secretHashKeyForBigBlueButton

                 var data = Utils.universalFunctions.createHash(link)

                 finalJoinLink1 = url + "join?" + "&meetingID=" + params.sessionId + "&password=" + moderatorPW + "&fullName=" + params.userDetails.firstName + "&userID=" + params.userDetails._id + "&checksum=" + data

                 cb(null, null)
             }],
             createLinks: ["requestTheLink", function(data, cb) {


                 Utils.async.eachSeries(data.checkSessionAndGuru.joinees, function(item, Incb) {
                         //var attendeePW = item._id
                         Utils.async.auto({
                             // createLink: [function(cb) {

                             //     var name = details.title

                             //     name = name.replace(/ /g, '')

                             //     var attendeePW = params.sessionId + moderatorPW + name

                             //     //console.log('attendeePW=========',attendeePW)

                             //     var url = serverUrl + "/bigbluebutton/api/"
                             //     var link = "create" + "name=" + name + "&meetingID=" + params.sessionId + "&attendeePW=" + attendeePW + "&moderatorPW=" + moderatorPW + "&logo=http://virtualclassroom.ignivastaging.com:8066/emailTemplates/logo.png&redirect=true&copyright=VirtualClassroom" + "&logoutURL=http://" + configs.app[env.instance].url + APP_CONSTANTS.secretHashKeyForBigBlueButton

                             //     var data = Utils.universalFunctions.createHash(link)

                             //     finalCreationLink = url + "create?" + "name=" + name + "&meetingID=" + params.sessionId + "&attendeePW=" + attendeePW + "&moderatorPW=" + moderatorPW + "&logo=http://virtualclassroom.ignivastaging.com:8066/emailTemplates/logo.png&redirect=true&copyright=VirtualClassroom" + "&logoutURL=http://" + configs.app[env.instance].url + "&checksum=" + data

                             //     cb(null, null)
                             // }],

                             joinLesson: [function(cb) {

                                 params.userDetails.firstName = params.userDetails.firstName.replace(/ /g, '')

                                 var url = serverUrl + "/bigbluebutton/api/"
                                 var link = "join" + "&meetingID=" + params.sessionId + "&password=" + moderatorPW + "&fullName=" + params.userDetails.firstName + "&userID=" + item._id + APP_CONSTANTS.secretHashKeyForBigBlueButton

                                 var data = Utils.universalFunctions.createHash(link)

                                 finalJoinLink = url + "join?" + "&meetingID=" + params.sessionId + "&password=" + moderatorPW + "&fullName=" + params.userDetails.firstName + "&userID=" + item._id + "&checksum=" + data

                                 cb(null, null)
                             }],
                             emitSocket: ["joinLesson", function(data, cb) {

                                 if (item.deviceDetails && item.deviceDetails.length > 0) {

                                     var obj = {
                                         sessionId: params.sessionId,
                                         status: "Join Call"
                                     }



                                     Utils.async.eachSeries(item.deviceDetails, function(item1, Inncb) {
                                             console.log('user info to emit socket to====', item.email)
                                             if (item1.socketId) {
                                                 Utils.universalFunctions.notifiyForLesson(obj, "rookieJoinCall", item1.socketId, function(err, res) {
                                                     Inncb()
                                                 })
                                             } else Inncb()
                                         },
                                         function(err, result) {
                                             if (err) cb(err);
                                             cb(null, null);
                                         });
                                 } else {
                                     cb(null, null)
                                 }
                             }]
                         }, function(err, result) {
                             Incb(err ? err : null, true)
                         })
                     },
                     function(err, result) {
                         cb(err ? err : null, result)
                     });
             }],
             updateDb: ["createLinks", function(data, cb) {

                 //update in db to show Join Call status to everyone
                 var criteria = {
                     requestedTo: params.userId,
                     groupLessonNumber: params.sessionId,
                     startDateTime: { $gte: startDate, $lte: endDate }
                 }

                 sessionsModel.update(criteria, { $addToSet: { joinedUsersInSession: params.userId }, isCallInitiatedRookie: true, externalMeetingId: params.meetingID, isCallInitiatedGuru: true, callStatus: "Join Call" }, { multi: true, new: true }, function(err, res) {
                     console.log('meeting Id updated in db================')
                     cb(null, null)
                 })

             }],
         }, function(err, result) {
             callback(err ? err : null, {
                 statusCode: 200,
                 status: "success",
                 message: "Redirection successful",
                 data: {
                     status: "Join Call",
                     joinUrl: finalJoinLink1
                 }
             })
         });


     }




 }

 var joinACall = function(params, callback) {
     var startDate = Utils.moment().startOf('day').unix()
     var endDate = Utils.moment().endOf('day').unix()
     var finalJoinLink, moderatorPW, finalCreationLink, attendeePW
     params.isGuru = false

     Utils.async.auto({

             checkSessionAndGuru: [function(cb) {
                 var criteria = {
                     startDateTime: { $gte: startDate, $lte: endDate },
                     $or: [{ requestedTo: params.userId }, { requestedBy: params.userId }, { joinees: { $in: [params.userId] } }]
                 }

                 params.sessionType == "group" ? criteria.groupLessonNumber = params.sessionId : criteria._id = params.sessionId

                 sessionsModel.findOne(criteria)
                     .populate({ path: "requestedTo", select: "firstName lastName deviceDetails" })
                     .exec(function(err, res) {
                         if (err) cb(err)
                         else if (res == null) cb({ statusCode: 401, status: "warning", message: "Invalid user/session Id" })
                         else if (res.joinedUsersInSession.length > 0) {

                             var x = res.joinedUsersInSession.includes(params.userId.toString())
                             x == true ? cb({ statusCode: 401, status: "warning", message: "You are already in middle of the session" }) : cb(null, res)
                         } 
                         else if (res.endDateTime <= Utils.moment().unix()) {
                             cb({ statusCode: 401, status: "warning", message: "Lesson ended , you cannot join now." })
                         } else {
                             cb(null, res)
                         }
                     })
             }],
             checkIfMeetingExists: ["checkSessionAndGuru", function(data, cb) {

                 if (params.userId.toString() == data.checkSessionAndGuru.requestedTo._id.toString()) {

                     var url = serverUrl + "/bigbluebutton/api/"
                     var link = "getMeetingInfo" + "&meetingID=" + params.sessionId + APP_CONSTANTS.secretHashKeyForBigBlueButton

                     var data = Utils.universalFunctions.createHash(link)

                     var finalJoinLink1 = url + "getMeetingInfo?" + "&meetingID=" + params.sessionId + "&checksum=" + data


                     Utils.request(finalJoinLink1, function(error, response, body) {
                         if (error) cb(error)
                         if (response && body) {

                             to_json(body, function(error, data) {
                                 if (error) cb(error)
                                 if (data.response.returncode == "SUCCESS") {

                                     cb(null, null)
                                 } else {
                                     params.isGuru = true
                                     makeACall(params, function(err, res) {
                                         res ? finalJoinLink = res.data.joinUrl : null
                                         cb(err ? err : null, res)
                                     })
                                 }
                             });
                         } else {
                             cb({ statusCode: 401, status: "warning", message: "Something went wrong ! Please try again" })
                         }
                     });
                 } else {
                     cb(null, data)
                 }

             }],

             joinLesson: ["checkIfMeetingExists", function(data, cb) {
                 if (params.isGuru == false) {
                     var details = data.checkSessionAndGuru
                     moderatorPW = details.requestedTo._id

                     params.userDetails.firstName = params.userDetails.firstName.replace(/ /g, '')


                     if (params.sessionType == 'group' && params.userId.toString() == details.requestedTo._id.toString()) {
                         attendeePW = params.userId
                     } else if (params.sessionType == 'group' && params.userId.toString() != details.requestedTo._id.toString()) {
                         var name = details.title

                         name = name.replace(/ /g, '')

                         attendeePW = params.sessionId + details.requestedTo._id + name
                     } else if (params.sessionType == "one-one" && params.userId.toString() == details.requestedTo._id.toString()) {
                         attendeePW = params.userId
                     } else if (params.sessionType == "one-one" && params.userId.toString() != details.requestedTo._id.toString()) {
                         attendeePW = params.userId
                     }

                     var url = serverUrl + "/bigbluebutton/api/"
                     var link = "join" + "&meetingID=" + params.sessionId + "&password=" + attendeePW + "&fullName=" + params.userDetails.firstName + "&userID=" + params.userId + APP_CONSTANTS.secretHashKeyForBigBlueButton

                     var data = Utils.universalFunctions.createHash(link)

                     finalJoinLink = url + "join?" + "&meetingID=" + params.sessionId + "&password=" + attendeePW + "&fullName=" + params.userDetails.firstName + "&userID=" + params.userId + "&checksum=" + data
                 }

                 cb(null, null)
             }],
             checkIfMeetingIsNotExpired: ["joinLesson", function(data, cb) {

                 if (params.isGuru == false) {
                     var url = serverUrl + "/bigbluebutton/api/"
                     var link = "getMeetingInfo" + "&meetingID=" + params.sessionId + APP_CONSTANTS.secretHashKeyForBigBlueButton

                     var data = Utils.universalFunctions.createHash(link)

                     var finalJoinLink1 = url + "getMeetingInfo?" + "&meetingID=" + params.sessionId + "&checksum=" + data


                     Utils.request(finalJoinLink1, function(error, response, body) {
                         if (error) cb(error)
                         if (response && body) {

                             to_json(body, function(error, data) {
                                 if (error) cb(error)
                                 if (data.response.returncode == "SUCCESS") {

                                     cb(null, null)
                                 } else {
                                     cb({ statusCode: 401, status: "warning", message: "You cannot join the session because Guru must have left the call .Please wait till the Guru rejoins." })
                                 }
                             });
                         } else {
                             cb({ statusCode: 401, status: "warning", message: "Something went wrong ! Please try again" })
                         }
                     });

                 } else {
                     cb(null, null)
                 }
             }],
             updateSession: ['checkIfMeetingIsNotExpired', function(data, cb) {
                 if (params.isGuru == false) {
                     var criteria = {
                         startDateTime: { $gte: startDate, $lte: endDate },
                         $or: [{ requestedTo: params.userId }, { requestedBy: params.userId }, { joinees: { $in: [params.userId] } }]
                     }

                     params.sessionType == "group" ? criteria.groupLessonNumber = params.sessionId : criteria._id = params.sessionId

                     sessionsModel.update(criteria, { $addToSet: { joinedUsersInSession: params.userId }, isCallInitiatedRookie: true }, { multi: true })
                         .exec(function(err, res) {
                             cb(err ? err : null, res)
                         })
                 } else {
                     cb(null, null)
                 }
             }],
         },
         function(err, result) {
             callback(err ? err : null, {
                 statusCode: 200,
                 status: "success",
                 message: "Redirection successful",
                 data: {
                     status: "Join Call",
                     joinUrl: finalJoinLink
                 }
             })
         });
 }

 var webhooks = function(params, callback) {
     console.log('webhook res====', params)
     var feedback = true
     Utils.async.auto({
         getSessionDetails: [function(cb) {

             sessionsModel.findOne({ externalMeetingId: params.payload.meeting_id })
                 .populate({ path: "requestedTo", select: "deviceDetails" })
                 .populate({ path: "requestedBy", select: "deviceDetails" })
                 .populate({ path: "joinees", select: "deviceDetails" })
                 .exec(function(err, res) {
                     //console.log('got meeting id======', res)
                     // cb(err ? err : res == null ? null, res)
                     if (err) cb(err)
                     if (res == null) callback(null, null)
                     else {
                         cb(null, res)
                     }
                 })

         }],
         storeEvent: ['getSessionDetails', function(data, cb) {
             var obj = {
                 details: params
             }

             data.getSessionDetails && data.getSessionDetails.sessionType == "group" ? obj.groupLessonNumber = data.getSessionDetails.groupLessonNumber : obj.sessionId = data.getSessionDetails._id

             bigBlueButtonEventsHistory(obj).save(function(err, res) {
                 if (err) {
                     cb(err)
                 } else {
                     cb(null, res)
                 }
                 //cb(err ? err : null, data)
             })
         }],
         removeUserIdFromJoinedArray: ["storeEvent", function(data, cb) {

             if (params.header.name == "user_left_message") {

                 var criteria = {
                     startDateTime: { $gte: Utils.moment().startOf('day').unix(), $lte: Utils.moment().endOf('day').unix() }
                 }

                 data.getSessionDetails && data.getSessionDetails.sessionType == "group" ? criteria.groupLessonNumber = data.getSessionDetails.groupLessonNumber : criteria._id = data.getSessionDetails._id
                 // console.log('criteria======', criteria)
                 // console.log('id to pull--------', params.payload.user.extern_userid.toString())
                 sessionsModel.findOneAndUpdate(criteria, { $pull: { joinedUsersInSession: { $in: [params.payload.user.extern_userid.toString()] } } }, { new: true }, function(err, res) {
                     cb(err ? err : null, data)
                 })
             } else {
                 cb(null, data)
             }
         }],
         handleLogoutCases: ['storeEvent', function(data, cb) {

             var sessionDetails = data.getSessionDetails

             if (params.header.name == "user_left_message" && params.payload.user.extern_userid.toString() == sessionDetails.requestedTo._id.toString() && sessionDetails.endDateTime <= Utils.moment().unix()) {
                 
                 Utils.async.waterfall([

                     function(cb) {

                         // Destory the session when guru has left the session after end time 

                         sessionDetails.sessionType == "group" ? params.sessionId = sessionDetails.groupLessonNumber : params.sessionId = sessionDetails._id

                         var url = serverUrl + "/bigbluebutton/api/"
                         var link = "end" + "&meetingID=" + params.sessionId + "&password=" + sessionDetails.requestedTo._id + APP_CONSTANTS.secretHashKeyForBigBlueButton

                         var data = Utils.universalFunctions.createHash(link)

                         var finalCreationLink = url + "end?" + "&meetingID=" + params.sessionId + "&password=" + sessionDetails.requestedTo._id + "&checksum=" + data

                         Utils.request(finalCreationLink, function(error, response, body) {
                             console.log('session destroyed----', body)
                             if (error) cb(error)
                             else {
                                 cb(null, null)
                             }
                         });
                     },
                     function(data, cb) {

                         if (sessionDetails.sessionType == "group") {

                             sessionsModel.find({ groupLessonNumber: sessionDetails.groupLessonNumber }, {}, { sort: { startDateTime: -1 } }, function(err, res) {
                                 if (err) cb(err)
                                 else {
                                     if (res.length > 0) {
                                         var length = res.length
                                         var i = 0

                                         var startDateTime = res[length - 1].startDateTime
                                         var endDateTime = res[i].endDateTime

                                         if (endDateTime >= Utils.moment().unix()) { // if group lesson's last date have not completed yet then no feedback form to show
                                             feedback = false
                                         }
                                         console.log('feedback-------', feedback)
                                     }
                                     cb(null, data)
                                 }
                             })
                         } else {
                             cb(null, data)
                         }
                     },
                     function(data, cb) {

                         //  emit socket to guru to remove the lesson from todays session
                         var obj = {
                             giveFeedback: feedback,
                             lessonType: sessionDetails.sessionType,
                             userRole: "1"
                         }
                         sessionDetails.sessionType == "group" ? obj.sessionId = sessionDetails.groupLessonNumber : obj.sessionId = sessionDetails._id

                         Utils.async.eachSeries(sessionDetails.requestedTo.deviceDetails, function(item, Incb) {
                                 console.log('sending ntfcn to guru========')
                                 Utils.universalFunctions.notifiyForLesson(obj, "callEnd", item.socketId, function(err, res) {
                                     Incb()
                                 })
                             },
                             function(err, result) {
                                 if (err) cb(err);
                                 cb(null, data);
                             });
                     },
                     function(data, cb) {
                         if (sessionDetails.sessionType == "one-one") {

                             var obj = {
                                 giveFeedback: feedback,
                                 lessonType: sessionDetails.sessionType,
                                 userRole: "2",
                                 sessionId: sessionDetails._id
                             }

                             Utils.async.eachSeries(sessionDetails.requestedBy.deviceDetails, function(item, Incb) {
                                     console.log('sending ntfcn to rooie one one lesson')
                                     Utils.universalFunctions.notifiyForLesson(obj, "callEnd", item.socketId, function(err, res) {
                                         Incb()
                                     })
                                 },
                                 function(err, result) {
                                     if (err) cb(err);
                                     cb(null, data);
                                 });

                         } else {

                             var obj = {
                                 giveFeedback: feedback,
                                 lessonType: sessionDetails.sessionType,
                                 userRole: "2",
                                 sessionId: sessionDetails.groupLessonNumber
                             }

                             Utils.async.eachSeries(sessionDetails.joinees, function(item, Incb) {
                                     console.log('sending ntfcn to rookie group lesson')

                                     Utils.async.eachSeries(item.deviceDetails, function(Innitem, Inncb) {

                                             Utils.universalFunctions.notifiyForLesson(obj, "callEnd", Innitem.socketId, function(err, res) {
                                                 Inncb()
                                             })
                                         },
                                         function(err, result) {
                                             Incb();
                                         });

                                 },
                                 function(err, result) {
                                     if (err) cb(err);
                                     cb(null, data);
                                 });
                         }
                     }
                 ], function(err, result) {
                     if (err) callback(err);
                     callback(null, result);
                 })
             } else {
                 callback(null, null)
             }
         }]
     }, function(err, result) {
         callback(err ? err : null, result);
     });
 }


 module.exports = {
     makeACall: makeACall,
     joinACall: joinACall,
     webhooks: webhooks
 }