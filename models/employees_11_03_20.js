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
var commonModule = require('../utility/common');
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

var employeeModels = {

    //register employee
    register: function (data, callback) {
        if (data) {
            CandidateSchema.findOne({
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

                            data.profile_complete_percentage = 1.25 * 3; // for first,last name and employeeType
                            data.preferJob_complete_percentage = 1.25; // for job role
                            data.contact_complete_percentage = 6.25; // for email

                            new CandidateSchema(data).save(function (err, result) {
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
    // Social Login
    socialLogin: async function (data, callback) {

        if (data) {
            var profile_image = '';
            let employee = await CandidateSchema.findOne({
                email: data.email
            }, function (err, result) {
                if (err) {
                    callback({
                        "response_code": 5005,
                        "response_message": err,
                        "response_data": {}
                    });

                }
            })

            if (employee != null) {

                if (employee.status == 'no') {
                    var all_result = {
                        authtoken: '',
                        _id: employee._id,
                        name: employee.fname + ' ' + employee.lname,
                        email: employee.email
                    }
                    callback({
                        "response_code": 5010,
                        "response_message": "Your account is temporarily blocked. Please contact admin.",
                        "response_data": all_result
                    });
                }

                if (employee.type == "NORMAL") {

                    callback({
                        "response_code": 2008,
                        "response_message": "You are not login throug social platform",
                        "response_data": {}
                    });

                } else if (employee.type != data.socialLogin.type) {

                    callback({
                        "response_code": 2008,
                        "response_message": "You are not login via " + employee.type,
                        "response_data": {}
                    });
                } else {

                    let token = createToken(employee);
                    employee.authtoken = token;
                    employee.type = data.socialLogin.type;
                    employee.save();

                    if (employee.profile_image_updated == true) {
                        profile_image = employee.profile_image
                    } else {
                        profile_image = employee.socialLogin.image;
                    }

                    if (profile_image == '' || profile_image == null) {
                        profile_image = config.liveUrl + config.userDemoPicPath;
                    }

                    callback({
                        "response_code": 2008,
                        "response_message": "Email address already exist",
                        "response_data": {
                            authtoken: employee.authtoken,
                            _id: employee._id,
                            name: employee.fname + ' ' + employee.lname,
                            email: employee.email,
                            socialData: employee.socialLogin,
                            user_type: "employees",
                            profile_image: profile_image
                        }
                    })

                }


            } else {
                data.profile_complete_percentage = 1.25 * 2; // for first and last name
                data.contact_complete_percentage = 6.25; // for email
                if (data.socialLogin.image != null) {
                    data.profile_complete_percentage = data.profile_complete_percentage + 1.25; // for profile image
                }

                data._id = new ObjectID;
                let token = createToken(data);
                if (token) {
                    //data.authtoken = token;
                    //data.user_type = 'Normal User';
                    data.type = data.socialLogin.type;
                    data.email_verify = 'yes';


                    new CandidateSchema(data).save(function (err, result) {
                        if (err) {

                            callback({
                                "response_code": 5005,
                                "response_message": "INTERNAL DB ERROR",
                                "response_data": {}
                            });
                        } else {

                            profile_image = data.socialLogin.image;

                            if (profile_image == '' || profile_image == null) {
                                profile_image = config.liveUrl + config.userDemoPicPath;
                            }
                            mailProperty('socialSignUp')(data.email, {
                                name: data.fname + ' ' + data.lname,
                                userType: "Employee",
                                email: data.email,
                                site_url: config.liveUrl,
                                email_validation_url: ``
                            }).send();
                            var all_result = {
                                authtoken: token,
                                _id: result._id,
                                name: data.fname + ' ' + data.lname,
                                email: result.email,
                                socialLogin: result.socialLogin,
                                user_type: "employees",
                                profile_image: profile_image
                            }
                            callback({
                                "response_code": 2000,
                                "response_message": "User Successfully Logged in.",
                                "response_data": all_result
                            });
                        }
                    });
                }

            }

        } else {
            callback({
                "response_code": 5005,
                "response_message": "INTERNAL DB ERROR",
                "response_data": {}
            });
        }
    },
    //Email Verification 
    emailVerify: function (data, callback) {
        if (data) {
            CandidateSchema.count({
                email: data.email
            }).exec(function (err, resCount) {
                if (err) {
                    callback({
                        "response_code": 5005,
                        "response_message": "INTERNAL DB ERROR",
                        "response_data": {}
                    });
                } else {
                    if (resCount > 0) {
                        CandidateSchema.findOne({
                                verification_code: data.verification_code,
                                email: data.email
                            }, {
                                _id: 1,
                                email: 1,
                                fname: 1,
                                lname: 1,
                                profile_image: 1
                            },
                            function (err, findRes) {

                                if (err) {
                                    callback({
                                        "response_code": 5005,
                                        "response_message": "INTERNAL DB ERROR",
                                        "response_data": {}
                                    });
                                } else {
                                    if (findRes != null) {
                                        CandidateSchema.update({
                                            email: data.email
                                        }, {
                                            $set: {
                                                verification_code: '',
                                                email_verify: 'yes'
                                            }
                                        }, function (err, resUpdate) {
                                            if (err) {
                                                callback({
                                                    "response_code": 5005,
                                                    "response_message": "INTERNAL DB ERROR",
                                                    "response_data": {}
                                                });
                                            } else {
                                                var token = createToken(findRes);

                                                let profile_image = findRes.profile_image;

                                                if (profile_image == null) {
                                                    profile_image = config.liveUrl + config.userDemoPicPath;
                                                } else {
                                                    profile_image = config.liveUrl + findRes.profile_image;
                                                }
                                                var all_result = {
                                                    authtoken: token,
                                                    _id: findRes._id,
                                                    name: findRes.fname + ' ' + findRes.lname,
                                                    email: findRes.email,
                                                    profile_image: profile_image,

                                                }

                                                callback({
                                                    "response_code": 2000,
                                                    "response_message": "Your account has been activated successfully.",
                                                    "response_data": all_result
                                                });
                                            }
                                        });
                                    } else {
                                        callback({
                                            "response_code": 5002,
                                            "response_message": "Verification code is not valid.",
                                            "response_data": {}
                                        });
                                    }
                                }
                            });
                    } else {
                        callback({
                            "response_code": 5002,
                            "response_message": "Email address is not valid.",
                            "response_data": {}
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
    // Resend email verification code
    resendEmailVerifyCode: function (data, callback) {
        if (data) {
            CandidateSchema.findOne({
                    email: data.email
                },
                function (err, findRes) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": {}
                        });
                    } else {
                        if (findRes != null) {
                            CandidateSchema.update({
                                email: data.email
                            }, {
                                $set: {
                                    verification_code: data.verification_code,
                                    email_verify: 'no'
                                }
                            }, function (err, resUpdate) {
                                if (err) {
                                    callback({
                                        "response_code": 5005,
                                        "response_message": "INTERNAL DB ERROR",
                                        "response_data": {}
                                    });
                                } else {

                                    mailProperty('emailVerificationMail')(data.email, {
                                        userType: "Employee",
                                        name: findRes.fname + ' ' + findRes.lname,
                                        email: data.email,
                                        verification_code: data.verification_code,
                                        site_url: config.liveUrl,
                                        date: new Date()
                                    }).send();

                                    callback({
                                        "response_code": 2000,
                                        "response_message": "Please check your registered email address. We send you verification code.",
                                        "response_data": {}
                                    });


                                }
                            });
                        } else {
                            callback({
                                "response_code": 5002,
                                "response_message": "Email address is not valid.",
                                "response_data": {}
                            });
                        }

                    }
                });
        } else {
            callback({
                "response_code": 5002,
                "response_message": "Email address is not valid.",
                "response_data": {}
            });
        }
    },
    //login
    login: async function (data, callback) {
        if (data) {

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

                            bcrypt.compare(data.password.toString(), result.password, function (err, response) {
                                // result == true
                                if (response == true) {

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

                                            let profile_image = result.profile_image;

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
                                                user_type: "employees",
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
                            });
                        }


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
            CandidateSchema.findOne({
                    email: data.email
                }, {
                    fname: 1,
                    lname: 1
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
                            CandidateSchema.update({
                                _id: resDetails._id
                            }, {
                                $set: {
                                    otp: data.otp
                                }
                            }, function (err, result) {
                                if (err) {
                                    callback({
                                        "response_code": 5005,
                                        "response_message": "INTERNAL DB ERROR",
                                        "response_data": {}
                                    });
                                } else {
                                    mailProperty('sendOTPdMail')(data.email, {
                                        otp: data.otp,
                                        email: data.email,
                                        name: resDetails.fname + ' ' + resDetails.lname,
                                        site_url: config.liveUrl,
                                        date: new Date()
                                    }).send();
                                    callback({
                                        "response_code": 2000,
                                        "response_message": "Please check your registered email address. We send OTP.",
                                        "response_data": resDetails
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
    // Reset password
    resetPassword: function (data, callback) {
        if (data) {
            CandidateSchema.findOne({
                    email: data.email
                }, {
                    _id: 1
                },
                function (err, result) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": {}
                        });
                    } else {
                        const saltRounds = 10;
                        bcrypt.hash(data.password, saltRounds, function (err, hash) {

                            if (err) {
                                callback({
                                    "response_code": 5005,
                                    "response_message": "INTERNAL DB ERROR",
                                    "response_data": {}
                                });
                            } else {
                                CandidateSchema.count({
                                    email: data.email,
                                    otp: data.otp
                                }).exec(function (err, resCount) {
                                    if (err) {
                                        callback({
                                            "response_code": 5005,
                                            "response_message": "INTERNAL DB ERROR",
                                            "response_data": {}
                                        });
                                    } else {
                                        if (resCount > 0) {
                                            CandidateSchema.update({
                                                _id: result._id
                                            }, {
                                                $set: {
                                                    otp: '',
                                                    password: hash
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
                                                        "response_code": 2000,
                                                        "response_message": "Password has been changed. You can login your account."
                                                    });
                                                }
                                            });
                                        } else {
                                            callback({
                                                "response_code": 5002,
                                                "response_message": "OTP is not valid.",
                                                "response_data": {}
                                            });
                                        }
                                    }
                                });
                            }
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
    // change password
    changePassword: function (data, callback) {
        if (data) {
            CandidateSchema.findOne({
                    email: data.email
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
                                "response_code": 5002,
                                "response_message": "User does not exist.",
                                "response_data": {}
                            });
                        } else {

                            bcrypt.compare(data.currentpassword.toString(), result.password, function (err, response) {

                                if (response == true) {

                                    const saltRounds = 10;
                                    bcrypt.hash(data.password.toString(), saltRounds, function (err, hash) {

                                        if (err) {
                                            callback({
                                                "response_code": 5005,
                                                "response_message": "INTERNAL DB ERROR",
                                                "response_data": err
                                            });
                                        } else {
                                            CandidateSchema.updateOne({
                                                _id: result._id
                                            }, {
                                                $set: {
                                                    password: hash
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
                                                        "response_code": 2000,
                                                        "response_message": "Password has been changed."
                                                    });
                                                }
                                            });

                                        }
                                    });
                                } else {
                                    callback({
                                        "response_code": 5002,
                                        "response_message": "Current password is wrong.",
                                        "response_data": {}
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
    //Update Email Request 
    updateEmailReq: function (data, callback) {
        if (data) {
            CandidateSchema.findOne({
                    email: data.email
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
                                "response_code": 5002,
                                "response_message": "User is not valid.",
                                "response_data": {}
                            });
                        } else if (result.email == data.newemail) {
                            callback({
                                "response_code": 5002,
                                "response_message": "New email and current email can't be same.",
                                "response_data": {}
                            });
                        } else {
                            CandidateSchema.findOne({
                                    email: data.newemail
                                },
                                function (err, result2) {
                                    if (err) {
                                        callback({
                                            "response_code": 5005,
                                            "response_message": "INTERNAL DB ERROR",
                                            "response_data": {}
                                        });
                                    } else {
                                        if (result2 == null) {

                                            CandidateSchema.updateOne({
                                                _id: result._id
                                            }, {
                                                $set: {
                                                    newemail: data.newemail,
                                                    verification_code: data.verification_code
                                                }
                                            }, function (err, resUpdate) {
                                                if (err) {
                                                    callback({
                                                        "response_code": 5005,
                                                        "response_message": "INTERNAL DB ERROR",
                                                        "response_data": {}
                                                    });
                                                } else {

                                                    mailProperty('changeEmail')(data.email, {
                                                        name: result.fname + ' ' + result.lname,
                                                        email: result.email,
                                                        newemail: data.newemail,
                                                        verification_code: data.verification_code,
                                                        site_url: config.liveUrl,
                                                    }).send();

                                                    var all_result = {
                                                        _id: result._id,
                                                        name: result.fname + ' ' + result.lname,
                                                        email: result.email,
                                                        newemail: data.newemail
                                                    }
                                                    callback({
                                                        "response_code": 2000,
                                                        "response_message": "Please check your email " + data.email + ". Verification code has been send.",
                                                        "response_data": all_result
                                                    });
                                                }
                                            });
                                        } else {
                                            callback({
                                                "response_code": 5002,
                                                "response_message": "New email is already exist with some other account.",
                                                "response_data": {}
                                            });
                                        }

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
    //Update Email  
    updateEmail: function (data, callback) {
        if (data) {
            CandidateSchema.findOne({
                    email: data.email
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
                                "response_code": 5002,
                                "response_message": "User is not valid.",
                                "response_data": {}
                            });
                        } else if (result.newemail == null || result.newemail == undefined) {
                            callback({
                                "response_code": 5002,
                                "response_message": "Email Already Changed.",
                                "response_data": {}
                            });
                        } else {
                            CandidateSchema.findOne({
                                    verification_code: data.verification_code,
                                    email: data.email
                                }, {
                                    _id: 1,
                                    email: 1,
                                    fname: 1,
                                    lname: 1,
                                    profile_image: 1
                                },
                                function (err, findRes) {
                                    if (err) {
                                        callback({
                                            "response_code": 5005,
                                            "response_message": "INTERNAL DB ERROR",
                                            "response_data": {}
                                        });
                                    } else {
                                        if (findRes != null) {

                                            CandidateSchema.updateOne({
                                                email: data.email
                                            }, {
                                                $set: {
                                                    email: result.newemail,
                                                    newemail: null,
                                                    verification_code: '',
                                                }
                                            }, function (err, resUpdate) {
                                                if (err) {
                                                    callback({
                                                        "response_code": 5005,
                                                        "response_message": "INTERNAL DB ERROR",
                                                        "response_data": {}
                                                    });
                                                } else {
                                                    mailProperty('changeEmailSuccess')(result.newemail, {
                                                        name: result.fname + ' ' + result.lname,
                                                        email: result.email,
                                                        site_url: config.liveUrl,
                                                    }).send();
                                                    callback({
                                                        "response_code": 2000,
                                                        "response_message": "Email address updated successfully.",
                                                    });
                                                }
                                            });

                                        } else {
                                            callback({
                                                "response_code": 5002,
                                                "response_message": "Verification code is not valid.",
                                                "response_data": {}
                                            });
                                        }
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
    // block Employee
    blockEmployee: async function (data, callback) {
        if (data) {

            let employee = await CandidateSchema.findOne({
                _id: data._id
            }, function (err, result) {
                if (err) {
                    callback({
                        "response_code": 5005,
                        "response_message": err,
                        "response_data": {}
                    });

                }
            });

            if (employee != null) {

                CandidateSchema.updateOne({
                    _id: data._id
                }, {
                    $set: {
                        status: data.status,
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
                            "response_code": 2000,
                            "response_message": "Status updated successfully.",
                        });
                    }
                });

            } else {
                callback({
                    "response_code": 5002,
                    "response_message": "User is not valid.",
                    "response_data": {}
                });
            }

        } else {
            callback({
                "response_code": 5005,
                "response_message": "INTERNAL DB ERROR",
                "response_data": {}
            });
        }
    },
    //Employee List
    userList: async function (data, callback) {
        if (data) {

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
            }
            if (data.email) {
                query['email'] = data.email;
            }

            var aggregate = CandidateSchema.aggregate();
            aggregate.match(query);
            aggregate.lookup({
                from: 'job-titles',
                localField: 'preferJob.job_role',
                foreignField: '_id',
                as: 'preferJobrole'
            });
            aggregate.lookup({
                from: 'job-levels',
                localField: 'preferJob.job_level',
                foreignField: '_id',
                as: 'preferJoblevel'
            });
            aggregate.lookup({
                from: 'job-industries',
                localField: 'preferJob.job_industry',
                foreignField: '_id',
                as: 'preferIndustry'
            });
            aggregate.lookup({
                from: 'job-types',
                localField: 'preferJob.job_employment_type',
                foreignField: '_id',
                as: 'preferJobtype'
            });
            aggregate.lookup({
                from: 'job-types',
                localField: 'preferJob.job_employment_type',
                foreignField: '_id',
                as: 'preferEmpType'
            });
            aggregate.unwind({
                path: "$workExperience",
                preserveNullAndEmptyArrays: true
            });
            aggregate.lookup({
                from: 'job-industries',
                localField: 'workExperience.industry',
                foreignField: '_id',
                as: 'workIndustry'
            });
            aggregate.unwind({
                path: "$workIndustry",
                preserveNullAndEmptyArrays: true
            });
            aggregate.unwind({
                path: "$education",
                preserveNullAndEmptyArrays: true
            });
            aggregate.lookup({
                from: 'degree-lists',
                localField: 'education.degree',
                foreignField: '_id',
                as: 'educationDegree'
            });
            aggregate.unwind({
                path: "$educationDegree",
                preserveNullAndEmptyArrays: true
            });
            aggregate.unwind({
                path: "$skills",
                preserveNullAndEmptyArrays: true
            });
            aggregate.lookup({
                from: 'job-skills',
                localField: 'skills.skill_id',
                foreignField: '_id',
                as: 'job_skills'
            });
            aggregate.unwind({
                path: "$job_skills",
                preserveNullAndEmptyArrays: true
            });

            aggregate.redact({
                $cond: [{
                        $eq: [
                            "$workExperience.industry",
                            "$workIndustry._id"
                        ]
                    },
                    "$$KEEP",
                    "$$PRUNE"
                ]
            })
            aggregate.redact({
                $cond: [{
                        $eq: [
                            "$education.degree",
                            "$educationDegree._id"
                        ]
                    },
                    "$$KEEP",
                    "$$PRUNE"
                ]
            })

            aggregate.redact({
                $cond: [{
                        $eq: [
                            "$skills.skill_id",
                            "$job_skills._id"
                        ]
                    },
                    "$$KEEP",
                    "$$PRUNE"
                ]
            })

            aggregate.project({
                _id: 1,
                current_job_title: 1,
                type: 1,
                socialLogin: 1,
                fname: 1,
                lname: 1,
                profile_image: {
                    $cond: {
                        if: {
                            $eq: ["$profile_image_updated", true]
                        },
                        then: {
                            $concat: [config.liveUrl, "$profile_image"]
                        },
                        else: {
                            $cond: {
                                if: {
                                    $and: [{
                                            $ne: ["$type", "NORMAL"]
                                        },
                                        {
                                            $ne: ["$socialLogin.image", null]
                                        }
                                    ]
                                },
                                then: "$socialLogin.image",
                                else: config.liveUrl + config.userDemoPicPath
                            }
                        }
                    }
                },
                country: 1,
                city: 1,
                dob: 1,
                nationality: 1,
                resident_country: 1,
                material_status: 1,
                employeeType: 1,
                current_company: 1,
                visa_status: 1,
                driving_licence: 1,
                // profile_complete_percentage: 1,
                email: 1,
                country_code: 1,
                phone_no: 1,
                // contact_complete_percentage: 1,
                preferJob: 1,
                preferJobrole: 1,
                preferJoblevel: 1,
                preferIndustry: 1,
                preferEmpType: 1,
                // preferJob_complete_percentage: 1,
                workExperience: {

                    title: "$workExperience.title",
                    company_name: "$workExperience.company_name",
                    industry: "$workExperience.industry",
                    industry_details: {
                        name: "$workIndustry.name",
                        ar_name: "$workIndustry.ar_name",
                        _id: "$workIndustry._id"
                    },
                    country: "$workExperience.country",
                    city: "$workExperience.city",
                    present_company: "$workExperience.present_company",
                    start: "$workExperience.start",
                    end: "$workExperience.end",
                    description: "$workExperience.description",
                    _id: "$workExperience._id"

                },
                // workExperience_complete_percentage: 1,
                salary: 1,
                // salary_complete_percentage: 1,
                education: {
                    degree_details: {
                        name: "$educationDegree.name",
                        ar_name: "$educationDegree.ar_name",
                        _id: "$educationDegree._id"
                    },
                    degree: "$education.degree",
                    university: "$education.university",
                    country: "$education.country",
                    majorSubject: "$education.majorSubject",
                    gaduationDate: "$education.gaduationDate",
                    grade: "$education.grade",
                    description: "$education.description",
                    _id: "$education._id",
                },
                // education_complete_percentage: 1,
                language: 1,
                // language_complete_percentage: 1,
                skills: {
                    name: "$job_skills.name",
                    ar_name: "$job_skills.ar_name",
                    level: "$skills.level",
                    skill_id: "$skills.skill_id",
                    _id: "$skills._id"

                },
                pecentage: {
                    "$sum": ["$profile_complete_percentage", "$contact_complete_percentage", "$preferJob_complete_percentage", "$workExperience_complete_percentage", "$salary_complete_percentage", "$education_complete_percentage", "$language_complete_percentage", "$skills_complete_percentage"]
                },
                updatedAt: 1
            })

            aggregate.group({
                "_id": "$_id",
                current_job_title: {
                    "$first": "$current_job_title"
                },
                type: {
                    "$first": "$type"
                },
                socialLogin: {
                    "$first": "$socialLogin"
                },
                fname: {
                    "$first": "$fname"
                },
                lname: {
                    "$first": "$lname"
                },
                profile_image_updated: {
                    "$first": "$profile_image_updated"
                },
                profile_image: {
                    "$first": "$profile_image"
                },
                country: {
                    "$first": "$country"
                },
                city: {
                    "$first": "$city"
                },
                dob: {
                    "$first": "$dob"
                },
                nationality: {
                    "$first": "$nationality"
                },
                resident_country: {
                    "$first": "$resident_country"
                },
                material_status: {
                    "$first": "$material_status"
                },
                employeeType: {
                    "$first": "$employeeType"
                },
                current_company: {
                    "$first": "$current_company"
                },
                visa_status: {
                    "$first": "$visa_status"
                },
                driving_licence: {
                    "$first": "$driving_licence"
                },
                profile_complete_percentage: {
                    "$first": "$profile_complete_percentage"
                },
                email: {
                    "$first": "$email"
                },
                country_code: {
                    "$first": "$country_code"
                },
                phone_no: {
                    "$first": "$phone_no"
                },
                contact_complete_percentage: {
                    "$first": "$contact_complete_percentage"
                },
                preferJob: {
                    "$first": "$preferJob"
                },
                preferJobrole: {
                    "$first": "$preferJobrole"
                },
                preferJoblevel: {
                    "$first": "$preferJoblevel"
                },
                preferIndustry: {
                    "$first": "$preferIndustry"
                },
                preferEmpType: {
                    "$first": "$preferEmpType"
                },
                preferJob_complete_percentage: {
                    "$first": "$preferJob_complete_percentage"
                },
                workExperience: {
                    "$addToSet": "$workExperience"
                },
                workExperience_complete_percentage: {
                    "$first": "$workExperience_complete_percentage"
                },
                salary: {
                    "$first": "$salary"
                },
                salary_complete_percentage: {
                    "$first": "$salary_complete_percentage"
                },
                education: {
                    "$addToSet": "$education"
                },
                education_complete_percentage: {
                    "$first": "$education_complete_percentage"
                },
                language: {
                    "$first": "$language"
                },
                language_complete_percentage: {
                    "$first": "$language_complete_percentage"
                },
                skills: {
                    "$addToSet": "$skills"
                },
                skills_complete_percentage: {
                    "$first": "$skills_complete_percentage"
                },
                job_skills: {
                    "$addToSet": "$job_skills"
                },
                pecentage: {
                    "$first": "$pecentage"
                },
                updatedAt: {
                    "$first": "$updatedAt"
                },


            })

            aggregate.project({
                _id: 1,
                current_job_title: 1,
                type: 1,
                socialLogin: 1,
                fname: 1,
                lname: 1,
                profile_image: 1,
                // profile_image: {
                //     $cond: {
                //         if: {
                //             $eq: ["$profile_image_updated", true]
                //         },
                //         then: {
                //             $concat: [config.liveUrl, "$profile_image"]
                //         },
                //         else: {
                //             $cond: {
                //                 if: {
                //                     $and: [{
                //                             $ne: ["$type", "NORMAL"]
                //                         },
                //                         {
                //                             $ne: ["$socialLogin.image", null]
                //                         }
                //                     ]
                //                 },
                //                 then: "$socialLogin.image",
                //                 else: config.liveUrl + config.userDemoPicPath
                //             }
                //         }
                //     }
                // },
                country: 1,
                city: 1,
                dob: 1,
                nationality: 1,
                resident_country: 1,
                material_status: 1,
                employeeType: 1,
                current_company: 1,
                visa_status: 1,
                driving_licence: 1,
                // profile_complete_percentage: 1,
                email: 1,
                country_code: 1,
                phone_no: 1,
                // contact_complete_percentage: 1,
                preferJob: {
                    job_title: "$preferJob.job_title",
                    job_role: "$preferJob.job_role",
                    job_role_details: {
                        '$arrayElemAt': [
                            [{
                                _id: {
                                    '$arrayElemAt': ['$preferJobrole._id', 0]
                                },
                                name: {
                                    '$arrayElemAt': ['$preferJobrole.name', 0]
                                },
                                ar_name: {
                                    '$arrayElemAt': ['$preferJobrole.ar_name', 0]
                                },
                            }], 0
                        ]
                    },
                    job_level: "$preferJob.job_level",
                    job_level_details: {
                        '$arrayElemAt': [
                            [{
                                _id: {
                                    '$arrayElemAt': ['$preferJoblevel._id', 0]
                                },
                                name: {
                                    '$arrayElemAt': ['$preferJoblevel.name', 0]
                                },
                                ar_name: {
                                    '$arrayElemAt': ['$preferJoblevel.ar_name', 0]
                                },
                            }], 0
                        ]
                    },
                    job_country: "$preferJob.job_country",
                    job_city: "$preferJob.job_city",
                    job_summary: "$preferJob.job_summary",
                    job_industry: "$preferJob.job_industry",
                    job_industry_details: {
                        '$arrayElemAt': [
                            [{
                                _id: {
                                    '$arrayElemAt': ['$preferIndustry._id', 0]
                                },
                                name: {
                                    '$arrayElemAt': ['$preferIndustry.name', 0]
                                },
                                ar_name: {
                                    '$arrayElemAt': ['$preferIndustry.ar_name', 0]
                                },
                            }], 0
                        ]
                    },
                    job_employment_type: "$preferJob.job_employment_type",
                    job_employment_type_details: {
                        '$arrayElemAt': [
                            [{
                                _id: {
                                    '$arrayElemAt': ['$preferEmpType._id', 0]
                                },
                                name: {
                                    '$arrayElemAt': ['$preferEmpType.name', 0]
                                },
                                ar_name: {
                                    '$arrayElemAt': ['$preferEmpType.ar_name', 0]
                                },
                            }], 0
                        ]
                    },
                    job_salary_min: "$preferJob.job_salary_min",
                    job_salary_max: "$preferJob.job_salary_max",
                    job_notice_period: "$preferJob.job_notice_period",

                },
                // preferJob_complete_percentage: 1,
                workExperience: 1,
                // workExperience_complete_percentage: 1,
                salary: 1,
                // salary_complete_percentage: 1,
                education: 1,
                // education_complete_percentage: 1,
                language: 1,
                // language_complete_percentage: 1,
                skills: 1,
                pecentage: 1,
                updatedAt: 1

                // total: {
                //     // "$sum": "$passengers.times",
                //     $multiply: ["$restaurant_menus.price", "$orderDetails.qty"]
                // }
            });
            aggregate.sort({
                'createdAt': -1
            })
            var options = {
                page: page,
                limit: limit
            }

            CandidateSchema.aggregatePaginate(aggregate, options, function (err, results, pageCount, count) {
                if (err) {
                    callback({
                        "response_code": 5005,
                        "response_message": err,
                        "response_data": {}
                    });

                } else {

                    async.forEach(results, function (item, callback) {

                        item.last_updated = commonModule.updateDate(item.updatedAt);
                        item.user_type = "employees";

                    })

                    var data = {
                        docs: results,
                        pages: pageCount,
                        total: count,
                        limit: limit,
                        page: page
                    }
                    callback({
                        "response_code": 2000,
                        "response_message": "User Profile.",
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
    //Profile view
    viewProfile: async function (data, callback) {

        if (data) {

            let employee = await CandidateSchema.findOne({
                email: data.email
            }, function (err, result) {
                if (err) {
                    callback({
                        "response_code": 5005,
                        "response_message": err,
                        "response_data": {}
                    });

                }
            });

            if (employee != null) {

                if (employee.profile_image_updated == false) {
                    employee.profile_image = config.liveUrl + config.userDemoPicPath;
                } else {
                    employee.profile_image = config.liveUrl + employee.profile_image;
                }

                var total_profile_percentage = employee.profile_complete_percentage +
                    employee.contact_complete_percentage +
                    employee.preferJob_complete_percentage +
                    employee.workExperience_complete_percentage +
                    employee.salary_complete_percentage +
                    employee.education_complete_percentage +
                    employee.language_complete_percentage +
                    employee.skills_complete_percentage;

                let last_updated = commonModule.updateDate(employee.updatedAt);

                var result = {
                    profile_information: {
                        fname: employee.fname,
                        lname: employee.lname,
                        profile_image: employee.profile_image,
                        country: employee.country,
                        city: employee.city,
                        dob: employee.dob,
                        nationality: employee.nationality,
                        resident_country: employee.resident_country,
                        material_status: employee.material_status,
                        employeeType: employee.employeeType,
                        current_company: employee.current_company,
                        visa_status: employee.visa_status,
                        driving_licence: employee.driving_licence

                    },
                    contact_information: {
                        email: employee.email,
                        country_code: employee.country_code,
                        phone_no: employee.phone_no
                    },
                    preferJob: employee.preferJob,
                    workExperience: employee.workExperience,
                    salary: employee.salary,
                    education: employee.education,
                    language: employee.language,
                    skills: employee.skills,
                    socialLogin: employee.socialLogin,
                    current_job_title: employee.current_job_title,
                    pecentage: total_profile_percentage,
                    last_updated: last_updated
                };

                callback({
                    "response_code": 2000,
                    "response_message": "User Profile Details.",
                    "response_data": result
                });

            } else {
                callback({
                    "response_code": 5002,
                    "response_message": "User is not valid.",
                    "response_data": {}
                });
            }

        } else {
            callback({
                "response_code": 5005,
                "response_message": "INTERNAL DB ERROR",
                "response_data": {}
            });
        }

    },
    //Update Profile image
    editProfileImage: function (data, callback) {
        if (data) {
            CandidateSchema.findOne({
                    email: data.email
                }, {
                    profile_image: 1
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
                                "response_code": 5002,
                                "response_message": "User is not valid.",
                                "response_data": {}
                            });
                        } else {
                            var profile_complete_percentage = result.profile_complete_percentage;
                            if (result.profile_image !== null) {

                                let pf_image = `./public/${result.profile_image}`;
                                fs.unlink(pf_image, (err) => {
                                    if (err) {
                                        console.log('err', err);
                                    } else {
                                        console.log(result.profile_image + ' was deleted');
                                    }

                                });
                            } else { // First time update profile image

                                if (result.type != 'NORMAL' && result.socialLogin.image == null) { // check if user social image sync

                                    profile_complete_percentage = profile_complete_percentage + 1.25; // for profile image add

                                } else { // User register through normal flow
                                    profile_complete_percentage = profile_complete_percentage + 1.25; // for profile image add
                                }
                            }


                            CandidateSchema.updateOne({
                                email: data.email
                            }, {
                                $set: {
                                    profile_image: data.profile_image,
                                    profile_image_updated: true,
                                    profile_complete_percentage: profile_complete_percentage
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
                                        "response_code": 2000,
                                        "response_message": "Profile image has been changed.",
                                        "response_data": config.liveUrl + data.profile_image
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
    // Edit Personal Information
    editPersonalInfo: async function (data, callback) {
        if (data) {

            let employee = await CandidateSchema.findOne({
                email: data.email
            }, function (err, result) {
                if (err) {
                    callback({
                        "response_code": 5005,
                        "response_message": err,
                        "response_data": {}
                    });

                }
            });

            if (employee != null) {

                var profile_complete_percentage = employee.profile_complete_percentage;

                if (employee.country == '' && typeof data.country != undefined) {

                    profile_complete_percentage = profile_complete_percentage + 1.25; // for country

                }
                if (employee.city == '' && typeof data.city != undefined) {

                    profile_complete_percentage = profile_complete_percentage + 1.25; // for city

                }
                if (employee.dob == null && typeof data.dob != undefined) {

                    profile_complete_percentage = profile_complete_percentage + 1.25; // for dob

                }
                if (employee.nationality == '' && typeof data.nationality != undefined) {

                    profile_complete_percentage = profile_complete_percentage + 1.25; // for nationality

                }
                if (employee.resident_country == '' && typeof data.resident_country != undefined) {

                    profile_complete_percentage = profile_complete_percentage + 1.25; // for resident country

                }
                if (employee.material_status == '' && typeof data.material_status != undefined) {

                    profile_complete_percentage = profile_complete_percentage + 1.25; // for material status

                }
                if (employee.employeeType == '' && typeof data.employeeType != undefined) {

                    profile_complete_percentage = profile_complete_percentage + 1.25; // for employeeType
                }



                CandidateSchema.updateOne({
                    email: data.email
                }, {
                    $set: {
                        fname: data.fname != undefined ? data.fname : employee.fname,
                        lname: data.lname != undefined ? data.lname : employee.lname,
                        country: data.country != undefined ? data.country : employee.country,
                        city: data.city != undefined ? data.city : employee.city,
                        dob: data.dob != undefined ? data.dob : employee.dob,
                        nationality: data.nationality != undefined ? data.nationality : employee.nationality,
                        resident_country: data.resident_country != undefined ? data.resident_country : employee.resident_country,
                        material_status: data.material_status != undefined ? data.material_status : employee.material_status,
                        employeeType: data.employeeType != undefined ? data.employeeType : employee.employeeType,

                        current_company: data.current_company != undefined ? data.current_company : employee.current_company,
                        visa_status: data.visa_status != undefined ? data.visa_status : employee.visa_status,
                        driving_licence: data.driving_licence != undefined ? data.driving_licence : employee.driving_licence,
                        profile_complete_percentage: profile_complete_percentage
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
                            "response_code": 2000,
                            "response_message": "Personal information has been updated."
                        });
                    }
                });

            } else {
                callback({
                    "response_code": 5002,
                    "response_message": "User is not valid.",
                    "response_data": {}
                });
            }

        } else {
            callback({
                "response_code": 5005,
                "response_message": "INTERNAL DB ERROR",
                "response_data": {}
            });
        }
    },
    // Edit Contact Information
    editContactInfo: async function (data, callback) {
        if (data) {

            let employee = await CandidateSchema.findOne({
                email: data.email
            }, function (err, result) {
                if (err) {
                    callback({
                        "response_code": 5005,
                        "response_message": err,
                        "response_data": {}
                    });

                }
            });

            if (employee != null) {

                var contact_complete_percentage = employee.contact_complete_percentage;

                if (employee.phone_no == '' && typeof data.phone_no != undefined) {

                    contact_complete_percentage = contact_complete_percentage + 6.25; // for phone no

                }

                CandidateSchema.updateOne({
                    email: data.email
                }, {
                    $set: {
                        country_code: data.country_code,
                        phone_no: data.phone_no,

                        contact_complete_percentage: contact_complete_percentage
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
                            "response_code": 2000,
                            "response_message": "Contact information has been updated."
                        });
                    }
                });

            } else {
                callback({
                    "response_code": 5002,
                    "response_message": "User is not valid.",
                    "response_data": {}
                });
            }

        } else {
            callback({
                "response_code": 5005,
                "response_message": "INTERNAL DB ERROR",
                "response_data": {}
            });
        }
    },
    // Edit Prefered Job
    editPreferedJob: async function (data, callback) {
        if (data) {

            let employee = await CandidateSchema.findOne({
                email: data.email
            }, function (err, result) {
                if (err) {
                    callback({
                        "response_code": 5005,
                        "response_message": err,
                        "response_data": {}
                    });

                }
            });

            if (employee != null) {

                var preferJob_complete_percentage = employee.preferJob_complete_percentage;

                if (employee.preferJob.job_title == '' && typeof data.job_title != undefined) {

                    preferJob_complete_percentage = preferJob_complete_percentage + 1.25; // for job_title

                }
                if (employee.preferJob.job_role == '' && typeof data.job_role != undefined) {

                    preferJob_complete_percentage = preferJob_complete_percentage + 1.25; // for job_role

                }
                if (employee.preferJob.job_level == '' && typeof data.job_level != undefined) {

                    preferJob_complete_percentage = preferJob_complete_percentage + 1.25; // for job_level

                }
                if (employee.preferJob.job_country == '' && typeof data.job_country != undefined) {

                    preferJob_complete_percentage = preferJob_complete_percentage + 1.25; // for job_country

                }
                if (employee.preferJob.job_city == '' && typeof data.job_city != undefined) {

                    preferJob_complete_percentage = preferJob_complete_percentage + 1.25; // for job_city

                }
                if (employee.preferJob.job_summary == '' && typeof data.job_summary != undefined) {

                    preferJob_complete_percentage = preferJob_complete_percentage + 1.25; // for job_summary

                }
                if (employee.preferJob.job_industry == '' && typeof data.job_industry != undefined) {

                    preferJob_complete_percentage = preferJob_complete_percentage + 1.25; // for job_industry

                }
                if (employee.preferJob.job_employment_type == '' && typeof data.job_employment_type != undefined) {

                    preferJob_complete_percentage = preferJob_complete_percentage + 1.25; // for job_employment_type

                }
                if (employee.preferJob.job_salary_min == 0 && typeof data.job_salary_min != undefined) {

                    preferJob_complete_percentage = preferJob_complete_percentage + 1.25; // for job_salary_min

                }
                if (employee.preferJob.job_notice_period == 0 && typeof data.job_notice_period != undefined) {

                    preferJob_complete_percentage = preferJob_complete_percentage + 1.25; // for job_notice_period

                }

                CandidateSchema.updateOne({
                    email: data.email
                }, {
                    $set: {
                        preferJob: {
                            job_title: data.job_title,
                            job_role: data.job_role,
                            job_level: data.job_level,
                            job_country: data.job_country,
                            job_city: data.job_city,
                            job_summary: data.job_summary != undefined ? data.job_summary : employee.job_summary,
                            job_industry: data.job_industry,
                            job_employment_type: data.job_employment_type,
                            job_salary_min: data.job_salary_min,
                            job_salary_max: data.job_salary_max != undefined ? data.job_salary_max : employee.job_salary_max,
                            job_notice_period: data.job_notice_period,
                        },
                        preferJob_complete_percentage: preferJob_complete_percentage
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
                            "response_code": 2000,
                            "response_message": "Prefer job details has been updated."
                        });
                    }
                });

            } else {
                callback({
                    "response_code": 5002,
                    "response_message": "User is not valid.",
                    "response_data": {}
                });
            }

        } else {
            callback({
                "response_code": 5005,
                "response_message": "INTERNAL DB ERROR",
                "response_data": {}
            });
        }
    },
    // Edit Work Experience
    editWorkExperience: async function (data, callback) {
        if (data) {

            let employee = await CandidateSchema.findOne({
                email: data.email
            }, function (err, result) {
                if (err) {
                    callback({
                        "response_code": 5005,
                        "response_message": err,
                        "response_data": {}
                    });

                }
            });

            if (employee != null) {

                var workExperience_complete_percentage = employee.workExperience_complete_percentage;

                if (employee.workExperience.length == 0 && typeof data.workExperience[0].title != undefined) {

                    workExperience_complete_percentage = 12.5; // for work experience

                }

                CandidateSchema.updateOne({
                    email: data.email
                }, {
                    $set: {
                        workExperience: data.workExperience,
                        workExperience_complete_percentage: workExperience_complete_percentage
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
                            "response_code": 2000,
                            "response_message": "Contact information has been updated."
                        });
                    }
                });

            } else {
                callback({
                    "response_code": 5002,
                    "response_message": "User is not valid.",
                    "response_data": {}
                });
            }

        } else {
            callback({
                "response_code": 5005,
                "response_message": "INTERNAL DB ERROR",
                "response_data": {}
            });
        }
    },
    // Edit Salary Details
    editSalaryInfo: async function (data, callback) {
        if (data) {

            let employee = await CandidateSchema.findOne({
                email: data.email
            }, function (err, result) {
                if (err) {
                    callback({
                        "response_code": 5005,
                        "response_message": err,
                        "response_data": {}
                    });

                }
            });

            if (employee != null) {

                var salary_complete_percentage = employee.salary_complete_percentage;

                if (employee.salary.expected_salary == 0 && typeof data.expected_salary != undefined) {

                    salary_complete_percentage = 12.5; // for expected_salary

                }

                CandidateSchema.updateOne({
                    email: data.email
                }, {
                    $set: {
                        salary: {
                            current_salary: data.current_salary != undefined ? data.current_salary : employee.current_salary,
                            expected_salary: data.expected_salary,
                        },
                        salary_complete_percentage: salary_complete_percentage
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
                            "response_code": 2000,
                            "response_message": "Salary information has been updated."
                        });
                    }
                });

            } else {
                callback({
                    "response_code": 5002,
                    "response_message": "User is not valid.",
                    "response_data": {}
                });
            }

        } else {
            callback({
                "response_code": 5005,
                "response_message": "INTERNAL DB ERROR",
                "response_data": {}
            });
        }
    },
    // Edit Education Details
    editEducationInfo: async function (data, callback) {
        if (data) {

            let employee = await CandidateSchema.findOne({
                email: data.email
            }, function (err, result) {
                if (err) {
                    callback({
                        "response_code": 5005,
                        "response_message": err,
                        "response_data": {}
                    });

                }
            });

            if (employee != null) {

                var education_complete_percentage = employee.education_complete_percentage;

                if (employee.education.length == 0 && typeof data.education[0].degree != undefined) {

                    education_complete_percentage = 12.5; // for Education

                }

                CandidateSchema.updateOne({
                    email: data.email
                }, {
                    $set: {
                        education: data.education,
                        education_complete_percentage: education_complete_percentage
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
                            "response_code": 2000,
                            "response_message": "Education information has been updated."
                        });
                    }
                });

            } else {
                callback({
                    "response_code": 5002,
                    "response_message": "User is not valid.",
                    "response_data": {}
                });
            }

        } else {
            callback({
                "response_code": 5005,
                "response_message": "INTERNAL DB ERROR",
                "response_data": {}
            });
        }
    },
    // Edit Language Details
    editLanguageInfo: async function (data, callback) {
        if (data) {

            let employee = await CandidateSchema.findOne({
                email: data.email
            }, function (err, result) {
                if (err) {
                    callback({
                        "response_code": 5005,
                        "response_message": err,
                        "response_data": {}
                    });

                }
            });

            if (employee != null) {

                var language_complete_percentage = employee.language_complete_percentage;

                if (employee.language.length == 0 && typeof data.language[0].name != undefined) {

                    language_complete_percentage = 12.5; // for language

                }

                CandidateSchema.updateOne({
                    email: data.email
                }, {
                    $set: {
                        language: data.language,
                        language_complete_percentage: language_complete_percentage
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
                            "response_code": 2000,
                            "response_message": "Language information has been updated."
                        });
                    }
                });

            } else {
                callback({
                    "response_code": 5002,
                    "response_message": "User is not valid.",
                    "response_data": {}
                });
            }

        } else {
            callback({
                "response_code": 5005,
                "response_message": "INTERNAL DB ERROR",
                "response_data": {}
            });
        }
    },
    // Edit Skill Details
    editSkillInfo: async function (data, callback) {
        if (data) {

            let employee = await CandidateSchema.findOne({
                email: data.email
            }, function (err, result) {
                if (err) {
                    callback({
                        "response_code": 5005,
                        "response_message": err,
                        "response_data": {}
                    });

                }
            });

            if (employee != null) {

                var skills_complete_percentage = employee.skills_complete_percentage;

                if (employee.skills.length == 0 && typeof data.skills._id != undefined) {

                    skills_complete_percentage = 12.5; // for skills

                }

                index = employee.skills.findIndex(x => x._id === data.skills._id);
                console.log("index:", index);
                if (index != -1) {
                    CandidateSchema.updateOne({
                        email: data.email
                    }, {
                        $pull: {
                            skills: {
                                _id: data.skills._id
                            }
                        }
                    }, {
                        multi: true
                    }, function (err, resUpdate) {
                        if (err) {
                            console.log("err", err);
                        }
                    });
                }

                CandidateSchema.updateOne({
                    email: data.email
                }, {
                    $push: {
                        skills: {
                            skill_id: data.skills.skill_id,
                            level: data.skills.level,
                            $position: index
                        }
                    }
                }, {
                    $set: {
                        //skills: data.skills,
                        skills_complete_percentage: skills_complete_percentage
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
                            "response_code": 2000,
                            "response_message": "Skills information has been updated."
                        });
                    }
                });

            } else {
                callback({
                    "response_code": 5002,
                    "response_message": "User is not valid.",
                    "response_data": {}
                });
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
module.exports = employeeModels;