var NotificationSchema = require('../schema/admin_notification');
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
    //Admin notification list
    listNotification: function (data, callback) {
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
            //'user_type' == 'employer' ? 'employers' : 'employees',
            aggregate.lookup({
                from: 'employers',
                localField: 'user_id',
                foreignField: '_id',
                as: 'employer'
            });
            aggregate.lookup({
                from: 'employees',
                localField: 'user_id',
                foreignField: '_id',
                as: 'employee'
            });

            aggregate.project({
                _id: 1,
                title: 1,
                message: 1,
                read_status: 1,
                user_type: 1,
                createdAt: 1,
                employer_details: {
                    '$arrayElemAt': [
                        [{
                            _id: {
                                '$arrayElemAt': ['$employer._id', 0]
                            },
                            fname: {
                                '$arrayElemAt': ['$employer.fname', 0]
                            },
                            lname: {
                                '$arrayElemAt': ['$employer.lname', 0]
                            },
                            type: {
                                '$arrayElemAt': ['$employer.type', 0]
                            },
                            profile_image: {
                                $cond: {
                                    if: {
                                        $in: ["NORMAL", "$employer.type"]
                                    },
                                    then: {
                                        $cond: {
                                            if: {
                                                $in: [null, "$employer.profile_image"]
                                            },
                                            then: config.liveUrl + config.userDemoPicPath,
                                            else: {
                                                $concat: [config.liveUrl, {
                                                    "$arrayElemAt": ["$employer.profile_image", 0]
                                                }]
                                                // "$arrayElemAt": ["$User.profile_image", 0]
                                            }
                                        }

                                    },
                                    else: {
                                        $cond: {
                                            if: {
                                                $eq: [{
                                                    '$arrayElemAt': ['$employer.socialLogin.image', 0]
                                                }, null]
                                            },
                                            then: config.liveUrl + config.userDemoPicPath,
                                            else: {
                                                '$arrayElemAt': ['$employer.socialLogin.image', 0]

                                            }
                                        }
                                    }
                                }
                            },

                        }], 0
                    ]
                },
                employee_details: {
                    '$arrayElemAt': [
                        [{
                            _id: {
                                '$arrayElemAt': ['$employee._id', 0]
                            },
                            fname: {
                                '$arrayElemAt': ['$employee.fname', 0]
                            },
                            lname: {
                                '$arrayElemAt': ['$employee.lname', 0]
                            },
                            type: {
                                '$arrayElemAt': ['$employee.type', 0]
                            },
                            profile_image: {
                                $cond: {
                                    if: {
                                        $in: ["NORMAL", "$employee.type"]
                                    },
                                    then: {
                                        $cond: {
                                            if: {
                                                $in: [null, "$employee.profile_image"]
                                            },
                                            then: config.liveUrl + config.userDemoPicPath,
                                            else: {
                                                $concat: [config.liveUrl, {
                                                    "$arrayElemAt": ["$employee.profile_image", 0]
                                                }]
                                                // "$arrayElemAt": ["$User.profile_image", 0]
                                            }
                                        }

                                    },
                                    else: {
                                        $cond: {
                                            if: {
                                                $eq: [{
                                                    '$arrayElemAt': ['$employee.socialLogin.image', 0]
                                                }, null]
                                            },
                                            then: config.liveUrl + config.userDemoPicPath,
                                            else: {
                                                '$arrayElemAt': ['$employee.socialLogin.image', 0]

                                            }
                                        }
                                    }
                                }
                            },

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