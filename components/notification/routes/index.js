/*
 * @description: This file defines all the user routes
 * @date: 21 June 2018
 * @author: Simran
 * */


// include utils module

var Utils = require('../../../utils/index');
var Services = require('../services/index');
var configs = require('../../../configs');
var env = require('../../../env');

module.exports = [
{
    method: 'GET',
    path: '/v1/Notifications/list',
    config: {
        description: 'api to get list of notifications',
        tags: ['api'],
        pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "verify" }],
        validate: {
            headers: Utils.Joi.object({
                'x-logintoken': Utils.Joi.string().required().trim()
            }).options({ allowUnknown: true }),
            query: {
                skip: Utils.Joi.number(),
                limit: Utils.Joi.number()
            }
        }
    },
    handler: function(request, reply) {
        request.query.userId = request.pre.verify._id;
        Services.notifications(request.query, function(err, res) {
            reply(err ? err : null, res)
        });
    }
}
];