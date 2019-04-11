/*
 * @file: index.js
 * @description: main module to include all the config files
 * @date: 22 March 2018
 * @author: Nidhi
 * */


'use strict';

module.exports = {
    app: require("./appConstants"),
    database: require('./dbConstants'),
    mailer: require("./mailerConstants"),
    config: require("./configConstants"),
    constants: require("./constants")
};
