// File for calling the email templates and passing data to smtp for sending emails
'use strict'

const fs = require('fs')
const path = require('path')
const appRoot = require('app-root-path')
const templateHelper = require('./template')


const forward = async (to, content, context) => {

    const log = context.logger.start('utils:communication:forward')

    const subject = templateHelper
        .formatter(fs.readFileSync(path.join(appRoot.path, `/templates/${content.template}.subject.html`), 'utf8'))
        .inject(content.data)

    const body = templateHelper
        .formatter(fs.readFileSync(path.join(appRoot.path, `/templates/${content.template}.html`), 'utf8'))
        .inject(content.data)

    //console.log('body=========', body)

    require('../providers/smtp').send(to.email, subject, body, context)

}

exports.forward = forward