/*
 * @file:users.js
 * @description: This file defines the user schema for mongodb
 * @date: 16th June,2017
 * @author: Prabhjot
 * */


var Mongoose = require('mongoose'),
    Schema = Mongoose.Schema;

const env = require('../../../env');

if (env.instance == "local") {
    // Mongoose.set('debug', true)
}

var FileSchema = new Schema({
    user_id: { type: String },
    tmp_file: { type: Boolean, default: true },
    tmp_location: { type: String },
    file_original_name: { type: String },
    file_type: { type: String },
    file_size: { type: Number, default: 0 },
    file_extension: { type: String },
    thumbnail: { type: String },
    image_thumbnail: { type: String },
    is_video: { type: Boolean, default: false },
    uploaded_at: { type: Date, default: Date.now },
    is_deleted: { type: Boolean, default: false }
});

var file = Mongoose.model('files', FileSchema);
module.exports = {
    Files: file
};