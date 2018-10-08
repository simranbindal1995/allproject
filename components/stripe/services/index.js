/*--------------------------------------------
 * Include internal modules.
 ---------------------------------------------*/

const utils = require('../../../utils/index');
const configs = require('../../../configs/index');
var userModel = require('../../user/models/index');
const env = require('../../../env');

var stripe = require("stripe")(configs.config.stripeKeys.secretKey);
//console.log("Stripe Details **** ",configs.constants)

// stripe.accounts.retrieve(
//   "acct_1CnQLmIU1SrA2I8U",
//   function(err, account) {
//    console.log('=======',account)
//   }
// );







var createCustomer = function(params, callback) {

    utils.async.waterfall([
        function(cb) { // create stripe customer
            if (params.stripeCustomerId) { // customer id already exists
                cb({ statusCode: 103, status: "warning", message: "Customer id already exists" })
            } else {
                stripe.customers.create({
                    description: 'Customer for virtual classroom',
                    email: params.email,
                }, function(err, customer) {
                    if (err) {
                        utils.universalFunctions.logger("error while creating customer")
                        console.log(err)
                        cb(err.raw)
                    } else {
                        utils.universalFunctions.logger("inside success when creating customer")
                        cb(null, customer)
                    }
                });
            }
        },
        function(data, cb) { // update the customer id in users
            var setCriteria = {
                _id: params._id
            }
            var setQuery = {
                stripeCustomerId: data.id
            };
            userModel.findOneAndUpdate(setCriteria, setQuery, {}, (err, dbData) => {
                if (err) return cb(err)
                return cb(null, { stripeCustomerId: data.id });
            });
        }
    ], function(err, result) {
        if (err) {
            callback(err)
        } else {
            callback(null, result)
        }
    })
}

var createSource = function(params, callback) {

    if (params.userDetails.stripeCustomerId) {
        stripe.customers.createSource(
            params.userDetails.stripeCustomerId, { source: params.cardToken },
            function(err, card) {
                if (err) {
                    console.log(err);
                    utils.universalFunctions.logger("inside error when creating customer source")
                    if (err.raw)
                        callback({ statusCode: err.raw.statusCode ? err.raw.statusCode : 400, type: err.raw.type, message: err.raw.message })
                    else
                        callback({ statusCode: 400, type: "Error", message: "Card Not Saved." });
                } else {
                    utils.universalFunctions.logger("successfully source created")
                    listCards(params.userDetails, function(err, res) {
                        if (err) callback(err)
                        else {
                            callback(null, res)
                        }
                    })

                }
            }
        );
    } else {
        stripe.customers.create({
            description: 'Customer for vicrtual classroom',
            email: params.userDetails.email,
        }, function(err, customer) {
            if (err) {
                utils.universalFunctions.logger("error while creating customer")
                console.log(err)
                callback({ statusCode: err.raw.statusCode ? err.raw.statusCode : 400, type: err.raw.type, message: err.raw.message })
            } else {
                stripe.customers.createSource(
                    params.userDetails.stripeCustomerId, { source: params.cardToken },
                    function(err, card) {
                        if (err) {
                            console.log(err);
                            utils.universalFunctions.logger("inside error when creating customer source")
                            if (err.raw)
                                callback({ statusCode: err.raw.statusCode ? err.raw.statusCode : 400, type: err.raw.type, message: err.raw.message })
                            else
                                callback({ statusCode: 400, type: "Error", message: "Card Not Saved." });
                        } else {
                            utils.universalFunctions.logger("successfully source created")
                            userModel.findOneAndUpdate({ _id: params.userDetails._id }, { stripeCustomerId: customer.id }, {}, (err, dbData) => {
                                if (err) {
                                    callback(err)
                                } else {

                                    listCards(params.userDetails, function(err, res) {
                                        if (err) callback(err)
                                        else {
                                            callback(null, res)
                                        }
                                    })
                                }
                            });
                        }
                    }
                );
            }
        });
    }
}

