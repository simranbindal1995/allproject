//Handlebars.compile method will compile the template into a function.
// The generated function takes a context argument, which will be used to render the template.
//File for compiling the template

'use strict'

const handlebars = require('handlebars')
const moment = require('moment')


exports.formatter = (format) => {
    var template = handlebars.compile(format)
    return {
        inject: (data) => {
            return template(data)
        }
    }
}