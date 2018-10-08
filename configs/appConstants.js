/*
 * @file: appconstants.js
 * @description: All major application contacts are defined here
 ** @date: 22 March 2018
 * @author: Nidhi
 * */


module.exports = {

    local: {
        host: "127.0.0.1", //"",
        port: "8021",
        debug: true,
        url: "virtualclassroom.ignivastaging.com"
    },
    dev: {
        host: "192.168.0.235",
        port: "8066",
        debug: false,
        url: "virtualclassroom.ignivastaging.com"
    },
    staging: {
        host: "",
        port: "8066",
        debug: false
    },
    live: {
        host: "",
        port: "8066",
        debug: true
    }

};