/*
 * @description: This file defines all the file upload services
 * @date: 29 march 2015
 * @author: Simran
 * */


'use strict';

// include Utils module

var Utils = require('../../../utils/index');
var env = require('../../../env');
var configs = require('../../../configs');


// include all the internal modules

var filesModel = require('../models/index');
var userModel = require('../../user/models/index');



module.exports = {

    fileUploadTmp: function(request, cb) {

        var userData = request.pre.verify
        var path = '/tmp/virtualClassroom-';
        var tmpPath;
        var mode = "0777";
        var extension = request.payload.file.hapi.filename.split('.').pop();

        Utils.universalFunctions.logger("Step 1 of uploading files the process started and user details collected");

        Utils.async.waterfall([
            function(cb) {
                Utils.universalFunctions.logger("Checking extension for the image");
                var ext = request.payload.file.hapi.filename.substr(request.payload.file.hapi.filename.lastIndexOf('.') + 1);

                if (request.payload.type == 2) {
                    cb(ext != 'jpg' && ext != 'jpeg' && ext != 'png' && ext != 'xls' && ext != 'xlsx' && ext != 'pdf' && ext != 'doc' && ext != 'docx' ? { statusCode: 401, status: "warning", message: "Only documents with format jpg , jpeg , png ,xls, xlsx, pdf , doc , docx allowed" } : null, request)
                } else {
                    cb(ext != 'jpg' && ext != 'jpeg' && ext != 'png' ? { statusCode: 401, status: "warning", message: "Only images with format jpg , jpeg , png allowed" } : null, request)
                }
            },
            function(data, cb) {

                Utils.universalFunctions.logger("Checking size for the image;5mb max allowed");

                cb(request.payload.file['_data'].length > 1048576 * 5 ? { statusCode: 401, status: "warning", message: "Maximum file size allowed 5 MB" } : null, request)

            },
            function(data, callback) {

                Utils.fs.mkdir(path, mode, function(err, res) {
                    if (err) {
                        if (err.code == 'EEXIST') {
                            Utils.universalFunctions.logger("Step 2 of uploading files directory already exists for user");
                            callback(null, res)
                        } else {
                            callback(err)
                        }
                    } else {
                        Utils.universalFunctions.logger("Step 2 of uploading files new directory successfully created");
                        callback(null, res)
                    }
                })

            },
            function(dir, callback) {

                tmpPath = path;
                Utils.universalFunctions.logger("Step 3 of uploading files saving file meta data to the database");

                var fileObject = {
                    user_id: userData._id,
                    tmp_location: tmpPath,
                    file_original_name: request.payload.file.hapi.filename,
                    file_type: request.payload.file.hapi.headers["content-type"],
                    file_extension: extension,
                    type: request.payload.type,
                    uploaded_at : request.payload.currentTime
                    // title: request.payload.title || "",
                    // description: request.payload.description || ""
                };

                filesModel(fileObject).save(function(err, res) {
                    if (err) {
                        Utils.universalFunctions.logger("Step 3 of uploading files error in saving files to the database");
                        callback(err)
                    } else {
                        callback(null, res)
                    }
                })

            },
            function(file, callback) {

                Utils.universalFunctions.logger("Step 4 of uploading files writing the file stream to the directory");

                var writePath = tmpPath + '/' + file._id + '.' + extension;
                var fileStream = Utils.fs.createWriteStream(writePath);

                fileStream.on('finish', function() {
                    Utils.universalFunctions.logger("Step 4 of uploading files finished writing stream");
                    callback(null, file)
                });

                request.payload.file.pipe(fileStream);
            }
        ], function(err, res) {
            if (err) {
                cb(err)
            } else {
                cb(null, { statusCode: 200, status: "success", message: "File uploaded successfully", data: res })
            }
        })
    },
    findFile: function(request, cb) {
        filesModel.find({ _id: request.params.name }, function(err, res) {
            //console.log(err, res)
            if (err) {
                Utils.universalFunctions.logger(err);
                cb(err)
            } else {
                if (res.length == 1) {
                    cb(null, {statusCode:200,status: "success", messsage: "Image successfully fetched", data: res })
                } else {
                    cb({statusCode:401,status: "warning", message: "Sorry! file not found." })
                }
            }
        })
    },
    deleteFile: function(params, cb) { 
        Utils.async.auto({
            markBooleanInFile: [function(cb) {

                filesModel.findOneAndUpdate({ _id: params.fileId }, { is_deleted: true }, { new: true }, function(err, res) {
                    cb(err ? err : null, res)
                })
            }],
            deleteFromUserTable: [function(cb) {

                userModel.findOneAndUpdate({ _id: params.userId }, { $pull: { documents: params.fileId } }, function(err, res) {
                    cb(err? err : null, res)
                })
            }]
        }, function(err, result) {
            cb(err ? err : null, { statusCode: 200, status: "success", message: "Deleted successfully" });
        });
    }

};