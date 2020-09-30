var CandidateSchema = require('../schema/candidate');
var EmployerSchema = require('../schema/employer');
var ResumeSchema = require('../schema/resume');
var ApplicationSchema = require('../schema/job_applilation');

var JobSkillSchema = require('../schema/job_skill');
var Employee_Dashoard_LogSchema = require('../schema/employee_dashoard_log');
var Interested_Not_InterestedSchema = require('../schema/interested_not_interested');
var JobSchema = require('../schema/job');
var SaveJobSchema = require('../schema/save_job');
var config = require('../config');
var async = require("async");
var mongo = require('mongodb');
var ObjectID = mongo.ObjectID;
var bcrypt = require('bcrypt');
var fs = require('fs');
var path = require('path');
var jwt = require('jsonwebtoken');
var mailProperty = require('../modules/sendMail');
var secretKey = config.secretKey;
var cron = require('node-cron');
var commonModule = require('../utility/common');
var NotificationModels = require('../models/employees_notification');
var EmpployerNotificationModels = require('../models/employers_notification');
var AdminNotificationModels = require('../models/admin_notification');
var pushNotification = require('../modules/pushNotification');
var moment = require('moment')
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

                                    var admin_message = 'New member ' + data.fname + ' ' + data.lname + ' is registered';
                                    var admin_title = 'New Employee Registered';
                                    var addData = {
                                        _id: new ObjectID,
                                        user_id: data._id,
                                        user_type: 'employee',
                                        message: admin_message,
                                        title: admin_title,

                                    }
                                    AdminNotificationModels.addNotification(addData, function (notiResult) {});

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
                "socialLogin.socialId": data.socialLogin.socialId
            }, function (err, result) {
                if (err) {
                    callback({
                        "response_code": 5005,
                        "response_message": err,
                        "response_data": {}
                    });

                }
            })
