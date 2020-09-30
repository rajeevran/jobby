var EmployerSchema = require('../schema/employer');
var CandidateSchema = require('../schema/candidate');
var ApplicationSchema = require('../schema/job_applilation');
var JobSchema = require('../schema/job');

var AdminSchema = require('../schema/admin');
var AdminNotificationSchema = require('../schema/admin_notification');
var JobTypeSchema = require('../schema/job_type');
var JobTagSchema = require('../schema/job_tag');
var JobPackageSchema = require('../schema/job_package');
var JobTitleSchema = require('../schema/job_title');
var JobLevelSchema = require('../schema/job_level');
var JobSkillSchema = require('../schema/job_skill');
var JobIndustrySchema = require('../schema/job_industry');
var JobSkillSchema = require('../schema/job_skill');
var JobCountrySchema = require('../schema/job_country');
var JobCitySchema = require('../schema/job_city');
var JobSchema = require('../schema/job');

var DegreeSchema = require('../schema/degree_list');
var config = require('../config');
var async = require("async");
var mongo = require('mongodb');
var ObjectID = mongo.ObjectID;
var bcrypt = require('bcrypt');
var fs = require('fs');
var jwt = require('jsonwebtoken');
var mailProperty = require('../modules/sendMail');
var commonModule = require('../utility/common');
var secretKey = config.secretKey;

createToken = (admin) => {
    var tokenData = {
        id: admin._id
    };
    var token = jwt.sign(tokenData, secretKey, {
        expiresIn: 86400
    });
    return token;
};