var listCards = function(params, callback) {
    // console.log(params.stripe_customer_id);
    if (params.stripeCustomerId) {
        stripe.customers.retrieve(params.stripeCustomerId, function(err, cards) {
            if (err) {
                utils.universalFunctions.logger("erron in fetching cards==", {
                    statusCode: err.raw.statusCode,
                })
                callback(err.raw)
            } else {
                //console.log(err, cards.sources);
                var newData = [];
                if (cards.sources.data.length > 0) {
                    cards.sources.data.forEach(function(obj) {
                        var objToSave = { "id": obj.id, "brand": obj.brand, "object": obj.object, "last4": obj.last4, "fingerprint": obj.fingerprint, "image": "http://127.0.0.1:8021/" + "staticImages/" /*, "funding": obj.funding*/ } //configs.app[env.instance].baseUrl
                        objToSave.image = obj.brand == "Visa" ? objToSave.image + "visa.jpg" : obj.brand == "MasterCard" ? objToSave.image + "mastercard.png" : obj.brand == "American Express" ? objToSave.image + "amex.png" : "";
                        newData.push(objToSave);
                    });
                    var default_card_data = []
                    var default_source = cards.default_source;
                    // console.log("default_source ====", default_source);
                    var fingerprint;

                    var all_cards = newData;
                    all_cards.forEach(function(crd, index) { // first fetch the default card and save in a array and its fingerprint
                        if (crd.id.toString() == default_source.toString()) {
                            default_card_data.push(crd)
                            fingerprint = crd.fingerprint
                        }
                    })

                    for (i = all_cards.length - 1; i >= 0; i -= 1) { // remove all the cards that have fingerprint as same as default card
                        if (all_cards[i].fingerprint == fingerprint) {
                            all_cards.splice(i, 1);
                        }
                    }
                    if (all_cards.length > 0) {
                        var arr = {};
                        for (var i = 0, len = all_cards.length; i < len; i++)
                            arr[all_cards[i]['fingerprint']] = all_cards[i];

                        var newCardsData = []

                        newCardsData.push(default_card_data[0]) // merge the default card data

                        for (var key in arr)
                            newCardsData.push(arr[key]);

                        cards.sources.data = newCardsData;
                        cards.sources.total_count = newCardsData.length;
                        callback(null, cards);
                    } else {
                        cards.sources.data = default_card_data;
                        callback(null, cards);
                    }
                } else
                    callback(null, cards);
            }
        })
    } else {
        return callback(null, []);
    }
}

var setDefaultCard = function(params, callback) {

    stripe.customers.update(
        params.userDetails.stripeCustomerId, { default_source: params.cardId },
        function(err, obj) {
            if (err) {
                utils.universalFunctions.logger("error in updating card details");
                callback({ statusCode: err.raw.statusCode, type: err.raw.type, message: err.raw.message })
            } else {
                utils.universalFunctions.logger("response of updating card");
                callback(null, obj)
            }

        }
    );

}
var createCharge = (Data, callback) => {
    // console.log("inside create charge", Data)
    utils.async.auto({
        stripeCharge: [(cb) => {
            stripe.charges.create({
                amount: Math.round(Data.total * 100),
                currency: configs.constants.stripeCurrency,
                source: Data.cardID,
                customer: Data.stripeCustomerId, // obtained with Stripe.js
                description: "Charge for session " + Data.sessionId
            }, (err, charge) => {
                if (err) {
                    utils.universalFunctions.logger("error while creating charges", err)
                    return cb(err)
                } else {
                    utils.universalFunctions.logger("success in charge create")
                    return cb(null, charge)
                }
            });
        }]
    }, (err, result) => {
        if (err) return callback(err)
        return callback(null, result)
    });
}

