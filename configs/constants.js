/*
 * @file: constants.js
 * @description: All major constants that will be used throughout the application
 * @date: 23 March 2018
 * @author: Simran
 * */




module.exports = {

    USER_TYPE: {
        "guru": "1", // guru
        "rookie": "2", //rookie
        "admin": "3" //admin
    },
    USER_STATUS: {
        "active": "active",
        "inactive": "inactive"
    },
    GENDER: {
        "male": "male",
        "female": "female",
        "others": "others"
    },
    LESSON_TYPE: {
        "one": 'one-one',
        "group": "group"
    },
    SESSION_STATUS: {
        "payment_done": "payment done",
        "cancelled_by_guru": "cancelled by guru",
        "cancelled_by_rookie": "cancelled by rookie",
        "refunded": "refunded",
        "accepted": "accepted",
        "rejected": "rejected",
        "pending": "pending",
        "expired": "expired",
        "complaint_raised": "complaint raised",
        "completed": "completed"
    },
    MESSAGE_STATUS: {
        "read": "message read",
        "unread": "message not read"
    },
    MESSAGE_TYPE: {
        "comment": "comment",
        "message": "message"
    },
    TRANSACTION_TYPES: {
        "cardToStripe": "1",
        "stripeToBank": "2",
        "refund": "3"
    },
    REQUEST_STATUS: {
        "ongoing": "ongoing",
        "readyForPayment": "readyForPayment",
        "completed": "completed"
    },
    NOTIFICATION_TYPE: {
        "lesson_request" : "1",
        "rookie_pay_one_one":"2",
        "cancel_group_lesson":"3",
        "cancel_one_one_lesson":"4",
        "complaint_raised":"5",
        "give_feedback":"6",
        "rookie_pay_group":"7",
        "send_message":"8",
        "reminder_notification":"9",
        "accept_lesson":"10",
        "reject_lesson":"11",
        "transfer_to_guru":"12",
        "approve_skill":"13"
    }

};

module.exports.IMG_SIZE = 1048576 * 5;
module.exports.stripeCurrency = "gbp";
module.exports.adminCommission = 10;
module.exports.stripeUserShare = 90; // Because admin's commision is 10% therefore user's share is 90% (100 - 10 %)
module.exports.secretHashKeyForBigBlueButton = "c362699e0767bbc56a055b94e6ff004b"