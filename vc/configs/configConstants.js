/*
 * @file: configConstants.js
 * @description: Includes all the configuration settings
 * @date: 22 March, 2018
 * @author: Nidhi
 * */



module.exports = {
    data: {
        jwtAlgo: 'HS512',
        jwtkey: 'virtualclassroom_ignivasolutions',
        bcryptSaltRound: '10',
        noReplyEmail: '',
        baseUrl: ''
    },
    googleKeys: {
        provider: 'google',
        password: 'PluginPasswordUsedToLoginUsingBell',
        clientId: "540741793772-0ef2uk8hais19srq3fdd9ggmi7qnkoll.apps.googleusercontent.com",
        clientSecret: "6lPRsmG6r3emX2Lt4IYqB6eA",
        isSecure: false // Required if not using HTTPS especially if developing locally
    },
    facebookKeys: {
        provider: 'facebook',
        password: 'FaceBookPluginPasswordUsedToLoginUsingBell',
        clientId: "1945126632468156",
        clientSecret: "4cb42ff038729849c33df601612cf1bc",
        isSecure: false // Required if not using HTTPS especially if developing locally
    },
    stripeKeys : {
        secretKey : "sk_test_KGFjDHVCZQTB7UCA1OruJXj9"
    }
}