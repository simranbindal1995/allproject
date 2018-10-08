/*
 * @file: appconstants.js
 * @description: All major application contacts are defined here
 * @date:26 March 2018
 * @author: Simran
 * */

'use strict';


module.exports = {

    success: function(reply, message, data) {
        if (data) {
            reply({ status: 'success', statusCode: 200, message: message, data: data });
        } else {
            reply({ status: 'success', statusCode: 200, message: message });
        }
    },
    error: function(reply) {
        reply({ status: 'error', statusCode: 500, message: "Technical Error! Please try again later." }).takeover();
    },
    warning: function(reply, message, data) {
        if (data) {
            reply({ status: 'warning', statusCode: 320, message: message, data: data })
        } else {
            reply({ status: 'warning', statusCode: 320, message: message });
        }
    }


};