var adminModels = {

    //register employee
    register: function (data, callback) {
        if (data) {
            AdminSchema.findOne({
                    email: data.email
                }, {
                    _id: 1,
                    email: 1,
                },
                function (err, result) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": {}
                        });
                    } else {
                        if (result != null) {
                            callback({
                                "response_code": 2008,
                                "response_message": "Email address already exist",
                                "response_data": result
                            });
                        } else {
                            new AdminSchema(data).save(function (err, result) {
                                if (err) {
                                    callback({
                                        "response_code": 5005,
                                        "response_message": "INTERNAL DB ERROR",
                                        "response_data": {}
                                    });
                                } else {

                                    callback({
                                        "response_code": 2000,
                                        "response_message": "You have registered successfully."
                                    });
                                }
                            });
                        }
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
    //login
    login: async function (data, callback) {
        if (data) {

            let admin = await AdminSchema.findOne({
                email: data.email
            }, {
                email: 1,
                password: 1
            }, function (err, result) {
                if (err) {
                    callback({
                        "response_code": 5005,
                        "response_message": err,
                        "response_data": {}
                    });

                } else {

                    if (result == null) {

                        callback({
                            "response_code": 5002,
                            "response_message": "Wrong password or email. Please provide registered details.",
                            "response_data": {}
                        });


                    } else {

                        bcrypt.compare(data.password.toString(), result.password, function (err, response) {
                            // result == true
                            if (response == true) {

                                var token = createToken(result);

                                var all_result = {
                                    authtoken: token,
                                    _id: result._id,
                                    name: result.name,
                                    email: result.email,

                                }
                                callback({
                                    "response_code": 2000,
                                    "response_message": "Logged your account",
                                    "response_data": all_result
                                });

                            } else {
                                callback({
                                    "response_code": 5002,
                                    "response_message": "Wrong password or email. Please provide registered details.",
                                    "response_data": {}
                                });
                            }
                        });



                    }
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
    //Forgotpassword
    forgotPassword: function (data, callback) {
        if (data) {
            AdminSchema.findOne({
                    email: data.email
                },
                function (err, resDetails) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": {}
                        });
                    } else {
                        if (resDetails == null) {
                            callback({
                                "response_code": 5002,
                                "response_message": "User does not exist.",
                                "response_data": {}
                            });
                        } else {
                            var random = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 6);
                            const saltRounds = 10;
                            bcrypt.hash(random, saltRounds, function (err, hash) {

                                var new_password = hash;
                                var conditions = {
                                        _id: resDetails._id
                                    },
                                    fields = {
                                        password: new_password
                                    },
                                    options = {
                                        upsert: false
                                    };
                                AdminSchema.update(conditions, fields, options, function (err, affected) {
                                    if (err) {
                                        callback({
                                            response_code: 5005,
                                            response_message: "INTERNAL DB ERROR",
                                            response_data: err
                                        });
                                    } else {
                                        mailProperty('forgotPasswordMail')(data.email, {
                                            name: 'Admin',
                                            password: random,
                                            email: data.email,
                                            site_url: config.liveUrl,
                                            date: new Date()
                                        }).send();
                                        callback({
                                            response_code: 2000,
                                            response_message: "New password will be sent to your mail.",
                                        });
                                    }
                                });

                            });
                        }
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
    //Forgotpassword
    changePassword: function (data, callback) {
        if (data) {
            AdminSchema.findOne({
                    email: data.email
                },
                function (err, resDetails) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": {}
                        });
                    } else {
                        if (resDetails == null) {
                            callback({
                                "response_code": 5002,
                                "response_message": "User does not exist.",
                                "response_data": {}
                            });
                        } else {

                            const saltRounds = 10;
                            bcrypt.hash(data.password.toString(), saltRounds, function (err, hash) {

                                var new_password = hash;

                                AdminSchema.updateOne({
                                    _id: resDetails._id
                                }, {
                                    $set: {
                                        password: new_password
                                    }
                                }, function (err, resUpdate) {
                                    if (err) {
                                        callback({
                                            "response_code": 5005,
                                            "response_message": "INTERNAL DB ERROR",
                                            "response_data": {}
                                        });
                                    } else {
                                        callback({
                                            response_code: 2000,
                                            response_message: "Password Update successfully.",
                                        });
                                    }
                                });


                            });
                        }
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
    listJobType: function (data, callback) {

        var page = 1,
            limit = 20,
            query = {};
        var teamJoinRequest = [];
        if (data.page) {
            page = parseInt(data.page);
        }
        if (data.limit) {
            limit = parseInt(data.limit);
        }
        if (data.name) {
            query['name'] = new RegExp(data.name, 'i');
        }

        var aggregate = JobTypeSchema.aggregate();
        aggregate.match(query);

        aggregate.project({
            _id: 1,
            createdAt: 1,
            name: 1,
            ar_name: 1,
        });
        aggregate.sort({
            'createdAt': 1
        })
        var options = {
            page: page,
            limit: limit
        }

        JobTypeSchema.aggregatePaginate(aggregate, options, function (err, results, pageCount, count) {
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
                    "response_message": "Job type list.",
                    "response_data": data
                });

            }
        });
    },
    addJobType: async function (data, callback) {
        if (data) {
            JobTypeSchema.findOne({
                    name: data.name
                },
                function (err, result) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": {}
                        });
                    } else {
                        if (result != null) {
                            callback({
                                "response_code": 2008,
                                "response_message": "Job type already exist",
                                "response_data": result
                            });
                        } else {
                            new JobTypeSchema(data).save(function (err, result) {
                                if (err) {
                                    callback({
                                        "response_code": 5005,
                                        "response_message": "INTERNAL DB ERROR",
                                        "response_data": {}
                                    });
                                } else {

                                    callback({
                                        "response_code": 2000,
                                        "response_message": "Job type add successfully."
                                    });
                                }
                            });
                        }
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
    editJobType: async function (data, callback) {
        if (data) {
            JobTypeSchema.findOne({
                    _id: data._id
                },
                function (err, result) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": {}
                        });
                    } else {
                        if (result == null) {
                            callback({
                                "response_code": 2008,
                                "response_message": "Job type not exist",
                                "response_data": result
                            });
                        } else {
                            JobTypeSchema.updateOne({
                                    _id: data._id
                                }, {
                                    $set: {
                                        name: data.name,
                                        ar_name: data.ar_name,
                                    }
                                }, {
                                    upsert: true
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
                                            "response_message": "Job type updated successfully."
                                        });

                                    }
                                })
                        }
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
    deleteJobType: async function (data, callback) {
        if (data) {

            JobTypeSchema.findOne({
                    _id: data._id
                },
                function (err, result) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": {}
                        });
                    } else {
                        if (result == null) {
                            callback({
                                "response_code": 2008,
                                "response_message": "Job type not exist",
                                "response_data": result
                            });
                        } else {
                            JobTypeSchema.remove({
                                _id: data._id
                            }, function (err, result) {
                                if (err) {
                                    callback({
                                        "response_code": 5005,
                                        "response_message": "INTERNAL DB ERROR",
                                        "response_data": err
                                    });
                                } else {
                                    callback({
                                        "response_code": 2000,
                                        "response_message": "Job type deleted."
                                    });
                                }
                            });
                        }
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
    //Admin Notification List
    listAdminNotification: async function (data, callback) {

        
        var page = 1,
            limit = 20,
            query = {};

        if (data.page) {
            page = parseInt(data.page);
        }
        if (data.limit) {
            limit = parseInt(data.limit);
        }
        if (data._id) {
            query['_id'] = data._id;

            await AdminNotificationSchema.updateOne({
                _id: data._id
            }, {
                $set: {
                    read_status: 'yes',
                }
            });
        }

        var aggregate = AdminNotificationSchema.aggregate();
        aggregate.match(query);

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
            order: {
                $cond: {
                    if: {
                        $eq: ["$read_status", 'yes']
                    },
                    then: 2,
                    else: 1
                }
            },
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
            createdAt: -1,
            'order': 1
        })
        var options = {
            page: page,
            limit: limit
        }

        AdminNotificationSchema.aggregatePaginate(aggregate, options, async function (err, results, pageCount, count) {
            if (err) {
                callback({
                    "response_code": 5005,
                    "response_message": err,
                    "response_data": {}
                });

            } else {

                async.forEach(results, function (item, callback) {

                    item.last_updated = commonModule.updateDate(item.createdAt);
        
                })

                let total_unread_msg = await AdminNotificationSchema.find({
                    read_status: 'no'
                }).exec(function (err, result) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": err,
                            "response_data": {}
                        });
        
                    } else {
                        

                        var data = {
                            docs: results,
                            total_unread_msg: result.length,
                            pages: pageCount,
                            total: count,
                            limit: limit,
                            page: page
                        }
                        callback({
                            "response_code": 2000,
                            "response_message": "Admin Notification list.",
                            "response_data": data
                        });
                    }
                })
                
                

                // var data = {
                //     docs: results,
                //     total_unread_msg: total_unread_msg.length,
                //     pages: pageCount,
                //     total: count,
                //     limit: limit,
                //     page: page
                // }
                // callback({
                //     "response_code": 2000,
                //     "response_message": "Admin Notification list.",
                //     "response_data": data
                // });

            }
        });
    },
    //Delete Admin Notification
    deleteAdminNotification: async function (data, callback) {
        if (data) {

            AdminNotificationSchema.findOne({
                    _id: data._id
                },
                function (err, result) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": {}
                        });
                    } else {
                        if (result == null) {
                            callback({
                                "response_code": 2008,
                                "response_message": "Notification not exist",
                                "response_data": result
                            });
                        } else {
                            AdminNotificationSchema.remove({
                                _id: data._id
                            }, function (err, result) {
                                if (err) {
                                    callback({
                                        "response_code": 5005,
                                        "response_message": "INTERNAL DB ERROR",
                                        "response_data": err
                                    });
                                } else {
                                    callback({
                                        "response_code": 2000,
                                        "response_message": "Admin Notification deleted."
                                    });
                                }
                            });
                        }
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
    listJobType: function (data, callback) {

        var page = 1,
            limit = 20,
            query = {};
        var teamJoinRequest = [];
        if (data.page) {
            page = parseInt(data.page);
        }
        if (data.limit) {
            limit = parseInt(data.limit);
        }
        if (data.name) {
            query = {
                "$or": [{
                    "name": new RegExp(data.name, 'i')
                }, {
                    "ar_name": new RegExp(data.name, 'i')
                }]
            }
        }
        if (data._id) {
            query['_id'] = data._id;
        }

        var aggregate = JobTypeSchema.aggregate();
        aggregate.match(query);

        aggregate.project({
            _id: 1,
            createdAt: 1,
            name: 1,
            ar_name: 1,
        });
        aggregate.sort({
            'name': 1
        })
        var options = {
            page: page,
            limit: limit
        }

        JobTypeSchema.aggregatePaginate(aggregate, options, function (err, results, pageCount, count) {
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
                    "response_message": "Job type list.",
                    "response_data": data
                });

            }
        });
    },
    addJobType: async function (data, callback) {
        if (data) {
            JobTypeSchema.findOne({
                    name: data.name
                },
                function (err, result) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": {}
                        });
                    } else {
                        if (result != null) {
                            callback({
                                "response_code": 2008,
                                "response_message": "Job type already exist",
                                "response_data": result
                            });
                        } else {
                            new JobTypeSchema(data).save(function (err, result) {
                                if (err) {
                                    callback({
                                        "response_code": 5005,
                                        "response_message": "INTERNAL DB ERROR",
                                        "response_data": {}
                                    });
                                } else {

                                    callback({
                                        "response_code": 2000,
                                        "response_message": "Job type add successfully."
                                    });
                                }
                            });
                        }
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
    editJobType: async function (data, callback) {
        if (data) {
            JobTypeSchema.findOne({
                    _id: data._id
                },
                function (err, result) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": {}
                        });
                    } else {
                        if (result == null) {
                            callback({
                                "response_code": 2008,
                                "response_message": "Job type not exist",
                                "response_data": result
                            });
                        } else {
                            JobTypeSchema.updateOne({
                                    _id: data._id
                                }, {
                                    $set: {
                                        name: data.name,
                                        ar_name: data.ar_name,
                                    }
                                }, {
                                    upsert: true
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
                                            "response_message": "Job type updated successfully."
                                        });

                                    }
                                })
                        }
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
    deleteJobType: async function (data, callback) {
        if (data) {

            JobTypeSchema.findOne({
                    _id: data._id
                },
                function (err, result) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": {}
                        });
                    } else {
                        if (result == null) {
                            callback({
                                "response_code": 2008,
                                "response_message": "Job type not exist",
                                "response_data": result
                            });
                        } else {
                            JobTypeSchema.remove({
                                _id: data._id
                            }, function (err, result) {
                                if (err) {
                                    callback({
                                        "response_code": 5005,
                                        "response_message": "INTERNAL DB ERROR",
                                        "response_data": err
                                    });
                                } else {
                                    callback({
                                        "response_code": 2000,
                                        "response_message": "Job type deleted."
                                    });
                                }
                            });
                        }
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
    listJobTag: function (data, callback) {

        var page = 1,
            limit = 20,
            query = {};
        var teamJoinRequest = [];
        if (data.page) {
            page = parseInt(data.page);
        }
        if (data.limit) {
            limit = parseInt(data.limit);
        }
        if (data.name) {
            query = {
                "$or": [{
                    "name": new RegExp(data.name, 'i')
                }, {
                    "ar_name": new RegExp(data.name, 'i')
                }]
            }
        }
        if (data._id) {
            query['_id'] = data._id;
        }

        var aggregate = JobTagSchema.aggregate();
        aggregate.match(query);

        aggregate.project({
            _id: 1,
            createdAt: 1,
            name: 1,
            ar_name: 1,
        });
        aggregate.sort({
            'name': 1
        })
        var options = {
            page: page,
            limit: limit
        }

        JobTagSchema.aggregatePaginate(aggregate, options, function (err, results, pageCount, count) {
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
                    "response_message": "Job tag list.",
                    "response_data": data
                });

            }
        });
    },
    addJobTag: async function (data, callback) {
        if (data) {
            JobTagSchema.findOne({
                    name: data.name
                },
                function (err, result) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": {}
                        });
                    } else {
                        if (result != null) {
                            callback({
                                "response_code": 2008,
                                "response_message": "Job tag already exist",
                                "response_data": result
                            });
                        } else {
                            new JobTagSchema(data).save(function (err, result) {
                                if (err) {
                                    callback({
                                        "response_code": 5005,
                                        "response_message": "INTERNAL DB ERROR",
                                        "response_data": {}
                                    });
                                } else {

                                    callback({
                                        "response_code": 2000,
                                        "response_message": "Job tag add successfully."
                                    });
                                }
                            });
                        }
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
    editJobTag: async function (data, callback) {
        if (data) {
            JobTagSchema.findOne({
                    _id: data._id
                },
                function (err, result) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": {}
                        });
                    } else {
                        if (result == null) {
                            callback({
                                "response_code": 2008,
                                "response_message": "Job tag not exist",
                                "response_data": result
                            });
                        } else {
                            JobTagSchema.updateOne({
                                    _id: data._id
                                }, {
                                    $set: {
                                        name: data.name,
                                        ar_name: data.ar_name,
                                    }
                                }, {
                                    upsert: true
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
                                            "response_message": "Job tag updated successfully."
                                        });

                                    }
                                })
                        }
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
    deleteJobTag: async function (data, callback) {
        if (data) {

            JobTagSchema.findOne({
                    _id: data._id
                },
                function (err, result) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": {}
                        });
                    } else {
                        if (result == null) {
                            callback({
                                "response_code": 2008,
                                "response_message": "Job tag not exist",
                                "response_data": result
                            });
                        } else {
                            JobTagSchema.remove({
                                _id: data._id
                            }, function (err, result) {
                                if (err) {
                                    callback({
                                        "response_code": 5005,
                                        "response_message": "INTERNAL DB ERROR",
                                        "response_data": err
                                    });
                                } else {
                                    callback({
                                        "response_code": 2000,
                                        "response_message": "Job tag deleted."
                                    });
                                }
                            });
                        }
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
    //Job Package List
    listJobPackage: function (data, callback) {

        var page = 1,
            limit = 20,
            query = {};

        if (data.page) {
            page = parseInt(data.page);
        }
        if (data.limit) {
            limit = parseInt(data.limit);
        }
        if (data.name) {
            query = {
                "$or": [{
                    "name": new RegExp(data.name, 'i')
                }, {
                    "ar_name": new RegExp(data.name, 'i')
                }]
            }
        }
        if (data._id) {
            query['_id'] = data._id;
        }
        var aggregate = JobPackageSchema.aggregate();
        aggregate.match(query);

        aggregate.project({
            _id: 1,
            createdAt: 1,
            name: 1,
            ar_name: 1,
            description: 1,
            ar_description: 1,
            price: 1,
            job_post_limit: 1,
            job_display_duration: 1,
            package_expire_date: 1
        });
        aggregate.sort({
            'createdAt': -1
        })
        var options = {
            page: page,
            limit: limit
        }

        JobPackageSchema.aggregatePaginate(aggregate, options, function (err, results, pageCount, count) {
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
                    "response_message": "Job Package list.",
                    "response_data": data
                });

            }
        });
    },
    //Add Job Package
    addJobPackage: async function (data, callback) {
        if (data) {
            JobPackageSchema.findOne({
                    name: data.name
                },
                function (err, result) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": {}
                        });
                    } else {
                        if (result != null) {
                            callback({
                                "response_code": 2008,
                                "response_message": "Job package with same name already exist",
                                "response_data": result
                            });
                        } else {
                            new JobPackageSchema(data).save(function (err, result) {
                                if (err) {
                                    callback({
                                        "response_code": 5005,
                                        "response_message": "INTERNAL DB ERROR",
                                        "response_data": {}
                                    });
                                } else {

                                    callback({
                                        "response_code": 2000,
                                        "response_message": "Job package add successfully."
                                    });
                                }
                            });
                        }
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
    //Edit Job Package
    editJobPackage: async function (data, callback) {
        if (data) {
            JobPackageSchema.findOne({
                    _id: data._id
                },
                function (err, result) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": {}
                        });
                    } else {
                        if (result == null) {
                            callback({
                                "response_code": 2008,
                                "response_message": "Job package not exist",
                                "response_data": result
                            });
                        } else {
                            JobPackageSchema.updateOne({
                                    _id: data._id
                                }, {
                                    $set: {
                                        name: data.name,
                                        ar_name: data.ar_name,
                                        description: data.description,
                                        ar_description: data.ar_description,
                                        price: data.price,
                                        job_post_limit: data.job_post_limit,
                                        job_display_duration: data.job_display_duration,
                                        package_expire_date: data.package_expire_date
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
                                            "response_message": "Job package updated successfully."
                                        });

                                    }
                                })
                        }
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
    //Delete Job Package
    deleteJobPackage: async function (data, callback) {
        if (data) {

            JobPackageSchema.findOne({
                    _id: data._id
                },
                function (err, result) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": {}
                        });
                    } else {
                        if (result == null) {
                            callback({
                                "response_code": 2008,
                                "response_message": "Job tag not exist",
                                "response_data": result
                            });
                        } else {
                            JobPackageSchema.remove({
                                _id: data._id
                            }, function (err, result) {
                                if (err) {
                                    callback({
                                        "response_code": 5005,
                                        "response_message": "INTERNAL DB ERROR",
                                        "response_data": err
                                    });
                                } else {
                                    callback({
                                        "response_code": 2000,
                                        "response_message": "Job package deleted."
                                    });
                                }
                            });
                        }
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
    //Job Title List
    listJobTitle: function (data, callback) {

        var page = 1,
            limit = 20,
            query = {};

        if (data.page) {
            page = parseInt(data.page);
        }
        if (data.limit) {
            limit = parseInt(data.limit);
        }
        if (data.name) {
            query = {
                "$or": [{
                    "name": new RegExp(data.name, 'i')
                }, {
                    "ar_name": new RegExp(data.name, 'i')
                }]
            }
        }
        if (data._id) {
            query['_id'] = data._id;
        }

        var aggregate = JobTitleSchema.aggregate();
        aggregate.match(query);

        aggregate.project({
            _id: 1,
            createdAt: 1,
            name: 1,
            ar_name: 1,
        });
        aggregate.sort({
            'createdAt': -1
        })
        var options = {
            page: page,
            limit: limit
        }

        JobTitleSchema.aggregatePaginate(aggregate, options, function (err, results, pageCount, count) {
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
                    "response_message": "Job title list.",
                    "response_data": data
                });

            }
        });
    },
    //Add Job Title
    addJobTitle: async function (data, callback) {
        if (data) {
            JobTitleSchema.findOne({
                    name: data.name
                },
                function (err, result) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": {}
                        });
                    } else {
                        if (result != null) {
                            callback({
                                "response_code": 2008,
                                "response_message": "Job title already exist",
                                "response_data": result
                            });
                        } else {
                            new JobTitleSchema(data).save(function (err, result) {
                                if (err) {
                                    callback({
                                        "response_code": 5005,
                                        "response_message": "INTERNAL DB ERROR",
                                        "response_data": {}
                                    });
                                } else {

                                    callback({
                                        "response_code": 2000,
                                        "response_message": "Job title add successfully."
                                    });
                                }
                            });
                        }
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
    //Edit Job Title
    editJobTitle: async function (data, callback) {
        if (data) {
            JobTitleSchema.findOne({
                    _id: data._id
                },
                function (err, result) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": {}
                        });
                    } else {
                        if (result == null) {
                            callback({
                                "response_code": 2008,
                                "response_message": "Job title not exist",
                                "response_data": result
                            });
                        } else {
                            JobTitleSchema.updateOne({
                                    _id: data._id
                                }, {
                                    $set: {
                                        name: data.name,
                                        ar_name: data.ar_name,
                                    }
                                }, {
                                    upsert: true
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
                                            "response_message": "Job title updated successfully."
                                        });

                                    }
                                })
                        }
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
    //Delete Job Title
    deleteJobTitle: async function (data, callback) {
        if (data) {

            JobTitleSchema.findOne({
                    _id: data._id
                },
                function (err, result) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": {}
                        });
                    } else {
                        if (result == null) {
                            callback({
                                "response_code": 2008,
                                "response_message": "Job title not exist",
                                "response_data": result
                            });
                        } else {
                            JobTitleSchema.remove({
                                _id: data._id
                            }, function (err, result) {
                                if (err) {
                                    callback({
                                        "response_code": 5005,
                                        "response_message": "INTERNAL DB ERROR",
                                        "response_data": err
                                    });
                                } else {
                                    callback({
                                        "response_code": 2000,
                                        "response_message": "Job title deleted."
                                    });
                                }
                            });
                        }
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
    //Job Level List
    listJobLevel: function (data, callback) {

        var page = 1,
            limit = 20,
            query = {};

        if (data.page) {
            page = parseInt(data.page);
        }
        if (data.limit) {
            limit = parseInt(data.limit);
        }
        if (data.name) {
            query = {
                "$or": [{
                    "name": new RegExp(data.name, 'i')
                }, {
                    "ar_name": new RegExp(data.name, 'i')
                }]
            }
        }
        if (data._id) {
            query['_id'] = data._id;
        }

        var aggregate = JobLevelSchema.aggregate();
        aggregate.match(query);

        aggregate.project({
            _id: 1,
            createdAt: 1,
            name: 1,
            ar_name: 1,
        });
        aggregate.sort({
            'name': 1
        })
        var options = {
            page: page,
            limit: limit
        }

        JobLevelSchema.aggregatePaginate(aggregate, options, function (err, results, pageCount, count) {
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
                    "response_message": "Job title list.",
                    "response_data": data
                });

            }
        });
    },
    //Add Job Level
    addJobLevel: async function (data, callback) {
        if (data) {
            JobLevelSchema.findOne({
                    name: data.name
                },
                function (err, result) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": {}
                        });
                    } else {
                        if (result != null) {
                            callback({
                                "response_code": 2008,
                                "response_message": "Job level already exist",
                                "response_data": result
                            });
                        } else {
                            new JobLevelSchema(data).save(function (err, result) {
                                if (err) {
                                    callback({
                                        "response_code": 5005,
                                        "response_message": "INTERNAL DB ERROR",
                                        "response_data": {}
                                    });
                                } else {

                                    callback({
                                        "response_code": 2000,
                                        "response_message": "Job level add successfully."
                                    });
                                }
                            });
                        }
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
    //Edit Job Level
    editJobLevel: async function (data, callback) {
        if (data) {
            JobLevelSchema.findOne({
                    _id: data._id
                },
                function (err, result) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": {}
                        });
                    } else {
                        if (result == null) {
                            callback({
                                "response_code": 2008,
                                "response_message": "Job level not exist",
                                "response_data": result
                            });
                        } else {
                            JobLevelSchema.updateOne({
                                    _id: data._id
                                }, {
                                    $set: {
                                        name: data.name,
                                        ar_name: data.ar_name,
                                    }
                                }, {
                                    upsert: false
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
                                            "response_message": "Job level updated successfully."
                                        });

                                    }
                                })
                        }
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
    //Delete Job Level
    deleteJobLevel: async function (data, callback) {
        if (data) {

            JobLevelSchema.findOne({
                    _id: data._id
                },
                function (err, result) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": {}
                        });
                    } else {
                        if (result == null) {
                            callback({
                                "response_code": 2008,
                                "response_message": "Job level not exist",
                                "response_data": result
                            });
                        } else {
                            JobLevelSchema.remove({
                                _id: data._id
                            }, function (err, result) {
                                if (err) {
                                    callback({
                                        "response_code": 5005,
                                        "response_message": "INTERNAL DB ERROR",
                                        "response_data": err
                                    });
                                } else {
                                    callback({
                                        "response_code": 2000,
                                        "response_message": "Job level deleted."
                                    });
                                }
                            });
                        }
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
    //Job Skill List
    listJobSkill: function (data, callback) {

        var page = 1,
            limit = 20,
            query = {};

        if (data.page) {
            page = parseInt(data.page);
        }
        if (data.limit) {
            limit = parseInt(data.limit);
        }
        if (data.name) {
            query = {
                "$or": [{
                    "name": new RegExp(data.name, 'i')
                }, {
                    "ar_name": new RegExp(data.name, 'i')
                }]
            }
        }
        if (data._id) {
            query['_id'] = data._id;
        }

        var aggregate = JobSkillSchema.aggregate();
        aggregate.match(query);

        aggregate.project({
            _id: 1,
            createdAt: 1,
            name: 1,
            ar_name: 1,
        });
        aggregate.sort({
            'name': 1
        })
        var options = {
            page: page,
            limit: limit
        }

        JobSkillSchema.aggregatePaginate(aggregate, options, function (err, results, pageCount, count) {
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
                    "response_message": "Job skill list.",
                    "response_data": data
                });

            }
        });
    },
    //Add Job Skill
    addJobSkill: async function (data, callback) {
        if (data) {
            JobSkillSchema.findOne({
                    name: data.name
                },
                function (err, result) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": {}
                        });
                    } else {
                        if (result != null) {
                            callback({
                                "response_code": 2008,
                                "response_message": "Job skill already exist",
                                "response_data": result
                            });
                        } else {
                            new JobSkillSchema(data).save(function (err, result) {
                                if (err) {
                                    callback({
                                        "response_code": 5005,
                                        "response_message": "INTERNAL DB ERROR",
                                        "response_data": {}
                                    });
                                } else {

                                    callback({
                                        "response_code": 2000,
                                        "response_message": "Job skill add successfully."
                                    });
                                }
                            });
                        }
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
    //Edit Job Skill
    editJobSkill: async function (data, callback) {
        if (data) {
            JobSkillSchema.findOne({
                    _id: data._id
                },
                function (err, result) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": {}
                        });
                    } else {
                        if (result == null) {
                            callback({
                                "response_code": 2008,
                                "response_message": "Job skill not exist",
                                "response_data": result
                            });
                        } else {
                            JobSkillSchema.updateOne({
                                    _id: data._id
                                }, {
                                    $set: {
                                        name: data.name,
                                        ar_name: data.ar_name,
                                    }
                                }, {
                                    upsert: false
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
                                            "response_message": "Job skill updated successfully."
                                        });

                                    }
                                })
                        }
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
    //Delete Job Skill
    deleteJobSkill: async function (data, callback) {
        if (data) {

            JobSkillSchema.findOne({
                    _id: data._id
                },
                function (err, result) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": {}
                        });
                    } else {
                        if (result == null) {
                            callback({
                                "response_code": 2008,
                                "response_message": "Job skill not exist",
                                "response_data": result
                            });
                        } else {
                            JobSkillSchema.remove({
                                _id: data._id
                            }, function (err, result) {
                                if (err) {
                                    callback({
                                        "response_code": 5005,
                                        "response_message": "INTERNAL DB ERROR",
                                        "response_data": err
                                    });
                                } else {
                                    callback({
                                        "response_code": 2000,
                                        "response_message": "Job skill deleted."
                                    });
                                }
                            });
                        }
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
    //Degree List
    listDegree: function (data, callback) {

        var page = 1,
            limit = 20,
            query = {};

        if (data.page) {
            page = parseInt(data.page);
        }
        if (data.limit) {
            limit = parseInt(data.limit);
        }
        if (data.name) {
            query = {
                "$or": [{
                    "name": new RegExp(data.name, 'i')
                }, {
                    "ar_name": new RegExp(data.name, 'i')
                }]
            }
        }
        if (data._id) {
            query['_id'] = data._id;
        }

        var aggregate = DegreeSchema.aggregate();
        aggregate.match(query);

        aggregate.project({
            _id: 1,
            createdAt: 1,
            name: 1,
            ar_name: 1,
        });
        aggregate.sort({
            'name': 1
        })
        var options = {
            page: page,
            limit: limit
        }

        DegreeSchema.aggregatePaginate(aggregate, options, function (err, results, pageCount, count) {
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
                    "response_message": "Degree list.",
                    "response_data": data
                });

            }
        });
    },
    //Add Degree
    addDegree: async function (data, callback) {
        if (data) {
            DegreeSchema.findOne({
                    name: data.name
                },
                function (err, result) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": {}
                        });
                    } else {
                        if (result != null) {
                            callback({
                                "response_code": 2008,
                                "response_message": "Degree already exist",
                                "response_data": result
                            });
                        } else {
                            new DegreeSchema(data).save(function (err, result) {
                                if (err) {
                                    callback({
                                        "response_code": 5005,
                                        "response_message": "INTERNAL DB ERROR",
                                        "response_data": {}
                                    });
                                } else {

                                    callback({
                                        "response_code": 2000,
                                        "response_message": "Degree add successfully."
                                    });
                                }
                            });
                        }
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
    //Edit Degree
    editDegree: async function (data, callback) {
        if (data) {
            DegreeSchema.findOne({
                    _id: data._id
                },
                function (err, result) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": {}
                        });
                    } else {
                        if (result == null) {
                            callback({
                                "response_code": 2008,
                                "response_message": "Degree not exist",
                                "response_data": result
                            });
                        } else {
                            DegreeSchema.updateOne({
                                    _id: data._id
                                }, {
                                    $set: {
                                        name: data.name,
                                        ar_name: data.ar_name,
                                    }
                                }, {
                                    upsert: false
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
                                            "response_message": "Degree updated successfully."
                                        });

                                    }
                                })
                        }
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
    //Delete Degree
    deleteDegree: async function (data, callback) {
        if (data) {

            DegreeSchema.findOne({
                    _id: data._id
                },
                function (err, result) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": {}
                        });
                    } else {
                        if (result == null) {
                            callback({
                                "response_code": 2008,
                                "response_message": "Degree not exist",
                                "response_data": result
                            });
                        } else {
                            DegreeSchema.remove({
                                _id: data._id
                            }, function (err, result) {
                                if (err) {
                                    callback({
                                        "response_code": 5005,
                                        "response_message": "INTERNAL DB ERROR",
                                        "response_data": err
                                    });
                                } else {
                                    callback({
                                        "response_code": 2000,
                                        "response_message": "Degree deleted."
                                    });
                                }
                            });
                        }
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

    //Job Industry List
    listJobIndustry: function (data, callback) {

        var page = 1,
            limit = 20,
            query = {};

        if (data.page) {
            page = parseInt(data.page);
        }
        if (data.limit) {
            limit = parseInt(data.limit);
        }
        if (data.name) {
            query = {
                "$or": [{
                    "name": new RegExp(data.name, 'i')
                }, {
                    "ar_name": new RegExp(data.name, 'i')
                }]
            }
        }
        if (data._id) {
            query['_id'] = data._id;
        }

        var aggregate = JobIndustrySchema.aggregate();
        aggregate.match(query);

        aggregate.project({
            _id: 1,
            createdAt: 1,
            name: 1,
            ar_name: 1,
        });
        aggregate.sort({
            'name': 1
        })
        var options = {
            page: page,
            limit: limit
        }

        JobIndustrySchema.aggregatePaginate(aggregate, options, function (err, results, pageCount, count) {
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
                    "response_message": "Industry list.",
                    "response_data": data
                });

            }
        });
    },
    //Add Job Industry
    addJobIndustry: async function (data, callback) {
        if (data) {
            JobIndustrySchema.findOne({
                    name: data.name
                },
                function (err, result) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": {}
                        });
                    } else {
                        if (result != null) {
                            callback({
                                "response_code": 2008,
                                "response_message": "Industry already exist",
                                "response_data": result
                            });
                        } else {
                            new JobIndustrySchema(data).save(function (err, result) {
                                if (err) {
                                    callback({
                                        "response_code": 5005,
                                        "response_message": "INTERNAL DB ERROR",
                                        "response_data": {}
                                    });
                                } else {

                                    callback({
                                        "response_code": 2000,
                                        "response_message": "Industry add successfully."
                                    });
                                }
                            });
                        }
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
    //Edit Job Industry
    editJobIndustry: async function (data, callback) {
        if (data) {
            JobIndustrySchema.findOne({
                    _id: data._id
                },
                function (err, result) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": {}
                        });
                    } else {
                        if (result == null) {
                            callback({
                                "response_code": 2008,
                                "response_message": "Industry not exist",
                                "response_data": result
                            });
                        } else {
                            JobIndustrySchema.updateOne({
                                    _id: data._id
                                }, {
                                    $set: {
                                        name: data.name,
                                        ar_name: data.ar_name,
                                    }
                                }, {
                                    upsert: false
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
                                            "response_message": "Industry updated successfully."
                                        });

                                    }
                                })
                        }
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
    //Delete Job Industry
    deleteJobIndustry: async function (data, callback) {
        if (data) {

            JobIndustrySchema.findOne({
                    _id: data._id
                },
                function (err, result) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": {}
                        });
                    } else {
                        if (result == null) {
                            callback({
                                "response_code": 2008,
                                "response_message": "Industry not exist",
                                "response_data": result
                            });
                        } else {
                            
                            JobIndustrySchema.remove({
                                _id: data._id
                            }, function (err, result) {
                                if (err) {
                                    callback({
                                        "response_code": 5005,
                                        "response_message": "INTERNAL DB ERROR",
                                        "response_data": err
                                    });
                                } else {
                                    callback({
                                        "response_code": 2000,
                                        "response_message": "Industry deleted."
                                    });
                                }
                            });
                        }
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
    //Job Country List
    listJobCountry: function (data, callback) {

        var page = 1,
            limit = 20,
            query = {};

        if (data.page) {
            page = parseInt(data.page);
        }
        if (data.limit) {
            limit = parseInt(data.limit);
        }
        if (data.name) {
            query = {
                "$or": [{
                    "name": new RegExp(data.name, 'i')
                }, {
                    "ar_name": new RegExp(data.name, 'i')
                }]
            }
        }
        if (data._id) {
            query['_id'] = data._id;
        }

        var aggregate = JobCountrySchema.aggregate();
        aggregate.match(query);
        aggregate.lookup({
            from: 'job-cities',
            localField: '_id',
            foreignField: 'countryId',
            as: 'city'
        });
        aggregate.project({
            _id: 1,
            createdAt: 1,
            name: 1,
            city_details: "$city"
        });
        aggregate.sort({
            'name': 1
        })
        var options = {
            page: page,
            limit: limit
        }

        JobCountrySchema.aggregatePaginate(aggregate, options, function (err, results, pageCount, count) {
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
                    "response_message": "Country list.",
                    "response_data": data
                });

            }
        });
    },
    //Add Job Country
    addJobCountry: async function (data, callback) {
        if (data) {
            JobCountrySchema.findOne({
                    name: data.name
                },
                function (err, result) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": {}
                        });
                    } else {
                        if (result != null) {
                            callback({
                                "response_code": 2008,
                                "response_message": "Country already exist",
                                "response_data": result
                            });
                        } else {
                            new JobCountrySchema(data).save(function (err, result) {
                                if (err) {
                                    callback({
                                        "response_code": 5005,
                                        "response_message": "INTERNAL DB ERROR",
                                        "response_data": {}
                                    });
                                } else {

                                    callback({
                                        "response_code": 2000,
                                        "response_message": "Country add successfully."
                                    });
                                }
                            });
                        }
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
    //Edit Job Country
    editJobCountry: async function (data, callback) {
        if (data) {
            JobCountrySchema.findOne({
                    _id: data._id
                },
                function (err, result) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": {}
                        });
                    } else {
                        if (result == null) {
                            callback({
                                "response_code": 2008,
                                "response_message": "Country not exist",
                                "response_data": result
                            });
                        } else {
                            JobCountrySchema.updateOne({
                                    _id: data._id
                                }, {
                                    $set: {
                                        name: data.name
                                    }
                                }, {
                                    upsert: false
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
                                            "response_message": "Country updated successfully."
                                        });

                                    }
                                })
                        }
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
    //Delete Job Country
    deleteJobCountry: async function (data, callback) {
        if (data) {

            JobCountrySchema.findOne({
                    _id: data._id
                },
                function (err, result) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": {}
                        });
                    } else {
                        if (result == null) {
                            callback({
                                "response_code": 2008,
                                "response_message": "Country not exist",
                                "response_data": result
                            });
                        } else {
                            
                            JobCountrySchema.remove({
                                _id: data._id
                            }, async function (err, result) {
                                if (err) {
                                    callback({
                                        "response_code": 5005,
                                        "response_message": "INTERNAL DB ERROR",
                                        "response_data": err
                                    });
                                } else {

                                    let cities = await JobCitySchema.find({
                                        countryId: data._id
                                    }).exec(function (err, result) {
                                        if (err) {
                                            console.log("Error",err);
                                            
                        
                                        } else {
                                            if (result.length > 0) {
                                                for (let index = 0; index < result.length; index++) {
                                                    let city_id = result[index]._id;
                                                    
                                                    
                                                    JobCitySchema.remove({
                                                        _id: city_id
                                                    }, function (err, result) {
                                                        if (err) {
                                                            console.log("Error",err);
                                                        }
                                                    });
                                                }
                                            } 
                                        }
                                    })
                                       

                                    callback({
                                        "response_code": 2000,
                                        "response_message": "Country deleted."
                                    });
                                }
                            });
                        }
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
     //Job City List
     listJobCity: function (data, callback) {

        var page = 1,
            limit = 20,
            query = {};

        if (data.page) {
            page = parseInt(data.page);
        }
        if (data.limit) {
            limit = parseInt(data.limit);
        }
        if (data.name) {
            query = {
                "$or": [{
                    "name": new RegExp(data.name, 'i')
                }, {
                    "ar_name": new RegExp(data.name, 'i')
                }]
            }
        }
        if (data._id) {
            query['_id'] = data._id;
        }
        if (data.countryId) {
            query['countryId'] = data.countryId;
        }

        var aggregate = JobCitySchema.aggregate();
        aggregate.match(query);
        aggregate.lookup({
            from: 'job-countries',
            localField: 'countryId',
            foreignField: '_id',
            as: 'country'
        });
        aggregate.project({
            _id: 1,
            createdAt: 1,
            name: 1,
            countryId:1,
            country_details: {
                '$arrayElemAt': [
                    [{
                        _id: {
                            '$arrayElemAt': ['$country._id', 0]
                        },
                        name: {
                            '$arrayElemAt': ['$country.name', 0]
                        }

                    }], 0
                ]
            },
        });
        aggregate.sort({
            'name': 1
        })
        var options = {
            page: page,
            limit: limit
        }

        JobCitySchema.aggregatePaginate(aggregate, options, function (err, results, pageCount, count) {
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
                    "response_message": "Country list.",
                    "response_data": data
                });

            }
        });
    },


    //Job List
    listJob: async function (data, callback) {

        console.log('data----------->',data)
        var page = 1,
            limit = 20,
            query = {};

        var queryName = {};
        var querySearchText = {};
        let companyDemoLogo = config.companyDemoLogoPath;
        if (data.page) {
            page = parseInt(data.page);
        }
        if (data.limit) {
            limit = parseInt(data.limit);
        }
        if (data._id) {
            query['_id'] = data._id;
        }
        if (data.employerId) {
            query['employerId'] = data.employerId;
        }

        if (data.name) {

            queryName = {
                $or: [
                    { name: { $regex: data.name, $options: "i" } },
                    { ar_name: { $regex: data.name, $options: "i" } }
                ]
            }
            //query['name'] = new RegExp(data.name, 'i');
        }

        if (data.city) {
            query['city'] = data.city;
        }

        if (data.country) {
            query['country'] = data.country;
        }


        if (data.status) {
            query['status'] = data.status;
        }


        console.log('query----------->',query)

        var aggregate = JobSchema.aggregate();
        aggregate.match(query);

        aggregate.lookup({
            from: 'employers',
            localField: 'employerId',
            foreignField: '_id',
            as: 'User'
        });
        aggregate.lookup({
            from: 'companies',
            localField: 'employerId',
            foreignField: 'employerId',
            as: 'Company'
        });
        aggregate.lookup({
            from: 'job-countries',
            localField: 'country',
            foreignField: '_id',
            as: 'country'
        });
        aggregate.lookup({
            from: 'job-cities',
            localField: 'city',
            foreignField: '_id',
            as: 'city'
        });
        aggregate.unwind({
            path: "$job_tag",
            preserveNullAndEmptyArrays: true
        });
        aggregate.lookup({
            from: 'job-tags',
            localField: 'job_tag',
            foreignField: '_id',
            as: 'Jobtag'
        });
        aggregate.unwind({
            path: "$Jobtag",
            preserveNullAndEmptyArrays: true
        });
        aggregate.lookup({
            from: 'job-types',
            localField: 'job_type',
            foreignField: '_id',
            as: 'Jobtype'
        });
        aggregate.lookup({
            from: 'job-industries',
            localField: 'job_industry',
            foreignField: '_id',
            as: 'Jobindustry'
        });
        aggregate.lookup({
            from: 'job-levels',
            localField: 'job_level',
            foreignField: '_id',
            as: 'Joblevel'
        });
        aggregate.unwind({
            path: "$job_skill",
            preserveNullAndEmptyArrays: true
        });
        aggregate.lookup({
            from: 'job-skills',
            localField: 'job_skill',
            foreignField: '_id',
            as: 'Jobskill'
        });
        aggregate.unwind({
            path: "$Jobskill",
            preserveNullAndEmptyArrays: true
        });

        aggregate.group({
            "_id": "$_id",
            createdAt: {
                "$first": "$createdAt"
            },
            name: {
                "$first": "$name"
            },
            ar_name: {
                "$first": "$ar_name"
            },
            employerId: {
                "$first": "$employerId"
            },
            country: {
                "$first": "$country"
            },
            city: {
                "$first": "$city"
            },
            job_tag: {
                "$addToSet": "$Jobtag"
            },
            job_skill: {
                "$addToSet": "$Jobskill"
            },
            job_type: {
                "$first": "$Jobtype"
            },
            Jobindustry: {
                "$first": "$Jobindustry"
            },
            Joblevel: {
                "$first": "$Joblevel"
            },
            description: {
                "$first": "$description"
            },
            ar_description: {
                "$first": "$ar_description"
            },
            application_email_id: {
                "$first": "$application_email_id"
            },
            Company: {
                "$first": "$Company"
            },
            employers_details: {
                "$first": "$User"
            },
            job_expire_date: {
                "$first": "$job_expire_date"
            },
            status: {
                "$first": "$status"
            },

        });

        aggregate.project({
            _id: 1,
            createdAt: 1,
            name: 1,
            ar_name: 1,
            employerId: 1,
            country: {
                '$arrayElemAt': [
                    [{
                        name: {
                            '$arrayElemAt': ['$country.name', 0]
                        },
                        _id: {
                            '$arrayElemAt': ['$country._id', 0]
                        },
                    }], 0
                ]
            },
            city: {
                '$arrayElemAt': [
                    [{
                        name: {
                            '$arrayElemAt': ['$city.name', 0]
                        },
                        _id: {
                            '$arrayElemAt': ['$city._id', 0]
                        },
                    }], 0
                ]
            },
            job_tag: 1,
            job_type: 1,
            job_skill: 1,
            job_industry: {
                '$arrayElemAt': [
                    [{
                        _id: {
                            '$arrayElemAt': ['$Jobindustry._id', 0]
                        },
                        name: {
                            '$arrayElemAt': ['$Jobindustry.name', 0]
                        },
                        ar_name: {
                            '$arrayElemAt': ['$Jobindustry.ar_name', 0]
                        },

                    }], 0
                ]
            },
            job_level: {
                '$arrayElemAt': [
                    [{
                        _id: {
                            '$arrayElemAt': ['$Joblevel._id', 0]
                        },
                        name: {
                            '$arrayElemAt': ['$Joblevel.name', 0]
                        },
                        ar_name: {
                            '$arrayElemAt': ['$Joblevel.ar_name', 0]
                        },

                    }], 0
                ]
            },
            company_details: {
                '$arrayElemAt': [
                    [{
                        _id: {
                            '$arrayElemAt': ['$Company._id', 0]
                        },
                        name: {
                            '$arrayElemAt': ['$Company.name', 0]
                        },
                        designation: {
                            '$arrayElemAt': ['$Company.designation', 0]
                        },
                        logo: {
                            $cond: {
                                if: {
                                    $in: [null, "$Company.logo"]
                                },
                                then: {
                                    $concat: [config.liveUrl, companyDemoLogo]
                                },
                                else: {
                                    $concat: [config.liveUrl, {
                                        "$arrayElemAt": ["$Company.logo", 0]
                                    }]
                                }
                            }
                        },

                    }], 0
                ]
            },
            employers_details: {
                '$arrayElemAt': [
                    [{
                        _id: {
                            '$arrayElemAt': ['$employers_details._id', 0]
                        },
                        fname: {
                            '$arrayElemAt': ['$employers_details.fname', 0]
                        },
                        lname: {
                            '$arrayElemAt': ['$employers_details.lname', 0]
                        },
                        profile_image: {
                            $cond: {
                                if: {
                                    $in: ["NORMAL", "$employers_details.type"]
                                },
                                then: {
                                    $cond: {
                                        if: {
                                            $in: [null, "$employers_details.profile_image"]
                                        },
                                        then: config.liveUrl + config.userDemoPicPath,
                                        else: {
                                            $concat: [config.liveUrl, {
                                                "$arrayElemAt": ["$employers_details.profile_image", 0]
                                            }]
                                            // "$arrayElemAt": ["$User.profile_image", 0]
                                        }
                                    }

                                },
                                else: {
                                    $cond: {
                                        if: {
                                            $eq: [{
                                                '$arrayElemAt': ['$employers_details.socialLogin.image', 0]
                                            }, null]
                                        },
                                        then: config.liveUrl + config.userDemoPicPath,
                                        else: {
                                            '$arrayElemAt': ['$employers_details.socialLogin.image', 0]

                                        }
                                    }
                                }
                            }
                        },

                    }], 0
                ]
            },
            description: 1,
            ar_description: 1,
            application_email_id: 1,
            job_expire_date: 1,
            status: 1,
        });

        aggregate.sort({
            'createdAt': 1
        })
        var options = {
            page: page,
            limit: limit
        }

        JobSchema.aggregatePaginate(aggregate, options, function (err, results, pageCount, count) {
            if (err) {
                callback({
                    "response_code": 5005,
                    "response_message": err,
                    "response_data": {}
                });

            } else {
                let counter = {}

                var data = {
                    docs: results,
                    pages: pageCount,
                    total: count,
                    limit: limit,
                    page: page
                }
                callback({
                    "response_code": 2000,
                    "response_message": "Job list.",
                    "response_data": data
                });

            }
        });
    },



    //Add Job City
    addJobCity: async function (data, callback) {
        if (data) {
            JobCitySchema.findOne({
                    name: data.name,
                    countryId: data.countryId
                },
                function (err, result) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": {}
                        });
                    } else {
                        if (result != null) {
                            callback({
                                "response_code": 2008,
                                "response_message": "City already exist that country",
                                "response_data": result
                            });
                        } else {
                            new JobCitySchema(data).save(function (err, result) {
                                if (err) {
                                    callback({
                                        "response_code": 5005,
                                        "response_message": "INTERNAL DB ERROR",
                                        "response_data": {}
                                    });
                                } else {

                                    callback({
                                        "response_code": 2000,
                                        "response_message": "City add successfully."
                                    });
                                }
                            });
                        }
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
    //Edit Job City
    editJobCity: async function (data, callback) {
        if (data) {
            JobCitySchema.findOne({
                    _id: data._id
                },
                function (err, result) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": {}
                        });
                    } else {
                        if (result == null) {
                            callback({
                                "response_code": 2008,
                                "response_message": "City not exist",
                                "response_data": result
                            });
                        } else {
                            JobCitySchema.updateOne({
                                    _id: data._id
                                }, {
                                    $set: {
                                        name: data.name,
                                        countryId: data.countryId
                                    }
                                }, {
                                    upsert: false
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
                                            "response_message": "City updated successfully."
                                        });

                                    }
                                })
                        }
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
    //Delete Job City
    deleteJobCity: async function (data, callback) {
        if (data) {

            JobCitySchema.findOne({
                    _id: data._id
                },
                function (err, result) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": {}
                        });
                    } else {
                        if (result == null) {
                            callback({
                                "response_code": 2008,
                                "response_message": "City not exist",
                                "response_data": result
                            });
                        } else {
                            JobCitySchema.remove({
                                _id: data._id
                            }, function (err, result) {
                                if (err) {
                                    callback({
                                        "response_code": 5005,
                                        "response_message": "INTERNAL DB ERROR",
                                        "response_data": err
                                    });
                                } else {
                                    callback({
                                        "response_code": 2000,
                                        "response_message": "City deleted."
                                    });
                                }
                            });
                        }
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
    //User notification list
    listNotification: (data, callback) => {
        if (!data.user_id || typeof data.user_id === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide user id",
                "response_data": {}
            });
        } else {
            NotificationModels.listNotification(data, function (result) {
                callback(result);
            });
        }
    },
    //User notification status change
    notificationstatuschange: (data, callback) => {
        if (!data.notification_id || typeof data.notification_id === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide notification id",
                "response_data": {}
            });
        } else {
            NotificationModels.notificationStatusChange(data, function (result) {
                callback(result);
            });
        }
    },

    
    //listDashboard
    listDashboard: async function (data, callback) {
        if (data) {

            //listDashboard
            var employerTotal = await EmployerSchema.countDocuments({});
            var employeeTotal = await CandidateSchema.countDocuments({});
            var jobTotal = await JobSchema.countDocuments({});
            var applicationTotal = await ApplicationSchema.countDocuments({});

            callback({
                "response_code": 2000,
                "response_message": "Dashboard Details",
                "response_data": {
                    employerTotal:employerTotal,
                    employeeTotal:employeeTotal,
                    jobTotal:jobTotal,
                    applicationTotal:applicationTotal
                }
            });

        } else {
            callback({
                "response_code": 5005,
                "response_message": "Something Went Wrong",
                "response_data": { }
            });
        }
    },

};
module.exports = adminModels;