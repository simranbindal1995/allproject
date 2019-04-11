/* ----------------------------------------------------------------------
   * @ description : Here config all hapi plugIns and custom plugIns.
----------------------------------------------------------------------- */

const Inert = require('inert');
const Vision = require('vision');
const Good = require('good');
const Pack = require('../package.json');
const Swagger = require('hapi-swagger');
const requestLogger = require('../utils/requestLogger');

/**
 * exports array of plugins with configuration.
 * @type {Array}
 */
module.exports = [
    /* -----------------------
          Register inert
        ------------------------ */
    {
        plugin: Inert,
        options: {}
    },

    /* -----------------------
          Register vision
        ------------------------ */
    {
        plugin: Vision,
        options: {}
    },

    /* -----------------------
          Register Swagger
        ------------------------ */


    {
        plugin: Swagger,
        'options': {
            info: {
                'title': 'Virtual Classroom',
                'version': '1.1.0' //pack.version
            },
            pathPrefixSize: 2,
            basePath: '/v1',
            tags: [{
                    name: 'User',
                    description: "All API's about User Operations"
                } // here we can add more objects to devide and describe the categery wise end points.
            ]
        }
    },
    /* ------------------
          Register good
        ------------------ */

    {
        plugin: Good,
        options: {
            ops: {
                interval: 1000
            },
            reporters: {
                myConsoleReporter: [{
                        module: 'good-squeeze',
                        name: 'Squeeze',
                        args: [{ log: '*', response: '*' }]
                    },
                    {
                        module: 'good-console'
                    },
                    'stdout'
                ]
            }
        }
    },

    /* ------------------
          Register logger 
         ------------------ */
    // {
    //     plugin: requestLogger,
    //     options: {}
    // }

];