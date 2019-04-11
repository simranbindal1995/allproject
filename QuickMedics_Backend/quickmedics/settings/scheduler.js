const schedule = require('node-schedule');
const cronService = require("../components/cronJobs/service")

const config = require('config').get("env")


if (config.instance == "production") {
    schedule.scheduleJob('*/6 * * *', async () => {
        console.log("Reminder notification every 6 hours")
        try {
            await cronService.reminderNotification();
        } catch (err) {
            throw new Error(err)
        }
    });

    schedule.scheduleJob({ hour: 23, minute: 55, second: 00 }, async () => {
        console.log("Paying out all the payments")
        try {
            await cronService.payOuts();
        } catch (err) {
            throw new Error(err)
        }
    });

    schedule.scheduleJob('* * * * *', async () => {
        console.log("To check which booking is about to start")
        try {
            await cronService.checkBookingToStart();
        } catch (err) {
            throw new Error(err)
        }
    });

    schedule.scheduleJob('*/1 * * *', async () => {
        console.log("Cron to check and mark bookings for which call is completed but booking not marked as completed")
        try {
            await cronService.markBookingsComplete();
        } catch (err) {
            throw new Error(err)
        }
    });

    schedule.scheduleJob('*/15 * * * * *', async () => {
        console.log("Cron every 15 seconds to check if any booking is there for which patient has not picked up the call in 2 mins")
        try {
            await cronService.checkCallNotJoinedByPatient();
        } catch (err) {
            throw new Error(err)
        }
    });

}