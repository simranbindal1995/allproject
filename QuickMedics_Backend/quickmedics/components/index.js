'use strict'

const fs = require('fs')

const models = async (logger) => {
    const log = logger.start('components:models')
    const components = fs.readdirSync(__dirname)

    try {
        for (const component of components) {
            if (component !== 'index.js' && fs.existsSync(`${__dirname}/${component}/model/index.js`)) {
                mongoose.model(component, require(`./${component}/model`))
            }
            if (component !== 'index.js' && fs.existsSync(`${__dirname}/${component}/model/diagnosis.js`)) {
                mongoose.model("diagnosis", require(`./${component}/model/diagnosis`))
            }
            if (component !== 'index.js' && fs.existsSync(`${__dirname}/${component}/model/allergies.js`)) {
                mongoose.model("allergies", require(`./${component}/model/allergies`))
            }
            if (component !== 'index.js' && fs.existsSync(`${__dirname}/${component}/model/vaccinations.js`)) {
                mongoose.model("vaccinations", require(`./${component}/model/vaccinations`))
            }
            if (component !== 'index.js' && fs.existsSync(`${__dirname}/${component}/model/manufacturers.js`)) {
                mongoose.model("manufacturers", require(`./${component}/model/manufacturers`))
            }
            if (component !== 'index.js' && fs.existsSync(`${__dirname}/${component}/model/medicines.js`)) {
                mongoose.model("medicines", require(`./${component}/model/medicines`))
            }
            if (component !== 'index.js' && fs.existsSync(`${__dirname}/${component}/model/prescriptions.js`)) {
                mongoose.model("prescriptions", require(`./${component}/model/prescriptions`))
            }
            if (component !== 'index.js' && fs.existsSync(`${__dirname}/${component}/model/invoices.js`)) {
                mongoose.model("invoices", require(`./${component}/model/invoices`))
            }
            if (component !== 'index.js' && fs.existsSync(`${__dirname}/${component}/model/chatRooms.js`)) {
                mongoose.model("chatRooms", require(`./${component}/model/chatRooms`))
            }
            if (component !== 'index.js' && fs.existsSync(`${__dirname}/${component}/model/feedbacks.js`)) {
                mongoose.model("feedbacks", require(`./${component}/model/feedbacks`))
            }
        }
        log.end()
    } catch (err) {
        log.error(err)
        log.error('error while configuring models')
        log.end()
    }
}

const routes = async (server, logger) => {
    const log = logger.start('components:routes')
    const components = fs.readdirSync(__dirname)

    try {
        for (const component of components) {
            if (component !== 'index.js' && fs.existsSync(`${__dirname}/${component}/route`)) {
                server.route(require(`./${component}/route`))
            }
        }
        log.end()
    } catch (err) {
        log.error(err)
        log.error('error while configuring routes')
        log.end()
    }
}
exports.models = models
exports.routes = routes