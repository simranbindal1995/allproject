var Utils = require('../../../utils/index');
var env = require('../../../env');
var configs = require('../../../configs');

// include all the internal modules

var userModel = require('../../user/models/index');
var notificationModel = require('../models/index');

// var schedule = require('node-schedule');


module.exports = {

    notifications: function(params, callback) {
        Utils.async.auto({
            getTotalNotifications: [function(cb) {

                notificationModel.count({ receiverId: params.userId }, function(err, res) {
                    cb(err ? err : null, res)
                })
            }],
            getNotifications: [function(cb) {

                notificationModel.find({ receiverId: params.userId }, {}, { sort: { createdAt: -1 }, skip: params.skip||0, limit: params.limit ||10})
                    .populate({ path: "senderId", select: "firstName lastName profilePic" })
                    .exec(function(err, res) {
                        cb(err ? err : null, res)
                    })
            }],
            markNotificationsRead: [function(cb) {

                notificationModel.update({ receiverId: params.userId, isRead: false }, { isRead: true }, { multi: true, new: true }, function(err, res) {
                    cb(null, null)
                })

            }]
        }, function(err, result) {
            callback(err ? err : null, { statusCode: 200, status: "success", message: "fetched successfully", totalRecords: result.getTotalNotifications, data: result.getNotifications });
        });
    },
    markAllRead: function(input, callback) {
        notificationModel.notification.update({ receiver: input, read_status: false }, { read_status: true }, { new: true, multi: true }, function(err, res) {
            if (err) {
                Utils.logger.errorLogger('Error in fetching notifications', err);
                callback(err);
            } else {
                callback(null, { statusCode: 200, status: "success", message: "All notifications marked as read." });
            }
        });
    }
}