// File for sending emails in offline mode
'use strict'
var queueConfig = require('config').get('queueServer')
var appRoot = require('app-root-path')
var _ = require('underscore')
var async = require('async')
var fs = require('fs')
var paramCase = require('param-case')
let redisSMQ = require('rsmq')
var RSMQWorker = require('rsmq-worker')

let options = {}
const setOptions = (config) => {
    options.disabled = config.disabled

    options.processors = {}
    if (config.processors) {
        if (config.processors.dir) {
            options.processors.dir = config.processors.dir
        }
        options.processors.default = {}
        if (config.processors.default) {
            if (config.processors.default.dir) {
                options.processors.default.dir = config.processors.default.dir
            }

            if (config.processors.default.file) {
                options.processors.default.file = config.processors.default.file
            }
        }
    }
}

setOptions(queueConfig)

const handleDefaultProcessors = (files, data, context, onDone) => {

    if (_.isEmpty(files)) {
        return onDone(null)
    }
    async.eachSeries(files, (file, cb) => {
        let handler = require(file)
        if (!handler.process) {
            return cb(null)
        }
        logger.debug('processing', {
            handler: file
        })
        handler.process(data, context, err => {
            if (err) {
                logger.error(err)
            }
            cb(err)
        })
    }, onDone)
}

const handleMessage = function(data, context, callback) {

    const root = `${appRoot}/${options.processors.dir}/${paramCase(context.entity)}/${paramCase(context.action)}`

    if (!fs.existsSync(root)) {
        return callback()
    }
    let handlerFiles = []
    let file = `${root}/${options.processors.default.file}`

    if (fs.existsSync(file)) {
        handlerFiles.push(file)
    }

    let dir = `${root}/${options.processors.default.dir}`

    if (fs.existsSync(dir)) {
        _.each(fs.readdirSync(dir), function(file) {
            if (file.search('.js') < 0) {
                logger.error(`${file} is not .js`)
                return
            }
            handlerFiles.push(`${dir}/${file}`)
        })
    }
    handleDefaultProcessors(handlerFiles, data, context, callback)
}

const queue = (entity, action, data, context) => {
    context.entity = entity
    context.action = action

    if (options.disabled || global.processSync || context.processSync) {
        logger.debug('immediately processing', {
            entity: entity,
            action: action
        })

        return new Promise((resolve, reject) => {
            handleMessage(data, context, (err) => {
                if (err) {
                    reject(err)
                } else {
                    resolve()
                }
            })
        })
    }

}


exports.queue = queue