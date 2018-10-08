'use strict';

exports.register = function (server, options, next) {


    server.ext('onRequest', function (request, reply){

        reply.continue();
    });

    server.ext('onPreHandler', function (request, reply) {
    
        reply.continue();
    });


    next();

};

exports.register.attributes = {
    name: 'absoluteLogger',
    version: '1.0.0'
};