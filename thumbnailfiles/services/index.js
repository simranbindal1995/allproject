/*
 * @description: This file defines all the file upload services
 * @date: 13-July-2017
 * @author: Nitin Padgotra
 * */


'use strict';

// include Utils module

var Utils = require('../../../utils/index');
var env = require('../../../env');
var configs = require('../../../configs');
var filepreview = require('filepreview');
// include all the internal modules

var filesModel = require('../models/index');
var im = require('imagemagick');
var fs = require('fs');

var thumb = require('node-thumbnail').thumb;



module.exports = {

    fileUpload: function(request, cb) {
        var userData = request.pre.userDetails;
        var path = Utils.path.join(__dirname, "../../../assets/cdn/" + userData[0]._id);
        var mode = "0777";
        var extension = request.payload.file.hapi.filename.split('.').pop();

        Utils.universalFunctions.logger("Step 1 of uploading files the process started and user details collected");

        Utils.async.waterfall([
            function(callback) {

                Utils.fs.mkdir(path, mode, function(err, res) {
                    if (err) {
                        if (err.code == 'EEXIST') {
                            Utils.universalFunctions.logger("Step 2 of uploading files directory already exists for user");
                            callback(null, path)
                        } else {
                            callback(err)
                        }
                    } else {
                        Utils.universalFunctions.logger("Step 2 of uploading files new directory successfully created");
                        callback(null, path)
                    }
                })

            },
            function(dir, callback) {

                Utils.universalFunctions.logger("Step 3 of uploading files saving file meta data to the database");

                var fileObject = {
                    user_id: userData[0]._id,
                    file_original_name: request.payload.file.hapi.filename,
                    file_type: request.payload.file.hapi.headers["content-type"],
                    file_size: 0,
                    file_extension: extension
                };

                filesModel.Files(fileObject).save(function(err, res) {
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

                var writePath = path + '/' + file._id + '.' + extension;
                var fileStream = Utils.fs.createWriteStream(writePath);

                fileStream.on('finish', function() {
                    Utils.universalFunctions.logger("Step 4 of uploading files finished writing stream");
                    callback(null, file)
                });

                request.payload.file.pipe(fileStream);
            }
        ], function(err, res) {
            if (err) {
                Utils.universalFunctions.logger(err);
                cb(true)
            } else {
                cb(null, { status: "success", message: "File uploaded successfully", data: [{ fileId: res._id }] })
            }
        })
    },
    fileUploadTmp: function(request, cb) {
        var is_video = (/true/i).test(request.payload.is_video)
        var chat_media = (/true/i).test(request.payload.chat_media)
        var userData = request.pre.userDetails;
        var path = '/tmp/skint-';
        var tmpPath;
        var mode = "0777";
        var extension = request.payload.file.hapi.filename.split('.').pop();
        Utils.universalFunctions.logger("Step 1 of uploading files the process started and user details collected");

        Utils.async.waterfall([
            function(callback) {

                Utils.fs.mkdtemp(path, function(err, res) {
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
                tmpPath = dir;
                Utils.universalFunctions.logger("Step 3 of uploading files saving file meta data to the database");

                var fileObject = {
                    user_id: userData[0]._id,
                    tmp_location: tmpPath,
                    file_original_name: request.payload.file.hapi.filename,
                    file_type: request.payload.file.hapi.headers["content-type"],
                    file_size: 0,
                    file_extension: extension,
                    is_video: is_video
                };

                filesModel.Files(fileObject).save(function(err, res) {
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
            },
            function(file, callback) {
                if (chat_media == true) {
                    var options = {
                        width: 120,
                        height: 120,
                        quality: 30
                    };
                    thumb({
                        source: tmpPath + '/' + file._id + '.' + extension,
                        destination: tmpPath + '/',
                        concurrency: 4,
                        width: 400,
                    }, function(files, err, stdout, stderr) {
                        if (err || stderr) {
                            callback(err)
                        } else {
                            var response = { fileId: file._id };
                            callback(null, response)
                        }
                    });
                } else {
                    var response = { fileId: file._id };
                    callback(null, response)
                }
            },
            function(file, callback) {
                if (is_video == true) {
                    var options = {
                        width: 400,
                        height: 300,
                        quality: 90
                    };

                    var path1 = Utils.filepreview.generateSync(tmpPath + '/' + file.fileId + '.' + extension, tmpPath + '/' + file._id + '.' + 'png', options)
                    console.log(tmpPath, "11path+++", file.fileId, "++++++++==", path1, "====", extension, "======", tmpPath, "========", options)
                    Utils.universalFunctions.logger("Step 5 of creating thumbnail for video");
                    if (!Utils.filepreview.generateSync(tmpPath + '/' + file.fileId + '.' + extension, tmpPath + '/' + file._id + '.' + 'png', options)) {
                        callback('Error generating the thumbnail for the video');
                    } else {

                        var thumb = tmpPath + '/' + file._id + '.' + 'png';

                        var data = Utils.fs.readFileSync(thumb);

                        var query = { _id: file.fileId },
                            updateData = { thumbnail: data.toString('base64') },
                            options = { new: true, upsert: false };

                        filesModel.Files.findOneAndUpdate(query, updateData, options).exec(function(err, res) {
                            if (err) {
                                callback(err)
                            } else {


                                var response = { fileId: file.fileId, thumb: data.toString('base64') };

                                callback(null, response)
                            }
                        });
                    }
                } else {
                    callback(null, file)
                }
            }
        ], function(err, res) {
            if (err) {
                Utils.universalFunctions.logger(err);
                cb(true)
            } else {
                cb(null, { status: "success", message: "File uploaded successfully", data: res })
            }
        })
    },
    findFile: function(request, cb) {
        filesModel.Files.find({ _id: request.params.name }, function(err, res) {



            if (err) {
                Utils.universalFunctions.logger(err);
                cb(err)
            } else {
                if (res.length == 1) {
                    cb(null, { status: "success", messsage: "Image successfully fetched", data: res })
                } else {
                    cb(null, { status: "warning", message: "Sorry! file not found." })
                }
            }
        })
    }
};