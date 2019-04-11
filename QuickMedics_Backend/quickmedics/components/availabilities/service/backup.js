 const auth = require('../../../utils/auth')
 const fileService = require('../../files/service')


 const addAvailability = async (params) => {
     logger.start("availabilities:services:addAvailability")

     const today = moment().tz(params.userInfo.deviceDetails.timeZone).day();

     params.data.forEach(async (data) => {

         const checkday = await db.availabilities.findOne({ userId: params.userInfo._id, isDeleted: false, dayNumber: data.dayNumber, startRange: { $lte: today }, endRange: { $gte: today } })

         if (checkday && checkday != null) {

             for (var i = 0; i < data.allAvailabilities.length; i++) {
                 data.allAvailabilities[i].startDateTime += checkday.startRange
                 data.allAvailabilities[i].endDateTime += checkday.endRange
             }

             await db.availabilities.findOneAndUpdate({ userId: params.userInfo._id, dayNumber: data.dayNumber, isExpired: false, isDeleted: false }, { consultationFee: params.data.consultationFee, $addToSet: { allAvailabilities: data.allAvailabilities } })
             await db.users.findOneAndUpdate({ _id: params.userInfo._id }, { consultationFee: params.consultationFee })
         } else {
             logger.start("getting startRange & endRange")

             data.userId = params.userInfo._id
             data.consultationFee = params.consultationFee

             const res = 7 - today
             const daysToAdd = res + data.dayNumber

             data.startRange = moment().tz(params.userInfo.deviceDetails.timeZone).startOf('day').add(daysToAdd, "days").unix()
             data.endRange = moment(data.startRange * 1000).tz(params.userInfo.deviceDetails.timeZone).add(11, 'weeks').unix() //availability will be added for 12 weeks only

             for (var i = 0; i < data.allAvailabilities.length; i++) {
                 data.allAvailabilities[i].startDateTime += data.startRange
                 data.allAvailabilities[i].endDateTime += data.endRange
             }

             data.startRange = moment(data.startRange * 1000).tz(params.userInfo.deviceDetails.timeZone).startOf('day').unix()
             data.endRange = moment(data.endRange * 1000).tz(params.userInfo.deviceDetails.timeZone).endOf('day').unix()

             await db.availabilities.update({ userId: params.userInfo._id, isExpired: false }, { isExpired: true }, { multi: true })
             await db.availabilities(data).save()
             await db.users.findOneAndUpdate({ _id: params.userInfo._id }, { consultationFee: params.consultationFee })

         }
     })

     return "Availability added successfully";



 }
 const editAvailability = async (params) => {

     if (params.removeAvailabilitiesDays.length > 0) {
         const today = moment().tz(params.userInfo.deviceDetails.timeZone).day();
         const x = await db.availabilities.update({ userId: params.userInfo._id, dayNumber: { $in: removeAvailabilitiesDays }, startRange: { $lte: today }, endRange: { $gte: today } }, { $unset: { allAvailabilities: 1 } }, { multi: true })
     }

     params.data.forEach(async (data) => {
         await db.availabilities.findOneAndUpdate({ userId: params.userInfo._id, dayNumber: data.dayNumber, isExpired: false, isDeleted: false }, { consultationFee: params.consultationFee, $addToSet: { allAvailabilities: data.allAvailabilities } })
     })

     if (params.userInfo.consultationFee != params.consultationFee) {
         await db.users.findOneAndUpdate({ _id: params.userInfo._id }, { consultationFee: params.consultationFee })
     }

     return "Availability saved successfully";
 }

 const fetchAllAvailabilities = async (params) => {

     const all = await db.availabilities.find({ userId: params.userInfo._id, isExpired: false, isDeleted: false })

 }
 exports.addAvailability = addAvailability
 exports.editAvailability = editAvailability
 exports.fetchAllAvailabilities = fetchAllAvailabilities