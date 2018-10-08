/*
 * @file: stripe - index.js
 * @description: Route definition file for payment related operations
 * @date: 4 June,2018
 * @author: Simran
 * */

'use strict';

var Utils = require('../../../utils/index');
var Services = require('../services/index');
var configs = require('../../../configs');

var saveCardOfUser = {
    method: 'PUT',
    path: '/v1/Stripe/saveCardOfUser',
    config: {
        description: 'Create source is used to link cards to users using customer id.',
        tags: ['api', 'Consumer'],
        pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "userDetails" }],
        validate: {
            headers: Utils.Joi.object({ 'x-logintoken': Utils.Joi.string().trim().required() }).options({ allowUnknown: true }),
            payload: {
                cardToken: Utils.Joi.string().required().label('Stripe card token')
            },
            failAction: Utils.universalFunctions.failActionFunction // to format the error messages returned by joi 
        }
    },
    handler: function(request, reply) {
        request.payload.userDetails = request.pre.userDetails;
        Services.saveCardOfUser(request.payload, function(err, data) {
            if (err) {
                reply(err);
            } else {
                reply(data);
            }
        });
    }
}

var ListCards = {
    method: 'GET',
    path: '/v1/Stripe/listCards',
    config: {
        description: 'List all cards associated to user',
        tags: ['api', 'Consumer'],
        pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "userDetails" }],
        validate: {
            headers: Utils.Joi.object({ 'x-logintoken': Utils.Joi.string().trim().required() }).options({ allowUnknown: true }),
            failAction: Utils.universalFunctions.failActionFunction // to format the error messages returned by joi 
        }
    },
    handler: function(request, reply) {
        var userData = request.pre.userDetails;
        Services.listCards(userData, function(err, data) {
            if (err) {
                reply(err);
            } else {
                reply({ statusCode: 200, status: "success", message: "Cards listed successfully.", result: { cards: data } })
            }
        });
    }
}

var SetDefaultCards = {
    method: 'PUT',
    path: '/v1/Stripe/setDefaultCard',
    config: {
        description: 'Set default card amongst multiple cards',
        tags: ['api', 'Consumer'],
        pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "userDetails" }],
        validate: {
            headers: Utils.Joi.object({ 'x-logintoken': Utils.Joi.string().trim().required() }).options({ allowUnknown: true }),
            payload: {
                card_id: Utils.Joi.string().required().label('Card id')
            },
            failAction: Utils.universalFunctions.failActionFunction // to format the error messages returned by joi 
        }
    },
    handler: function(request, reply) {
        request.payload.userData = request.pre.userDetails;
        Services.setDefaultCard(request.payload, function(err, data) {
            if (err) {
                reply(err);
            } else {
                reply({ statusCode: 200, status: "success", message: "Card set as default successfully." })
            }
        });
    },
}

var DeleteCard = {
    method: 'PUT',
    path: '/v1/Stripe/deleteCard',
    config: {
        description: 'Delete card from list',
        tags: ['api', 'Consumer'],
        pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "userDetails" }],
        validate: {
            headers: Utils.Joi.object({ 'x-logintoken': Utils.Joi.string().trim().required() }).options({ allowUnknown: true }),
            payload: {
                cardId: Utils.Joi.string().required().label('Card ID')
            },
            failAction: Utils.universalFunctions.failActionFunction // to format the error messages returned by joi 
        }
    },
    handler: function(request, reply) {
        request.payload.userData = request.pre.userDetails;
        Services.deleteCard(request.payload, function(err, data) {
            if (err) {
                reply(err);
            } else {
                reply(data)
            }
        });
    }
}

