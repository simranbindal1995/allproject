/** Stripe services **/

const config = require('config').get('stripe')
const stripe = require("stripe")(config.secretKey)
const stripeCurrency = config.stripeCurrency //gbp for UK
const webServer = require('config').get('webServer')
const path = require('path')
const fs = require('fs')

const fileService = require('../../files/service')


// eventEmitter.on('event', () => {
//     console.log('================================an event occurred!');
// });


const createCustomer = async (params) => {
    const data = await stripe.customers.create({ description: 'Customer for Quickmedics', email: params.email })
    const info = await db.users.findOneAndUpdate({ _id: params._id }, { stripeCustomerId: data.id }, { new: true })

    return info;
}

const addCard = async (params) => {
    let newData = []
    try {
        if (params.userInfo.stripeCustomerId) { //If user already registered with stripe enter card
            var cardDetails = await stripe.customers.createSource(params.userInfo.stripeCustomerId, { source: params.cardToken })
        } else { //First create user with stripe and then store card details
            const data = await createCustomer(params.userInfo)

            params.userInfo.stripeCustomerId = data.stripeCustomerId
            var cardDetails = await stripe.customers.createSource(data.stripeCustomerId, { source: params.cardToken })
        }
        await db.users.findOneAndUpdate({ _id: params.userInfo._id }, { profileStepCompleted: 2, isCardDetailsAdded: true })
        logger.start("Set this card as default card of the user.")

        await stripe.customers.update(params.userInfo.stripeCustomerId, { default_source: cardDetails.id })

        //Fetch all cards of this user
        let allCards = await stripe.customers.retrieve(params.userInfo.stripeCustomerId)

        if (allCards.sources.data.length > 0) {

            allCards.sources.data.forEach(function(obj) { //To send the image of each card's brand & reducing the data object
                let objToSave = {
                    "id": obj.id,
                    "brand": obj.brand,
                    "object": obj.object,
                    "last4": obj.last4,
                    "fingerprint": obj.fingerprint,
                    "image": path.join(__dirname, '../../../assets/staticImages/')
                }
                objToSave.image = obj.brand == "Visa" ? objToSave.image + "visa.jpg" : obj.brand == "MasterCard" ? objToSave.image + "mastercard.jpg" : obj.brand == "American Express" ? objToSave.image + "amex.png" : "";
                newData.push(objToSave);
            });

            allCards.sources.data = newData;
            allCards.sources.total_count = newData.length;
            return allCards;
        } else return allCards

    } catch (err) {
        console.log('err----add card------', err)
        throw new Error(err.raw ? err.raw.message : "Something went wrong while saving the card ! Please try again later.")
    }
}

const createCharge = async (params) => {
    try {
        const data = await stripe.charges.create({
            amount: Math.round(params.totalAmount * 100),
            currency: stripeCurrency,
            source: params.cardID,
            customer: params.userInfo.stripeCustomerId
        })
        return data;
    } catch (err) {
        console.log('err----create charge------', err)
        throw new Error(err.raw ? err.raw.message : "Something went wrong while making the payment ! Please try again later.")
    }
}

const createSource = async (params) => {
    try {
        if (!params.userInfo.stripeCustomerId) {
            const data = await createCustomer(params.userInfo)
            params.userInfo.stripeCustomerId = data.stripeCustomerId
        }

        const cardDetails = await stripe.customers.createSource(params.userInfo.stripeCustomerId, { source: params.cardToken })
        return cardDetails;

    } catch (err) {
        console.log('err----add source------', err)
        throw new Error(err.raw ? err.raw.message : "Something went wrong while saving the card ! Please try again later.")
    }
}
const refundPartialCharge = async (params) => {
    try {
        const data = await stripe.refunds.create({
            charge: params.chargeId,
            amount: Math.round(params.amount * 100),
        })
        return data;
    } catch (err) {
        console.log('err----refund charge------', err)
        throw new Error(err.raw ? err.raw.message : "Something went wrong while making the refund ! Please try again later.")
    }
}
const refundFullCharge = async (params) => {
    try {
        const data = await stripe.refunds.create({
            charge: params.chargeId
        })
        return data;
    } catch (err) {
        console.log('err----refund charge------', err)
        throw new Error(err.raw ? err.raw.message : "Something went wrong while making the refund ! Please try again later.")
    }
}