var deleteCard = (params, callback) => {
    var arr = [],
        allCards = []
    utils.async.auto({

        getCardInfo: [function(cb) {
            stripe.customers.retrieveCard(
                params.userData.stripeCustomerId,
                params.cardId,
                function(err, card) {
                    if (err) cb(err)
                    else {
                        cb(null, card)
                    }
                }
            );
        }],
        getAllCardOfUser: [function(cb) {

            stripe.customers.retrieve(params.userData.stripeCustomerId, function(err, cards) {
                if (err) {
                    // utils.universalFunctions.logger("erron in fetching cards==", {
                    //     statusCode: err.raw.statusCode,
                    // })
                    callback(err.raw)
                } else {
                    arr = cards.sources.data
                    cb(null, null)
                }
            });
        }],
        matchFingerPrintsAndGetCardId: ["getCardInfo", "getAllCardOfUser", function(data, cb) {
            for (var i = 0; i < arr.length; i++) {
                if (arr[i].fingerprint.toString() == data.getCardInfo.fingerprint.toString()) {
                    allCards.push(arr[i].id)
                }
            }
            cb(null, null)

        }],
        deleteCards: ["matchFingerPrintsAndGetCardId", function(data, cb) {

            utils.async.eachSeries(allCards, function(item, Incb) {

                    stripe.customers.deleteCard(
                        params.userData.stripeCustomerId, //"cus_BDn9tyZ7JHhbMf", //customer_id
                        item, //"card_1ArLZHAUIb3ryDLmN5rWKLSr", //CardId
                        function(err, confirmation) {
                            if (err) {
                                if (err.raw) return callback({
                                    type: err.raw.type,
                                    message: err.raw.message,
                                    statusCode: 400,
                                });
                                Incb();
                            } else Incb();
                        })
                },
                function(err, result) {
                    cb(err ? err : null, result)
                });
        }],
        lisAllCards: ["deleteCards", function(data, cb) {

            stripe.customers.retrieve(params.userData.stripeCustomerId, function(err, cards) {
                if (err) {
                    utils.universalFunctions.logger("erron in fetching cards==", {
                        statusCode: err.raw.statusCode,
                    })
                    callback(err.raw)
                } else {

                    var newData = [];
                    if (cards.sources.data.length > 0) {
                        cards.sources.data.forEach(function(obj) {
                            var objToSave = { "id": obj.id, "brand": obj.brand, "object": obj.object, "last4": obj.last4, "fingerprint": obj.fingerprint, "image": "http://127.0.0.1:8021/" + "staticImages/" /*, "funding": obj.funding*/ } //configs.app[env.instance].baseUrl
                            objToSave.image = obj.brand == "Visa" ? objToSave.image + "visa.jpg" : obj.brand == "MasterCard" ? objToSave.image + "mastercard.png" : obj.brand == "American Express" ? objToSave.image + "amex.png" : "";
                            newData.push(objToSave);
                        });
                        var default_card_data = []
                        var default_source = cards.default_source;
                        // console.log("default_source ====", default_source);
                        var fingerprint;

                        var all_cards = newData;
                        all_cards.forEach(function(crd, index) { // first fetch the default card and save in a array and its fingerprint
                            if (crd.id.toString() == default_source.toString()) {
                                default_card_data.push(crd)
                                fingerprint = crd.fingerprint
                            }
                        })

                        for (i = all_cards.length - 1; i >= 0; i -= 1) { // remove all the cards that have fingerprint as same as default card
                            if (all_cards[i].fingerprint == fingerprint) {
                                all_cards.splice(i, 1);
                            }
                        }
                        if (all_cards.length > 0) {
                            var arr = {};
                            for (var i = 0, len = all_cards.length; i < len; i++)
                                arr[all_cards[i]['fingerprint']] = all_cards[i];

                            var newCardsData = []

                            newCardsData.push(default_card_data[0]) // merge the default card data

                            for (var key in arr)
                                newCardsData.push(arr[key]);

                            cards.sources.data = newCardsData;
                            cards.sources.total_count = newCardsData.length;
                            cb(null, cards);
                        } else {
                            cards.sources.data = default_card_data;
                            cb(null, cards);
                        }
                    } else
                        cb(null, cards);
                }
            })


        }]
    }, (err, result) => {
        if (err) return callback(err)
        return callback(null, { statusCode: 200, status: "success", message: "Deleted successfully", data: result.lisAllCards });
    })

}

var uploadImgeToStripe = (Data, callback) => {
    var stripeFileId;
    var verificationDoc = utils.path.join('./assets/documents/', Data.verification_doc); //if the file is a user profile picture

    if (utils.fs.existsSync(verificationDoc)) {
        //uploading file to stripe server
        var fileStats = utils.fs.statSync(verificationDoc);

        if (fileStats.size < 8000000 && (Data.verification_doc.includes('.jpeg') || Data.verification_doc.includes('.jpg') || Data.verification_doc.includes('.png'))) {

            var fp = utils.fs.readFileSync(verificationDoc),
                myFile = {
                    purpose: 'identity_document',
                    file: {
                        data: fp,
                        name: 'file.jpg',
                        type: 'application/octet-stream'
                    }
                };

            stripe.fileUploads.create(myFile, function(err, fileUpload) {
                console.log('fileuplaod-----', fileUpload)
                if (err) {
                    cb(err)
                } else {
                    imageUpdated = true;
                    Data.dob = Data.dob.split('/'); //splitting DD-MM-YYY to ['DD','MM','YYYY']
                    stripeFileId = fileUpload.id
                    console.log("stripeFileId ===== ", stripeFileId);
                    callback(null, stripeFileId)
                }
            });

        } else {
            // var response = utils.error.customAccountError;
            //response.message = 'The Verification file should be an image of size not more than 8mb and of extension either .png or .jpg';
            callback({ statusCode: 401, status: "error", message: "The Verification file should be an image of size not more than 8mb and of extension either .jpeg or .png or .jpg" });
        }
    } else {
        Data.dob = Data.dob.split('/'); //splitting DD-MM-YYY to ['DD','MM','YYYY']
        callback(null, Data.verification_doc)
    }
}

