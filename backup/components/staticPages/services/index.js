'use strict';

// include Utils module

var Utils = require('../../../utils/index');
var env = require('../../../env');
var configs = require('../../../configs');
var jwt = require('jsonwebtoken');
var Mongoose = require('mongoose');

// include internal modules
var staticPageService = require('../models/index');

module.exports = {

    add_update_static_pages: function(req, callback) { // add update content of about us, privacy policy and terms and conditions

        Utils.async.waterfall([
            function(cb) {
                staticPageService.static_pages.findOneAndUpdate({ content_type: req.content_type }, { updated_at: Utils.moment().unix(), content: req.content }, { upsert: true, setDefaultsOnInsert: true }).exec(function(err, res) {
                    if (err) {
                        cb(err)
                    } else {
                        cb({ status: "success", statusCode: 200, message: "Content updated successfully" })
                    }
                })
            }
        ], function(err, result) {
            if (err) {
                callback(err)
            } else {
                callback(null, result)
            }
        })
    },
    update_faq: function(req, callback) { // add or update the FAQ question and answer

        Utils.async.waterfall([

                function(cb) { // if question id, check it exists
                    if (req.question_id && req.question_id != "") { // in case of updating any question answer, chk the question id exist
                        staticPageService.static_pages.find({ 'questions_answers._id': req.question_id }, function(err, res) {
                            if (err) {
                                cb(err)
                            } else {
                                if (res.length > 0) {
                                    cb(null, res)
                                } else {
                                    cb({ status: "warning", statusCode: 325, message: "Question id is invalid" })
                                }
                            }
                        })
                    } else {
                        cb(null, req)
                    }
                },
                function(request, cb) {
                    if (req.question_id && req.question_id != "") { // in case whn to update any question answer
                        staticPageService.static_pages.findOneAndUpdate({
                            content_type: 6,
                            questions_answers: { $elemMatch: { _id: req.question_id } }
                        }, {
                            updated_at: Utils.moment().unix(),
                            $set: { 'questions_answers.$.question': req.question, 'questions_answers.$.answer': req.answer }
                        }, { new: true }).exec(function(err, res) {
                            if (err) {
                                cb(err)
                            } else {

                                callback({ status: "success", statusCode: 200, message: "Content updated successfully" })
                            }
                        })
                    } else {
                        cb(null, request)
                    }
                },
                function(request, cb) { //check if question exists, then update, else insert

                    staticPageService.static_pages.findOne({ content_type: 6 }, function(err, res) {
                        if (err) {
                            cb(err)
                        } else {

                            if (res) { // record exist, so just addtoset the question and answer
                                var data = { 'question': req.question, 'answer': req.answer };
                                staticPageService.static_pages.update({ content_type: 6 }, { updated_at: Utils.moment().unix(), $push: { "questions_answers": data } }, { new: true, multi: true }, function(err, res) {
                                    if (err) {
                                        cb(err)
                                    } else {
                                        callback(null, { status: "success", statusCode: 200, message: "Content updated successfully" })
                                    }
                                })
                            } else {
                                cb(null, request)
                            }
                        }
                    })
                },
                function(request, cb) { // insert new document in db with content_type 

                    var dataToSave = {
                        content_type: 6,
                        questions_answers: [{
                            question: req.question,
                            answer: req.answer
                        }],
                        updated_at: Utils.moment().unix()
                    }

                    staticPageService.static_pages(dataToSave).save(function(err, res) {
                        if (err) {
                            cb(err)
                        } else {
                            cb(null, { status: "success", statusCode: 200, message: "Content updated successfully" })
                        }
                    })
                }
            ],
            function(err, result) {
                if (err) {
                    callback(err)
                } else {
                    callback(null, result)
                }
            })
    },
    static_pages_content: function(req, callback) { // get static pages content

        Utils.async.waterfall([
            function(cb) {

                staticPageService.static_pages.findOne({ content_type: req.page_type }).exec(function(err, res) {
                    if (err) {
                        cb(err)
                    } else {
                        callback({ status: "success", statusCode: 200, message: "Content fetched successfully", data: res })
                    }
                })
            }
        ], function(err, result) {
            if (err) {
                callback(err)
            } else {
                callback(null, result)
            }
        })

    },
    delete_faq: function(req, cb) {
        staticPageService.static_pages.update({ content_type: 6 }, { updated_at: Utils.moment().unix(), $pull: { "questions_answers": { _id: req.question_id } } }, { new: true, multi: true }, function(err, res) {
            console.log(err, res)
            if (err) {
                cb(err)
            } else {
                cb(null, { status: "success", statusCode: 200, message: "Content deleted successfully" })
            }
        })
    },
    fetch_particular_question: function(req, cb) {
        staticPageService.static_pages.findOne({ questions_answers: { $elemMatch: { _id: req.question_id } } }, function(err, res) {
            if (err) {
                cb(err)
            } else {
                for (var i = 0; i < res.questions_answers.length; i++) {
                    if (res.questions_answers[i]._id.toString() == req.question_id.toString()) { 
                        return cb(null, {
                            status: "success",
                            statusCode: 200,
                            message: "Content fetched successfully",
                            data: {
                                question_id: res.questions_answers[i]._id,
                                question: res.questions_answers[i].question,
                                answer: res.questions_answers[i].answer
                            }
                        })
                    }
                }
            }
        })
    },
};