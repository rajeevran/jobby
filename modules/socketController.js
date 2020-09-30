var express = require('express');
var https = require('http');
var app = express();
var server = https.createServer(app);
var io = require('socket.io').listen(server);
var rp = require('request-promise');
var config = require('../config');
// module.exports = function (req, res, next) {
//     function abc() {
//         console.log('abc')
//     }

//     return next();
// };
var SocketService = {
    abc: function (val) {
        console.log(val);
        io.sockets.on('connection', function (socket) {
            console.log(socket.id + 'a user connected');

            socket.emit('restaurantStatus', val);
            // socket.on('cartList', function (data) {
            //     console.log("data.userId", data);
            //     var options = {
            //         method: 'POST',
            //         uri: config.liveUrl + 'api/cartList',
            //         form: {
            //             userId: data.userId
            //         },
            //         headers: {
            //             'content-type': 'application/x-www-form-urlencoded',
            //             'x-access-token': data.authToken
            //         },
            //         json: true,
            //         rejectUnauthorized: false,
            //         requestCert: true
            //     };
            //     rp(options)
            //         .then(function (repos) {
            //             console.log("repos", repos);
            //             if (repos.response_code === 2000) {
            //                 socket.emit('cartListStatus', repos);
            //             } else {
            //                 socket.emit('cartListStatus', repos);
            //             }
            //         })
            //         .catch(function (err) {

            //             console.log('err', err);
            //         });

            //     //}
            // });


            socket.on('disconnect', function () {
                console.log('user disconnected');
            });
        });
    }
};
module.exports = SocketService;