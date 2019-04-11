/*
 * @description: This file defines all the languages
 * @date: 17 april
 * @author: Simran
 * */


'use strict';

// include Utils module

var Utils = require('../../../utils/index');
var env = require('../../../env');
var configs = require('../../../configs');

// include all the internal modules

var langModel = require('../models/index');

module.exports = {
    saveLanguage: function(params, callback) {
        Utils.async.auto({
            checkIfAlreadyExists: [function(cb) {

                langModel.findOne({ name: params.name }, function(err, res) {
                    cb(err ? err : res ? { statusCode: 401, status: "error", message: "Already exists" } : null, res)
                })
            }],
            addLanguage: ["checkIfAlreadyExists", function(data, cb) {

                langModel({ name: params.name }).save(function(err, res) {
                    callback(err ? err : null, { statusCode: 200, status: "success", message: "Added successfully" })
                })
            }],
        }, function(err, result) {
            callback(err ? err : null, result);
        });
    },
    getLanguage: function(params, callback) {
        var arr = []
        Utils.async.auto({

            getLanguage: [function(cb) {

                langModel.find({}, { name: 1, _id: 0 }, function(err, res) {

                    callback(err ? err : null, { statusCode: 200, status: "success", message: "Fetched successfully", data: res })
                })
            }],
        }, function(err, result) {
            callback(err ? err : null, result);
        });
    }


};