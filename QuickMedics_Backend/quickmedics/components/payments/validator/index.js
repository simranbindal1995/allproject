'use strict'
const Joi = require('joi')

module.exports = {
    addCard: {
        payload: {
            cardToken: Joi.string().required()
        }
    },
    addBankAccount: {
        payload: {
            firstName: Joi.string().trim().required().label("First name"),
            lastName: Joi.string().trim().required().label("Last name"),
            dob: Joi.string().trim().required().label("Date of Birth"),
            sort: Joi.string().trim().required().label('BSB'),
            accountNumber: Joi.string().trim().required().label("Account number"),
            address: Joi.string().trim().required().label("Address"),
            state: Joi.string().trim().optional().label("State"),
            city: Joi.string().trim().required().label("City"),
            postalCode: Joi.string().trim().required().label("Postal Code"),
            verificationDoc: Joi.string().required().label("Verification Doc File")
        }
    },
    header: Joi.object({
        'x-logintoken': Joi.string().required().trim().description('Provide token to access api')
    }).unknown()
}