var createStripeAccount = (Data, payloadData, callback) => {
    //console.log(Data);
    utils.async.auto({
        createCustomAccount: [(cb) => {
            utils.universalFunctions.logger("In createCustomAccount ........... ");
            if (Data.customAccountDetails) {
                var account_details = JSON.parse(Data.customAccountDetails);
                cb(null, account_details)
            } else {
                var stripeObj = {
                    type: 'custom',
                    country: 'GB', // UK
                    default_currency: configs.constants.stripeCurrency,
                    external_account: {
                        object: 'bank_account',
                        account_number: payloadData.accountNumber,
                        country: 'GB', //UK
                        currency: configs.constants.stripeCurrency,
                        routing_number: payloadData.sort,
                    }
                };
                stripe.accounts.create(stripeObj, (err, account) => {
                    if (err) {
                        if (err.raw) {
                            //console.log('=======================', err);
                            if (err.raw.message == "Invalid BSB. The number should be 6 digits in the format xxxxxx.") return cb({ statusCode: 401, status: 'warning', message: "Invalid Sort code" })
                            return cb(err.raw)
                        }
                        return cb(err);
                    }
                    return cb(null, account);
                });
            }
        }],
        updateCustomAccount: ['createCustomAccount', (r1, cb) => {
            utils.universalFunctions.logger("In updateCustomAccount ........... ");
            var dob = payloadData.dob.split('/');
            var updateObj = {
                metadata: {
                    user_ID: Data.userId.toString()
                },
                legal_entity: {
                    address: {
                        city: payloadData.city,
                        //state: params.state,
                        line1: payloadData.address,
                        postal_code: payloadData.postalCode
                    },
                    dob: {
                        day: dob[0],
                        month: dob[1],
                        year: dob[2]
                    },
                    first_name: payloadData.firstName,
                    last_name: payloadData.lastName,
                    type: 'individual'
                },
                tos_acceptance: {
                    date: (() => {
                        return Math.round(Date.now() / 1000)
                    })(),
                    ip: '127.0.0.1'
                }
            };
            if (payloadData.state) {
                updateObj.legal_entity.address.state = payloadData.state
            }
            if (Data.stripeFileId) {
                updateObj.legal_entity.verification = {
                    document: Data.stripeFileId
                };
            }
            // console.log("r1.createCustomAccount.id ====== ", r1.createCustomAccount);
            // console.log("updateObj ==== ", updateObj);
            stripe.accounts.update(r1.createCustomAccount.id, updateObj, (err, res) => {
                if (err) {
                    if (err.raw) return cb(err.raw)
                    return cb(err)
                }
                return cb(null, res)
            })
        }],
        getOlderBankDetails: ["updateCustomAccount", function(data, cb) {
            if (payloadData.alreadyAdded == true) {

                userModel.findOne({ _id: Data.userId }, function(err, res) {
                    if (err) cb(err)
                    else {
                        if (res == null) cb(null, null)
                        else {
                            payloadData.stripeCustomerId = res.stripeCustomerId
                            payloadData.olderDetails = res.customAccount
                            cb(null, null)
                        }
                    }
                })
            } else {
                cb(null, null)
            }
        }],
        deleteAccount: ["getOlderBankDetails", function(data, cb) {

            if (payloadData.alreadyAdded == true) {

                stripe.accounts.del(
                    payloadData.olderDetails,
                    function(err, confirmation) {
                        console.log('delete account from stripe========', err, confirmation)
                        if (err) cb(err)
                        else {
                            cb(null, null)
                        }
                    });

            } else {
                cb(null, data)
            }


        }],
        addStripeDetailsToUserAccount: ['deleteAccount', (r2, cb) => {
            utils.universalFunctions.logger("In addStripeDetailsToUserAccount ........... ");
            var queryObj = {
                    _id: Data.userId
                },
                updateObj = {
                    customAccount: r2.updateCustomAccount.id,
                    customAccountDetails: JSON.stringify(r2.updateCustomAccount),
                    modified_at: (Date.now() / 1000),
                    customAccountStatus: 0,
                    account_setup: true
                },
                options = {
                    new: true
                };
            userModel.findOneAndUpdate(queryObj, updateObj, options, (err, res) => {
                if (err) return cb(err)
                return cb(null, res)
            });
        }],


    }, (err, result) => {
        if (err) return callback(err)
        return callback(null, result);
    })
}

