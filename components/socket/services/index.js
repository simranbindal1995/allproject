var Services = require('../../chat/services/index');
var ss = require('socket.io-stream');
var io;


var startSocketServer = function(server, callback) {
    var wsServer = server.select('ws');
    io = require('socket.io')(wsServer.listener);
    io.setMaxListeners(0);
    callback(io);
};
var socketConnect = function(io) {

    io.on('connection', function(socket) {

        //++++++++++++++++++++authenticate (check authenticity of user)+++++++++++++++++++++++++++
        socket.on('authenticate', function(query, callback) { //getting accesstoken from frontend
            //query parameters : x-logintoken - login token of connected user
            var request = {
                token: query['x-logintoken'],
                socket_id: socket.id
            }

            Services.validate_token(request, function(err, res) {
                console.log('SOCKET SAVED IN DB-----',socket.id) //calling validate token function
                err ? callback(err) : callback(null, { status: "success", statusCode: 200, message: "Authenticated successfully.", data: res })
            })

        }); //authenticate

        //++++++++++++++++++++SEND MESSAGE+++++++++++++++++++++++++++
        socket.on('sendMessage', function(query, callback) {

            // query parameters : from- sender, to- receiver, message- msg text, sent_time- teme stamp sent msg time, attachement- send image
            send_message_query = query.hasOwnProperty('from') && query.hasOwnProperty('to') && query.hasOwnProperty('sent_time') && query.hasOwnProperty('message')
            console.log("send_message_query ......... ", send_message_query);
            if (send_message_query == true) { //check if all required params are there in query
                Services.sendMessage(query, function(err, res) { //calling send Message function 

                    err ? callback(err) : callback(null, res)
                })
            } else {
                callback({ statusCode: 320, status: 'warning', message: 'Invalid Json.' });
            }

        }); //sendMessage

        //++++++++++++++++++++MARK MESSAGE READ(all messages in a chatRoom)+++++++++++++++++++++++++++
        socket.on('markMessageRead', function(query, callback) { //mark messages read
            // query parameter : chat_room_id
            query_param = query.hasOwnProperty('chat_room_id')

            if (query_param == true) {
                Services.markMessagesRead(query, function(err, res) {
                    err ? callback(err) : callback(null, res)
                })
            } else {
                callback({ statusCode: 320, status: 'warning', message: 'Invalid Json.' });
            }

        }); //markMessageRead

        //++++++++++++++++++++++++FETCH MESSAGES++++++++++++++++++++++++++++++++++++++++++++++++
        socket.on('fetchMessages', function(query, callback) { //fetching all messages between 2 users
            //query param logged_in_user_id- receiver id, user_id- sender
            query_param = query.hasOwnProperty('logged_in_user_id') && query.hasOwnProperty('user_id')

            if (query_param == true) {
                Services.fetchMessages(query, function(err, res) { //fetching msgs between 2 users
                    err ? callback(err) : callback(null, res)

                })
            } else {
                callback({ statusCode: 320, status: 'warning', message: 'Invalid Json.' });
            }

        }); //fetchMessages

        //+++++++++++++++++++++++++++++FETCH INBOX++++++++++++++++++++++++++++++++++++++
        socket.on('fetchInbox', function(query, callback) { //fetching the inbox of particular user
            //query param : x-logintoken
            query_param = query.hasOwnProperty('x-logintoken')
            if (query_param == true) {
                Services.fetchInbox(query, function(err, res) {
                    err ? callback(err) : callback(null, res)
                })
            } else {
                callback({ statusCode: 320, status: 'warning', message: 'Invalid Json.' });
            }

        }); //fetchInbox

        //+++++++++++++++++++++++++++MSG ACK (update msg delivered status)+++++++++++++++++++++++++++++++++++++++++++++++++++++
        socket.on('msg_acknowledgement', function(query, callback) { //api to update status of delivered messages
            //query param : chat_id
            query_param = query.hasOwnProperty('chat_id')
            if (query_param == true) {
                Services.msg_acknowledgement(query, function(err, res) {
                    err ? callback(err) : callback(null, res)
                })
            } else {
                callback({ statusCode: 320, status: 'warning', message: 'Invalid Json.' });
            }

        }); //message acknowledment

        //++++++++++++++++++++++++++++++SENDING TYPING EVENT+++++++++++++++++++++++++++++++++++++++++++++++++++
        socket.on('sending_is_typing_Status', function(query, callback) { //api to send is typing status
            //query param : from, to, isTyping: true/false
            query_param = query.hasOwnProperty('from') && query.hasOwnProperty('to') && query.hasOwnProperty('isTyping')

            if (query_param == true) {
                Services.sending_is_typing_Status(query, function(err, res) {
                    console.log("\n\n\nerr,res", res)
                    err ? callback(err) : callback(null, res)
                })
            } else {
                callback({ statusCode: 320, status: 'warning', message: 'Invalid Json.' });
            }

        }); //sending_is_typing_Status

        //++++++++++++++++++++++DISCONNECT EVENT+++++++++++++++++++++++++++++
        socket.on('disconnect_event', function(query, callback) { //api to disconnect socket event
            //query param : x-logintoken
            query_param = query.hasOwnProperty('x-logintoken')

            if (query_param == true) {
                Services.disconnect_socket(query, function(err, res) {
                    err ? callback(err) : callback(null, res)
                })
            } else {
                callback({ statusCode: 320, status: 'warning', message: 'Invalid Json.' });
            }

        }); //disconnect event


        socket.on('block_event', function(query, callback) { //api to block a user
            //query param : to , from
            // from - one who is blocking
            // to - one who is being blocked
            query_param = query.hasOwnProperty('to') && query.hasOwnProperty('from')

            if (query_param == true) {
                Services.block_event(query, function(err, res) {
                    err ? callback(err) : callback(null, res)
                })
            } else {
                callback({ statusCode: 320, status: 'warning', message: 'Invalid Json.' });
            }

        }); //disconnect event


        socket.on('sendGroupMessage', function(query, callback) {

            send_message_query = query.hasOwnProperty('groupLessonNumber') && query.hasOwnProperty('message') && query.hasOwnProperty('sent_time')

            if (send_message_query == true) {
                Services.sendGroupMessage(query, function(err, res) {
                    err ? callback(err) : callback(null, res)
                })
            } else {
                callback({ statusCode: 320, status: 'warning', message: 'Invalid Json.' });
            }

        }); //sendMessage


        socket.on('disconnect', function() { //api to disconnect socket event
            //query param : x-logintoken

            console.log('DISCONNECT EVENT =========',socket.id)

            Services.disconnect_socketId({socketId :  socket.id }, function(err, res) {
               
            })


        }); //disconnect event



    }); //connection



}


module.exports = {
    startSocketServer: startSocketServer,
    io: io,
    socketConnect: socketConnect
};