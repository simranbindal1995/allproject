/*
 * @description: This file defines all the user services
 * @date: 26 March 2018
 * @author: Simran
 * */


'use strict';

// include Utils module

var Utils = require('../../../utils/index');
var env = require('../../../env');
var configs = require('../../../configs');
var jwt = require('jsonwebtoken');
var _ = require('underscore');

var subjectNSkillModel = require('../models/index');
var skillGuruTeaches = require('../../skillsGuruTeaches/models/index');
var userModel = require('../../user/models/index');
var sessionsModel = require('../../sessions/models/index');

module.exports = {
    getAllChildren: function(array, callback) {
        var arraystr = JSON.stringify(array);
        var newarray = JSON.parse(arraystr)
        var map = {};
        for (var i = 0; i < newarray.length; i++) {
            var obj = newarray[i];
            obj.children = [];
            map[obj._id] = obj;
            var parent = obj.parent || '-';
            if (!map[parent]) {
                map[parent] = {
                    children: []
                };
            }
            map[parent].children.push(obj);
        }
        callback(null, map['-'].children);
        //return map['-'].children;
    },
    saveCategory: function(req, callback) { // save any category or skill or sub skill

        Utils.async.auto({
                checkIfCategoryExist: [function(cb) { // in case any parent , check if its valid
                    subjectNSkillModel.findOne({ name: req.name }, function(err, res) {
                        err ? cb(err) : (res ? cb({ status: "warning", statusCode: 401, message: "Category already exist" }) : cb(null, res))
                    })
                }],
                saveCategoryInDb: ['checkIfCategoryExist', function(data, cb) { // save category in case it dont exist
                    var obj = {
                        name: req.name,
                        level: 0
                    }
                    subjectNSkillModel(obj).save(function(err, res) {
                        err ? cb(err) : cb(null, { status: "success", statusCode: 200, message: "Category saved successfully" });
                    })
                }]
            },
            function(err, res) {
                callback(err ? err : null, res)
            });
    },

    saveSubjectAndSKill: function(req, callback) { // save a new subject

        var subject_exist = false,
            subject_id;

        Utils.async.auto({
                checkIfParentIdExist: [function(cb) { // in case any parent , check if its valid
                    Utils.universalFunctions.logger('In Step 1 to check if parent id exist ++');
                    subjectNSkillModel.findOne({ _id: req.parent_id }, function(err, res) {
                        
                        err ? cb(err) : (res ? cb(null, res) : cb({ status: "warning", statusCode: 401, message: "Category not exist" }));
                    })
                }],

                checkIfSubjectAlreadyExist: ['checkIfParentIdExist', function(data, cb) { // check if subject exist for that category
                    Utils.universalFunctions.logger('In Step 2 to check if subject already exist ++')
                    subjectNSkillModel.findOne({ name: req.subject, parent: req.parent_id }, function(err, res) {
                        res ? (subject_exist = true, subject_id = res._id) : subject_exist = false;
                        err ? cb(err) : (res ? cb(null, res) : cb(null, res));
                    })
                }],

                checkifSubjectSkillCombinationExist: ['checkIfSubjectAlreadyExist', function(data, cb) {
                    subjectNSkillModel.findOne({ name: req.skill, parent: subject_id }, function(err, res) {
                        err ? cb(err) : (res ? cb({ status: "warning", statusCode: 401, message: "Subject already exist" }) : cb(null, res));
                    })
                }],

                createSubjectIfNotExist: ['checkifSubjectSkillCombinationExist', function(data, cb) {
                    if (subject_exist == false) { // if subject not exist
                        var is_approved = false
                        req.userDetails.userType == "3" ? is_approved = true : is_approved = false
                        subjectNSkillModel({ requestedBy: req.userId, name: req.subject, parent: req.parent_id, is_approved: is_approved, level: 1 }).save(function(err, res) { // first save the subject

                            if (err) {
                                cb(err)
                            } else {

                                var is_approved = false
                                req.userDetails.userType == "3" ? is_approved = true : is_approved = false

                                subjectNSkillModel({ description: req.description || "", requestedBy: req.userId, parent: res._id, name: req.skill, is_approved: is_approved, level: 2 }).save(function(err, res) { // save the skill and use subject_id as parent

                                    err ? cb(err) : cb({ status: "success", statusCode: 200, message: "Subject add request sent to admin" });
                                })
                            }
                        })
                    } else { // if subject exist,only save the skill

                        var is_approved = false
                        req.userDetails.userType == "3" ? is_approved = true : is_approved = false

                        subjectNSkillModel({ description: req.description || "", requestedBy: req.userId, parent: subject_id, name: req.skill, is_approved: is_approved, level: 2 }).save(function(err, res) { // save the skill and use subject_id as parent

                            err ? cb(err) : cb({ status: "success", statusCode: 200, message: "Subject add request sent to admin" });
                        })
                    }
                }]
            },
            function(err, result) {
                err ? callback(err) : callback(null, result);
            });

    },
    getCategories: function(req, callback) {
        var finalresult;
        Utils.async.auto({

            fetchRootCategories: [function(cb) { // fetch all the root categories
                subjectNSkillModel.find({ parent: { $exists: false }, is_approved: true }).sort({ created_at: -1 }).exec(function(err, res) {
                    err ? cb(err) : (cb(null, res))
                })
            }],
            capitalizeNames: ['fetchRootCategories', function(data, cb) { // capitalize the names

                if (data.fetchRootCategories && data.fetchRootCategories.length > 0) {
                    finalresult = _.map(data.fetchRootCategories, function(category) {
                        return {
                            _id: category._id,
                            name: Utils.universalFunctions.capitalizeFirstLetter(category.name)
                        }
                    })
                    cb(null, finalresult)
                } else {
                    cb(null, data)
                }
            }]
        }, function(err, result) {
            err ? callback(err) : callback(null, { status: "success", statusCode: 200, message: "Categories fetched successfully", data: finalresult });
        })
    },
    getAllCategoriesAndSubjects: function(req, callback) {

        var self = this;
        var skills = [];

        Utils.async.auto({

            fetchRootCategories: [function(cb) { // fetch all the root categories
              
                subjectNSkillModel.find({ is_approved: true }, function(err, res) {
                    if (res && res.length > 0) {
                        cb(null, res)
                    } else {
                        callback(null, { status: "success", statusCode: 200, message: "Categories fetched successfully", data: res })
                    }
                });
            }],

            fetchFirstLevelChild: ['fetchRootCategories', function(data, cb) { // call function to create tree view of child parent

                self.getAllChildren(data.fetchRootCategories, function(err, res) {
                    cb(null, res)
                });
            }],
            modifyData: ['fetchFirstLevelChild', function(data, cb) {
                if (data.fetchFirstLevelChild && data.fetchFirstLevelChild.length > 0) {
                    cb(null, { status: "success", statusCode: 200, message: "Categories fetched successfully", data: data.fetchRootCategories })
                } else {
                    data.fetchFirstLevelChild.forEach(function(categories) {
                        delete categories['__v'];
                        delete categories['is_approved'];
                    })
                    cb(null, res.fetchRootCategories)
                }
            }]
        }, function(err, result) {
            err ? callback(err) : callback(null, { status: "success", statusCode: 200, message: "Categories fetched successfully", data: result.fetchFirstLevelChild });
        })
    },
    getSubCategoriesOfCategory: function(params, callback) {
        subjectNSkillModel.find({ parent: params.category_id, is_approved: true }).sort({ created_at: -1 }).exec(function(err, res) {
            err ? callback(err) : callback({ status: "success", statusCode: 200, message: "Sub categories fetched successfully", data: res })
        })
    },
    getSkillsOfSubCategories: function(params, callback) {
        subjectNSkillModel.find({ parent: params.subcategoryId, is_approved: true }).sort({ created_at: -1 }).exec(function(err, res) {
            err ? callback(err) : callback({ status: "success", statusCode: 200, message: "Skills fetched successfully", data: res })
        })
    },

    getAddedSkillsOfUser: function(params, callback) {
        var arr = []
        Utils.async.auto({
            getAllSkills: [function(cb) {

                subjectNSkillModel.find({ parent: params.subcategoryId, is_approved: true }, { name: 1 }, { lean: true }).sort({ created_at: -1 }).exec(function(err, res) {

                    if (err) cb(err)
                    else {
                        cb(null, res)
                    }
                })
            }],
            getSkillsOfUser: ["getAllSkills", function(data, cb) {

                Utils.async.eachSeries(data.getAllSkills, function(item, Incb) {

                        skillGuruTeaches.findOne({ type: 1, isDeleted: false, userId: params.userId, skillId: item._id }, {}, { lean: true }, function(err, res) {
                            if (err) Incb(err)
                            if (res == null) {
                                item.isChecked = false
                            } else {
                                item.isChecked = true
                            }
                            arr.push(item)
                            Incb()
                        })

                    },
                    function(err, result) {
                        cb(err ? err : null, null)
                    });

            }]
        }, function(err, result) {
            callback(err ? err : null, { statusCode: 200, status: "success", message: "Fetched successfully", data: arr });
        });
    },
    getAllAvailableSkills: function(params, callback) {
        subjectNSkillModel.find({ level: 2, is_approved: true }, { name: 1, _id: 0 }).sort({ name: 1 }).exec(function(err, res) {
            err ? callback(err) : callback({ status: "success", statusCode: 200, message: "Skills fetched successfully", data: res })
        })
    },
    getAllSubjects: function(params, callback) {
        subjectNSkillModel.find({ level: 1, is_approved: true }, { name: 1 }).sort({ name: 1 }).exec(function(err, res) {
            err ? callback(err) : callback({ status: "success", statusCode: 200, message: "Subjects fetched successfully", data: res })
        })
    },

    getCategoriesGuruTeaches: function(params, userDetails, callback) {
        Utils.async.auto({
            getSkillsOfUser: [function(cb) {

                if (!params.guruId || params.guruId == "") {

                    userDetails.skillsGuruTeaches.length == 0 ? cb({ statusCode: 401, status: "warning", message: "You cannot book the lesson until you add some skills that you can teach in your profile." }) : cb(null, null)

                } else {

                    userModel.findOne({ _id: params.guruId }, function(err, res) {
                        if (err) cb(err)
                        else {
                            res.skillsGuruTeaches.length == 0 ? cb({ statusCode: 401, status: "warning", message: "You cannot book the lesson with the guru because he doesn't teach any available skill." }) : cb(null, null)
                        }
                    })
                }
            }],
            getCategories: ["getSkillsOfUser", function(data, cb) {

                var criteria = {
                    _id: params.guruId && params.guruId != "" ? params.guruId : userDetails._id
                }

                userModel.findOne(criteria, { skillsGuruTeaches: 1 }).lean().populate({ path: 'skillsGuruTeaches', populate: { path: 'skillId', populate: { path: 'parent', populate: { path: 'parent' } } } }).exec(function(err, res) {
                    if (err) cb(err)
                    else {

                        if (res.skillsGuruTeaches && res.skillsGuruTeaches.length > 0) {
                            var a = []
                            res.skillsGuruTeaches.forEach(function(guruSkills) {

                                a.push({
                                    name: guruSkills.skillId.parent.parent.name,
                                    _id: guruSkills.skillId.parent.parent._id
                                })

                            })
                        }


                        var arr = []

                        var group = Utils._.groupBy(a, function(item) {
                            return item.name
                        });

                        var map = Utils._.map(group, function(num) { return num });


                        var arr = []
                        for (var i = 0; i < map.length; i++) {
                            arr.push({
                                name: map[i][0].name,
                                _id: map[i][0]._id
                            })
                        }

                        callback(null, { statusCode: 200, status: "success", message: "Fetched successfully", data: arr })
                    }
                });

            }]
        }, function(err, result) {
            callback(err ? err : null, result);
        });
    },

    getSubjectsGuruTeaches: function(params, userDetails, callback) {
        var allSubjects = []
        Utils.async.auto({
            getSkillsOfUser: [function(cb) {

                if (!params.guruId || params.guruId == "") {

                    userDetails.skillsGuruTeaches.length == 0 ? cb({ statusCode: 401, status: "warning", message: "You cannot book the lesson until you add some skills that you can teach in your profile." }) : cb(null, null)

                } else {

                    userModel.findOne({ _id: params.guruId }, function(err, res) {
                        if (err) cb(err)
                        else {
                            res.skillsGuruTeaches.length == 0 ? cb({ statusCode: 401, status: "warning", message: "You cannot book the lesson with the guru because he doesn't teach any available skill." }) : cb(null, null)
                        }
                    })
                }
            }],
            getAllSubjectsOfCategory: ["getSkillsOfUser", function(data, cb) {

                subjectNSkillModel.find({ parent: params.categoryId, is_approved: true }, function(err, res) { // console.log(res)
                    for (var i = 0; i < res.length; i++) {
                        allSubjects.push({ _id: res[i]._id.toString(), name: res[i].name })
                    }
                    cb(err ? err : null, res)
                })

            }],
            getCategories: ["getSkillsOfUser", function(data, cb) {

                var criteria = {
                    _id: params.guruId && params.guruId != "" ? params.guruId : userDetails._id
                }

                userModel.findOne(criteria, { skillsGuruTeaches: 1 }).lean().populate({ path: 'skillsGuruTeaches', populate: { path: 'skillId', populate: { path: 'parent' } } }).exec(function(err, res) {
                    if (err) cb(err)
                    else {

                        if (res.skillsGuruTeaches && res.skillsGuruTeaches.length > 0) {
                            var a = []
                            res.skillsGuruTeaches.forEach(function(guruSkills) {

                                a.push({
                                    name: guruSkills.skillId.parent.name,
                                    _id: guruSkills.skillId.parent._id
                                })

                            })
                        }


                        var arr = []

                        var group = Utils._.groupBy(a, function(item) {
                            return item.name
                        });

                        var map = Utils._.map(group, function(num) { return num });

                        var arr = []
                        for (var i = 0; i < map.length; i++) {
                            arr.push({
                                name: map[i][0].name,
                                _id: map[i][0]._id.toString()
                            })
                        }



                        var final = []

                        for (var i = 0; i < allSubjects.length; i++) {
                            for (var j = 0; j < arr.length; j++) {
                                if (allSubjects[i]._id == arr[j]._id) {
                                    final.push(arr[j])
                                    break;
                                }
                            }
                        }



                        callback(null, { statusCode: 200, status: "success", message: "Fetched successfully", data: final })
                    }
                });

            }]
        }, function(err, result) {
            callback(err ? err : null, result);
        });
    },

    getSkillsGuruTeaches: function(params, userDetails, callback) {
        var allSubjects = []
        Utils.async.auto({
            getSkillsOfUser: [function(cb) {

                if (!params.guruId || params.guruId == "") {

                    userDetails.skillsGuruTeaches.length == 0 ? cb({ statusCode: 401, status: "warning", message: "You cannot book the lesson until you add some skills that you can teach in your profile." }) : cb(null, null)

                } else {

                    userModel.findOne({ _id: params.guruId }, function(err, res) {
                        if (err) cb(err)
                        else {
                            res.skillsGuruTeaches.length == 0 ? cb({ statusCode: 401, status: "warning", message: "You cannot book the lesson with the guru because he doesn't teach any available skill." }) : cb(null, null)
                        }
                    })
                }
            }],
            getAllSubjectsOfCategory: ["getSkillsOfUser", function(data, cb) {

                subjectNSkillModel.find({ level: 2, parent: params.subjectId, is_approved: true }, function(err, res) { // console.log(res)
                    for (var i = 0; i < res.length; i++) {
                        allSubjects.push({ _id: res[i]._id.toString(), name: res[i].name })
                    }
                    cb(err ? err : null, res)
                })

            }],
            getCategories: ["getSkillsOfUser", function(data, cb) {

                var criteria = {
                    _id: params.guruId && params.guruId != "" ? params.guruId : userDetails._id
                }

                userModel.findOne(criteria, { skillsGuruTeaches: 1 }).lean().populate({ path: 'skillsGuruTeaches', populate: { path: 'skillId' } }).exec(function(err, res) {
                    if (err) cb(err)
                    else {

                        if (res.skillsGuruTeaches && res.skillsGuruTeaches.length > 0) {
                            var a = []
                            res.skillsGuruTeaches.forEach(function(guruSkills) {

                                a.push({
                                    name: guruSkills.skillId.name,
                                    _id: guruSkills.skillId._id
                                })

                            })
                        }

                        var final = []

                        for (var i = 0; i < allSubjects.length; i++) {
                            for (var j = 0; j < a.length; j++) {
                                if (allSubjects[i]._id == a[j]._id) {
                                    final.push(a[j])
                                    break;
                                }
                            }
                        }



                        callback(null, { statusCode: 200, status: "success", message: "Fetched successfully", data: final })
                    }
                });

            }]
        }, function(err, result) {
            callback(err ? err : null, result);
        });
    },


    getSubjectsForFilters: function(params, userDetails, callback) {
        Utils.async.auto({
            getSkillsOfUser: [function(cb) {
                var criteria = {}

                userDetails.userType == "1" ? criteria.requestedTo = userDetails._id : criteria.$or = [{ requestedBy: userDetails._id }, { joinees: { $in: [userDetails._id] } }]

                sessionsModel.find(criteria, { skillId: 1 })
                    .populate({ path: "skillId", populate: { path: "parent", select: "name" } })
                    .exec(function(err, res) {

                        var group = Utils._.groupBy(res, function(item) {
                            return item.skillId[0].parent.name
                        });

                        var map = Utils._.map(group, function(num) { return num });

                        var arr = []

                        for (var i = 0; i < map.length; i++) {
                            arr.push(map[i][0].skillId[0].parent)
                        }

                        callback(null, { statusCode: 200, status: "success", message: "Fetched successfully", data: arr })
                    })
            }],
        }, function(err, result) {
            callback(err ? err : null, result);
        });
    },
    searchSkill: function(params, callback) {
        var found = false
        subjectNSkillModel.find({ name: new RegExp(params.search, 'i'), is_approved: true }, function(err, res) {
            if (err) callback(err)
            else {
                res.length == 0 ? found = false : found = true;
                callback({ statusCode: 200, status: "success", message: "successfully", data: found })
            }
        })



    }
};