var editStripeAccount = (Data, payloadData, callback) => {
    utils.async.auto({
        updateCustomAccount: [(cb) => {
            var dob = payloadData.dob.split('/');
            var updateObj = {
                metadata: {
                    user_ID: Data.userId.toString()
                },
                legal_entity: {
                    address: {
                        city: payloadData.city,
                        //state: payloadData.state,
                        line1: payloadData.address,
                        postal_code: payloadData.postalCode
                    },
                    dob: {
                        day: dob[0],
                        month: dob[1],
                        year: dob[2]
                    },
                    first_name: payloadData.firstName,
                    last_name: payloadData.lastName,
                    type: 'individual'
                },
                tos_acceptance: {
                    date: (() => {
                        return Math.round(Date.now() / 1000)
                    })(),
                    ip: '127.0.0.1'
                }
            };
            if (payloadData.state) {
                updateObj.legal_entity.address.state = payloadData.state
            }
            if (Data.stripeFileId) {
                updateObj.legal_entity.verification = {
                    document: Data.stripeFileId
                };
            }
            stripe.accounts.update(Data.CustomAccountId, updateObj, (err, res) => {
                if (err) {
                    if (err.raw) return cb(err.raw)
                    return cb(err);
                }
                return cb(null, res)
            })
        }],
        addStripeDetailsToUserAccount: ['updateCustomAccount', (r2, cb) => {
            var queryObj = {
                    _id: Data.userId
                },
                updateObj = {
                    customAccount: r2.updateCustomAccount.id,
                    customAccountDetails: JSON.stringify(r2.updateCustomAccount),
                    customAccountStatus: 0
                },
                options = {
                    new: true
                };
            userModel.findOneAndUpdate(queryObj, updateObj, options, (err, res) => {
                if (err) return cb(err)
                return cb(null, res)
            });
        }]
    }, (err, result) => {
        if (err) return callback(err)
        return callback(null, result);
    })
}

var accountUpdatedWebhook = (params, callback) => {
    utils.async.waterfall([
        (cb) => { //fetch account details and customer ID from the meta data object
            stripe.accounts.retrieve(params.account, (err, account) => {
                if (err) {
                    cb(err)
                } else {
                    cb(null, account)
                }
            });
        },
        (data, cb) => { //updating the user data in Users Database
            var queryObj = {
                    _id: data.metadata.user_ID
                },
                update = {
                    modified_at: (Date.now() / 1000),
                    trainerCustomAccountDetails: JSON.stringify(data),
                    account_setup: true
                };
            if (data.verification.disabled_reason) {
                update.Trainer_Custom_Account_Status = 2
            } else if (data.verification.fields_needed.length > 0 || data.verification.status == "pending") {
                update.Trainer_Custom_Account_Status = 0
            } else if (data.verification.status == "verified") {
                update.Trainer_Custom_Account_Status = 1
            }
            userModel.Users.findOneAndUpdate(queryObj, update).exec((err, res) => {
                if (err) return cb(err)
                return cb(null, res)
            });
        }
    ], (err, res) => {
        if (err) {
            utils.universalFunctions.logger("Error while Updating user data on webhook ", err)
            callback(err)
        } else {
            utils.universalFunctions.logger("Successfully updated user data on webhook ", res)
            callback(null, res)
        }
    });
}
var transferToBankAccount = (Data, callback) => {
    utils.async.auto({
        getBookingData: [(cb) => {
            trainingModel.trainings.findOne({ _id: Data.booking_id, funds_transfered: false, booking_status: 1, disputed: false, is_deleted: false }).populate({ path: 'bus_id', select: 'company', populate: { path: 'company', select: 'Trainer_Custom_Account' } }).exec((err, res) => {
                if (err) return cb(err)
                if (res.payment_status == "failed")
                    return cb({ statusCode: 103, status: "Error", message: "Payment not done." });
                return cb(null, res);
            });
        }],
        addStripeDetailsToUserAccount: ['getBookingData', (r2, cb) => {
            if (r2.getBookingData.bus_id.company.Trainer_Custom_Account) {
                var transferData = {
                    amount: Math.round(r2.getBookingData.trip_cost * 100),
                    currency: configs.Constants.SERVER.STRIPE_CURRENCY || "AUD",
                    destination: r2.getBookingData.bus_id.company.Trainer_Custom_Account,
                    metadata: {
                        bookingID: r2.getBookingData.bookingID
                    }
                }
                stripe.transfers.create(transferData, (err, res) => {
                    var transactionData = {
                        bookingID: r2.getBookingData.bookingID,
                        user_id: r2.getBookingData.user_id,
                        company: r2.getBookingData.bus_id.company._id,
                        bus_id: r2.getBookingData.bus_id._id,
                        amount: transferData.amount,
                        transaction_date: utils.moment().unix()
                    }
                    if (err) {
                        transactionData.transaction_status = "failed";
                        transactionData.metaData = err;
                        if (err.raw) {
                            transactionData.error = { type: err.raw.type, message: err.raw.message };
                        } else
                            transactionData.error = err;
                    } else {
                        transactionData.transaction_status = "success";
                        transactionData.metaData = res;
                    }
                    transferModel.Transfers(transactionData).save((err, res1) => {
                        if (err) {
                            utils.universalFunctions.logger("error in transaction");
                            return cb(err);
                        } else {
                            return cb(null, transactionData);
                        }
                    });
                });
            } else {
                return cb({ statusCode: 103, status: "warning", message: "Company account has not been set up yet." });
            }
        }],
        transferAmount: ['addStripeDetailsToUserAccount', (r3, cb) => {
            trainingModel.trainings.findOneAndUpdate({ _id: Data.booking_id }, { funds_transfered: true, amount_transfered: r3.addStripeDetailsToUserAccount.amount, funds_transfered_date: r3.addStripeDetailsToUserAccount.transaction_date, funds_transfered_status: r3.addStripeDetailsToUserAccount.transaction_status }, { new: true }).exec((err, res) => {
                if (err) {
                    utils.universalFunctions.logger("inside error when fetching orders");
                    return cb(err);
                } else {
                    if (r3.addStripeDetailsToUserAccount.transaction_status == "failed") {
                        return cb({ statusCode: 500, status: "error", message: "Transfer failed.", type: r3.addStripeDetailsToUserAccount.error.type, message: r3.addStripeDetailsToUserAccount.error.message });
                    } else
                        return cb(null, { statusCode: 200, status: "success", message: "Funds transferred successfully." });
                }
            });
        }]
    }, (err, result1) => {
        if (err) return callback(err)
        return callback(null, result1);
    })
}

