/*
 * @description: This file defines all the user services
 * @date: 28 March 2018
 * @author: Simran
 * */


'use strict';

// include Utils module

var Utils = require('../../../utils/index');

var skillGuruTeachesModel = require('../models/index');
var subjectSkillModel = require('../../subjectNSkill/models/index');
var userModel = require('../../user/models/index');


module.exports = {

    addSkilsInProfile: function(params, callback) {
        var final = [],allChild=[]
        Utils.async.auto({
                getSubject: [function(cb) {

                    subjectSkillModel.findOne({ _id: params.skillId[0] }, function(err, res) {
                        cb(null,res)
                    })
                }],
                getChildOfSubject: ['getSubject',function(data,cb) {
                    subjectSkillModel.find({ parent: data.getSubject.parent }, function(err, res) {
                        for (var i = 0; i < res.length; i++) {
                            allChild.push(res[i]._id)
                        }
                        cb(null, null)
                    })
                }],
                getSkills: ["getChildOfSubject", function(data, cb) {

                    skillGuruTeachesModel.find({isDeleted:false, skillId: { $in: allChild }, type: 1, userId: params.userId }, function(err, res) {
                        if(res.length >0){
                            params.startAge = res[0].startAge
                            params.endAge = res[0].endAge
                        }
                        cb(null, null)
                    })

                }],
                storingSkills: ["getSkills",function(data,cb) {

                    Utils.universalFunctions.logger('Check the skill id , see if user has already added that skill , storing the skills in the DB')

                    Utils.async.eachSeries(params.skillId, function(item, Incb) {

                            Utils.async.auto({
                                checkSkillId: [function(cb) {
                                    Utils.universalFunctions.logger("checking the skill id")

                                    subjectSkillModel.find({ _id: item }, function(err, res) {
                                        cb(err ? err : res.length == 0 || !res ? { statusCode: 401, status: "warning", message: "Invalid Skill Id" } : null, res)
                                    })
                                }],
                                checkIfSkillAlreadyAddedByUser: ["checkSkillId", function(data, cb) {
                                    Utils.universalFunctions.logger("If skill already added by the user don't add it again")

                                    skillGuruTeachesModel.find({ userId: params.userId, skillId: item, type: 1, isDeleted: false }, function(err, res) {

                                        (err ? cb(err) : res.length > 0 ? Incb() : cb(null, res))
                                    })
                                }],
                                addSkillThatGuruTeaches: ["checkIfSkillAlreadyAddedByUser", function(data, cb) {

                                    var obj = {
                                        userId: params.userId,
                                        skillId: item,
                                        type: 1,
                                        startAge : params.startAge || 18,
                                        endAge : params.endAge || 99
                                    }

                                    skillGuruTeachesModel(obj).save(function(err, res) {
                                        cb(err ? err : null, res)
                                    })

                                }],
                                updateSkillInUser: ["addSkillThatGuruTeaches", function(data, cb) {

                                    Utils.universalFunctions.logger("Add this skill in User's Db in skils_guru_teaches key")

                                    userModel.findOneAndUpdate({ _id: params.userId }, { $addToSet: { skillsGuruTeaches: data.addSkillThatGuruTeaches._id } }, { new: true }, function(err, res) {
                                        cb(err ? err : null, res)
                                    })

                                }]
                            }, function(err, result) {
                                Incb(err ? err : null, true)
                            })

                        },
                        function(err, result) {
                            cb(err ? err : result)
                        });
                }],

                gettingAllSkillsOfThisUser: ["storingSkills", function(data, cb) {

                    userModel.findOne({ _id: params.userId }, { skillsGuruTeaches: 1 }).lean().populate({ path: 'skillsGuruTeaches', populate: { path: 'skillId', populate: { path: 'parent', populate: { path: 'parent' } } } }).exec(function(err, res) {
                        if (err) cb(err)
                        else {
                            var a = []

                            if (res.skillsGuruTeaches && res.skillsGuruTeaches.length > 0) {

                                res.skillsGuruTeaches.forEach(function(guruSkills) {

                                    a.push({
                                        category: guruSkills.skillId.parent.parent.name,
                                        subject: {
                                            _id: guruSkills.skillId.parent._id,
                                            name: guruSkills.skillId.parent.name
                                        },
                                        subskill: [{
                                            _id: guruSkills.skillId._id,
                                            name: guruSkills.skillId.name,
                                            startAge: guruSkills.startAge,
                                            endAge: guruSkills.endAge
                                        }]
                                    })

                                })
                            }


                            var arr = []

                            var group = Utils._.groupBy(a, function(item) {
                                return item.category
                            });

                            var map = Utils._.map(group, function(num) { return num });
                            //var final = []
                            for (var i = 0; i < map.length; i++) {
                                var arr = [],
                                    startAge = 0,
                                    endAge = 0
                                var group1 = Utils._.groupBy(map[i], function(item) {
                                    return item.subject._id
                                });

                                var map2 = Utils._.map(group1, function(num) { return num });

                                for (var j = 0; j < map2.length; j++) {
                                    var tmp = []
                                    for (var k = 0; k < map2[j].length; k++) {
                                        startAge = map2[j][k].subskill[0].startAge, endAge = map2[j][k].subskill[0].endAge
                                        tmp.push({ _id: map2[j][k].subskill[0]._id, name: map2[j][k].subskill[0].name })

                                    }
                                    //console.log('===tmp',tmp)
                                    arr.push({ subject: map2[j][0].subject, skills: tmp, startAge: startAge, endAge: endAge })
                                }


                                final.push({ category: map[i][0].category, subjectnskills: arr })
                            }
                            // if (res.skillsGuruTeaches && res.skillsGuruTeaches.length > 0) {

                            //     res.skillsGuruTeaches.forEach(function(guruSkills) { 
                            //         console.log('guruSkills===',guruSkills)

                            //         a.push({
                            //             category: guruSkills.skillId.parent.parent.name,
                            //             subject: {
                            //                 _id: guruSkills.skillId.parent._id,
                            //                 name: guruSkills.skillId.parent.name
                            //             },
                            //             subskill: [{
                            //                 name: guruSkills.skillId.name,
                            //                 startAge: guruSkills.startAge,
                            //                 endAge: guruSkills.endAge
                            //             }]
                            //         })
                            //          console.log('a===',a)

                            //     })
                            // }


                            // var arr = []

                            // var group = Utils._.groupBy(a, function(item) {
                            //     return item.category
                            // });

                            // var map = Utils._.map(group, function(num) { return num });
                            // var final = []
                            // for (var i = 0; i < map.length; i++) {  console.log('map[i====]',map[i])
                            //     var arr = [],
                            //         startAge = 0,
                            //         endAge = 0
                            //     var group1 = Utils._.groupBy(map[i], function(item) {
                            //         return item.subject._id
                            //     });

                            //     var map2 = Utils._.map(group1, function(num) { return num });

                            //     for (var j = 0; j < map2.length; j++) {
                            //         var tmp = []
                            //         for (var k = 0; k < map2[j].length; k++) {
                            //             startAge = map2[j][k].subskill[0].startAge, endAge = map2[j][k].subskill[0].endAge
                            //             tmp.push(map2[j][k].subskill[0].name)

                            //         }

                            //         arr.push({ subject: map2[j][0].subject, skills: tmp, startAge: startAge, endAge: endAge })
                            //     }

                            //     final.push({ category: map[i][0].category, subjectnskills: arr })
                            // }
                            cb(null, null)
                        }

                    }) //userModel
                }]

            },
            function(err, res) {
                if (err) {
                    callback(err)
                } else {
                    callback(null, { statusCode: 200, status: "success", message: "Skills added successfully", data: final })
                }
            });

    },
    // addExampleCourses: function(params, callback) {
    //     Utils.universalFunctions.logger('Check the skill id , add example course of user with duration and description')

    //     Utils.async.auto({

    //             checkSkillId: [function(cb) {
    //                 Utils.universalFunctions.logger("checking the skill id")

    //                 subjectSkillModel.find({ _id: params.skillId }, function(err, res) {
    //                     cb(err ? err : res.length == 0 || !res ? { statusCode: 401, status: "warning", message: "Invalid Skill Id" } : null, res)
    //                 })
    //             }],
    //             addExampleCourse: ["checkSkillId", function(data, cb) {
    //                 Utils.universalFunctions.logger("Save example course")

    //                 var obj = {
    //                     userId: params.userId,
    //                     skillId: params.skillId,
    //                     type: 2, //for example courses
    //                     duration: params.duration,
    //                     description: params.description
    //                 }

    //                 skillGuruTeachesModel(obj).save(function(err, res) {
    //                     cb(err ? err : null, res)
    //                 })

    //             }],
    //             updateCourseInUser: ["addExampleCourse", function(data, cb) {

    //                 Utils.universalFunctions.logger("Add this course in User's Db in his exampleCourses key")

    //                 userModel.findOneAndUpdate({ _id: params.userId }, { $addToSet: { exampleCourses: data.addExampleCourse._id } }, { new: true }, function(err, res) {
    //                     cb(err ? err : { status: "success", statusCode: 200, message: "Course added successfully" })
    //                 })

    //             }]

    //         },
    //         function(err, res) {
    //             if (err) {
    //                 callback(err)
    //             } else {
    //                 callback(null, res)
    //             }
    //         });

    // },

    addExampleCourses: function(params, callback) {
        var final = []
        Utils.async.auto({
                storingSkills: [function(cb) {

                    Utils.universalFunctions.logger('Check the skill id , see if user has already added that skill , storing the skills in the DB')

                    Utils.async.eachSeries(params.skillId, function(item, Incb) {

                            Utils.async.auto({
                                checkSkillId: [function(cb) {
                                    Utils.universalFunctions.logger("checking the skill id")

                                    subjectSkillModel.find({ _id: item }, function(err, res) {
                                        cb(err ? err : res.length == 0 || !res ? { statusCode: 401, status: "warning", message: "Invalid Skill Id" } : null, res)
                                    })
                                }],
                                checkIfSkillAlreadyAddedByUser: ["checkSkillId", function(data, cb) {
                                    Utils.universalFunctions.logger("If skill already added by the user don't add it again")

                                    skillGuruTeachesModel.find({ userId: params.userId, skillId: item, type: 2, isDeleted: false }, function(err, res) {

                                        //  (err ? cb(err) : res.length > 0 ? cb({ statusCode: 400, status: "warning", message: "You have already added a example course for this skill" }) : cb(null, res))

                                        (err ? cb(err) : res.length > 0 ? Incb() : cb(null, res))
                                    })
                                }],
                                addExampleCourse: ["checkIfSkillAlreadyAddedByUser", function(data, cb) {

                                    var obj = {
                                        userId: params.userId,
                                        skillId: item,
                                        type: 2, //for example courses
                                        duration: params.duration,
                                        description: params.description
                                    }

                                    skillGuruTeachesModel(obj).save(function(err, res) {
                                        cb(err ? err : null, res)
                                    })

                                }],
                                updateSkillInUser: ["addExampleCourse", function(data, cb) {

                                    Utils.universalFunctions.logger("Add this skill in User's Db in skils_guru_teaches key")

                                    userModel.findOneAndUpdate({ _id: params.userId }, { $addToSet: { exampleCourses: data.addExampleCourse._id } }, { new: true }, function(err, res) {
                                        cb(err ? err : null, res)
                                    })

                                }]
                            }, function(err, result) {
                                Incb(err ? err : null, true)
                            })

                        },
                        function(err, result) {
                            cb(err ? err : null)
                        });

                }],
                gettingAllSkillsOfThisUser: ["storingSkills", function(data, cb) {

                    userModel.findOne({ _id: params.userId }, { exampleCourses: 1 }).lean().populate({ path: 'exampleCourses', populate: { path: 'skillId', populate: { path: 'parent', populate: { path: 'parent' } } } }).exec(function(err, res) {
                        if (err) cb(err)
                        else {
                            var a = []
                            

                            if (res.exampleCourses && res.exampleCourses.length > 0) {

                                res.exampleCourses.forEach(function(guruSkills) {

                                    // console.log('=======',guruSkills.skillId.parent)

                                    a.push({
                                        category: guruSkills.skillId.parent.parent.name,
                                        subject: {
                                            _id: guruSkills.skillId.parent._id,
                                            name: guruSkills.skillId.parent.name
                                        },
                                        subskill: [{
                                            name: guruSkills.skillId.name,
                                            startAge: guruSkills.startAge,
                                            endAge: guruSkills.endAge
                                        }],
                                        duration: guruSkills.duration,
                                        description: guruSkills.description
                                    })

                                })
                            }


                            var arr = []

                            var group = Utils._.groupBy(a, function(item) {
                                return item.category
                            });

                            var map = Utils._.map(group, function(num) { return num });
                            //var final = []
                            for (var i = 0; i < map.length; i++) {
                                var arr = [],
                                    startAge = 0,
                                    endAge = 0
                                var group1 = Utils._.groupBy(map[i], function(item) {
                                    return item.subject._id
                                });

                                var map2 = Utils._.map(group1, function(num) { return num });

                                for (var j = 0; j < map2.length; j++) {
                                    var tmp = []
                                    for (var k = 0; k < map2[j].length; k++) {
                                        startAge = map2[j][k].subskill[0].startAge, endAge = map2[j][k].subskill[0].endAge
                                        tmp.push(map2[j][k].subskill[0].name)

                                    }

                                    arr.push({ subject: map2[j][0].subject, skills: tmp, startAge: startAge, endAge: endAge, duration: map2[j][0].duration, description: map2[j][0].description })
                                }

                                final.push({ category: map[i][0].category, subjectnskills: arr })
                            }
                            // if (data.getProfileData[0].exampleCourses && data.getProfileData[0].exampleCourses.length > 0) {

                            //     data.getProfileData[0].exampleCourses.forEach(function(guruSkills) {
                            //         a.push({
                            //             category: guruSkills.skillId.parent.parent.name,
                            //             subject: {
                            //                 _id: guruSkills.skillId.parent._id,
                            //                 name: guruSkills.skillId.parent.name
                            //             },
                            //             subskill: [{
                            //                 name: guruSkills.skillId.name,
                            //                 startAge: guruSkills.startAge,
                            //                 endAge: guruSkills.endAge
                            //             }],
                            //             description: guruSkills.description,
                            //             duration: guruSkills.duration,
                            //         })

                            //     })
                            // }

                            // var arr = []

                            // var group = Utils._.groupBy(a, function(item) {
                            //     return item.category
                            // });

                            // var map = Utils._.map(group, function(num) { return num });
                            // var final = []
                            // for (var i = 0; i < map.length; i++) {
                            //     var arr = [],
                            //         startAge = 0,
                            //         endAge = 0
                            //     var group1 = Utils._.groupBy(map[i], function(item) {
                            //         return item.subject._id
                            //     });

                            //     var map2 = Utils._.map(group1, function(num) { return num });

                            //     for (var j = 0; j < map2.length; j++) {
                            //         var tmp = []
                            //         for (var k = 0; k < map2[j].length; k++) {
                            //             startAge = map2[j][k].subskill[0].startAge, endAge = map2[j][k].subskill[0].endAge
                            //             tmp.push(map2[j][k].subskill[0].name)

                            //         }

                            //         arr.push({ subject: map2[j][0].subject, skills: tmp, startAge: startAge, endAge: endAge, description: map2[j][0].description, duration: map2[j][0].duration })
                            //     }

                            //     final.push({ category: map[i][0].category, subjectnskills: arr })
                            // }

                            cb(null, null)
                        }

                    }) //userModel
                }]

            },
            function(err, res) {
                if (err) {
                    callback(err)
                } else {
                    callback(null, { statusCode: 200, status: "success", message: "Courses added successfully", data: final })
                }
            });

    },

    deleteSkillsFromProfile: function(params, callback) {
        console.log("inside delete skill from profile.....")
        var allChild = [],
            skills = [],
            arr = [],
            final = []
        Utils.async.auto({
            getChildOfSubject: [function(cb) {

                subjectSkillModel.find({ parent: params.subjectId }, function(err, res) {
                    for (var i = 0; i < res.length; i++) {
                        allChild.push(res[i]._id)
                    }
                    cb(null, null)
                })
            }],
            getSkills: ["getChildOfSubject", function(data, cb) {

                skillGuruTeachesModel.find({ isDeleted: false, skillId: { $in: allChild }, type: 1, userId: params.userId }, function(err, res) {

                    for (var i = 0; i < res.length; i++) {
                        arr.push(res[i].skillId)
                    }
                    cb(null, null)
                })

            }],
            updateEach: ["getSkills", function(data, cb) {

                Utils.async.eachSeries(arr, function(item, Incb) {

                    skillGuruTeachesModel.findOneAndUpdate({ isDeleted: false, skillId: item, type: 1, userId: params.userId }, { isDeleted: true }, { new: true }, function(err, res) {

                        if (err) Incb(err)
                        if (res) {
                            userModel.findOneAndUpdate({ _id: params.userId }, { $pull: { skillsGuruTeaches: res._id } }, { new: true }, function(err, res) {
                                //console.log("here in update....")
                                Incb()
                            })
                        } else {
                            Incb()
                        }
                    })
                }, function(err, result) {
                    cb(err ? err : null, null)
                })
            }],
            gettingAllSkillsOfThisUser: ["updateEach", function(data, cb) {

                userModel.findOne({ _id: params.userId }, { skillsGuruTeaches: 1 }).lean().populate({ path: 'skillsGuruTeaches', populate: { path: 'skillId', populate: { path: 'parent', populate: { path: 'parent' } } } }).exec(function(err, res) {
                    if (err) cb(err)
                    else {
                        var a = []

                        if (res.skillsGuruTeaches && res.skillsGuruTeaches.length > 0) {

                            res.skillsGuruTeaches.forEach(function(guruSkills) {

                                a.push({
                                    category: guruSkills.skillId.parent.parent.name,
                                    subject: {
                                        _id: guruSkills.skillId.parent._id,
                                        name: guruSkills.skillId.parent.name
                                    },
                                    subskill: [{
                                        name: guruSkills.skillId.name,
                                        startAge: guruSkills.startAge,
                                        endAge: guruSkills.endAge,
                                        _id: guruSkills.skillId._id,
                                    }]
                                })

                            })
                        }


                        var arr = []

                        var group = Utils._.groupBy(a, function(item) {
                            return item.category
                        });

                        var map = Utils._.map(group, function(num) { return num });
                        //var final = []
                        for (var i = 0; i < map.length; i++) {
                            var arr = [],
                                startAge = 0,
                                endAge = 0
                            var group1 = Utils._.groupBy(map[i], function(item) {
                                return item.subject._id
                            });

                            var map2 = Utils._.map(group1, function(num) { return num });

                            for (var j = 0; j < map2.length; j++) {
                                var tmp = []
                                for (var k = 0; k < map2[j].length; k++) {
                                    startAge = map2[j][k].subskill[0].startAge, endAge = map2[j][k].subskill[0].endAge
                                    tmp.push({ _id: map2[j][k].subskill[0]._id, name: map2[j][k].subskill[0].name })

                                }

                                arr.push({ subject: map2[j][0].subject, skills: tmp, startAge: startAge, endAge: endAge })
                            }

                            final.push({ category: map[i][0].category, subjectnskills: arr })
                        }
                        cb(null, null)
                    }

                }) //userModel
            }]
        }, function(err, result) {
            err ? callback(err) : callback(null, { status: "success", statusCode: 200, message: "Skill updated successfully", data: final })
            //callback(err ? err : null, result);
        });
    },

    updateSkillAgeRange: function(params, callback) {

        var allChild = [],
            arr = [],
            final = []
        Utils.async.auto({
            getChildOfSubject: [function(cb) {
                subjectSkillModel.find({ parent: params.subjectId }, function(err, res) {
                    for (var i = 0; i < res.length; i++) {
                        allChild.push(res[i]._id)
                    }
                    cb(null, null)
                })
            }],
            getSkills: ["getChildOfSubject", function(data, cb) {

                skillGuruTeachesModel.find({ skillId: { $in: allChild }, type: 1, userId: params.userId }, function(err, res) {

                    for (var i = 0; i < res.length; i++) {
                        arr.push(res[i].skillId)
                    }
                    cb(null, null)
                })

            }],
            updateEach: ["getSkills", function(data, cb) {
                Utils.async.eachSeries(arr, function(item, Incb) { 

                    skillGuruTeachesModel.findOneAndUpdate({ isDeleted: false, skillId: item, type: 1, userId: params.userId }, { startAge: params.startAge, endAge: params.endAge }, { new: true }, function(err, res) {
                      
                        if (err) {
                            Incb(err)
                        } else {
                            Incb(null, res)
                        }
                    })
                }, function(err, result) {
                    cb(err ? err : null, null)
                })
            }],
            gettingAllSkillsOfThisUser: ["updateEach", function(data, cb) {

                userModel.findOne({ _id: params.userId }, { skillsGuruTeaches: 1 }).lean().populate({ path: 'skillsGuruTeaches', populate: { path: 'skillId', populate: { path: 'parent', populate: { path: 'parent' } } } }).exec(function(err, res) {
                    if (err) cb(err)
                    else {
                        var a = []

                        if (res.skillsGuruTeaches && res.skillsGuruTeaches.length > 0) {

                            res.skillsGuruTeaches.forEach(function(guruSkills) {

                                a.push({
                                    category: guruSkills.skillId.parent.parent.name,
                                    subject: {
                                        _id: guruSkills.skillId.parent._id,
                                        name: guruSkills.skillId.parent.name
                                    },
                                    subskill: [{
                                        name: guruSkills.skillId.name,
                                        startAge: guruSkills.startAge,
                                        endAge: guruSkills.endAge,
                                        _id: guruSkills.skillId._id
                                    }]
                                })

                            })
                        }


                        var arr = []

                        var group = Utils._.groupBy(a, function(item) {
                            return item.category
                        });

                        var map = Utils._.map(group, function(num) { return num });
                        //var final = []
                        for (var i = 0; i < map.length; i++) {
                            var arr = [],
                                startAge = 0,
                                endAge = 0
                            var group1 = Utils._.groupBy(map[i], function(item) {
                                return item.subject._id
                            });

                            var map2 = Utils._.map(group1, function(num) { return num });

                            for (var j = 0; j < map2.length; j++) {
                                var tmp = []
                                for (var k = 0; k < map2[j].length; k++) {
                                    startAge = map2[j][k].subskill[0].startAge, endAge = map2[j][k].subskill[0].endAge
                                    tmp.push({ _id: map2[j][k].subskill[0]._id, name: map2[j][k].subskill[0].name })

                                }

                                arr.push({ subject: map2[j][0].subject, skills: tmp, startAge: startAge, endAge: endAge })
                            }

                            final.push({ category: map[i][0].category, subjectnskills: arr })
                        }
                        cb(null, null)
                    }

                }) //userModel
            }]

        }, function(err, result) {
            err ? callback(err) : callback(null, { status: "success", statusCode: 200, message: "Skill updated successfully", data: final })
            // callback(err ? err : null, result);
        });

    },

    updateExampleCourseAgeRange: function(params, callback) {

        var allChild = [],
            arr = [],
            final = []
        Utils.async.auto({
            getChildOfSubject: [function(cb) {
                subjectSkillModel.find({ parent: params.subjectId }, function(err, res) {
                    for (var i = 0; i < res.length; i++) {
                        allChild.push(res[i]._id)
                    }
                    cb(null, null)
                })
            }],
            getSkills: ["getChildOfSubject", function(data, cb) {

                skillGuruTeachesModel.find({isDeleted : false, skillId: { $in: allChild }, type: 2, userId: params.userId }, function(err, res) {
                    for (var i = 0; i < res.length; i++) {
                        arr.push(res[i].skillId)
                    }
                    cb(null, null)
                })

            }],
            updateEach: ["getSkills", function(data, cb) {
                Utils.async.eachSeries(arr, function(item, Incb) {

                    skillGuruTeachesModel.findOneAndUpdate({isDeleted : false, skillId: item, type: 2, userId: params.userId }, { startAge: params.startAge, endAge: params.endAge }, { new: true }, function(err, res) {
                        if (err) {
                            Incb(err)
                        } else {
                            Incb(null, res)
                        }
                    })
                }, function(err, result) {
                    cb(err ? err : null, null)
                })
            }],
            gettingAllSkillsOfThisUser: ["updateEach", function(data, cb) {

                userModel.findOne({ _id: params.userId }, { exampleCourses: 1 }).lean().populate({ path: 'exampleCourses', populate: { path: 'skillId', populate: { path: 'parent', populate: { path: 'parent' } } } }).exec(function(err, res) {
                    if (err) cb(err)
                    else {
                        var a = []

                        if (res.exampleCourses && res.exampleCourses.length > 0) {

                            res.exampleCourses.forEach(function(guruSkills) {

                                a.push({
                                    category: guruSkills.skillId.parent.parent.name,
                                    subject: {
                                        _id: guruSkills.skillId.parent._id,
                                        name: guruSkills.skillId.parent.name
                                    },
                                    subskill: [{
                                        name: guruSkills.skillId.name,
                                        startAge: guruSkills.startAge,
                                        endAge: guruSkills.endAge
                                    }],
                                    duration: guruSkills.duration,
                                    description: guruSkills.description
                                })

                            })
                        }


                        var arr = []

                        var group = Utils._.groupBy(a, function(item) {
                            return item.category
                        });

                        var map = Utils._.map(group, function(num) { return num });
                        //var final = []
                        for (var i = 0; i < map.length; i++) {
                            var arr = [],
                                startAge = 0,
                                endAge = 0
                            var group1 = Utils._.groupBy(map[i], function(item) {
                                return item.subject._id
                            });

                            var map2 = Utils._.map(group1, function(num) { return num });

                            for (var j = 0; j < map2.length; j++) {
                                var tmp = []
                                for (var k = 0; k < map2[j].length; k++) {
                                    startAge = map2[j][k].subskill[0].startAge, endAge = map2[j][k].subskill[0].endAge
                                    tmp.push(map2[j][k].subskill[0].name)

                                }

                                arr.push({ subject: map2[j][0].subject, skills: tmp, startAge: startAge, endAge: endAge, duration: map2[j][0].duration, description: map2[j][0].description })
                            }

                            final.push({ category: map[i][0].category, subjectnskills: arr })
                        }
                        cb(null, null)
                    }

                }) //userModel
            }]
        }, function(err, result) {
            err ? callback(err) : callback(null, { status: "success", statusCode: 200, message: "Example Course updated successfully", data: final })
        });

    },
    deleteExampleCourse: function(params, callback) {
        var allChild = [],
            skills = [],
            arr = [],
            final = []
        Utils.async.auto({
            getChildOfSubject: [function(cb) {

                subjectSkillModel.find({ parent: params.subjectId }, function(err, res) {
                    for (var i = 0; i < res.length; i++) {
                        allChild.push(res[i]._id)
                    }
                    cb(null, null)
                })
            }],
            getSkills: ["getChildOfSubject", function(data, cb) {

                skillGuruTeachesModel.find({isDeleted : false, skillId: { $in: allChild }, type: 2, userId: params.userId }, function(err, res) {
                    for (var i = 0; i < res.length; i++) {
                        arr.push(res[i].skillId)
                    }
                    cb(null, null)
                })

            }],
            updateEach: ["getSkills", function(data, cb) {
                Utils.async.eachSeries(arr, function(item, Incb) {

                    skillGuruTeachesModel.findOneAndUpdate({isDeleted : false, skillId: item, type: 2, userId: params.userId }, { isDeleted: true }, { new: true }, function(err, res) {
                        if (err) Incb(err)
                        if (res) {
                            userModel.findOneAndUpdate({ _id: params.userId }, { $pull: { exampleCourses: res._id } }, function(err, res) {
                                Incb()
                            })
                        } else {
                            Incb()
                        }
                    })
                }, function(err, result) {
                    cb(err ? err : null, null)
                })
            }],
            gettingAllSkillsOfThisUser: ["updateEach", function(data, cb) {

                userModel.findOne({ _id: params.userId }, { exampleCourses: 1 }).lean().populate({ path: 'exampleCourses', populate: { path: 'skillId', populate: { path: 'parent', populate: { path: 'parent' } } } }).exec(function(err, res) {
                    if (err) cb(err)
                    else {
                        var a = []

                        if (res.exampleCourses && res.exampleCourses.length > 0) {

                            res.exampleCourses.forEach(function(guruSkills) {

                                a.push({
                                    category: guruSkills.skillId.parent.parent.name,
                                    subject: {
                                        _id: guruSkills.skillId.parent._id,
                                        name: guruSkills.skillId.parent.name
                                    },
                                    subskill: [{
                                        name: guruSkills.skillId.name,
                                        startAge: guruSkills.startAge,
                                        endAge: guruSkills.endAge
                                    }],
                                    duration: guruSkills.duration,
                                    description: guruSkills.description
                                })

                            })
                        }


                        var arr = []

                        var group = Utils._.groupBy(a, function(item) {
                            return item.category
                        });

                        var map = Utils._.map(group, function(num) { return num });
                        //var final = []
                        for (var i = 0; i < map.length; i++) {
                            var arr = [],
                                startAge = 0,
                                endAge = 0
                            var group1 = Utils._.groupBy(map[i], function(item) {
                                return item.subject._id
                            });

                            var map2 = Utils._.map(group1, function(num) { return num });

                            for (var j = 0; j < map2.length; j++) {
                                var tmp = []
                                for (var k = 0; k < map2[j].length; k++) {
                                    startAge = map2[j][k].subskill[0].startAge, endAge = map2[j][k].subskill[0].endAge
                                    tmp.push(map2[j][k].subskill[0].name)

                                }

                                arr.push({ subject: map2[j][0].subject, skills: tmp, startAge: startAge, endAge: endAge, duration: map2[j][0].duration, description: map2[j][0].description })
                            }

                            final.push({ category: map[i][0].category, subjectnskills: arr })
                        }
                        cb(null, null)
                    }

                }) //userModel
            }]
        }, function(err, result) {
            err ? callback(err) : callback(null, { status: "success", statusCode: 200, message: "Example course deleted successfully", data: final })
            //callback(err ? err : null, result);
        });
    },
    deleteParticularSkillFromProfile: function(params, callback) {
        var final = []
        Utils.async.auto({
            deleteSkill: [function(cb) {

                skillGuruTeachesModel.findOneAndUpdate({ isDeleted: false, skillId: params.skillId, type: 1, userId: params.userId }, { isDeleted: true }, { new: true }, function(err, res) {

                    if (err) Incb(err)
                    if (res) {
                        userModel.findOneAndUpdate({ _id: params.userId }, { $pull: { skillsGuruTeaches: res._id } }, { new: true }, function(err, res) {
                            cb(null, null)
                        })
                    } else {
                        cb(null, null)
                    }
                })
            }],
            gettingAllSkillsOfThisUser: ["deleteSkill", function(data, cb) {

                userModel.findOne({ _id: params.userId }, { skillsGuruTeaches: 1 }).lean().populate({ path: 'skillsGuruTeaches', populate: { path: 'skillId', populate: { path: 'parent', populate: { path: 'parent' } } } }).exec(function(err, res) {
                    if (err) cb(err)
                    else {
                        var a = []

                        if (res.skillsGuruTeaches && res.skillsGuruTeaches.length > 0) {

                            res.skillsGuruTeaches.forEach(function(guruSkills) {

                                a.push({
                                    category: guruSkills.skillId.parent.parent.name,
                                    subject: {
                                        _id: guruSkills.skillId.parent._id,
                                        name: guruSkills.skillId.parent.name
                                    },
                                    subskill: [{
                                        name: guruSkills.skillId.name,
                                        startAge: guruSkills.startAge,
                                        endAge: guruSkills.endAge,
                                        _id: guruSkills.skillId._id
                                    }]
                                })

                            })
                        }


                        var arr = []

                        var group = Utils._.groupBy(a, function(item) {
                            return item.category
                        });

                        var map = Utils._.map(group, function(num) { return num });
                        //var final = []
                        for (var i = 0; i < map.length; i++) {
                            var arr = [],
                                startAge = 0,
                                endAge = 0
                            var group1 = Utils._.groupBy(map[i], function(item) {
                                return item.subject._id
                            });

                            var map2 = Utils._.map(group1, function(num) { return num });

                            for (var j = 0; j < map2.length; j++) {
                                var tmp = []
                                for (var k = 0; k < map2[j].length; k++) {
                                    startAge = map2[j][k].subskill[0].startAge, endAge = map2[j][k].subskill[0].endAge
                                    tmp.push({ _id: map2[j][k].subskill[0]._id, name: map2[j][k].subskill[0].name })

                                }

                                arr.push({ subject: map2[j][0].subject, skills: tmp, startAge: startAge, endAge: endAge })
                            }

                            final.push({ category: map[i][0].category, subjectnskills: arr })
                        }
                        cb(null, null)
                    }

                }) //userModel
            }]
        }, function(err, result) {
            callback(err ? err : null, { statusCode: 200, status: "success", message: "Deleted successfully", data: final });
        });
    }




}