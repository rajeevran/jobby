var apn = require('apn');
var FCM = require('fcm-push');
var path = require('path');
var config = require('./config')('production');
//=====================APN=================================
// var configDataUser = new apn.Provider({
//     cert: __dirname + config.USER_APN_CERTI,
//     key: __dirname + config.USER_APN_KEY,
//     production: true
// });
//====================APN=================================
//====================FCM SETUP FOR PUSH NOTIFICATION=================
var serverKey = config.FCM_SERVER_KEY;
var serverKeyIOS = require('./config')('production_ios').FCM_SERVER_KEY;
var fcm = new FCM(serverKey);
var fcm_ios = new FCM(serverKeyIOS);
//====================FCM SETUP FOR PUSH NOTIFICATION=================

var pushNotificationService = {
    // iosPush: function (iosDriverData, callback) {
    //     var note = new apn.Notification();
    //     note.alert = iosDriverData.from;
    //     //note.payload = iosDriverData; 

    //     apnOne.send(note, iosDriverData.deviceId).then(result => {
    //         console.log(result.failed);
    //         callback({
    //             result: result
    //         })
    //     });
    // },
    iosPushNotificationUser: function (iosData, callback) {
        var message = {
            to: iosData.deviceId, // required fill with device token or topics

            data: {
                rawData: iosData,
                title: iosData.title,
                body: iosData.message,
                // image: iosData.profile_image,
            },
            notification: {
                rawData: iosData,
                title: iosData.title,
                body: iosData.message,
                // image: iosData.profile_image,
            },
            android: {
                "priority": "high"
            },
            apns: {
                "headers": {
                    "apns-priority": "5",
                }
            },


        };

        fcm_ios.send(message)
            .then(function (response) {
                console.log("Successfully sent with response: ", response);
                callback({
                    success: true,
                    result: response
                })
            })
            .catch(function (err) {
                console.log("Something has gone wrong!");
                console.error(err);
                callback({
                    success: false,
                    result: err
                })
            })
    },
    // iosPushNotificationUserBroadCast: function (iosDriverData, callback) {
    //     var all_data = {
    //         'all_data': iosDriverData
    //     };
    //     var myJSON = JSON.stringify(all_data);
    //     var note = new apn.Notification();
    //     note.alert = iosDriverData.message;
    //     note.payload = all_data;
    //     note.badge = 1;
    //     note.sound = iosDriverData.sound_type + ".mp3";
    //     //note.sound="six.mp3";
    //     note.topic = "com.app.MasjidSpeaker.Users";
    //     configDataUser.send(note, iosDriverData.deviceId).then(result => {
    //         callback({
    //             result: result
    //         })
    //     });
    // },

    androidPushNotification: function (androidData, callback) {
        var message = {
            to: androidData.deviceId, // required fill with device token or topics

            data: {
                rawData: androidData,
                title: androidData.title,
                body: androidData.message,
                // image: androidData.profile_image,
            },
            notification: {
                rawData: androidData,
                title: androidData.title,
                body: androidData.message,
                // image: androidData.profile_image,
            },
            android: {
                "priority": "high"
            },
            apns: {
                "headers": {
                    "apns-priority": "5",
                }
            },


        };
        // var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
        //     to: androidData.deviceId,
        //     collapse_key: 'your_collapse_key',

        //     notification: {
        //         title: androidData.title,
        //         body: androidData.message,
        //         image: androidData.profile_image,
        //     },
        //     "data": {
        //         rawData: androidData,
        //     }
        // }
        //console.log(message);
        fcm.send(message)
            .then(function (response) {
                console.log("Successfully sent with response: ", response);
                callback({
                    success: true,
                    result: response
                })
            })
            .catch(function (err) {
                console.log("Something has gone wrong!");
                console.error(err);
                callback({
                    success: false,
                    result: err
                })
            })
    },
    androidTeamOrderPushNotification: function (androidData, callback) {
        var message = {
            to: androidData.deviceId, // required fill with device token or topics

            data: {
                rawData: androidData,
                title: androidData.title,
                body: androidData.message,
                image: androidData.profile_image,
            },
            notification: {
                rawData: androidData,
                title: androidData.title,
                body: androidData.message,
                image: androidData.profile_image,
            },
            "android": {
                "ttl": "60s",
                "priority": "high"
            },
            apns: {
                "headers": {
                    "apns-priority": "5",
                },
                "payload": {
                    "aps": {
                        "category": "NEW_MESSAGE_CATEGORY"
                    }
                }
            },



        };
        // var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
        //     to: androidData.deviceId,
        //     collapse_key: 'your_collapse_key',

        //     notification: {
        //         title: androidData.title,
        //         body: androidData.message,
        //         image: androidData.profile_image,
        //     },
        //     "data": {
        //         rawData: androidData,
        //     }
        // }
        //console.log(message);
        fcm.send(message)
            .then(function (response) {
                console.log("Successfully sent with response: ", response);
                callback({
                    success: true,
                    result: response
                })
            })
            .catch(function (err) {
                console.log("Something has gone wrong!");
                console.error(err);
                callback({
                    success: false,
                    result: err
                })
            })
    },
    androidPushNotificationBroadCast: function (androidData, callback) {
        var message = {
            to: androidData.deviceId, // required fill with device token or topics
            collapse_key: 'demo',
            data: {
                rawData: androidData,
                title: androidData.title,
                user_id: androidData.user_id,
                friend_name: androidData.friend_name,
                sound_type: androidData.sound_type
            }

        };
        fcm.send(message)
            .then(function (response) {
                console.log("Successfully sent with response: ", response);
                callback({
                    success: true,
                    result: response
                })
            })
            .catch(function (err) {
                console.log("Something has gone wrong!");
                console.error(err);
                callback({
                    success: false,
                    result: err
                })
            })
    }
};
module.exports = pushNotificationService;