var addBankAccount = function(payloadData, UserData, CallbackRoute) {
    var imageUrl;
    var verificationDoc, stripeFileId;
    utils.async.auto({
        checkVerification_doc: [function(cb) {
            utils.universalFunctions.logger("In checkVerification_doc ........... ");
            if (payloadData.verification_doc) {
                if (payloadData.verification_doc['_data'].length > configs.constants.IMG_SIZE) {
                    cb({ statusCode: 401, status: "warning", message: "File size exceeds the maximum limit. Please upload the file of size less than 5MB" });
                } else {
                    cb();
                }
            } else {
                cb({ statusCode: 400, status: "warning", message: "Document is required." });
            }
        }],
        uploadVerificationDoc: ['checkVerification_doc', function(r1, Incb) {
            utils.universalFunctions.logger("In uploadVerificationDoc ........... ");
            if (payloadData.verification_doc) {
                var picData = {
                    file: payloadData.verification_doc,
                    userId: UserData._id
                };
                utils.universalFunctions.uploadDocument(picData, function(err, res) {
                    if (err) return Incb(err)
                    imageUrl = res;

                    return Incb(null, imageUrl);
                });
            } else {
                return Incb()
            }
        }],
        checkDocExist: ['uploadVerificationDoc', (r1, cb) => {
            utils.universalFunctions.logger("In checkDocExist ........... ");
            var data = {
                verification_doc: imageUrl,
                dob: payloadData.dob
            }

            uploadImgeToStripe(data, (err, result) => {
                if (err) return cb(err);
                stripeFileId = result;
                return cb(null, result)
            });
        }],
        createAccount: ['checkDocExist', (r1, cb) => {

            var data = {
                userId: UserData._id,
                stripeFileId: stripeFileId,
            }
            if (UserData.trainerCustomAccountDetails) {
                data.trainerCustomAccountDetails = UserData.trainerCustomAccountDetails
            }
            createStripeAccount(data, payloadData, (err, result) => {
                if (err) return cb(err);
                return cb(null, result)
            });
        }],
    }, (err, result) => {
        if (err) return CallbackRoute(err)
        return CallbackRoute();
    })
}

