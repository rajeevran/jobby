var EmployerSchema = require('../schema/employer');
var CandidateSchema = require('../schema/candidate');
var config = require('../config');
var async = require("async");
var mongo = require('mongodb');
var ObjectID = mongo.ObjectID;
var bcrypt = require('bcrypt');
var fs = require('fs');
var jwt = require('jsonwebtoken');
var mailProperty = require('../modules/sendMail');
var secretKey = config.secretKey;
var cron = require('node-cron');

//create auth token
createToken = (admin) => {
    var tokenData = {
        id: admin._id
    };
    var token = jwt.sign(tokenData, secretKey, {
        expiresIn: 86400
    });
    return token;
};

var UserModels = {

    //register employer
    registerEmployer: function (data, callback) {
        console.log(data);

        if (data) {
            EmployerSchema.findOne({
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
                            new EmployerSchema(data).save(function (err, result) {
                                if (err) {
                                    callback({
                                        "response_code": 50051,
                                        "response_message": "INTERNAL DB ERROR",
                                        "response_data": err
                                    });
                                } else {

                                    mailProperty('emailVerificationMail')(data.email, {
                                        userType: "Employer",
                                        name: data.fname + ' ' + data.lname,
                                        email: data.email,
                                        verification_code: data.verification_code,
                                        site_url: config.liveUrl,
                                        date: new Date()
                                    }).send();

                                    callback({
                                        "response_code": 2000,
                                        "response_message": "You have registered successfully.Please verify your email account."
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
    //register employer
    registerEmployee: function (data, callback) {
        if (data) {
            EmployerSchema.findOne({
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
                            new EmployerSchema(data).save(function (err, result) {
                                if (err) {
                                    callback({
                                        "response_code": 5005,
                                        "response_message": "INTERNAL DB ERROR",
                                        "response_data": {}
                                    });
                                } else {

                                    mailProperty('emailVerificationMail')(data.email, {
                                        userType: "Employee",
                                        name: data.fname + ' ' + data.lname,
                                        email: data.email,
                                        verification_code: data.verification_code,
                                        site_url: config.liveUrl,
                                        date: new Date()
                                    }).send();

                                    callback({
                                        "response_code": 2000,
                                        "response_message": "You have registered successfully.Please verify your email account."
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

            if (data.usertype == "employer") {

                let employer = await EmployerSchema.findOne({
                    email: data.email
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

                            if (result.email_verify == 'no') {
                                var all_result = {
                                    authtoken: '',
                                    _id: result._id,
                                    name: result.fname + ' ' + result.lname,
                                    email: result.email
                                }
                                callback({
                                    "response_code": 5010,
                                    "response_message": "Your account is not activated. Please activate your account.",
                                    "response_data": all_result
                                });
                            } else if (result.status == 'no') {
                                var all_result = {
                                    authtoken: '',
                                    _id: result._id,
                                    name: result.fname + ' ' + result.lname,
                                    email: result.email
                                }
                                callback({
                                    "response_code": 5010,
                                    "response_message": "Your account is temporarily blocked. Please contact admin.",
                                    "response_data": all_result
                                });
                            } else {

                                var comparePass = bcrypt.compare(data.password, result.password);

                                if (comparePass == true) {

                                    var token = createToken(result);
                                    EmployerSchema.update({
                                        _id: result._id
                                    }, {
                                        $set: {
                                            devicetoken: data.devicetoken,
                                            pushtoken: data.pushtoken,
                                            apptype: data.apptype
                                        }
                                    }, function (err, resUpdate) {
                                        if (err) {
                                            callback({
                                                "response_code": 5005,
                                                "response_message": "INTERNAL DB ERROR",
                                                "response_data": {}
                                            });
                                        } else {

                                            let profile_image = '';

                                            if (profile_image == null) {
                                                profile_image = config.liveUrl + config.userDemoPicPath;
                                            } else {
                                                profile_image = config.liveUrl + result.profile_image;
                                            }
                                            var all_result = {
                                                authtoken: token,
                                                _id: result._id,
                                                name: result.fname + ' ' + result.lname,
                                                email: result.email,
                                                profile_image: profile_image,

                                            }
                                            callback({
                                                "response_code": 2000,
                                                "response_message": "Logged your account",
                                                "response_data": all_result
                                            });
                                        }
                                    });
                                } else {
                                    callback({
                                        "response_code": 5002,
                                        "response_message": "Wrong password or email. Please provide registered details.",
                                        "response_data": {}
                                    });
                                }
                            }


                        }
                    }
                })

            }
            if (data.usertype == "employee") {

                let employee = await CandidateSchema.findOne({
                    email: data.email
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

                            if (result.email_verify == 'no') {
                                var all_result = {
                                    authtoken: '',
                                    _id: result._id,
                                    name: result.fname + ' ' + result.fnlnameame,
                                    email: result.email
                                }
                                callback({
                                    "response_code": 5010,
                                    "response_message": "Your account is not activated. Please activate your account.",
                                    "response_data": all_result
                                });
                            } else if (result.status == 'no') {
                                var all_result = {
                                    authtoken: '',
                                    _id: result._id,
                                    name: result.fname + ' ' + result.fnlnameame,
                                    email: result.email
                                }
                                callback({
                                    "response_code": 5010,
                                    "response_message": "Your account is temporarily blocked. Please contact admin.",
                                    "response_data": all_result
                                });
                            } else {

                                var comparePass = bcrypt.compareSync(data.password, result.password);
                                if (comparePass == true) {

                                    var token = createToken(result);
                                    CandidateSchema.update({
                                        _id: result._id
                                    }, {
                                        $set: {
                                            devicetoken: data.devicetoken,
                                            pushtoken: data.pushtoken,
                                            apptype: data.apptype
                                        }
                                    }, function (err, resUpdate) {
                                        if (err) {
                                            callback({
                                                "response_code": 5005,
                                                "response_message": "INTERNAL DB ERROR",
                                                "response_data": {}
                                            });
                                        } else {

                                            let profile_image = '';

                                            if (profile_image == null) {
                                                profile_image = config.liveUrl + config.userDemoPicPath;
                                            } else {
                                                profile_image = config.liveUrl + result.profile_image;
                                            }
                                            var all_result = {
                                                authtoken: token,
                                                _id: result._id,
                                                name: result.fname + ' ' + result.fnlnameame,
                                                email: result.email,
                                                profile_image: profile_image,

                                            }
                                            callback({
                                                "response_code": 2000,
                                                "response_message": "Logged your account",
                                                "response_data": all_result
                                            });
                                        }
                                    });
                                } else {
                                    callback({
                                        "response_code": 5002,
                                        "response_message": "Wrong password or email. Please provide registered details.",
                                        "response_data": {}
                                    });
                                }
                            }


                        }
                    }
                })

            }

        } else {
            callback({
                "response_code": 5005,
                "response_message": "INTERNAL DB ERROR",
                "response_data": {}
            });
        }
    },
};
module.exports = UserModels;