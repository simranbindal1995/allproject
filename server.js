/*
 * @file: server.js
 * @description: Main index file for initiating the server
 * @date: 26 march 2018
 * @author: Simran 
 * */



// include external modules
const Hapi = require('hapi');
const Inert = require('inert');
const Vision = require('vision');
const HapiSwagger = require('hapi-swagger');
const mongoose = require('mongoose');
const im = require('imagemagick');

// include internal modules
const configs = require('./configs');
const env = require('./env');
const requestLogger = require('./utils/requestLogger');
const utils = require('./utils/index')
const scheduler = require('./scheduler')

const app = configs.app[env.instance];
const db = configs.database[env.instance];

const server = new Hapi.Server({
    connections: {
        routes: {
            cors: {
                origin: ['*'],
                additionalHeaders: ['x-logintoken'],
                additionalExposedHeaders: ['x-logintoken']
            }
        }
    }
});

StaticRoutes = require('./components/staticPages/routes');
userRoutes = require('./components/user/routes');
subjectNSkillRoutes = require('./components/subjectNSkill/routes');
adminRoutes = require('./components/admin/routes');
skillsGuruTeaches = require('./components/skillsGuruTeaches/routes');
quesAnsRoutes = require('./components/quesAns/routes');
filesRoute = require('./components/files/routes');
availableRoute = require('./components/availability/routes');
sessionRoute = require('./components/sessions/routes');
languageRoute = require('./components/languages/routes');
chatRoute = require('./components/chat/routes');
socketServices = require('./components/socket/services/index');
chatServices = require('./components/chat/services/index');
stripeServices = require('./components/stripe/services/index');
stripeRoute = require('./components/stripe/routes');
notificationRoute = require('./components/notification/routes');
bookingsRoutes = require('./components/sessionBookings/routes');

server.connection({
    host: app.host,
    port: app.port
});



server.route([{
    method: 'GET',
    path: '/',
    handler: function(request, reply) {

        return reply({
            name: app.name,
            endpoint: app.host,
            port: app.port

        });
    }
}]);

// static images link
server.route([{ // api to access the user images without compressed
    method: 'GET',
    path: '/staticImages/{name}',
    handler: function(request, reply) {
        return reply.file('./assets/staticImages/' + request.params.name);
    }
}, {
    method: 'GET',
    path: '/emailTemplates/{name}',
    handler: function(request, reply) {
        return reply.file('./assets/emailTemplates/' + request.params.name);
    }
}, {
    method: 'GET',
    path: '/compressed/{name}/{size?}', // getting compressed images using imagemagick
    handler: function(request, reply) {
        if (request.params.size) {
            var size = request.params.size;
            var widthheight = size.split("x");
            var width = widthheight[0]
            var height = widthheight[1]

            im.resize({
                srcPath: './assets/images/' + request.params.name,
                dstPath: './assets/images/' + size + request.params.name,
                width: width,
                height: height
            }, function(err, stdout, stderr) {
                err ? reply.file('./assets/images/' + request.params.name) : reply.file('./assets/images/' + size + request.params.name)
            });
        } else {
            return reply.file('./assets/images/' + request.params.name);
        }
    }

}]);


// Start the server

var options = {
    info: {
        'title': 'Virtual Classroom API Documentation',
        'version': '1.0.0'
    },
    pathPrefixSize: '2',
    tags: [{
        'name': 'Users',
        'description': 'Users API end points'
    }],
    basePath: '/v1'
};

// utils.universalFunctions.insert_admin(function(err, message) { // when starting server, check if admin doest not exist, then enter a new one in db
//     if (err) {
//         console.log('Error while inserting admin detail : ' + err)
//     } else {
//         console.log(message);
//     }
// });


server.register([
    requestLogger,
    Inert,
    Vision,
    require('bell'), {
        'register': HapiSwagger,
        'options': options
    }
], function(err) {

    //utils.universalFunctions.logger("clientId,clientSecret key developed from https://developers.facebook.com/apps/1945126632468156/settings/basic/ using test credentials of igniva geetikanagpal2@gmail.com,123456gn")

    //current fb key from - tester.igniva3@gmail.com   , james1234@

    // server.auth.strategy('facebook', 'bell', {
    //     provider: configs.config.facebookKeys.provider,
    //     password: configs.config.facebookKeys.password,
    //     clientId: configs.config.facebookKeys.clientId,
    //     clientSecret: configs.config.facebookKeys.clientSecret,
    //     isSecure: false // Required if not using HTTPS especially if developing locally
    // });

   // utils.universalFunctions.logger("clientId,clientSecret key developed from https://console.developers.google.com/apis/credentials/oauthclient? using my personal credentials of gmail")

    // server.auth.strategy('google', 'bell', {
    //     provider: configs.config.googleKeys.provider,
    //     password: configs.config.googleKeys.password,
    //     clientId: configs.config.googleKeys.clientId,
    //     clientSecret: configs.config.googleKeys.clientSecret,
    //     isSecure: false // Required if not using HTTPS especially if developing locally
    // });

    server.route(userRoutes);
    server.route(subjectNSkillRoutes);
    server.route(adminRoutes);
    server.route(skillsGuruTeaches);
    server.route(quesAnsRoutes);
    server.route(filesRoute);
    server.route(availableRoute);
    server.route(sessionRoute);
    server.route(languageRoute);
    server.route(chatRoute);
    server.route(stripeRoute);
    server.route(notificationRoute)
    server.route(StaticRoutes)
    server.route(bookingsRoutes)

    server.start(function(err) {
        if (err) {
            console.log("+++++++++++++++++++++++ Error starting server +++++++++++++++++++++", err);
            throw err;
            process.exit(1);
        } else {
            console.log('Server running at ---', app.host + ":" + app.port)
        }
    });

    // server.ext('onPreResponse', function(request, reply) {

    //     if (request.query.error_code == 200) {
    //         console.log("inside denied case...")
    //         console.log(request.query.error_code)
    //         return reply.redirect('http://stylenshop.ignivastaging.com');
    //     } else {
    //         return reply.continue();
    //     }
    // });


});


const mongoUrl = 'mongodb://' + db.host + ':' + db.port + '/' + db.database;

var option = {
    user: db.username,
    pass: db.password
}

//Connect to MongoDB
mongoose.connect(mongoUrl, option, function(err) {
    if (err) {
        console.log("DB Error: ", err);
        process.exit(1);
    } else {
        console.log('MongoDB Connected', mongoUrl);
    }
});

// creating the Web Socket Server //8098
server.connection({ port: 8098, labels: ['ws'] });

const io = require('socket.io')
socketServices.startSocketServer(server, function(data) {
    socketServices.socketConnect(data);
    chatServices.setIo(data);
    utils.universalFunctions.setIo(data);
});






