var authBeforeCharge = (Data, callback) => {
    // console.log("inside capture charge", Data)
    utils.async.auto({
        captureCharge: [(cb) => {
            stripe.charges.create({
                amount: Math.round(Data.total * 100),
                currency: configs.Constants.SERVER.STRIPE_CURRENCY,
                source: Data.token,
                capture: false,
                description: "Capture charge for booking " + Data.bookingID
            }, (err, charge) => {
                if (err) {
                    utils.universalFunctions.logger("error while authenticating for charges", err)
                    return cb(err)
                } else {
                    utils.universalFunctions.logger("success in charge authenticate")
                    return cb(null, charge)
                }
            });
        }]
    }, (err, result) => {
        if (err) return callback(err)
        return callback(null, result)
    });
}

var captureCharge = (Data, callback) => {
    utils.async.auto({
        captureCharge: [(cb) => {
            stripe.charges.capture(Data, function(err, charge) {
                if (err) {
                    utils.universalFunctions.logger("error while capturing charges", err)
                    return cb(err)
                } else {
                    utils.universalFunctions.logger("success in charge capture")
                    return cb(null, charge)
                }
            });
        }]
    }, (err, result) => {
        if (err) return callback(err)
        return callback(null, result)
    });
}

var refundCharge = (Data, callback) => {
    utils.async.auto({
        refundCharge: [(cb) => {
            stripe.refunds.create({
                charge: Data.charge,
                amount: Math.round(Data.amount),
            }, function(err, refund) {
                console.log('err refund==========', err, refund)
                if (err) {
                    utils.universalFunctions.logger("error while refunding charge", err)
                    return cb(err)
                } else {
                    utils.universalFunctions.logger("success in refunding charge")
                    return cb(null, refund)
                }
            });
        }]
    }, (err, result) => {
        if (err) return callback(err)
        return callback(null, result)
    });
}

