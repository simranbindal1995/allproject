var schedule = require('node-schedule');
var sessionService = require('./components/sessions/services/cron');

const env = require('./env');

if (env.instance == "dev") {
    schedule.scheduleJob('*/50 * * * *', function() { console.log("Update transactions every 55 mins")

        sessionService.updateTransactions({}, function(err, res) {
            if (err) {
                console.log('error in cron 1 for updating records', err)
            } else {
                //console.log(res)
            }
        });
    });

    schedule.scheduleJob('*/59 * * * *', function() { console.log("Transfer money every 1 hr")

        sessionService.transferMoneyToGuru({}, function(err, res) {
            if (err) {
                console.log('error in cron 2 for transfering money', err)
            } else {
                //console.log(res)
            }
        });
    });

    schedule.scheduleJob('*/15 * * * *', function() { console.log("send ntfcn every 30 mins")

        sessionService.sendNotificationToGuru({}, function(err, res) {
            if (err) {
                console.log('error in cron 3 for sending mail', err)
            } else {
                //console.log(res)
            }
        });
    });

    schedule.scheduleJob({ hour: 23, minute: 59, second: 00 }, function() { console.log("reminder ntfcn to pay for lesson at 23:59")

        sessionService.reminderNotificationToRookieToPayLesson({}, function(err, res) {
            if (err) {
                console.log('error in cron 4 for reminder notification mail', err)
            } else {}
        });
    });

    schedule.scheduleJob('* * * * *', function() { console.log("every minute cron to see which lesson is about to start")
     // cron to emit sokcet to guru before 5 mins of starting a lesson

        sessionService.toCheckWhichLessonIsAboutToStart({}, function(err, res) {
            if (err) {
                console.log('error in cron 5 for sending socket to check which lesson is about to start', err)
            } else {}
        });
    });

}