console.log('employee----',employee)
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
                        "response_code": 5010,
                        "response_message": "You are not login throug social platform",
                        "response_data": {}
                    });

                } else if (employee.type != data.socialLogin.type) {

                    callback({
                        "response_code": 5010,
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
                        "response_message": "Welcome back " + employee.fname,
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
                     console.log('data---->',data)

                    new CandidateSchema(data).save(function (err, result) {
                        if (err) {

                            callback({
                                "response_code": 5005,
                                "response_message": "INTERNAL DB ERROR",
                                "response_data": err
                            });
                        } else {

                            profile_image = data.socialLogin.image;

                            if (profile_image == '' || profile_image == null) {
                                profile_image = config.liveUrl + config.userDemoPicPath;
                            }
                            var admin_message = 'New member ' + data.fname + ' ' + data.lname + ' is registered';
                            var admin_title = 'New Employee Registered';
                            var addData = {
                                _id: new ObjectID,
                                user_id: data._id,
                                user_type: 'employee',
                                message: admin_message,
                                title: admin_title,

                            }
                            AdminNotificationModels.addNotification(addData, function (notiResult) {});

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
                                                    "response_message": "Your account has been activated successfully.Please Login",
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
                localField: 'current_job_title',
                foreignField: '_id',
                as: 'current_job_title'
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
                from: 'job-countries',
                localField: 'preferJob.job_country',
                foreignField: '_id',
                as: 'preferJobCountry'
            });
            aggregate.lookup({
                from: 'job-cities',
                localField: 'preferJob.job_city',
                foreignField: '_id',
                as: 'preferJobCity'
            });
            aggregate.unwind({
                path: "$preferJob.job_industry",
                preserveNullAndEmptyArrays: true
            });
            aggregate.lookup({
                from: 'job-industries',
                localField: 'preferJob.job_industry',
                foreignField: '_id',
                as: 'preferIndustry'
            });
            aggregate.unwind({
                path: "$preferIndustry",
                preserveNullAndEmptyArrays: true
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

            aggregate.lookup({
                from: 'job-countries',
                localField: 'workExperience.country',
                foreignField: '_id',
                as: 'workCountry'
            });
            aggregate.unwind({
                path: "$workCountry",
                preserveNullAndEmptyArrays: true
            });
            aggregate.lookup({
                from: 'job-cities',
                localField: 'workExperience.city',
                foreignField: '_id',
                as: 'workCity'
            });
            
            aggregate.unwind({
                path: "$workCity",
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
            aggregate.lookup({
                from: 'job-countries',
                localField: 'education.country',
                foreignField: '_id',
                as: 'educationCountry'
            });
            aggregate.unwind({
                path: "$educationCountry",
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
            aggregate.unwind({
                path: "$references",
                preserveNullAndEmptyArrays: true
            });

            // aggregate.redact({
            //     $cond: [{
            //             $eq: [
            //                 "$preferJob.job_industry",
            //                 "$preferIndustry._id"
            //             ]
            //         },
            //         "$$KEEP",
            //         "$$PRUNE"
            //     ]
            // })

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
                            "$educationDegree._id",
                            "$education.degree"
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
                current_job_title: {
                    '$arrayElemAt': [
                        [{
                            name: {
                                '$arrayElemAt': ['$current_job_title.name', 0]
                            },
                            ar_name: {
                                '$arrayElemAt': ['$current_job_title.ar_name', 0]
                            },
                            _id: {
                                '$arrayElemAt': ['$current_job_title._id', 0]
                            },
                        }], 0
                    ]
                },
                type: 1,
                socialLogin: 1,
                fname: 1,
                lname: 1,
                ar_fname: 1,
                ar_lname: 1,
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
                dob: 1,
                nationality: 1,
                gender: 1,
                additional_nationality: 1,
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
                    job_country: {
                        '$arrayElemAt': [
                            [{
                                name: {
                                    '$arrayElemAt': ['$preferJobCountry.name', 0]
                                },
                                _id: {
                                    '$arrayElemAt': ['$preferJobCountry._id', 0]
                                },
                            }], 0
                        ]
                    },
                    job_city: {
                        '$arrayElemAt': [
                            [{
                                name: {
                                    '$arrayElemAt': ['$preferJobCity.name', 0]
                                },
                                _id: {
                                    '$arrayElemAt': ['$preferJobCity._id', 0]
                                },
                            }], 0
                        ]
                    },
                    job_summary: "$preferJob.job_summary",
                    job_industry: "$preferJob.job_industry",
                    job_industry_details: "$preferIndustry",
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
                    job_salary: "$preferJob.job_salary",
                    currency: "$preferJob.currency",
                    job_notice_period: "$preferJob.job_notice_period",

                },
                
                // preferJob_complete_percentage: 1,
                workExperience: {

                    title: "$workExperience.title",
                    company_name: "$workExperience.company_name",
                    industry: "$workExperience.industry",
                    industry_details: "$workIndustry",
                    // industry_details: {
                    //     name: "$workIndustry.name",
                    //     ar_name: "$workIndustry.ar_name",
                    //     _id: "$workIndustry._id"
                    // },
                    country: "$workExperience.country",
                    country_details: "$workCountry",
                    city: "$workExperience.city",
                    city_details: "$workCity",
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
                    degree_details: "$educationDegree",
                    // degree_details: {
                    //     name: "$educationDegree.name",
                    //     ar_name: "$educationDegree.ar_name",
                    //     _id: "$educationDegree._id"
                    // },
                    degree: "$education.degree",
                    university: "$education.university",
                    country: "$education.country",
                    country_details: "$educationCountry",
                    majorSubject: "$education.majorSubject",
                    gaduationDate: "$education.gaduationDate",
                    grade: "$education.grade",
                    grade_score: "$education.grade_score",
                    description: "$education.description",
                    _id: "$education._id",
                },
                // education_complete_percentage: 1,
                language: 1,
                video_cv: 1,
                
                references:{
                    name: "$references.name",
                    job_title: "$references.job_title",
                    company_name: "$references.company_name",
                    email: "$references.email",
                    country_code: "$references.country_code",
                    phone_no: "$references.phone_no",
                    _id: "$references._id"

                },
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
                updatedAt: 1,
                status: 1
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
                ar_fname: {
                    "$first": "$ar_fname"
                },
                ar_lname: {
                    "$first": "$ar_lname"
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
                gender: {
                    "$first": "$gender"
                },
                additional_nationality: {
                    "$first": "$additional_nationality"
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
                video_cv: {
                    "$first": "$video_cv"
                },
                references: {
                    "$addToSet": "$references"
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
                status: {
                    "$first": "$status"
                },


            })

            aggregate.project({
                _id: 1,
                current_job_title: 1,
                type: 1,
                socialLogin: 1,
                fname: 1,
                lname: 1,
                ar_fname: 1,
                ar_lname: 1,
                profile_image: 1,
                country: 1,
                city: 1,
                dob: 1,
                nationality: 1,
                gender: 1,
                additional_nationality: 1,
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
                
                // preferJob_complete_percentage: 1,
                workExperience: { $reverseArray: "$workExperience" },
                // workExperience_complete_percentage: 1,
                salary: 1,
                // salary_complete_percentage: 1,
                education: { $reverseArray: "$education" },
                // education_complete_percentage: 1,
                language: 1,
                video_cv: 1,
                references:{ $reverseArray: "$references" },
                // language_complete_percentage: 1,
                skills: { $reverseArray: "$skills" },
                pecentage: 1,
                updatedAt: 1,
                status: 1,

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
                        

                        console.log('item.workExperience---->',item.workExperience)

                        if(item.workExperience.length > 0)
                        {
                            let totalDays = 0
                            item.workExperience.map( async (workexperience) => {

                                var startdate = moment(workexperience.start);
                                
                                var enddate = workexperience.end !== null ? moment(workexperience.end): moment();

                                var days = enddate.diff(startdate, 'days');
                                totalDays = totalDays + days
                                //console.log( days + ' days');
                            })

                            console.log( totalDays + ' days');
                            var start = moment();
                            var end = moment().add(totalDays, 'days');
                            
                            var years = end.diff(start, 'year');
                            start.add(years, 'years');
                            
                            var months = end.diff(start, 'months');
                            start.add(months, 'months');
                            
                            var days = end.diff(start, 'days');
                            
                            var yearsexperience = years + ' years ' + months + ' months ' + days + ' days';
                            console.log(years + ' years ' + months + ' months ' + days + ' days');
                            item.yearsexperience = yearsexperience
                        }

                        if(item.references[0].name == undefined){
                            item.references = [];
                        }
                        if(item.skills[0].name == undefined){
                            item.skills = [];
                        }
                        if(item.workExperience[0].title == undefined){
                            item.workExperience = [];
                        }
                        if(item.education[0].degree == undefined){
                            item.education = [];
                        }
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
                    profile_image: 1,
                    profile_complete_percentage: 1
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

                        ar_fname: data.ar_fname != undefined ? data.ar_fname : employee.ar_fname,
                        ar_lname: data.ar_lname != undefined ? data.ar_lname : employee.ar_lname,
                        gender: data.gender != undefined ? data.gender : employee.gender,
                        additional_nationality: data.additional_nationality != undefined ? data.additional_nationality : employee.additional_nationality,
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
                if (employee.preferJob.job_industry.length == 0 ) {

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
                            job_salary: data.job_salary,
                            job_notice_period: data.job_notice_period,
                            currency: data.currency,
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
            var query = {email: data.email}; 
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

                if (employee.workExperience.length == 0 && typeof data.workExperience.title != undefined) {

                    workExperience_complete_percentage = 12.5; // for work experience

                }


                index = employee.workExperience.findIndex(x => x._id == data.workExperience._id);

                if (index != -1) {
                    query['workExperience._id'] = data.workExperience._id;
                    CandidateSchema.updateOne(query, 
                        {
                        
                        $set: {
                            "workExperience.$.title": data.workExperience.title,
                            "workExperience.$.company_name": data.workExperience.company_name,
                            "workExperience.$.industry": data.workExperience.industry,
                            "workExperience.$.country": data.workExperience.country,
                            "workExperience.$.city": data.workExperience.city,
                            "workExperience.$.present_company": data.workExperience.present_company,
                            "workExperience.$.start": data.workExperience.start,
                            "workExperience.$.end": data.workExperience.end,
                            "workExperience.$.description": data.workExperience.description
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
                                "response_message": "Work information has been updated."
                            });
                        }
                    });
                } else {
                    let getPresentCompany  = []
                    if(employee.workExperience.length > 0)
                    {

                     getPresentCompany  = employee.workExperience.filter(
                                            presentCompany => presentCompany.present_company === 'yes' &&
                                            data.workExperience.present_company === 'yes'
                                            )
                    }
    
                    //console.log("getPresentCompany------->",getPresentCompany)
                    if(getPresentCompany.length > 0)
                    {

                        callback({
                            "response_code": 5002,
                            "response_message": "The user has already enlisted in present company.",
                            "response_data": {}
                        });

                    }else{
                    CandidateSchema.updateOne(query, 
                        {
                        $push: {
                            workExperience: {
                                title: data.workExperience.title,
                                company_name: data.workExperience.company_name,
                                industry: data.workExperience.industry,
                                country: data.workExperience.country,
                                city: data.workExperience.city,
                                present_company: data.workExperience.present_company,
                                start: data.workExperience.start,
                                end: data.workExperience.end,
                                description: data.workExperience.description,
                            }
                        },
                        $set: {
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
                                "response_message": "Work information has been added."
                            });
                        }
                    });
                }
                }

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
    // Delete Work Experience
    deleteWorkExperience: async function (data, callback) {
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


                index = employee.workExperience.findIndex(x => x._id == data.workExperience._id);

                if (index != -1) {

                    var workExperience_complete_percentage = employee.workExperience_complete_percentage;

                    if (employee.workExperience.length == 1) { //if all experience deleted
                        workExperience_complete_percentage = 0;
                    }


                    await CandidateSchema.updateOne({
                        email: data.email
                    }, {
                        $pull: {
                            workExperience: {
                                _id: data.workExperience._id
                            }
                        },
                        $set: {
                            workExperience_complete_percentage: workExperience_complete_percentage
                        }
                    }, {
                        multi: true
                    }, function (err, resUpdate) {
                        if (err) {
                            console.log("err", err);
                        } else {
                            callback({
                                "response_code": 2000,
                                "response_message": "Work details removed."
                            });
                        }
                    });
                } else {

                    callback({
                        "response_code": 5002,
                        "response_message": "Work details not exist."
                    });
                }


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
                            current_salary_currency: data.current_salary_currency,
                            expected_salary: data.expected_salary,
                            expected_salary_currency: data.expected_salary_currency,
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
            var query = {email: data.email}; 
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

                if (employee.education.length == 0 && typeof data.education.degree != undefined) {

                    education_complete_percentage = 12.5; // for Education

                }

                index = employee.education.findIndex(x => x._id == data.education._id);
                
                
                if (index != -1) {
                    query['education._id'] = data.education._id;
                    // await CandidateSchema.updateOne({
                    //     email: data.email
                    // }, {
                    //     $pull: {
                    //         education: {
                    //             _id: data.education._id
                    //         }
                    //     }
                    // }, {
                    //     multi: true
                    // }, function (err, resUpdate) {
                    //     if (err) {
                    //         console.log("err", err);
                    //     }
                    // });

                    await CandidateSchema.updateOne(query, 
                        {
                        $set: {
                            "education.$.degree": data.education.degree,
                            "education.$.university": data.education.university,
                            "education.$.country": data.education.country,
                            "education.$.majorSubject": data.education.majorSubject,
                            "education.$.gaduationDate": data.education.gaduationDate,
                            "education.$. grade": data.education.grade,
                            "education.$.grade_score": data.education.grade_score,
                            "education.$.description": data.education.description,
                        }
                    }, function (err, resUpdate) {
                        if (err) {
                            callback({
                                "response_code": 5005,
                                "response_message":err,
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

                    CandidateSchema.updateOne(query, 
                        {
                        $push: {
                            education: {
                            
                                degree: data.education.degree,
                                university: data.education.university,
                                country: data.education.country,
                                majorSubject: data.education.majorSubject,
                                gaduationDate: data.education.gaduationDate,
                                grade: data.education.grade,
                                grade_score: data.education.grade_score,
                                description: data.education.description,
                            }
                        },
                        $set: {

                            education_complete_percentage: education_complete_percentage
                        }
                    }, function (err, resUpdate) {
                        if (err) {
                            callback({
                                "response_code": 5005,
                                "response_message":err,
                                "response_data": {}
                            });
                        } else {
                            callback({
                                "response_code": 2000,
                                "response_message": "Education information has been added."
                            });
                        }
                    });
                }

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
    // Delete Education Details
    deleteEducationInfo: async function (data, callback) {
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



                index = employee.education.findIndex(x => x._id == data.education._id);

                if (index != -1) {

                    var education_complete_percentage = employee.education_complete_percentage;

                    if (employee.education.length == 1) { //if all education deleted
                        education_complete_percentage = 0;
                    }

                    await CandidateSchema.updateOne({
                        email: data.email
                    }, {
                        $pull: {
                            education: {
                                _id: data.education._id
                            }
                        },
                        $set: {
                            education_complete_percentage: education_complete_percentage
                        }
                    }, {
                        multi: true
                    }, function (err, resUpdate) {
                        if (err) {
                            console.log("err", err);
                        } else {
                            callback({
                                "response_code": 2000,
                                "response_message": "Education details removed."
                            });
                        }
                    });
                } else {

                    callback({
                        "response_code": 5002,
                        "response_message": "Education details not exist."
                    });
                }


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
            var query = {email: data.email}; 
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

                if (employee.language.length == 0 && typeof data.language.name != undefined) {

                    language_complete_percentage = 12.5; // for language

                }

                index = employee.language.findIndex(x => x._id == data.language._id);

                if (index != -1) {
                    query['language._id'] = data.language._id;

                    await CandidateSchema.updateOne(query, 
                        {
                        $set: {
                            "language.$.name"  : data.language.name,
                            "language.$.level" : data.language.level
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

                    CandidateSchema.updateOne(query, {
                        $push: {
                            language: {
                                name: data.language.name,
                                level: data.language.level
                            }
                        },
                        $set: {
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
                                "response_message": "Language information has been added."
                            });
                        }
                    });
                }

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
    // Delete Language Details
    deleteLanguageInfo: async function (data, callback) {
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


                index = employee.language.findIndex(x => x._id == data.language._id);

                if (index != -1) {

                    var language_complete_percentage = employee.language_complete_percentage;

                    if (employee.language.length == 1) { //if all education deleted
                        language_complete_percentage = 0;
                    }

                    await CandidateSchema.updateOne({
                        email: data.email
                    }, {
                        $pull: {
                            language: {
                                _id: data.language._id
                            }
                        },
                        $set: {
                            language_complete_percentage: language_complete_percentage
                        }
                    }, {
                        multi: true
                    }, function (err, resUpdate) {
                        if (err) {
                            console.log("err", err);
                        } else {
                            callback({
                                "response_code": 2000,
                                "response_message": "Language details removed."
                            });
                        }
                    });
                } else {

                    callback({
                        "response_code": 5002,
                        "response_message": "Language details not exist."
                    });
                }

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
            var query = {email: data.email};
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

                if (employee.skills.length == 0 && typeof data.skills.skill_id != undefined) {

                    skills_complete_percentage = 12.5; // for skills

                }

                index = employee.skills.findIndex(x => x._id == data.skills._id);

                if (index != -1) {
                    // await CandidateSchema.updateOne({
                    //     email: data.email
                    // }, {
                    //     $pull: {
                    //         skills: {
                    //             _id: data.skills._id
                    //         }
                    //     }
                    // }, {
                    //     multi: true
                    // }, function (err, resUpdate) {
                    //     if (err) {
                    //         console.log("err", err);
                    //     }
                    // });
                    query['skills._id'] = data.skills._id;

                    await CandidateSchema.updateOne(query, 
                        {
                        $set: {
                            "skills.$.skill_id"  : data.skills.skill_id,
                            "skills.$.level" : data.skills.level
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

                    CandidateSchema.updateOne(query, 
                        {
                        $push: {
                            skills: {
                                skill_id: data.skills.skill_id,
                                level: data.skills.level
                            }
                        },
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
                                "response_message": "Skills information has been added."
                            });
                        }
                    });
                }

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
    // Delete Skill
    deleteSkillInfo: async function (data, callback) {
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


                index = employee.skills.findIndex(x => x._id == data.skills._id);

                if (index != -1) {

                    var skills_complete_percentage = employee.skills_complete_percentage;

                    if (employee.skills.length == 1) { //if all education deleted
                        skills_complete_percentage = 0;
                    }
                    await CandidateSchema.updateOne({
                        email: data.email
                    }, {
                        $pull: {
                            skills: {
                                _id: data.skills._id
                            }
                        },
                        $set: {
                            skills_complete_percentage: skills_complete_percentage
                        }
                    }, {
                        multi: true
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
                                "response_message": "Skill details removed."
                            });
                        }
                    });
                } else {

                    callback({
                        "response_code": 5002,
                        "response_message": "Skill details not exist."
                    });
                }


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
    addVideoCv: async function (data, callback) {

        if(data){

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

                CandidateSchema.updateOne({
                    email: data.email
                }, {
                    $set: {
                        video_cv: {
                            link: data.video_cv.link,
                            description: data.video_cv.description,
                        }
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
                            "response_message": "Video cv has been updated."
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
    deleteVideoCv: async function (data, callback) {

        if(data){

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

                CandidateSchema.updateOne({
                    email: data.email
                }, {
                    $set: {
                        video_cv: {
                            link: '',
                            description: '',
                        }
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
                            "response_message": "Video cv has been deleted."
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
    
    editReferences : async function(data,callback){

        if (data) {
            var query = {email: data.email};
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



                index = employee.references.findIndex(x => x._id == data.references._id);
                console.log(index);
                
                if (index != -1) {
                    query['references._id'] = data.references._id;

                    await CandidateSchema.updateOne(query, 
                        {
                        $set: {
                            'references.$.name'         :   data.references.name,
                            'references.$.job_title'    :   data.references.job_title,
                            'references.$.company_name' :   data.references.company_name,
                            'references.$.email'        :   data.references.email,
                            'references.$.country_code' :   data.references.country_code,
                            'references.$.phone_no'     :   data.references.phone_no,
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
                                "response_message": "Refereence information has been updated."
                            });
                        }
                    });
                } else {

                    CandidateSchema.updateOne(query, 
                        {
                        $push: {
                            references: {
                                name         :  data.references.name,
                                job_title    :  data.references.job_title,
                                company_name :  data.references.company_name,
                                email        :  data.references.email,
                                country_code :  data.references.country_code,
                                phone_no     :  data.references.phone_no,
                            }
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
                                "response_message": "Refereence information has been added."
                            });
                        }
                    });
                }

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

    
    deleteReferences : async function(data,callback){

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



                index = employee.references.findIndex(x => x._id == data.references._id);

                if (index != -1) {

                    await CandidateSchema.updateOne({
                        email: data.email
                    }, {
                        $pull: {
                            references: {
                                _id: data.references._id
                            }
                        }
                    }, {
                        multi: true
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
                                "response_message": "Refereence details removed."
                            });
                        }
                    });
                    
                } else {

                    callback({
                        "response_code": 5002,
                        "response_message": "Refereence details not exist."
                    });
                    
                }

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
    listSaveJob: function (data, callback) {

        var page = 1,
            limit = 20,
            query = {};
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
        if (data.employeeId) {
            query['employeeId'] = data.employeeId;
        }

        let check_employee_id =''

        if(data.decoded !='')
        {

             check_employee_id = data.decoded.id

        }

        var aggregate = SaveJobSchema.aggregate();
        aggregate.match(query);

        aggregate.lookup({
            from: 'jobs',
            localField: 'jobId',
            foreignField: '_id',
            as: 'job_details'
        });

        aggregate.unwind({
            path: "$job_details",
            preserveNullAndEmptyArrays: true
        });

        aggregate.lookup({
            from: 'job-applications',
            localField: 'jobId',
            foreignField: 'jobId',
            as: 'JobApplication'
        });
        aggregate.unwind({
            path: "$JobApplication",
            preserveNullAndEmptyArrays: true
        });

        aggregate.lookup({
            from: 'jobs',
            localField: 'jobId',
            foreignField: '_id',
            as: 'SaveJob'
        });
        aggregate.unwind({
            path: "$SaveJob",
            preserveNullAndEmptyArrays: true
        });

        aggregate.lookup({
            from: 'job-countries',
            localField: 'job_details.country',
            foreignField: '_id',
            as: 'job_details.country'
        });

        aggregate.lookup({
            from: 'job-cities',
            localField: 'job_details.city',
            foreignField: '_id',
            as: 'job_details.city'
        });

        aggregate.lookup({
            from: 'job-tags',
            localField: 'job_details.job_tag',
            foreignField: '_id',
            as: 'job_details.job_tag'
        });

        aggregate.lookup({
            from: 'job-types',
            localField: 'job_details.job_type',
            foreignField: '_id',
            as: 'job_details.job_type'
        });

        aggregate.lookup({
            from: 'job-levels',
            localField: 'job_details.job_level',
            foreignField: '_id',
            as: 'job_details.job_level'
        });
        
        aggregate.lookup({
            from: 'job-industries',
            localField: 'job_details.job_industry',
            foreignField: '_id',
            as: 'job_details.job_industry'
        });    

        aggregate.lookup({
            from: 'job-skills',
            localField: 'job_details.job_skill',
            foreignField: '_id',
            as: 'job_details.job_skill'
        });

        aggregate.lookup({
            from: 'employers',
            localField: 'job_details.employerId',
            foreignField: '_id',
            as: 'job_details.employerId'
        });


        aggregate.lookup({
            from: 'companies',
            localField: 'job_details.employerId._id',
            foreignField: 'employerId',
            as: 'company_details'
        });


        aggregate.group({
            "_id": "$_id",
            createdAt: {
                "$first": "$createdAt"
            },
            job_details: {
                "$first": "$job_details"
            },
            company_details: {
                "$first": "$company_details"
            },
            JobApplication: {
                "$addToSet": "$JobApplication"
            },
            SaveJob: {
                "$addToSet": "$SaveJob"
            }

        });

        aggregate.project({
            _id: 1,
            createdAt: 1,
            employeeId: 1,
            job_details: 1,

            JobApplication: {
			                   '$arrayElemAt': [
			                    [{
			                        _id: {
			                            $cond: {
			                                if: {
			                                    $in: [check_employee_id, "$JobApplication.employeeId"]
			                                },
			                                then: {'$arrayElemAt': ['$JobApplication._id', 0]},
			                                else: null
			                            }
			                            

			                        },
			                        status: {
			                           $cond: {
			                            if: {
			                                $in: [check_employee_id, "$JobApplication.employeeId"]
			                            },
			                            then: 'Already Applied',
			                            else: null
			                        }
			                        },

			                    }], 0
			                ]
      
                        },

            SaveJob: 'Already Saved',
            company_details: {
                    
                '$arrayElemAt': [
                    [{
                        _id: {
                            '$arrayElemAt': ['$company_details._id', 0]
                        },
                        name: {
                            '$arrayElemAt': ['$company_details.name', 0]
                        },
                        ar_name: {
                            '$arrayElemAt': ['$company_details.ar_name', 0]
                        },
                        designation: {
                            '$arrayElemAt': ['$company_details.designation', 0]
                        },
                        logo: {
                            $cond: {
                                        if: {
                                            $in: [null, "$company_details.logo"]
                                        },
                                        then: config.liveUrl + companyDemoLogo,
                                        else: {
                                            $concat: [config.liveUrl, {
                                                "$arrayElemAt": ["$company_details.logo", 0]
                                            }]
                                            // "$arrayElemAt": ["$User.profile_image", 0]
                                        }
                              }      
                        },
                    }], 0
                ]
            },
           

        });
        aggregate.sort({
            'createdAt': -1
        })
        var options = {
            page: page,
            limit: limit
        }

        SaveJobSchema.aggregatePaginate(aggregate, options, function (err, results, pageCount, count) {
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
                    "response_message": "Save job list.",
                    "response_data": data
                });

            }
        });
    },
    // Add Save Job
    saveJob: async function (data, callback) {
        if (data) {

            let saveJob = await SaveJobSchema.findOne({
                employeeId: data.employeeId,
                jobId: data.jobId
            }, function (err, result) {
                if (err) {
                    callback({
                        "response_code": 5005,
                        "response_message": err,
                        "response_data": {}
                    });

                }
            });

            if (saveJob == null) {
                console.log(data);

                new SaveJobSchema(data).save(function (err, result) {
                    if (err) {

                        callback({
                            "response_code": 5005,
                            "response_message": err,
                            "response_data": {}
                        });
                    } else {

                        callback({
                            "response_code": 2000,
                            "response_message": "Job saved successfully"
                        });

                    }
                });


            } else {
                callback({
                    "response_code": 5002,
                    "response_message": "Job already saved",
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
    // Remove Save Job
    removeSaveJob: async function (data, callback) {
        if (data) {

            let saveJob = await SaveJobSchema.findOne({
                employeeId: data.employeeId,
                jobId: data.jobId
            }, function (err, result) {
                if (err) {
                    callback({
                        "response_code": 5005,
                        "response_message": err,
                        "response_data": {}
                    });

                }
            });

            if (saveJob != null) {

                SaveJobSchema.remove({
                    employeeId: data.employeeId,
                    jobId: data.jobId
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
                            "response_message": "Job removed successfully"
                        });
                    }
                });


            } else {
                callback({
                    "response_code": 5002,
                    "response_message": "Job already removed",
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


    //Employee Dashboard List
    employeeDashboard: async function (data, callback) {

        var query = {};

        if (data.employeeId) {
            query['_id'] = data.employeeId;
        }
        
        let startdate = moment().subtract(3, 'months').startOf('day').toISOString();
        let enddate = moment().endOf('day').toISOString();

        let employeedetails =   await CandidateSchema.aggregate([
            {
                    "$match": query
            },
            {
                $lookup: {
                    from: "job-titles",
                    localField: "current_job_title",
                    foreignField: "_id",
                    as: "employee_job_title"
                }

            },
            
            {
                $project: {
                _id: 1,
                profile_image: 1,
                employee_job_title: 1,
                fname: 1,
                lname: 1,
                updatedAt:1,
                current_company: 1,
                socialLogin:1,
                pecentage: {
                    "$sum": ["$profile_complete_percentage", "$contact_complete_percentage", "$preferJob_complete_percentage", "$workExperience_complete_percentage", "$salary_complete_percentage", "$education_complete_percentage", "$language_complete_percentage", "$skills_complete_percentage"]
                },
                }
            }]);
            console.log('employeedetails----',employeedetails)
            if(employeedetails.length > 0)
            {
               employeedetails = employeedetails[0]

                let updatedAt                           = commonModule.updateDate(employeedetails.updatedAt);    

                let employee_job_title                  = employeedetails.employee_job_title 

                let pecentage                           = employeedetails.pecentage        

                let fname                               = employeedetails.fname   

                let lname                               = employeedetails.lname  

                let current_company                     = employeedetails.current_company  

                //for profile image setup
                let profile_image                       = employeedetails.profile_image  

                if (employeedetails.socialLogin.image === null) {
                    profile_image =  config.liveUrl + employeedetails.profile_image
                } else {
                    profile_image =  employeedetails.socialLogin.image;
                }

                if (profile_image == '' || profile_image == null) {
                    profile_image = config.liveUrl + config.userDemoPicPath;
                }
                
                    employeedetails = {
                                    profile_image:profile_image,
                                    fname:fname,
                                    lname:lname,
                                    employee_job_title:employee_job_title,
                                    pecentage:pecentage,
                                    current_company:current_company,
                                    updatedAt:updatedAt,
                                }


            }


        let searchappearancejobvalue =  await Employee_Dashoard_LogSchema.find(
                                        { 
                                            "employee_id" :  data.employeeId,
                                            "action": 'search'
                                        })

        let recuiteractionjobvalue =  await Employee_Dashoard_LogSchema.find(
                                        { 
                                            "employee_id" :  data.employeeId,
                                            $or: 
                                                    [{
                                                        "action": 'viewAppliedJobCandidate'
                                                    }, {
                                                        "action": 'viewProfile'
                                                    }]
                                        })                                        

        let recommendedjobvalue =   await CandidateSchema.aggregate([
            {
                 "$match": query
            },
            {
                $lookup: {
                    from: "jobs",
                    localField: "skills.skill_id",
                    foreignField: "job_skill",
                    as: "employee_recommended_job_details"
                }

            },
            {
                $unwind: {
                    path: "$employee_recommended_job_details",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "job-countries",
                    localField: "country",
                    foreignField: "_id",
                    as: "country"
                }

            },
            {
                $lookup: {
                    from: "job-cities",
                    localField: "city",
                    foreignField: "_id",
                    as: "city"
                }

            },    
            {
                $group: {
                _id :  {
                        "country": "$country",
                        "city": "$city"
                      },
                employee_recommended_job_details: { $addToSet: "$employee_recommended_job_details" }
                    
              
                }
            }, 
            
            {
                $project: {
                _id: 1,
                employee_recommended_job_details: 1

                }
            }]);
      
        let newjobvalue =   await CandidateSchema.aggregate([
            {
                 "$match": query
            },
            {
                $lookup: {
                    from: "jobs",
                    localField: "skills.skill_id",
                    foreignField: "job_skill",
                    as: "employee_new_job_details"
                }

            },
            {
                $unwind: {
                    path: "$employee_new_job_details",
                    preserveNullAndEmptyArrays: true
                }
            },
            {

                $match: {

                    'employee_new_job_details.createdAt': { $gte : new Date(startdate), $lte :  new Date(enddate)}
                    
                }
            },

            {
                $group: {
                _id :  "$_id",
                employee_new_job_details: { $addToSet: "$employee_new_job_details" }
                    
              
                }
            }, 
            
            {
                $project: {
                _id: 1,
                employee_new_job_details: 1

                }
            }]);

        let savejobvalue =   await CandidateSchema.aggregate([
            {
                    "$match": query
            },
            {
                $lookup: {
                    from: "save-jobs",
                    localField: "_id",
                    foreignField: "employeeId",
                    as: "employee_save_job_details"
                }

            },
            {
                $unwind: {
                    path: "$employee_save_job_details",
                    preserveNullAndEmptyArrays: true
                }
            },

            {
                $lookup: {
                    from: "jobs",
                    localField: "employee_save_job_details.jobId",
                    foreignField: "_id",
                    as: "employee_job_details"
                }

            },
            {
                $unwind: {
                    path: "$employee_job_details",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $group: {
                _id :  "$_id",
                employee_save_job_details: { $addToSet: "$employee_save_job_details" },
                jobId:{ $addToSet: "$employee_job_details" },
                }
            }, 
            
            {
                $project: {
                _id: 1,
                employee_save_job_details: 1,
                jobId: 1,


                }
            }]);

    
        callback({
            "response_code": 2000,
            "response_message": "Employee Dashboard list.",
            "response_data": {
                 employeedetails:employeedetails,
                 searchappearancecount: searchappearancejobvalue.length ,
                 recruitedactioncount: recuiteractionjobvalue.length ,
                 newjobcount:   newjobvalue.length > 0 ? 
                                newjobvalue[0].employee_new_job_details.length:0 ,
                 recommendedjobcount: recommendedjobvalue.length > 0 ? 
                                recommendedjobvalue[0].employee_recommended_job_details.length:0 ,
                 savejobcount: savejobvalue.length > 0 ?
                                savejobvalue[0].employee_save_job_details.length:0 ,

                 searchappearancejobvalue : searchappearancejobvalue, 
                 recuiteractionjobvalue : recuiteractionjobvalue, 
                 newjobvalue : newjobvalue,
                 recommendedjobvalue : recommendedjobvalue,
                 savejobvalue : savejobvalue
                }
        });

           
    },




    //Resume List
    listResume: function (data, callback) {

        var page = 1,
            limit = 20,
            query = {};

        let queryName =''
        if (data.page) {
            page = parseInt(data.page);
        }
        if (data.limit) {
            limit = parseInt(data.limit);
        }
        if (data.title) {
            queryName = {
                "$or": [{
                    "title": new RegExp(data.title, 'i')
                }, {
                    "work_summary": new RegExp(data.work_summary, 'i')
                }]
            }
        }
        if (data.employeeId) {
            query['employeeId'] = data.employeeId;
        }
        if (data._id) {
            query['_id'] = data._id;
        }


        query = (data.title !== undefined || data.title !== '') ? { ...query ,...queryName} : query

        var aggregate = ResumeSchema.aggregate();
        aggregate.match(query);

        aggregate.lookup({
            from: 'employees',
            localField: 'employeeId',
            foreignField: '_id',
            as: 'employee_details'
        });

        aggregate.lookup({
            from: 'job-types',
            localField: 'employement_type',
            foreignField: '_id',
            as: 'employement_type'
        });

        aggregate.unwind({
            path: "$employement_type",
            preserveNullAndEmptyArrays: true
        });

        aggregate.lookup({
            from: 'job-countries',
            localField: 'country',
            foreignField: '_id',
            as: 'country'
        });

        aggregate.unwind({
            path: "$country",
            preserveNullAndEmptyArrays: true
        });

        aggregate.lookup({
            from: 'job-cities',
            localField: 'city',
            foreignField: '_id',
            as: 'city'
        });

        aggregate.unwind({
            path: "$city",
            preserveNullAndEmptyArrays: true
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

        aggregate.unwind({
            path: "$skills",
            preserveNullAndEmptyArrays: true
        });
        aggregate.lookup({
            from: 'job-skills',
            localField: 'skills',
            foreignField: '_id',
            as: 'skills'
        });
        aggregate.unwind({
            path: "$skills",
            preserveNullAndEmptyArrays: true
        });

        aggregate.group({
            "_id": "$_id",
            createdAt: {
                "$first": "$createdAt"
            },
            employee_details: {
                "$first": "$employee_details"
            },

            title: {
                "$first": "$title"
            },
            name: {
                "$first": "$name"
            },
            email: {
                "$first": "$email"
            },
            work_summary: {
                "$first": "$work_summary"
            },
            resumeImage: {
                "$first": "$resumeImage"
            },
            resume_file: {
                "$first": "$resume_file"
            },
            resumeImageName: {
                "$first": "$resumeImageName"
            },
            resumeFileName: {
                "$first": "$resumeFileName"
            },

            skills: {
                "$addToSet": "$skills"
            },
            job_tag: {
                "$addToSet": "$Jobtag"
            },
            employement_type: {
                "$addToSet": "$employement_type"
            },
            country: {
                "$addToSet": "$country"
            },
            city: {
                "$addToSet": "$city"
            },
            remoteArea: {
                "$first": "$remoteArea"
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
            remoteArea: {
                "$first": "$remoteArea"
            },
            onsite: {
                "$first": "$onsite"
            },
            relocation: {
                "$first": "$relocation"
            },

        });

        aggregate.project({
            _id: 1,
            createdAt: 1,
            employee_details: {
                '$arrayElemAt': [
                    [{
                        _id: {
                            '$arrayElemAt': ['$employee_details._id', 0]
                        },
                        fname: {
                            '$arrayElemAt': ['$employee_details.fname', 0]
                        },
                        lname: {
                            '$arrayElemAt': ['$employee_details.lname', 0]
                        },
                        profile_image: {
                            $cond: {
                                if: {
                                    $in: ["NORMAL", "$employee_details.type"]
                                },
                                then: {
                                    $cond: {
                                        if: {
                                            $in: [null, "$employee_details.profile_image"]
                                        },
                                        then: config.liveUrl + config.userDemoPicPath,
                                        else: {
                                            $concat: [config.liveUrl, {
                                                "$arrayElemAt": ["$employee_details.profile_image", 0]
                                            }]
                                            // "$arrayElemAt": ["$User.profile_image", 0]
                                        }
                                    }

                                },
                                else: {
                                    $cond: {
                                        if: {
                                            $eq: [{
                                                '$arrayElemAt': ['$employee_details.socialLogin.image', 0]
                                            }, null]
                                        },
                                        then: config.liveUrl + config.userDemoPicPath,
                                        else: {
                                            '$arrayElemAt': ['$employee_details.socialLogin.image', 0]

                                        }
                                    }
                                }
                            }
                        },
                    }], 0
                ]
            },
            title: 1,
            name: 1,
            email: 1,
            work_summary: 1,
            resumeImage:{
                $concat: [config.liveUrl, "$resumeImage"]
            },
            resumeImageName: 1,
            resumeFileName: 1,

            resume_file: {
                $concat: [config.liveUrl, "$resume_file"]
            },
            job_tag: 1,
            skills: "$skills",
            employement_type: "$employement_type",
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
            remoteArea: 1,
            onsite: 1,
            relocation: 1
        });
        aggregate.sort({
            'createdAt': -1
        })
        var options = {
            page: page,
            limit: limit
        }

        ResumeSchema.aggregatePaginate(aggregate, options, function (err, results, pageCount, count) {
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
                    "response_message": "Resume list.",
                    "response_data": data
                });

            }
        });
    },
    // Add Resume
    addResume: async function (data, fileData, callback) {

            if (data) {
                CandidateSchema.findOne({
                        _id: data.employeeId
                    },(err, employee) =>{
                        if (err) {
                                  callback({
                                    success: false,
                                    "response_code": 5005,
                                    "response_message": "INTERNAL DB ERROR",
                                    "response_data": {}
                                });                           
                          
                        } else {
                            if (employee === null) {
                                 callback({
                                    success: false,
                                    "response_code": 5002,
                                    "response_message": "Employee not exist",
                                    "response_data": {}
                                });
                            } else {
                                    data.remoteArea = data.remoteArea == "true" ? true : false;
                                    data.onsite     = data.onsite == "true" ? true : false;
                                    data.relocation = data.relocation == "true" ? true : false;
                                    data.skills     = data.skills ? JSON.parse(data.skills): [];
                                    data.job_tag    = data.job_tag ? JSON.parse(data.job_tag) : [];
                                    data.employement_type = data.employement_type ? JSON.parse(data.employement_type) : [];
                                    data.country    = data.country 
                                    data.city       = data.city 
                                    data.name       = data.name 
                                    data.email      = data.email

                                    new ResumeSchema(data).save( async (err, result) => {
                                        if (err) {
                                             callback({
                                                 success: false,
                                                "response_code": 5005,
                                                "response_message": err,
                                                "response_data": {}
                                            });
                                        } else {
                                            console.log('fileData-------->',fileData);
    
                                            if( fileData && fileData !== null)
                                            {

                                            let resumeImageFilename = ''
                                            let resumeImagefileName = ''

                                            if (fileData.resumeImage) {

                                                    let resumePicFile = fileData.resumeImage;
                                                    resumeImagefileName = resumePicFile.name;

                                                    let FrontPic = resumePicFile.mimetype.split("/")

                                                    var folderpath = config.uploadResumePath + data.employeeId + `/${result._id}/`;
                                                    let resumePath = config.resumePath + data.employeeId + `/${result._id}/`;
                                                    resumeImageFilename = resumePath+resumeImagefileName
                                                    data.resumeImageName = resumeImagefileName;

                                                    await resumePicFile.mv(`${folderpath}/${resumeImagefileName}`, async function (err) {
                                                                                     
                                                    });

                                                    await ResumeSchema.update({_id: result._id}, {
                                                        $set: {
                                                            "resumeImageName": resumeImagefileName,
                                                            "resumeImage": resumeImageFilename
                                                        }           
                                                     });
                                            }

                                            let fileFilename = ''
                                            let filefileName = ''

                                            if (fileData.file) {

                                                    let resumePicFile = fileData.file;
                                                     filefileName = resumePicFile.name;

                                                    console.log('[index]---',resumePicFile)
                                                    let FrontPic = resumePicFile.mimetype.split("/")
                                                   // var filefileName =  'file'+ '.' + FrontPic[1];

                                                   
                                                    var folderpath = config.uploadResumePath + data.employeeId + `/${result._id}/`;
                                                    let resumePath = config.resumePath + data.employeeId + `/${result._id}/`;
                                                    
                                                    fileFilename = resumePath+filefileName
                                                    data.fileName = filefileName;
                                                    await resumePicFile.mv(`${folderpath}/${filefileName}`, async function (err) {
                                                                                       
                                                    });

                                                    await ResumeSchema.update({_id: result._id}, {
                                                    $set: {
                                                        "resumeFileName": filefileName,
                                                        "resume_file": fileFilename
                                                    }           
                                                    });
                                             
                                            }
                                        
                                            }
    


                                           console.log('employee----->',employee)
                                            mailProperty('newResumeMail')(employee.email, {
                                                name: employee.fname + ' ' + employee.lname,
                                                resumeTitle: result.title,
                                                site_url: config.liveUrl,
                                                date: new Date()
                                            }).send();

                                            var message = 'New Resume ' + result.title + ' has been posted successfully.';
                                            var title = 'New Resume Posted';
                                            var notification_code = 1000;
                                            var pushData = {
                                                deviceId: employee.devicetoken,
                                                user_id: employee._id,
                                                title: title,
                                                message: message,
                                                notification_code: notification_code
                                            }
                                            var addData = {
                                                _id: new ObjectID,
                                                user_id: employee._id,
                                                notification_code: notification_code,
                                                message: message,
                                                title: title,
                                                notification_for: 'resume_post',
                                            }
                                           await NotificationModels.addNotification(addData, async function (notiResult) {
                                                if (employee.apptype == 'IOS') {
                                                    await pushNotification.iosPushNotificationUser(pushData, function (pushStatus) {
                                                        console.log('pushStatus', pushStatus);
                                                    });
                                                } else if (employee.apptype = 'ANDROID') {
                                                    await pushNotification.androidPushNotification(pushData, function (pushStatus) {
                                                        console.log('pushStatus', pushStatus);
                                                    });
                                                }
                                            });

                                            var admin_message = employee.fname + ' ' + employee.lname + ' posted a new resume ' + result.title;
                                            var admin_title = 'New Resume Posted';
                                            var addData = {
                                                _id: new ObjectID,
                                                user_id: employee._id,
                                                user_type: 'employee',
                                                message: admin_message,
                                                title: admin_title,

                                            }
                                            console.log('addData------->',addData)
                                           await AdminNotificationModels.addNotification(addData, function (notiResult) {});

                                            let findResumeResponse = await ResumeSchema.findOne({_id: result._id})
                                            if(findResumeResponse !== null)
                                            {
                                                findResumeResponse.resumeImage = findResumeResponse.resumeImage !== undefined ?
                                                                                 findResumeResponse.resumeImage:''

                                                findResumeResponse.resume_file = findResumeResponse.resume_file !== undefined ?
                                                                                 findResumeResponse.resume_file:''                                                                             
                                            }
        
                                            callback({
                                                success: true,
                                                "response_code": 2000,
                                                "response_message": "Resume has been registered successfully",
                                                "response_data": findResumeResponse
                                            });
                                    }
                                });
                            }
                        }
                    });
            } else {
                callback({
                     success: false,
                    "response_code": 5005,
                    "response_message": "INTERNAL DB ERROR",
                    "response_data": {}
                });
            }
    },
    // Publish Resume
    publishResume: async function (data, callback) {
        if (data) {

            let resume = await ResumeSchema.findOne({
                _id: data.resumeId
            }, function (err, result) {
                if (err) {
                    callback({
                        "response_code": 5005,
                        "response_message": err,
                        "response_data": {}
                    });

                }
            });

            if(resume != null) {
                
                ResumeSchema.updateOne({
                    _id: data.resumeId
                }, {
                    $set: {
                        status: "publish",
                    }
                }, function (err, resUpdate) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": err,
                            "response_data": {}
                        });
                    } else {
                        callback({
                            "response_code": 2000,
                            "response_message": "Resume Publish Successfully",
                            "response_data": {}
                        });
                    }
                });


            } else {
                callback({
                    "response_code": 5002,
                    "response_message": "Resume not found",
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
    // Edit Resume
    editResume: async function (data, fileData, callback) {

        if (data) {

                    let resData = await ResumeSchema.findOne({
                        _id: data.resumeId
                    }, function (err, result) {
                        if (err) {

                            callback({
                            "success": false,
                            "response_code": 5005,
                            "response_message": "Error Occur while editing Resume",
                            "response_data": err
                            });
                        }
                    });

                    if (resData !== null) {

                        data.remoteArea = data.remoteArea == "true" ? true : false;
                        data.onsite = data.onsite == "true" ? true : false;
                        data.relocation = data.relocation == "true" ? true : false;
                        data.skills = data.skills?JSON.parse(data.skills):resData.skills;
                        data.job_tag = data.job_tag?JSON.parse(data.job_tag):resData.job_tag;
                        data.employement_type = data.employement_type?JSON.parse(data.employement_type):resData.employement_type;
                        data.country = data.country?data.country:resData.country;
                        data.city = data.city?data.city:resData.city;
                        data.name = data.name?data.name:resData.name;
                        data.email = data.email?data.email:resData.email;


                        ResumeSchema.update({
                            _id: data.resumeId
                        }, {
                            $set: {
                                title: data.title,
                                work_summary: data.work_summary,
                                skills: data.skills,
                                job_tag: data.job_tag,
                                country: data.country,
                                city: data.city,
                                name: data.name,
                                email: data.email,
                                employement_type: data.employement_type,
                                remoteArea: data.remoteArea,
                                onsite: data.onsite,
                                relocation: data.relocation,
                            }
                        }, async (err, resUpdate) => {
                            if (err) {
                                    callback({
                                        success: false,
                                        STATUSCODE: 5005,
                                        message: "INTERNAL DB ERROR",
                                        response: err
                                    });
                            } else {



                                let resumeImageFilename= resData.resumeImage
                                let resumeImagefileName = resData.resumeImageName
                                if (fileData !== null && fileData.resumeImage) {

                                          let resumePicFile = fileData.resumeImage;
                                           resumeImagefileName = resumePicFile.name;

                                          console.log('[index]---',resumePicFile)
                                          let FrontPic = resumePicFile.mimetype.split("/")
                                         // var resumeImagefileName =  'resumeImage'+ '.' + FrontPic[1];

                                        var folderpath = config.uploadResumePath + resData.employeeId + `/${resData._id}/`;
                                        let resumePath = config.resumePath + resData.employeeId + `/${resData._id}/`;
                                          resumeImageFilename = resumePath+resumeImagefileName
                                          data.resumeImageName = resumeImagefileName;

                                          //resumeImageFilename = resumeImageFilename.replace(',','.')
                                          console.log('FrontPic--->',resumeImageFilename)


                                            let oldResumeImageFile = `./public/${resData.resumeImage}`;
                                            if (fs.existsSync(oldResumeImageFile)) {
                                                fs.unlink(oldResumeImageFile, (err) => {
                                                })
                                            }

                                        await resumePicFile.mv(`${folderpath}/${resumeImagefileName}`, async function (err) {
                                                                         
                                        });

                                        // resumeFileName:data.resumeFileName,
                                        // resumeImageName:data.resumeImageName,
                                        // resumeImage:data.resumeImage,
                                        //resume_file: data.resume_file,

                                        await ResumeSchema.update({_id: data.resumeId}, {
                                            $set: {
                                                "resumeImageName": resumeImagefileName,
                                                "resumeImage": resumeImageFilename
                                            }           
                                            });
                                }

                                let fileFilename= resData.file
                                let filefileName = resData.fileName

                                if (fileData !== null && fileData.file) {

                                    let resumePicFile = fileData.file;
                                     filefileName = resumePicFile.name;

                                    console.log('[index]---',resumePicFile)
                                    let FrontPic = resumePicFile.mimetype.split("/")
                                   // var filefileName =  'file'+ '.' + FrontPic[1];

                                   
                                    var folderpath = config.uploadResumePath + resData.employeeId + `/${resData._id}/`;
                                    let resumePath = config.resumePath + resData.employeeId + `/${resData._id}/`;
                                    
                                    fileFilename = resumePath+filefileName
                                    data.fileName = filefileName;

                                    //fileFilename = fileFilename.replace(',','.')
                                    console.log('FrontPic--->',fileFilename)


                                      let oldResumeImageFile = `./public/${resData.file}`;
                                      if (fs.existsSync(oldResumeImageFile)) {
                                          fs.unlink(oldResumeImageFile, (err) => {
                                          })
                                      }

                                  await resumePicFile.mv(`${folderpath}/${filefileName}`, async function (err) {
                                                                   
                                  });

                                  await ResumeSchema.update({_id: data.resumeId}, {
                                    $set: {
                                        "resumeFileName": filefileName,
                                        "resume_file": fileFilename
                                    }           
                                    });
                                 
                                }
                                let responseUpdated =    await ResumeSchema.findOne({_id: data.resumeId})
                                callback({
                                    "response_code": 2000,
                                    "response_message": "Resume Updated Successfully",
                                    "response_data": responseUpdated
                                });

                            }
                        })

                    }else{
                        callback({
                            "success": false,
                            "response_code": 5002,
                            "response_message": "Resume not found.",
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
    // Delete Resume
    deleteResume: async function (data, callback) {
        if (data) {

            let resume = await ResumeSchema.findOne({
                _id: data.resumeId
            }, function (err, result) {
                if (err) {
                    callback({
                        "response_code": 5005,
                        "response_message": err,
                        "response_data": {}
                    });

                }
            });

            if(resume !== null) {
                var filePath = config.uploadResumePath + resume.employeeId + `/${resume._id}/`;
                
                // let files = fs.readdirSync(filePath);
    
                // if(files.length > 0){
                //     files.forEach((file) => {
                //         fs.unlinkSync(path.join(filePath, file));
                        
                //     });
                //     fs.rmdirSync(filePath);
                // } else {
                //     fs.rmdirSync(filePath);
                // }
                
                

                // if (fs.existsSync(oldFile)) {
                //     fs.unlink(oldFile, (err) => {
                //         if (err) throw err;
                //         // if no error, file has been deleted successfully
                //         console.log('File deleted!');
                //     });
                //     fs.rmdirSync(folderpath)
                // }

                ResumeSchema.deleteOne({
                    _id: data.resumeId
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
                            "response_message": "Resume deleted."
                        });
                    }
                });


                } else {
                    callback({
                        "response_code": 5002,
                        "response_message": "Resume not found",
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



    //applyJob List
    applyJobList: async function (data, callback) {

        console.log('data---->',data)

        var page = 1,
            limit = 20,
            query = {};

        let queryName =''
        if (data.page) {
            page = parseInt(data.page);
        }
        if (data.limit) {
            limit = parseInt(data.limit);
        }

        if (data.employeeId) {
            query['employeeId'] = data.employeeId;
        }

        if (data.status) {
            query['status'] = data.status;
        }

        let employer_id = data.decoded.id

        let check_employer = await EmployerSchema.findOne({
            _id: employer_id
        }, function (err, result) {
            if (err) {
                callback({
                    "response_code": 5005,
                    "response_message": err,
                    "response_data": {}
                });

            }
        });

       // console.log('check_employer---',check_employer);
        

        let querySearchText = ''
        let jobSet = []
        if (data.searchText) {

          let jobvalue =   await JobSkillSchema.aggregate([
                { "$match": { $or: [
                            { name: { $regex: data.searchText, $options: "i" } },
                            { ar_name: { $regex: data.searchText, $options: "i" } }
                        ]
                    
                 }
                },

                {
                $lookup: {
                  from: "jobs",
                  localField: "_id",
                  foreignField: "job_skill",
                  as: "jobaddress"
                }

                },

                {
                    $group: {
                    _id : "$_id",
                    jobaddress: { $push: "$jobaddress" }
                    }
                }, 
                
                {
                    $project: {
                    _id: 1,
                    jobaddress: 1
                    }
                }]);


          //  console.log('jobvalue 1----->',jobvalue[0].jobaddress)
          //  console.log('jobvalue 2----->',jobvalue[1].jobaddress)
           if(jobvalue.length > 0) 
           {

                jobvalue.map( (jobVal) => {

                    //console.log('jobVal.jobaddress---',jobVal.jobaddress);
                    
                    if(jobVal.jobaddress.length > 0) 
                    {
                        jobVal.jobaddress[0].map( (jobId) => {
                            jobSet.push(jobId._id)
                        })
                    }
                })
            }
                    console.log('jobId------',jobSet)
                    querySearchText = { jobId: { $in: jobSet } }
                            
        }

        if (data._id) {
            query['_id'] = data._id;
        }

        
        query = (data.searchText !== undefined || data.searchText !== '') ? { ...query ,...querySearchText} : query

        var aggregate = ApplicationSchema.aggregate();
        aggregate.match(query);

        aggregate.lookup({
            from: 'employees',
            localField: 'employeeId',
            foreignField: '_id',
            as: 'employee_details'
        });

        aggregate.lookup({
            from: 'resumes',
            localField: 'resumeId',
            foreignField: '_id',
            as: 'resume_details'
        });

        aggregate.lookup({
            from: 'jobs',
            localField: 'jobId',
            foreignField: '_id',
            as: 'job_details'
        });

        aggregate.unwind({
            path: "$job_details",
            preserveNullAndEmptyArrays: true
        });

        aggregate.lookup({
            from: 'job-countries',
            localField: 'job_details.country',
            foreignField: '_id',
            as: 'job_details.country'
        });

        aggregate.lookup({
            from: 'job-cities',
            localField: 'job_details.city',
            foreignField: '_id',
            as: 'job_details.city'
        });

        aggregate.lookup({
            from: 'job-tags',
            localField: 'job_details.job_tag',
            foreignField: '_id',
            as: 'job_details.job_tag'
        });

        aggregate.lookup({
            from: 'job-types',
            localField: 'job_details.job_type',
            foreignField: '_id',
            as: 'job_details.job_type'
        });

        aggregate.lookup({
            from: 'job-levels',
            localField: 'job_details.job_level',
            foreignField: '_id',
            as: 'job_details.job_level'
        });
        
        aggregate.lookup({
            from: 'job-industries',
            localField: 'job_details.job_industry',
            foreignField: '_id',
            as: 'job_details.job_industry'
        });    

        aggregate.lookup({
            from: 'job-skills',
            localField: 'job_details.job_skill',
            foreignField: '_id',
            as: 'job_details.job_skill'
        });

        aggregate.lookup({
            from: 'employers',
            localField: 'job_details.employerId',
            foreignField: '_id',
            as: 'job_details.employerId'
        });
        

        aggregate.lookup({
            from: 'employers',
            localField: 'employerId',
            foreignField: '_id',
            as: 'employers_details'
        });


        aggregate.group({
            "_id": "$_id",
            createdAt: {
                "$first": "$createdAt"
            },
            status: {
                "$first": "$status"
            },
            employee_details: {
                "$first": "$employee_details"
            },
            employers_details: {
                "$first": "$employers_details"
            },
            resume_details: {
                "$first": "$resume_details"
            },

            job_details: {
                "$first": "$job_details"
            }

        });

        aggregate.project({
            _id: 1,
            createdAt: 1,
            status: 1,
            employee_details: {
                '$arrayElemAt': [
                    [{
                        _id: {
                            '$arrayElemAt': ['$employee_details._id', 0]
                        },
                        fname: {
                            '$arrayElemAt': ['$employee_details.fname', 0]
                        },
                        lname: {
                            '$arrayElemAt': ['$employee_details.lname', 0]
                        },
                        profile_image: {
                            $cond: {
                                if: {
                                    $in: ["NORMAL", "$employee_details.type"]
                                },
                                then: {
                                    $cond: {
                                        if: {
                                            $in: [null, "$employee_details.profile_image"]
                                        },
                                        then: config.liveUrl + config.userDemoPicPath,
                                        else: {
                                            $concat: [config.liveUrl, {
                                                "$arrayElemAt": ["$employee_details.profile_image", 0]
                                            }]
                                            // "$arrayElemAt": ["$User.profile_image", 0]
                                        }
                                    }

                                },
                                else: {
                                    $cond: {
                                        if: {
                                            $eq: [{
                                                '$arrayElemAt': ['$employee_details.socialLogin.image', 0]
                                            }, null]
                                        },
                                        then: config.liveUrl + config.userDemoPicPath,
                                        else: {
                                            '$arrayElemAt': ['$employee_details.socialLogin.image', 0]

                                        }
                                    }
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
            resume_details: 1,
            job_details: 1
        });
        aggregate.sort({
            'createdAt': -1
        })
        var options = {
            page: page,
            limit: limit
        }

        ApplicationSchema.aggregatePaginate(aggregate, options, function (err, results, pageCount, count) {
            if (err) {
                callback({
                    "response_code": 5005,
                    "response_message": err,
                    "response_data": {}
                });

            } else {

                if (results.length > 0)
                {
                
                        results.map( async (output) => {

                                    if(check_employer  !== null)
                                    {
                                            let logdata = {
                                                    employee_id: output.employee_details._id,
                                                    employer_id: check_employer._id,
                                                    action:'viewAppliedJobCandidate',
                                                    keyword:'',
                                                    body:''
                                            }
                                            await employeeDashoardLog(logdata)
                                    }
                            })
                }

                var data = {
                    docs: results,
                    pages: pageCount,
                    total: count,
                    limit: limit,
                    page: page
                }
                callback({
                    "response_code": 2000,
                    "response_message": "Applied Job list.",
                    "response_data": data
                });

            }
        });
    },


    // Revoke Job
    revokeApplyJob: async function (data, callback) {
        if (data) {

                    let jobApplication = await ApplicationSchema.findOne({
                        _id: data.jobApplicationId
                    }, async function (err, result) {
                        if (err) {
                          
                            callback({
                                "response_code": 5005,
                                "response_message": err,
                                "response_data": {}
                            });

                        }else if(result === null) {
                            
                            callback({
                                "response_code": 5002,
                                "response_message": "Job Application not found",
                                "response_data": {}
                            });

                        }else{

                            await ApplicationSchema.deleteOne({ _id: data.jobApplicationId })

                            callback({
                                "response_code": 2000,
                                "response_message": "Job Revoked successfully"
                            });
                        }
                    });
            }
            
    },


    // Apply Job
    applyJob: async function (data, callback) {
        if (data) {

            let employee = await CandidateSchema.findOne({
                _id: data.employeeId
            }, function (err, result) {
                if (err) {
                    callback({
                        "response_code": 5005,
                        "response_message": err,
                        "response_data": {}
                    });

                }
            });

            if(employee == null) {
                callback({
                    "response_code": 5002,
                    "response_message": "Employee not found",
                    "response_data": {}
                });
            }

            let job = await JobSchema.findOne({
                _id: data.jobId
            }, function (err, result) {
                if (err) {
                    callback({
                        "response_code": 5005,
                        "response_message": err,
                        "response_data": {}
                    });

                }
            });

            if(job == null) {
                callback({
                    "response_code": 5002,
                    "response_message": "Job not found",
                    "response_data": {}
                });
            }

            let employer = await EmployerSchema.findOne({
                _id: job.employerId
            }, function (err, result) {
                if (err) {
                    callback({
                        "response_code": 5005,
                        "response_message": err,
                        "response_data": {}
                    });

                }
            });


            let resume = await ResumeSchema.findOne({
                _id: data.resumeId
            }, function (err, result) {
                if (err) {
                    callback({
                        "response_code": 5005,
                        "response_message": err,
                        "response_data": {}
                    });

                }
            });

            if(resume != null) {
                data.employerId = job.employerId;
                let to_mail = job.application_email_id;

                if(to_mail == null){
                    to_mail = employer.email;
                }

                new ApplicationSchema(data).save(function (err, result) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": {}
                        });
                    } else {

                        mailProperty('newApplicationMail')(to_mail, {
                            name: employer.fname + ' ' + employer.lname,
                            candidate_name: employee.fname + ' ' + employee.lname,
                            jobTitle: job.language == 'ar' ? job.ar_name : job.name,
                            site_url: config.liveUrl,
                            date: new Date()
                        }).send();

                        var message = 'New Job Application Received for your job ' + job.name;
                        var title = 'New Job Application';
                        var notification_code = 1001;
                        var pushData = {
                            deviceId: employer.devicetoken,
                            user_id: employer._id,
                            title: title,
                            message: message,
                            notification_code: notification_code
                        }
                        var addData = {
                            _id: new ObjectID,
                            user_id: employer._id,
                            notification_code: notification_code,
                            message: message,
                            title: title,
                            notification_for: 'application_received',
                        }
                        EmpployerNotificationModels.addNotification(addData, function (notiResult) {
                            if (employee.apptype == 'IOS') {
                                pushNotification.iosPushNotificationUser(pushData, function (pushStatus) {
                                    console.log('pushStatus', pushStatus);
                                });
                            } else if (employee.apptype = 'ANDROID') {
                                pushNotification.androidPushNotification(pushData, function (pushStatus) {
                                    console.log('pushStatus', pushStatus);
                                });
                            }
                        });

                        var admin_message = employee.fname + ' ' + employee.lname + ' applied to a job ' + job.name;
                        var admin_title = 'New Job Application';
                        var addData = {
                            _id: new ObjectID,
                            user_id: employee._id,
                            user_type: 'employee',
                            message: admin_message,
                            title: admin_title,

                        }
                        AdminNotificationModels.addNotification(addData, function (notiResult) {});

                        callback({
                            "response_code": 2000,
                            "response_message": "Job applied successfully"
                        });
                    }
                });


            } else {
                callback({
                    "response_code": 5002,
                    "response_message": "Resume not found",
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

    //list Shortlisted Employee 
    listShortlistedEmployee: async function (data, callback) {

        //console.log('data----------->',data)
        var page = 1,
            limit = 20,
            query = {};

        let companyDemoLogo = config.companyDemoLogoPath;
        if (data.page) {
            page = parseInt(data.page);
        }
        if (data.limit) {
            limit = parseInt(data.limit);
        }
        if (data.employeeId) {
            query['_id'] = data.employeeId;
        }

        console.log('query----------->',query)

        var aggregate = EmployerSchema.aggregate();

        aggregate.lookup({
            from: 'companies',
            localField: 'companyId',
            foreignField: '_id',
            as: 'companiesDetails'
        });

        aggregate.unwind({
            path: "$companiesDetails",
            preserveNullAndEmptyArrays: true
        });

        aggregate.lookup({
            from: 'job-countries',
            localField: 'companiesDetails.country',
            foreignField: '_id',
            as: 'companiesDetails.country'
        });


        aggregate.unwind({
            path: "$companiesDetails.country",
            preserveNullAndEmptyArrays: true
        });

        aggregate.lookup({
            from: 'job-cities',
            localField: 'companiesDetails.city',
            foreignField: '_id',
            as: 'companiesDetails.city'
        });        

        aggregate.unwind({
            path: "$companiesDetails.city",
            preserveNullAndEmptyArrays: true
        });

        aggregate.lookup({
            from: 'employers',
            localField: 'companiesDetails.employerId',
            foreignField: '_id',
            as: 'companiesDetails.employerId'
        });

        aggregate.unwind({
            path: "$companiesDetails.employerId",
            preserveNullAndEmptyArrays: true
        });


        aggregate.lookup({
            from: 'job-applications',
            localField: '_id',
            foreignField: 'employerId',
            as: 'JobApplicationsDetails'
        });

        aggregate.unwind({
            path: "$JobApplicationsDetails",
            preserveNullAndEmptyArrays: true
        });

        aggregate.match(
            {
                 "JobApplicationsDetails.employeeId" : data.employeeId ,
                 "JobApplicationsDetails.status" : 'shortlisted'
            });
        
        aggregate.lookup({
            from: 'jobs',
            localField: 'JobApplicationsDetails.jobId',
            foreignField: '_id',
            as: 'JobDetails'
        });

        aggregate.unwind({
            path: "$JobDetails",
            preserveNullAndEmptyArrays: true
        });


        aggregate.lookup({
            from: 'job-countries',
            localField: 'JobDetails.country',
            foreignField: '_id',
            as: 'JobDetails.country'
        });

        aggregate.lookup({
            from: 'job-cities',
            localField: 'JobDetails.city',
            foreignField: '_id',
            as: 'JobDetails.city'
        });
        aggregate.lookup({
            from: 'job-tags',
            localField: 'JobDetails.job_tag',
            foreignField: '_id',
            as: 'JobDetails.job_tag'
        });
        aggregate.lookup({
            from: 'job-types',
            localField: 'JobDetails.job_type',
            foreignField: '_id',
            as: 'JobDetails.job_type'
        });
        aggregate.lookup({
            from: 'job-industries',
            localField: 'JobDetails.job_industry',
            foreignField: '_id',
            as: 'JobDetails.job_industry'
        });
        aggregate.lookup({
            from: 'job-levels',
            localField: 'JobDetails.job_level',
            foreignField: '_id',
            as: 'JobDetails.job_level'
        });

        aggregate.lookup({
            from: 'job-skills',
            localField: 'JobDetails.job_skill',
            foreignField: '_id',
            as: 'JobDetails.job_skill'
        });
       


        // aggregate.lookup({
        //     from: 'job-countries',
        //     localField: 'JobApplicationsDetails.employeeId.country',
        //     foreignField: '_id',
        //     as: 'JobApplicationsDetails.employeeId.country'
        // });
        
        // aggregate.unwind({
        //     path: "$JobApplicationsDetails.employeeId.country",
        //     preserveNullAndEmptyArrays: true
        // });

        // aggregate.lookup({
        //     from: 'job-cities',
        //     localField: 'JobApplicationsDetails.employeeId.city',
        //     foreignField: '_id',
        //     as: 'JobApplicationsDetails.employeeId.city'
        // });
        
        // aggregate.unwind({
        //     path: "$JobApplicationsDetails.employeeId.city",
        //     preserveNullAndEmptyArrays: true
        // });

        // aggregate.lookup({
        //     from: 'job-skills',
        //     localField: 'JobApplicationsDetails.employeeId.skills.skill_id',
        //     foreignField: '_id',
        //     as: 'JobApplicationsDetails.employeeId.skills.skill_id'
        // });


        // aggregate.lookup({
        //     from: 'job-levels',
        //     localField: 'JobApplicationsDetails.employeeId.preferJob.job_level',
        //     foreignField: '_id',
        //     as: 'JobApplicationsDetails.employeeId.preferJob.job_level'
        // });
        
        // aggregate.unwind({
        //     path: "$JobApplicationsDetails.employeeId.preferJob.job_level",
        //     preserveNullAndEmptyArrays: true
        // });

        // aggregate.lookup({
        //     from: 'job-countries',
        //     localField: 'JobApplicationsDetails.employeeId.preferJob.job_country',
        //     foreignField: '_id',
        //     as: 'JobApplicationsDetails.employeeId.preferJob.job_country'
        // });
        
        // aggregate.unwind({
        //     path: "$JobApplicationsDetails.employeeId.preferJob.job_country",
        //     preserveNullAndEmptyArrays: true
        // });

        // aggregate.lookup({
        //     from: 'job-cities',
        //     localField: 'JobApplicationsDetails.employeeId.preferJob.job_city',
        //     foreignField: '_id',
        //     as: 'JobApplicationsDetails.employeeId.preferJob.job_city'
        // });
        
        // aggregate.unwind({
        //     path: "$JobApplicationsDetails.employeeId.preferJob.job_city",
        //     preserveNullAndEmptyArrays: true
        // });

        // aggregate.lookup({
        //     from: 'job-industries',
        //     localField: 'JobApplicationsDetails.employeeId.preferJob.job_industry',
        //     foreignField: '_id',
        //     as: 'JobApplicationsDetails.employeeId.preferJob.job_industry'
        // });

        
        
        // aggregate.lookup({
        //     from: 'job-types',
        //     localField: 'JobApplicationsDetails.employeeId.preferJob.job_employment_type',
        //     foreignField: '_id',
        //     as: 'JobApplicationsDetails.employeeId.preferJob.job_employment_type'
        // });
        
        // aggregate.unwind({
        //     path: "$JobApplicationsDetails.employeeId.preferJob.job_employment_type",
        //     preserveNullAndEmptyArrays: true
        // });

        // aggregate.lookup({
        //     from: 'job-titles',
        //     localField: 'JobApplicationsDetails.employeeId.preferJob.job_role',
        //     foreignField: '_id',
        //     as: 'JobApplicationsDetails.employeeId.preferJob.job_role'
        // });
        
        // aggregate.unwind({
        //     path: "$JobApplicationsDetails.employeeId.preferJob.job_role",
        //     preserveNullAndEmptyArrays: true
        // });
        
        // aggregate.lookup({
        //     from: 'job-titles',
        //     localField: 'JobApplicationsDetails.employeeId.current_job_title',
        //     foreignField: '_id',
        //     as: 'JobApplicationsDetails.employeeId.current_job_title'
        // });
        
        // aggregate.unwind({
        //     path: "$JobApplicationsDetails.employeeId.current_job_title",
        //     preserveNullAndEmptyArrays: true
        // });

        // aggregate.lookup({
        //     from: 'jobs',
        //     localField: 'JobApplicationsDetails.jobId',
        //     foreignField: '_id',
        //     as: 'JobApplicationsDetails.jobId'
        // });
        
        // aggregate.unwind({
        //     path: "$JobApplicationsDetails.jobId",
        //     preserveNullAndEmptyArrays: true
        // });



        aggregate.group({
            "_id": "$_id",
            createdAt: {
                "$first": "$createdAt"
            },
            fname: {
                "$first": "$fname"
            },
            lname: {
                "$first": "$lname"
            },
            email: {
                "$first": "$email"
            },
            socialLogin :{
                "$first": "$socialLogin"
            },
            companiesDetails:{
                "$first": "$companiesDetails"
            },

            profile_image: {
                "$first": "$profile_image"
            },
            JobDetails: {
                "$addToSet": "$JobDetails"
            }

        });

        aggregate.project({
            _id: 1,
            createdAt: 1,
            fname: 1,
            lname: 1,
            email: 1,
            companiesDetails: 1,
            profile_image: 1,
            socialLogin: 1,
            JobDetails: 1
        });

        aggregate.sort({
            'createdAt': 1
        })
        var options = {
            page: page,
            limit: limit
        }

        EmployerSchema.aggregatePaginate(aggregate, options, function (err, results, pageCount, count) {
            if (err) {
                callback({
                    "response_code": 5005,
                    "response_message": err,
                    "response_data": {}
                });

            } else {


 
                if(results.length > 0)
                {

                            results.map( (output) => {



                                output.companiesDetails.logo = 
                                ( output.companiesDetails.logo !== null ) ? 
                                config.liveUrl + output.companiesDetails.logo : config.liveUrl + config.userDemoPicPath
            

                                output.companiesDetails.employerId.profile_image = 
                                ( output.companiesDetails.employerId.profile_image == null && output.companiesDetails.employerId.socialLogin.image !== null ) ? 
                                 output.companiesDetails.employerId.socialLogin.image:
                                ( output.companiesDetails.employerId.profile_image !== null && output.companiesDetails.employerId.socialLogin.image == null ) ? 
                                config.liveUrl + output.companiesDetails.employerId.profile_image : config.liveUrl + config.userDemoPicPath
            


                                output.profile_image = 
                                ( output.profile_image == null && output.socialLogin.image !== null ) ? 
                                 output.socialLogin.image:
                                ( output.profile_image !== null && output.socialLogin.image == null ) ? 
                                config.liveUrl + output.profile_image : config.liveUrl + config.userDemoPicPath
            
            
                            })

                }


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

    
    //list Interested Not Interested Employer
    listInterestedNotInterestedEmployer: async function (data, callback) {

        //console.log('data----------->',data)
        var page = 1,
            limit = 20,
            query = {};

        let companyDemoLogo = config.companyDemoLogoPath;
        if (data.page) {
            page = parseInt(data.page);
        }
        if (data.limit) {
            limit = parseInt(data.limit);
        }
        if (data.employeeId) {
            query['employeeId'] = data.employeeId;
        }

        console.log('query----------->',query)

        var aggregate = Interested_Not_InterestedSchema.aggregate();
        aggregate.match(query)

        aggregate.lookup({
            from: 'employers',
            localField: 'employerId',
            foreignField: '_id',
            as: 'employerId'
        });
        
        aggregate.unwind({
            path: "$employerId",
            preserveNullAndEmptyArrays: true
        });

        aggregate.lookup({
            from: 'companies',
            localField: 'employerId.companyId',
            foreignField: '_id',
            as: 'employerId.companyId'
        });

        aggregate.unwind({
            path: "$employerId.companyId",
            preserveNullAndEmptyArrays: true
        });

        aggregate.group({
            "_id": "$_id",
            createdAt: {
                "$first": "$createdAt"
            },
            employerId: {
                "$first": "$employerId"
            },
            employeeStatus: {
                "$first": "$employeeStatus"
            },
            employerStatus: {
                "$first": "$employerStatus"
            }

        });

        aggregate.project({
            _id: 1,
            createdAt: 1,
            employerId: 1,
            employeeStatus: 1,
            employerStatus: 1,

        });

        aggregate.sort({
            'createdAt': 1
        })
        var options = {
            page: page,
            limit: limit
        }

        Interested_Not_InterestedSchema.aggregatePaginate(aggregate, options, function (err, results, pageCount, count) {
            if (err) {
                callback({
                    "response_code": 5005,
                    "response_message": err,
                    "response_data": {}
                });

            } else {

                if(results.length > 0)
                {

                            results.map( (output) => {

                                output.employerId.profile_image = 
                                ( output.employerId.profile_image == null && output.employerId.socialLogin.image !== null ) ? 
                                 output.employerId.socialLogin.image:
                                ( output.employerId.profile_image !== null && output.employerId.socialLogin.image == null ) ? 
                                config.liveUrl + output.employerId.profile_image : config.liveUrl + config.companyDemoLogoPath
            
                            })

                }

                var data = {
                    docs: results,
                    pages: pageCount,
                    total: count,
                    limit: limit,
                    page: page
                }

                callback({
                    "response_code": 2000,
                    "response_message": "Employer Interested Not Interested list.",
                    "response_data": data
                });

            }
        });
    },
       //update Interested Not Interested Status
   updateInterestedNotInterestedStatus: async function (data, callback) {
    if (data) {

        let Applicant = await Interested_Not_InterestedSchema.findOne({
            _id: data.id
        }, function (err, result) {
            if (err) {
                callback({
                    "response_code": 5005,
                    "response_message": err,
                    "response_data": {}
                });

            }
        });

        if (Applicant !== null) {

            Interested_Not_InterestedSchema.updateOne({
                _id: data.id
            }, {
                $set: {
                    employerStatus: data.status
                }
            }, function (err, resUpdate) {
                if (err) {
                    callback({
                        "response_code": 5005,
                        "response_message": err,
                        "response_data": {}
                    });
                } else {
                    callback({
                        "response_code": 2000,
                        "response_message": "Application for Interested Not Interested updated Successfully",
                        "response_data": {}
                    });
                }
            });

        } else {
            callback({
                "response_code": 5002,
                "response_message": "No Application Found.",
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


    //employees Interested Not Interested 
    employeesInterestedNotInterested: async function (data, callback) {
    if (data) {

        let employeeInterested = await Interested_Not_InterestedSchema.findOne({
            employeeId: data.employeeId, employerId: data.employerId, employeeStatus: 'default'
        }, function (err, result) {
            if (err) {
                callback({
                    "response_code": 5005,
                    "response_message": err,
                    "response_data": {}
                });

            }
        });

        console.log('employeeInterested---',employeeInterested);
        
        if(employeeInterested !== null) {
            
            
            await Interested_Not_InterestedSchema.update({
                employeeId: data.employeeId, employerId: data.employerId, employeeStatus: 'default'
            }, {
                $set: {
                    employerStatus:data.employerStatus
                }
            })

            callback({
                "response_code": 2000,
                "response_message": "Interested_Not_Interested applied successfully",
                "response_data": data

            });

        }else{

            new Interested_Not_InterestedSchema(data).save(function (err, result) {
                if (err) {
                    callback({
                        "response_code": 5005,
                        "response_message": "INTERNAL DB ERROR",
                        "response_data": {}
                    });
                } else {
    
    
                    callback({
                        "response_code": 2000,
                        "response_message": "Interested_Not_Interested applied successfully",
                        "response_data": data
                    });
                }
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
// Api's by jayanta

    //deleteEmployee
    deleteEmployee: function (data, callback) {
        if (data) {
            CandidateSchema.findOne({
                    _id: data.employeeId
                },
                function (err, resData) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": err
                        });
                    } else {
                        if (resData) {
                            CandidateSchema.remove({
                                    _id: data.employeeId
                                },
                                async function (err, result) {
                                    if (err) {
                                        callback({
                                            "response_code": 5005,
                                            "response_message": "INTERNAL DB ERROR",
                                            "response_data": err
                                        });
                                    } else {
                                        
                                        if (resData.profile_image !== null) {
                                            let profile_image = `./public/${resData.profile_image}`;
                                            if (fs.existsSync(profile_image)) {
                                                await fs.unlink(profile_image, (err) => {
                                                    if (err) throw err;
                                                    console.log('successfully deleted');
                                                });
                                            }
                                        }

                                        callback({
                                            "response_code": 2000,
                                            "response_message": "Employee deleted successfully.",
                                            "response_data": {}
                                        });
                                    }
                                }
                            )
                        } else {
                            callback({
                                "response_code": 5002,
                                "response_message": "Employee not found.",
                                "response_data": err
                            });
                        }
                    }
                }
            )
        } else {
            callback({
                "response_code": 5005,
                "response_message": "INTERNAL DB ERROR",
                "response_data": {}
            });
        }
    },


};


async function employeeDashoardLog(logdata)
{

    let check_existing_log =  await Employee_Dashoard_LogSchema.findOne(
        {
            employee_id: logdata.employee_id,
            employer_id: logdata.employer_id,
            action:logdata.action

        })

    if(check_existing_log !== null )
    {
        await Employee_Dashoard_LogSchema.remove(
        {
            employee_id: logdata.employee_id,
            employer_id: logdata.employer_id,
            action:logdata.action,
            keyword: logdata.keyword,
            body: logdata.body
        }
        )
        
        await Employee_Dashoard_LogSchema.create(
            {
                _id: new ObjectID,
                employee_id: logdata.employee_id,
                employer_id: logdata.employer_id,
                action:logdata.action,
                keyword: logdata.keyword,
                body: logdata.body
            }
            );

        

    }else
    {
        await Employee_Dashoard_LogSchema.create(
            {
                _id: new ObjectID,
                employee_id: logdata.employee_id,
                employer_id: logdata.employer_id,
                action:logdata.action,
                keyword: logdata.keyword,
                body: logdata.body
            }
            )
    }

}

// send order pdf
async function sendEmail(){
    return new Promise((resolve, reject) => {
    	try{

    	 mailProperty('sendOTPdMail')('rajeevranjan.brainium@gmail.com', {
                                        otp: 345435,
                                        email: 'rajeevranjan.brainium@gmail.com',
                                        name: 'vxcvxcvxc',
                                        site_url: config.liveUrl,
                                        date: new Date()
                                    }).send();

				resolve(true)
    	}catch( e){
    		reject(e)
    	}

        // mailProperty('sendOrderPDF')('rajeevranjan.brainium@gmail.com', {
        //     name: 'surojitpaul',
        //     email: 'rajeevranjan.brainium@gmail.com',
        // }).send();
    });
}
module.exports = employeeModels;
