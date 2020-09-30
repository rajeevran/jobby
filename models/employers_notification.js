var NotificationSchema = require('../schema/employer_notification');
var async = require("async");
var mongo = require('mongodb');
var ObjectID = mongo.ObjectID;
var config = require('../config');
var NotificationModels = {

    addNotification: function (data, callback) {
        if (data) {
            new NotificationSchema(data).save(function (err, result) {
                if (err) {
                    callback({
                        "response_code": 5005,
                        "response_message": "INTERNAL DB ERROR",
                        "response_data": {}
                    });
                } else {
                    callback({
                        "response_code": 2000,
                        "response_message": "Notification has been added",
                        "response_data": {}
                    });
                }
            })
        } else {
            callback({
                "response_code": 5005,
                "response_message": "INTERNAL DB ERROR",
                "response_data": {}
            });
        }
    },
    //User notification list
    notificationList: function (data, callback) {
        if (data) {

            var page = 1,
                limit = 20,
                sortBy = -1;
            var query = {};
            if (data.page) {
                page = parseInt(data.page);
            }
            if (data.limit) {
                limit = parseInt(data.limit);
            }
            if (data.sortby) {
                sort_field = data.sortby;
            }
            if (data.user_id) {
                query['user_id'] = data.user_id;
            }
            if (data.status) {
                query['read_status'] = data.status;
            }
            var aggregate = NotificationSchema.aggregate();
            aggregate.match(query);

            aggregate.lookup({
                from: 'users',
                localField: 'team_join_request_details.user_id' ? 'team_join_request_details.user_id' : 'user_id',
                foreignField: '_id',
                as: 'user_details'
            });

            aggregate.project({
                _id: 1,
                title: 1,
                message: 1,
                read_status: 1,
                notification_code: 1,
                createdAt: 1,
                teamOrder: 1,
                user_details: {
                    '$arrayElemAt': [
                        [{
                            _id: {
                                '$arrayElemAt': ['$user_details._id', 0]
                            },
                            name: {
                                '$arrayElemAt': ['$user_details.name', 0]
                            },
                            type: {
                                '$arrayElemAt': ['$user_details.type', 0]
                            },
                            profile_image: {
                                $cond: {
                                    if: {
                                        $in: ["NORMAL", "$user_details.type"]
                                    },
                                    then: {
                                        $cond: {
                                            if: {
                                                $in: ["", "$user_details.profile_image"]
                                            },
                                            then: config.liveUrl + config.userDemoPicPath,
                                            else: {
                                                $concat: [config.liveUrl, {
                                                    "$arrayElemAt": ["$user_details.profile_image", 0]
                                                }]
                                                // "$arrayElemAt": ["$User.profile_image", 0]
                                            }
                                        }

                                    },
                                    else: {
                                        $cond: {
                                            if: {
                                                $eq: [
                                                    [{
                                                        '$arrayElemAt': ['$user_details.socialLogin.image', 0]
                                                    }, 0], " "
                                                ]
                                            },
                                            then: config.liveUrl + config.userDemoPicPath,
                                            else: {
                                                '$arrayElemAt': [{
                                                    '$arrayElemAt': ['$user_details.socialLogin.image', 0]
                                                }, 0]

                                            }
                                        }
                                    }
                                }
                            },
                            socialLogin: {
                                '$arrayElemAt': ['$user_details.socialLogin', 0]
                            }
                        }], 0
                    ]
                },

            });
            aggregate.sort({
                'createdAt': sortBy
            })
            var options = {
                page: page,
                limit: limit
            }
            NotificationSchema.aggregatePaginate(aggregate, options, function (err, results, pageCount, count) {
                if (err) {
                    callback({
                        "response_code": 5005,
                        "response_message": err,
                        "response_data": {}
                    });

                } else {
                    var data = {
                        docs: results,
                        pages: pageCount,
                        total: count,
                        limit: limit,
                        page: page
                    }
                    callback({
                        "response_code": 2000,
                        "response_message": "Notification list.",
                        "response_data": data
                    });
                }
            });

        } else {
            callback({
                "response_code": 5005,
                "response_message": "INTERNAL DB ERROR",
                "response_data": {}
            });
        }
    },
    //Notification statsu change
    notificationStatusChange: function (data, callback) {
        if (data) {
            NotificationSchema.update({
                    _id: data.notification_id
                }, {
                    $set: {
                        read_status: 'yes'
                    }
                },
                function (err, result) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": {}
                        });
                    } else {
                        callback({
                            "response_code": 2000,
                            "response_message": "Notification has been updated",
                            "response_data": {}
                        });
                    }
                });
        } else {
            callback({
                "response_code": 5005,
                "response_message": "INTERNAL DB ERROR",
                "response_data": {}
            });
        }
    },


}
module.exports = NotificationModels;