const addBankAccount = async (params) => {
    try {

        params.imageId = params.verificationDoc
        const record = await fileService.moveFileFromTempToCdn(params)
        params.verificationDoc = record._id

        uploadImageToStripe(params)

        const obj = {
            type: 'custom',
            country: 'GB', // UK
            default_currency: stripeCurrency,
            external_account: {
                object: 'bank_account',
                account_number: params.accountNumber, //00012345
                country: 'GB', //UK
                currency: stripeCurrency,
                routing_number: params.sort //108800
            }
        };
        const details = await stripe.accounts.create(obj)
        params.dob = params.dob.split('/'); //splitting DD-MM-YYY to ['DD','MM','YYYY']
        const updateObj = {
            metadata: {
                user_ID: params.userId
            },
            legal_entity: {
                address: {
                    city: params.city,
                    state: params.state,
                    line1: params.address,
                    postal_code: params.postalCode
                },
                dob: {
                    day: params.dob[0],
                    month: params.dob[1],
                    year: params.dob[2]
                },
                verification: {
                    document: params.stripeFileId
                },
                first_name: params.firstName,
                last_name: params.lastName,
                type: 'individual'
            },
            tos_acceptance: {
                date: (() => {
                    return Math.round(Date.now() / 1000)
                })(),
                ip: '127.0.0.1'
            }
        };

        const x = await stripe.accounts.update(details.id, updateObj)

        await db.bankDetails({ userId: params.userInfo._id, stripeBankId: details.id, metaData: details, ceratedAt: moment().unix() }).save();
        await db.users.findOneAndUpdate({ _id: params.userInfo._id }, { profileCompletionTime: moment().unix(), profileStepCompleted: 4 })
        return "Account registered successfully"
    } catch (err) {
        console.log('err----add bank account------', err)
        throw new Error(err.raw ? err.raw.message : "Something went wrong while saving the bank details ! Please try again later.")
    }

}
const listAllCards = async (params) => {
    let allCards = await stripe.customers.retrieve(params.userInfo.stripeCustomerId)
    let newData = []
    if (allCards.sources.data.length > 0) {

        allCards.sources.data.forEach(function(obj) { //To send the image of each card's brand & reducing the data object
            let objToSave = {
                "id": obj.id,
                "brand": obj.brand,
                "object": obj.object,
                "last4": obj.last4,
                "fingerprint": obj.fingerprint,
                "image": path.join(__dirname, '../../../assets/staticImages/')
            }
            objToSave.image = obj.brand == "Visa" ? objToSave.image + "visa.jpg" : obj.brand == "MasterCard" ? objToSave.image + "mastercard.jpg" : obj.brand == "American Express" ? objToSave.image + "amex.png" : "";
            newData.push(objToSave);
        });

        allCards.sources.data = newData;
        allCards.sources.total_count = newData.length;
        return allCards;
    } else return allCards
}

const transferToBank = async (params) => {
    try {
        const transferData = {
            amount: Math.round(params.totalAmount * 100),
            currency: stripeCurrency,
            destination: params.stripeBankId
        }
        const data = await stripe.transfers.create(transferData)
        return data;
    } catch (err) {
        console.log('err----transfer to bank account------', err)
        throw new Error(err.raw ? err.raw.message : "Something went wrong while transfering to bank account ! Please try again later.")
    }

}

const uploadImageToStripe = async (params) => {
    var stripeFileId;

    const data = await db.files.findOne({ _id: params.verificationDoc })

    const verificationDoc = path.join(__dirname, '../../../assets/images/cdn/' + data.userId + "/" + data._id + "." + data.fileExtension);

    if (fs.existsSync(verificationDoc)) { //uploading file to stripe server

        const fileStats = fs.statSync(verificationDoc);

        var fp = fs.readFileSync(verificationDoc),
            myFile = {
                purpose: 'identity_document',
                file: {
                    data: fp,
                    name: 'file.jpg',
                    type: 'application/octet-stream'
                }
            };

        const fileUpload = await stripe.fileUploads.create(myFile)

        params.stripeFileId = fileUpload.id
        return params;

    } else
        return params;
}

exports.createCustomer = createCustomer
exports.addCard = addCard
exports.createCharge = createCharge
exports.createSource = createSource
exports.refundPartialCharge = refundPartialCharge
exports.refundFullCharge = refundFullCharge
exports.addBankAccount = addBankAccount
exports.listAllCards = listAllCards
exports.transferToBank = transferToBank
exports.uploadImageToStripe = uploadImageToStripe