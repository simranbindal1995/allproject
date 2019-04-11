/*
 * @description: This file defines all the question answers services
 * @date: 29 March 2018
 * @author: Simran
 * */


'use strict';

// include Utils module

var Utils = require('../../../utils/index');
var env = require('../../../env');
var configs = require('../../../configs');

var quesModel = require('../models/index');


module.exports = {

    insertQuesAns: function(params, callback) {

        Utils.async.auto({

            storeQuestionsAnswers: [function(cb) {
                quesModel({ question: params.question, answers: params.answers }).save(function(err, res) {

                    cb(err ? err : null, res)
                })
            }]

        }, function(err, result) {
            callback(err ? err : result)
        });
    },
    getAllQuesAns: function(params, callback) {
        var arr = []

        Utils.async.auto({

            getAllQuestionsAnswers: [function(cb) {

                quesModel.find({ isDeleted: false }, { __v: 0, isDeleted: false }, { lean: true }, function(err, res) {
                    if (err) cb(err)
                    else {
                        for (var i = 0; i < res.length; i++) {
                            for (var j = 0; j < params.quesAlreadyAns.length; j++) {
                                if (res[i]._id.toString() == params.quesAlreadyAns[j].question.toString()) {
                                    for (var k = 0; k < res[i].answers.length; k++) {
                                        if (res[i].answers[k]._id.toString() == params.quesAlreadyAns[j].answer.toString()) {
                                            res[i].answers[k].isChecked = true
                                        }
                                    }
                                }
                            }
                        }
                        cb(null, res)
                    }
                })
            }]

        }, function(err, result) {
            callback(err ? err : result)
        });
    }



}