var saveCardOfUser = function(params, callback) {
    utils.async.auto({
        createCard: [function(callback) {
            if (params.userDetails.stripeCustomerId) {
                stripe.customers.createSource(
                    params.userDetails.stripeCustomerId, { source: params.cardToken },
                    function(err, card) {
                        if (err) {
                            console.log('err in creating source====', err);
                            utils.universalFunctions.logger("inside error when creating customer source")
                            if (err.raw)
                                callback({ statusCode: err.raw.statusCode ? err.raw.statusCode : 400, type: err.raw.type, message: err.raw.message })
                            else
                                callback({ statusCode: 400, type: "Error", message: "Card Not Saved." });
                        } else {
                            utils.universalFunctions.logger("successfully source created")
                            // listCards(params.userDetails, function(err, res) {
                            //     if (err) callback(err)
                            //     else {
                            callback(null, card)
                            //     }
                            // })
                        }
                    }
                );
            } else {
                stripe.customers.create({
                    description: 'Customer for virtual classroom',
                    email: params.userDetails.email,
                }, function(err, customer) {
                    if (err) {
                        utils.universalFunctions.logger("error while creating customer")
                        console.log(err)
                        callback({ statusCode: err.raw.statusCode ? err.raw.statusCode : 400, type: err.raw.type, message: err.raw.message })
                    } else {
                        stripe.customers.createSource(
                            params.userDetails.stripeCustomerId, { source: params.cardToken },
                            function(err, card) {
                                if (err) {
                                    console.log('err in creating source======', err);
                                    utils.universalFunctions.logger("inside error when creating customer source")
                                    if (err.raw)
                                        callback({ statusCode: err.raw.statusCode ? err.raw.statusCode : 400, type: err.raw.type, message: err.raw.message })
                                    else
                                        callback({ statusCode: 400, type: "Error", message: "Card Not Saved." });
                                } else {
                                    utils.universalFunctions.logger("successfully source created")
                                    userModel.findOneAndUpdate({ _id: params.userDetails._id }, { stripeCustomerId: customer.id }, {}, (err, dbData) => {
                                        if (err) {
                                            callback(err)
                                        } else {
                                            // listCards(params.userDetails, function(err, res) {
                                            //     if (err) callback(err)
                                            //     else {
                                            callback(null, card)
                                            //     }
                                            // })
                                        }
                                    });
                                }
                            }
                        );
                    }
                });
            }
        }],
        setDefaultCard: ["createCard", function(data, cb) {

            stripe.customers.update(
                params.userDetails.stripeCustomerId, { default_source: data.createCard.id },
                function(err, obj) {
                    if (err) {
                        utils.universalFunctions.logger("error in updating card details");
                        cb({ statusCode: err.raw.statusCode, type: err.raw.type, message: err.raw.message })
                    } else {
                        utils.universalFunctions.logger("response of updating card");
                        cb(null, obj)
                    }

                }
            );
        }],
        listAllCardsOfUser: ["setDefaultCard", function(data, cb) {

            stripe.customers.retrieve(params.userDetails.stripeCustomerId, function(err, cards) {
                if (err) {
                    utils.universalFunctions.logger("erron in fetching cards==", {
                        statusCode: err.raw.statusCode,
                    })
                    callback(err.raw)
                } else {

                    var newData = [];
                    if (cards.sources.data.length > 0) {
                        cards.sources.data.forEach(function(obj) {
                            var objToSave = { "id": obj.id, "brand": obj.brand, "object": obj.object, "last4": obj.last4, "fingerprint": obj.fingerprint, "image": "http://127.0.0.1:8021/" + "staticImages/" /*, "funding": obj.funding*/ } //configs.app[env.instance].baseUrl
                            objToSave.image = obj.brand == "Visa" ? objToSave.image + "visa.jpg" : obj.brand == "MasterCard" ? objToSave.image + "mastercard.png" : obj.brand == "American Express" ? objToSave.image + "amex.png" : "";
                            newData.push(objToSave);
                        });
                        var default_card_data = []
                        var default_source = cards.default_source;
                        // console.log("default_source ====", default_source);
                        var fingerprint;

                        var all_cards = newData;
                        all_cards.forEach(function(crd, index) { // first fetch the default card and save in a array and its fingerprint
                            if (crd.id.toString() == default_source.toString()) {
                                default_card_data.push(crd)
                                fingerprint = crd.fingerprint
                            }
                        })

                        for (i = all_cards.length - 1; i >= 0; i -= 1) { // remove all the cards that have fingerprint as same as default card
                            if (all_cards[i].fingerprint == fingerprint) {
                                all_cards.splice(i, 1);
                            }
                        }
                        if (all_cards.length > 0) {
                            var arr = {};
                            for (var i = 0, len = all_cards.length; i < len; i++)
                                arr[all_cards[i]['fingerprint']] = all_cards[i];

                            var newCardsData = []

                            newCardsData.push(default_card_data[0]) // merge the default card data

                            for (var key in arr)
                                newCardsData.push(arr[key]);

                            cards.sources.data = newCardsData;
                            cards.sources.total_count = newCardsData.length;
                            cb(null, cards);
                        } else {
                            cards.sources.data = default_card_data;
                            cb(null, cards);
                        }
                    } else
                        cb(null, cards);
                }
            })

        }]

    }, (err, result) => {
        if (err) return callback(err)
        return callback(null, { statusCode: 200, status: "success", message: "Data fetched successfully", data: result.listAllCardsOfUser })
    });
}


module.exports = {
    createCustomer: createCustomer,
    createSource: createSource,
    listCards: listCards,
    setDefaultCard: setDefaultCard,
    createCharge: createCharge,
    deleteCard: deleteCard,
    uploadImgeToStripe: uploadImgeToStripe,
    createStripeAccount: createStripeAccount,
    editStripeAccount: editStripeAccount,
    accountUpdatedWebhook: accountUpdatedWebhook,
    transferToBankAccount: transferToBankAccount,
    addBankAccount: addBankAccount,
    authBeforeCharge: authBeforeCharge,
    captureCharge: captureCharge,
    refundCharge: refundCharge,
    saveCardOfUser: saveCardOfUser
}




/*
STRIPE TEST BANK ACCOUNT NUMBER
    
    stripe.accounts.create({
  type: "custom",
  country: 'US',
  external_account: {
    object: "bank_account",
    country: "US",
    currency: "usd",
    routing_number: "108800",
    account_number: "00012345",
  },
  tos_acceptance: {
    date: 1528350965,
    ip: "182.156.229.242"
  }
}, function(err, account) {
  acct_id = account.id;
  console.log(acct_id);
});

* //UK TEST BANK ACCOUNT SETUP DETAILS
[{"key":"firstName","value":"simran","description":""},{"key":"lastName","value":"simran","description":""},{"key":"dob","value":"29/11/1995","description":""},{"key":"sort","value":"108800","description":""},{"key":"accountNumber","value":"00012345","description":""},{"key":"verification_doc","value":{"0":{}},"description":""},{"key":"address","value":"UK","description":""},{"key":"city","value":"UK","description":""},{"key":"postalCode","value":"SW15","description":""}] */