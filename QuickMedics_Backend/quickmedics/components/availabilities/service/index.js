 const auth = require('../../../utils/auth')
 const fileService = require('../../files/service')


 const addAvailability = async (params) => {
     const toDate = moment().tz(params.userInfo.deviceDetails.timeZone).unix()
     const today = moment().tz(params.userInfo.deviceDetails.timeZone).day();
     logger.start("availabilities:services:addAvailability")

     //Start and end range of the availability will start from current weeks's monday till sunday after 12 weeks

     const check = await db.availabilities.findOne({ userId: params.userInfo._id, isDeleted: false, isExpired: false }, {}, { sort: { endRange: 1 } })

     for (const index in params.availabilityDetails) {

         if (check == null) { //1 time added
             params.availabilityDetails[index].startRange = moment().tz(params.userInfo.deviceDetails.timeZone).startOf('isoWeek').unix()
             const endDateOfWeek = moment().tz(params.userInfo.deviceDetails.timeZone).endOf('isoWeek').unix()
             params.availabilityDetails[index].endRange = moment(endDateOfWeek * 1000).tz(params.userInfo.deviceDetails.timeZone).add(11, 'weeks').unix() //availability will be added for 12 weeks only
         }
         if (check != null && toDate > check.endRange) {
             //If today's date is greater than end range already defined(will happen when range is expired and new availabilities are added)
             //update Db by expiring all earlier availabilities 
             params.availabilityDetails[index].startRange = moment().tz(params.userInfo.deviceDetails.timeZone).startOf('isoWeek').unix()
             const endDateOfWeek = moment().tz(params.userInfo.deviceDetails.timeZone).endOf('isoWeek').unix()
             params.availabilityDetails[index].endRange = moment(endDateOfWeek * 1000).tz(params.userInfo.deviceDetails.timeZone).add(11, 'weeks').unix()

             await db.availabilities.update({ userId: params.userInfo._id, isExpired: false }, { isExpired: true }, { multi: true })
         }
         if (check != null) {
             // when availabilities are added with in 12 weeks.
             params.availabilityDetails[index].startRange = check.startRange
             params.availabilityDetails[index].endRange = check.endRange
         }

         params.availabilityDetails[index].userId = params.userInfo._id
         params.availabilityDetails[index].consultationFee = params.consultationFee
         params.availabilityDetails[index].createdAt = moment().unix()

         await db.availabilities(params.availabilityDetails[index]).save()

     }

     await db.users.findOneAndUpdate({ _id: params.userInfo._id }, { consultationFee: params.consultationFee, profileStepCompleted: 3, lastProfileUpdatedTime: moment().unix() })

     return "Availability added successfully";

 }
 const editAvailability = async (params) => {
     logger.start("users:services:editAvailability")

     for (const index in params.availabilityDetails) {
         params.availabilityDetails[index].consultationFee = params.consultationFee
         const session = await db.availabilities.findOneAndUpdate({ _id: params.availabilityDetails[index].sessionId, isExpired: false, isDeleted: false }, params.availabilityDetails[index])
         if (session == null) throw new Error("Availability session expired.")

     }
     await db.users.findOneAndUpdate({ _id: params.userInfo._id }, { consultationFee: params.consultationFee, lastProfileUpdatedTime: moment().unix() })

     return "Availability saved successfully";
 }

 const fetchAllAvailabilities = async (params) => {
     logger.start("users:services:fetchAllAvailabilities")
     let all = {}
     all.availabilities = await db.availabilities.find({ userId: params._id, isExpired: false, isDeleted: false }, { isDeleted: 1, dayNumber: 1, day: 1, allAvailabilities: 1, startRange: 1, endRange: 1 }, { sort: { createdAt: 1 }, lean: true })

     for (var i = 0; i < all.availabilities.length; i++) {
         all.availabilities[i].selectedDays = [false, false, false, false, false, false, false]
         var allDays = [0, 1, 2, 3, 4, 5, 6]

         // for (var j = 0; j < all.availabilities[i].dayNumber.length; j++) {

         for (var k = 0; k < allDays.length; k++) {
             for (var j = 0; j < all.availabilities[i].dayNumber.length; j++) {
                 if (allDays[k] == all.availabilities[i].dayNumber[j]) {

                     all.availabilities[i].selectedDays[k] = true
                     //break;
                 }
             }
         }
         //}

     }


     all.consultationFee = params.consultationFee || 0
     return all;
 }

 const fetchAvailabilitiesDateWise = async (params) => {
     let avail = [],
         bookings = [],
         slotsArr = []
     logger.start("users:services:fetchAvailabilitiesDateWise")
     const all = await db.availabilities.find({ userId: params.doctorId, isExpired: false, isDeleted: false, day: { $in: [params.day] }, dayNumber: { $in: [params.dayNumber] } }, { allAvailabilities: 1 })

     for (var i = 0; i < all.length; i++) {
         for (var j = 0; j < all[i].allAvailabilities.length; j++) {
             avail.push(all[i].allAvailabilities[j])
         }
     }

     const booking = await db.bookings.find({
         doctorId: params.doctorId,
         status: "paymentDone",
         "bookedAt.dayNumber": params.dayNumber,
         "bookedAt.day": params.day
     })

     for (var i = 0; i < booking.length; i++) {
         for (var j = 0; j < booking[i].bookedAt.slotsBooked.length; j++) {
             bookings.push(booking[i].bookedAt.slotsBooked[j])
         }
     }

     for (var i = 0; i < avail.length; i++) {
         var totalSeconds = avail[i].endTime - avail[i].startTime
         var timeForSlots = 15 * 60 // bcoz we have slots for 15 mins 

         var noOfSlots = parseInt(totalSeconds / timeForSlots)

         var startTime = avail[i].startTime

         for (var j = 0; j < noOfSlots; j++) {
             slotsArr.push({
                 startTime: startTime,
                 endTime: startTime + (15 * 60), // adding 15 mins to startTime to get each slot of 15 mins
                 isBooked: false
             })
             startTime = startTime + (15 * 60)
             //Slots will be like 9.00 - 9.15 , 9.15-9.30 ....
         }
     }


     for (var i = 0; i < slotsArr.length; i++) {
         for (var j = 0; j < bookings.length; j++) {
             if (slotsArr[i].startTime == bookings[j].startTime && slotsArr[i].endTime == bookings[j].endTime) {
                 slotsArr[i].isBooked = true
             }
         }
     }

     return slotsArr;
 }


 exports.addAvailability = addAvailability
 exports.editAvailability = editAvailability
 exports.fetchAllAvailabilities = fetchAllAvailabilities
 exports.fetchAvailabilitiesDateWise = fetchAvailabilitiesDateWise