var addBankAccount = {
    method: 'PUT',
    path: '/v1/Stripe/addBankAccount',
    config: {
        description: 'Api Route to Create Custom Stripe Connect ',
        notes: 'The request object should contain following fields in its <b>Headers</b> object. Refer the link https://stripe.com/docs/connect/testing (set country Australia) -- for testing purpose.<br/>&bull; <b>x-logintoken</b>: The token assigned to the user after successfull login.<br/><br/><b>Payload/Body</b> object<br/>&bull; <b>firstName</b>: The first name of the account holder.<br/>&bull; <b>lastName</b>: The last name of the account holder.<br/>&bull; <b>dob</b>: The date of birth of the account holder in format DD/MM/YYYY.<br/>&bull; <b>sort</b>: The bank sort code of the account holder.<br/>&bull; <b>accountNumber</b>: The account number for the account holder.<br/>&bull; <b>address</b>: The address of the account holder.<br/>&bull; <b>state</b>: The state of the account holder.<br/>&bull; <b>city</b>: The city of the account holder.<br/>&bull; <b>postal_code</b>: The postal code of the account holder.<br/>&bull; <b>verification_doc</b>: The filename of the verification doc of the account holder.',
        tags: ['api', 'Trainer'],
        pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "userDetails" }], // middleware to verify logintoken before proceeding.
        payload: {
            maxBytes: 3000000000,
            parse: true,
            output: 'stream',
            timeout: false
        },
        validate: {
            headers: Utils.Joi.object({
                'x-logintoken': Utils.Joi.string().required().trim()
            }).options({ allowUnknown: true }),
            payload: {
                firstName: Utils.Joi.string().trim().required().label("First name"),
                lastName: Utils.Joi.string().trim().required().label("Last name"),
                dob: Utils.Joi.string().trim().required().label("Date of Birth"),
                sort: Utils.Joi.string().trim().required().label('BSB'),
                accountNumber: Utils.Joi.string().trim().required().label("Account number"),
                address: Utils.Joi.string().trim().required().label("Address"),
                state: Utils.Joi.string().trim().optional().label("State"),
                city: Utils.Joi.string().trim().required().label("City"),
                postalCode: Utils.Joi.string().trim().required().label("Postal Code"),
                verification_doc: Utils.Joi.any().required().label("Verification Doc File"),
                alreadyAdded : Utils.Joi.boolean().required().default(false)
            },
            failAction: Utils.universalFunctions.failActionFunction // to format the error messages returned by joi 
        }
    },
    handler: function(request, reply) {
        var UserData = request.pre.userDetails;

        Services.addBankAccount(request.payload, UserData, (err, res) => {
            if (err) {
                reply(err);
            } else {
                reply({ statusCode: 200, status: "success", message: "Account set up successfully." });
            }
        })
    }
}

var transferToBankAccount = {
    method: 'POST',
    path: '/v1/Stripe/transferToBankAccount',
    config: {
        description: 'Transfer funds to trainer bank account.',
        tags: ['api', 'Trainer'],
        pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "userDetails" }],
        validate: {
            headers: Utils.Joi.object({ 'x-logintoken': Utils.Joi.string().trim().required() }).options({ allowUnknown: true }),
            payload: {
                trainer_id: Utils.Joi.string().required().label('Trainer ID')
            },
            failAction: Utils.universalFunctions.failActionFunction // to format the error messages returned by joi 
        }
    },
    handler: function(request, reply) {
        request.payload.UserData = request.pre.userDetails[0];
        Services.transferToBankAccount(request.payload, function(err, data) {
            if (err) {
                reply(err);
            } else {
                reply(data);
            }
        });
    }
}

var getBankAccount = {
    method: 'GET',
    path: '/v1/Stripe/getBankAccount',
    config: {
        description: 'Api Route to get Custom Stripe Connect for user.',
        tags: ['api'],
        pre: [{ method: Utils.universalFunctions.verifyLoginToken, assign: "userDetails" }], // middleware to verify logintoken before proceeding.
        validate: {
            headers: Utils.Joi.object({ 'x-logintoken': Utils.Joi.string().trim().required() }).options({ allowUnknown: true }),
            query: {},
            failAction: Utils.universalFunctions.failActionFunction
        }
    },
    handler: function(request, reply) {
        var UserData = request.pre.userDetails;
        if (UserData.customAccountDetails) {
            var trainerCustomAccount = JSON.parse(UserData.customAccountDetails);
            if (parseInt(trainerCustomAccount.legal_entity.dob.month) < 10)
                trainerCustomAccount.legal_entity.dob.month = "0" + trainerCustomAccount.legal_entity.dob.month;
            if (parseInt(trainerCustomAccount.legal_entity.dob.day) < 10)
                trainerCustomAccount.legal_entity.dob.day = "0" + trainerCustomAccount.legal_entity.dob.day;
            var dt = trainerCustomAccount.legal_entity.dob.year + "-" + trainerCustomAccount.legal_entity.dob.month + "-" + trainerCustomAccount.legal_entity.dob.day + "T00:00:00.000Z";
            var dob = Utils.moment(dt).toString();
            var tempObject = {
                accountId: trainerCustomAccount.id,
                first_name: trainerCustomAccount.legal_entity.first_name,
                last_name: trainerCustomAccount.legal_entity.last_name,
                dob: dob,
                address: trainerCustomAccount.legal_entity.address,
                type: trainerCustomAccount.legal_entity.type,
                verification: trainerCustomAccount.legal_entity.verification,
                country: trainerCustomAccount.country,
                last4: trainerCustomAccount.external_accounts.data[0].last4,
                currency: trainerCustomAccount.external_accounts.data[0].currency,
                routing_number: trainerCustomAccount.external_accounts.data[0].routing_number,
                bank_name: trainerCustomAccount.external_accounts.data[0].bank_name,
                metadata: trainerCustomAccount.metadata
            }
            reply({
                statusCode: 200,
                status: 'success',
                message: 'Bank account details fetched successfully.',
                result: tempObject
            })
        } else {
            reply({
                statusCode: 200,
                status: 'success',
                message: 'Bank account details fetched successfully.',
                result: {}
            });
        }
    }
}


module.exports = [
    saveCardOfUser,
    ListCards,
    SetDefaultCards,
    DeleteCard,
    addBankAccount,
    transferToBankAccount,
    getBankAccount
]