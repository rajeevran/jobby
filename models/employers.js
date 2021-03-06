var EmployerSchema = require('../schema/employer');
var CandidateSchema = require('../schema/candidate');
var ApplicationSchema = require('../schema/job_applilation');
var Employee_Dashoard_LogSchema = require('../schema/employee_dashoard_log');
var Interested_Not_InterestedSchema = require('../schema/interested_not_interested');
var CompanySchema = require('../schema/company');
var OrderSchema = require('../schema/order');
var JobPackageSchema = require('../schema/job_package');
var JobSchema = require('../schema/job');
var JobSkillSchema = require('../schema/job_skill');
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
var NotificationModels = require('../models/employers_notification');
var AdminNotificationModels = require('../models/admin_notification');
var pushNotification = require('../modules/pushNotification');

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

var employerModels = {

    // Checking employer job posting 
    can_post_job: async function (data, callback) {

        if (data) {

            let employer = await EmployerSchema.findOne(data, function (err, result) {

                if (err) {
                    callback({
                        "response_code": 5005,
                        "response_message": err,
                        "response_data": {}
                    });
                }
            });

            if (employer.job_package_purchase != false) {

                let job_posted = employer.jobCount;
                let allow_job_posted = employer.job_package.job_post_limit;

                callback({
                    "response_code": 2000,
                    "response_data": allow_job_posted - job_posted > 0 ? true : false
                });

            } else {
                callback({
                    "response_code": 2000,
                    "response_data": false
                });
            }

        } else {
            callback({
                "response_code": 2000,
                "response_data": false
            });
        }


    },
    profileCompleted: async function (data, callback) {

        if (data) {
            var profile_image = '';
            let employer = await EmployerSchema.findOne(data, function (err, result) {

                if (err) {
                    callback({
                        "response_code": 5005,
                        "response_message": err,
                        "response_data": {}
                    });
                }
            });

            if (employer.profile_image_updated == true) {
                profile_image = employer.profile_image
            } else {
                profile_image = employer.socialLogin.image;
            }

            var pecentage = 0;

            if (employer.fname != '') {
                pecentage = 12.5;
            }
            if (employer.lname != '') {
                pecentage = pecentage + 12.5;
            }
            if (employer.email != '') {
                pecentage = pecentage + 12.5;
            }
            if (employer.phone_no != '') {
                pecentage = pecentage + 12.5;
            }
            if (employer.email_verify == 'yes') {
                pecentage = pecentage + 12.5;
            }
            if (employer.companyId != null) {
                pecentage = pecentage + 12.5;
            }
            if (employer.jobCount > 0) {
                pecentage = pecentage + 12.5;
            }

            if (profile_image !== null) {
                pecentage = pecentage + 12.5;
            }

            callback({
                "response_code": 2000,
                "response_data": pecentage
            });

        }

    },
    //register employer
    register: function (data, callback) {

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

                            var company_data = {
                                _id: data.companyId,
                                name: data.company_name,
                                designation: data.designation,
                                employerId: data._id
                            }
                            // Add company
                            new CompanySchema(company_data).save(function (err, result) {
                                if (err) {
                                    callback({
                                        "response_code": 5005,
                                        "response_message": "INTERNAL DB ERROR",
                                        "response_data": {}
                                    });
                                } else {

                                    new EmployerSchema(data).save(function (err, result) {
                                        if (err) {

                                            // Delete company
                                            CompanySchema.remove({
                                                    _id: data.companyId
                                                },
                                                function (err, result) {
                                                    if (err) {
                                                        console.log("company not delet");
                                                    }
                                                })

                                            callback({
                                                "response_code": 5005,
                                                "response_message": "INTERNAL DB ERROR",
                                                "response_data": err
                                            });
                                        } else {

                                            var admin_message = 'New member ' + data.fname + ' ' + data.lname + ' is registered';
                                            var admin_title = 'New Employer Registered';
                                            var addData = {
                                                _id: new ObjectID,
                                                user_id: data._id,
                                                user_type: 'employer',
                                                message: admin_message,
                                                title: admin_title,

                                            }
                                            AdminNotificationModels.addNotification(addData, function (notiResult) {});

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
            let employer = await EmployerSchema.findOne({
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


            if (employer != null) {

                if (employer.status == 'no') {
                    var all_result = {
                        authtoken: '',
                        _id: employer._id,
                        name: employer.fname + ' ' + employer.lname,
                        email: employer.email
                    }
                    callback({
                        "response_code": 5010,
                        "response_message": "Your account is temporarily blocked. Please contact admin.",
                        "response_data": all_result
                    });
                }

                if (employer.type == "NORMAL") {

                    callback({
                        "response_code": 5010,
                        "response_message": "You are not login throug social platform",
                        "response_data": {}
                    });

                } else if (employer.type != data.socialLogin.type) {

                    callback({
                        "response_code": 5010,
                        "response_message": "You are not login via " + employer.type,
                        "response_data": {}
                    });
                } else {

                    let token = createToken(employer);
                    employer.authtoken = token;
                    employer.type = data.socialLogin.type;
                    employer.save();

                    if (employer.profile_image_updated == true) {
                        profile_image = employer.profile_image
                    } else {
                        profile_image = employer.socialLogin.image;
                    }

                    if (profile_image == '' || profile_image == null) {
                        profile_image = config.liveUrl + config.userDemoPicPath;
                    }

                    callback({
                        "response_code": 2008,
                        "response_message": "Welcome back " + employer.fname,
                        "response_data": {
                            authtoken: employer.authtoken,
                            _id: employer._id,
                            name: employer.fname + ' ' + employer.lname,
                            email: employer.email,
                            socialData: employer.socialLogin,
                            user_type: "employers",
                            profile_image: profile_image
                        }
                    })

                }


            } else {
                data._id = new ObjectID;
                let token = createToken(data);
                if (token) {
                    //data.authtoken = token;
                    //data.user_type = 'Normal User';
                    data.type = data.socialLogin.type;
                    data.email_verify = 'yes';


                    new EmployerSchema(data).save(function (err, result) {
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
                            var admin_message = 'New member ' + data.fname + ' ' + data.lname + ' is registered';
                            var admin_title = 'New Employer Registered';
                            var addData = {
                                _id: new ObjectID,
                                user_id: data._id,
                                user_type: 'employer',
                                message: admin_message,
                                title: admin_title,

                            }
                            AdminNotificationModels.addNotification(addData, function (notiResult) {});

                            mailProperty('socialSignUp')(data.email, {
                                name: data.fname + ' ' + data.lname,
                                userType: "Employer",
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
                                user_type: "employers",
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
            EmployerSchema.count({
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
                        EmployerSchema.findOne({
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
                                        EmployerSchema.update({
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
            EmployerSchema.findOne({
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
                            EmployerSchema.update({
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
                                        userType: "Employer",
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

                            bcrypt.compare(data.password.toString(), result.password, function (err, response) {
                                // result == true
                                if (response == true) {

                                    var token = createToken(result);
                                    EmployerSchema.update({
                                        _id: result._id
                                    }, {
                                        $set: {
                                            devicetoken: data.devicetoken,
                                            pushtoken: data.pushtoken,
                                            apptype: data.apptype
                                        }
                                    }, async function (err, resUpdate) {
                                        if (err) {
                                            callback({
                                                "response_code": 5005,
                                                "response_message": "INTERNAL DB ERROR",
                                                "response_data": {}
                                            });
                                        } else {

                                            // let profile_image = result.profile_image;

                                            // if (profile_image == null) {
                                            //     profile_image = config.liveUrl + config.userDemoPicPath;
                                            // } else {
                                            //     profile_image = config.liveUrl + result.profile_image;
                                            // }

                                            /** When package implement */

                                            // await employerModels.can_post_job({
                                            //     email: data.email
                                            // }, function (response) {

                                            //     var all_result = {
                                            //         authtoken: token,
                                            //         _id: result._id,
                                            //         name: result.fname + ' ' + result.lname,
                                            //         email: result.email,
                                            //         profile_image: profile_image,
                                            //         user_type: "employers",
                                            //         can_post_job: response.response_data

                                            //     }

                                            //     callback({
                                            //         "response_code": 2000,
                                            //         "response_message": "Logged your account",
                                            //         "response_data": all_result
                                            //     });

                                            // })

                                            var all_result = {
                                                authtoken: token,
                                                _id: result._id,
                                                name: result.fname + ' ' + result.lname,
                                                email: result.email,
                                                //profile_image: profile_image,
                                                user_type: "employers",

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
            EmployerSchema.findOne({
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
                            EmployerSchema.update({
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
            EmployerSchema.findOne({
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
                                EmployerSchema.count({
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
                                            EmployerSchema.update({
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
            EmployerSchema.findOne({
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
                                                "response_data": {}
                                            });
                                        } else {
                                            EmployerSchema.updateOne({
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
            EmployerSchema.findOne({
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
                            EmployerSchema.findOne({
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

                                            EmployerSchema.updateOne({
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
            EmployerSchema.findOne({
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
                            EmployerSchema.findOne({
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

                                            EmployerSchema.updateOne({
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
    // block Employer
    blockEmployer: async function (data, callback) {
        if (data) {

            let employer = await EmployerSchema.findOne({
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

            if (employer != null) {

                EmployerSchema.updateOne({
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

            var aggregate = EmployerSchema.aggregate();
            aggregate.match(query);

            aggregate.lookup({
                from: 'companies',
                localField: 'companyId',
                foreignField: '_id',
                as: 'Company'
            });

            aggregate.project({
                _id: 1,
                fname: 1,
                lname: 1,
                email: 1,
                country_code: 1,
                phone_no: 1,
                profile_image_updated: 1,
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
                type: 1,
                socialLogin: 1,
                status: 1,
                company_details: {
                    '$arrayElemAt': [
                        [{
                            _id: {
                                '$arrayElemAt': ['$Company._id', 0]
                            },
                            name: {
                                '$arrayElemAt': ['$Company.name', 0]
                            },
                            email: {
                                '$arrayElemAt': ['$Company.email', 0]
                            },
                            designation: {
                                '$arrayElemAt': ['$Company.designation', 0]
                            },
                            address: {
                                '$arrayElemAt': ['$Company.address', 0]
                            },
                            description: {
                                '$arrayElemAt': ['$Company.description', 0]
                            },
                            ar_description: {
                                '$arrayElemAt': ['$Company.ar_description', 0]
                            },
                        }], 0
                    ]
                },
                user_type: "employers",
                email_verify: 1,
                companyId: 1,
                jobCount: 1,
                updatedAt: 1
            })

            aggregate.sort({
                'createdAt': -1
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

                    async.forEach(results, function (item, callback) {

                        item.last_updated = commonModule.updateDate(item.updatedAt);
                        item.pecentage = commonModule.employerProfileCompleted(item);

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


            let employer = await EmployerSchema.findOne({
                email: data.email
            }, {
                "_id": 1,
                "fname": 1,
                "lname": 1,
                "email": 1,
                country_code: 1,
                "phone_no": 1,
                "profile_image": 1,
                "profile_image_updated": 1,
                companyId: 1,
                socialLogin: 1,
                email_verify: 1,
                jobCount: 1,
                updatedAt: 1

            }, function (err, result) {
                if (err) {
                    callback({
                        "response_code": 5005,
                        "response_message": err,
                        "response_data": {}
                    });

                }
            });

            if (employer != null) {

                let company = await CompanySchema.findOne({
                    _id: employer.companyId
                }, {
                    _id: 1,
                    name: 1,
                    designation: 1

                }, function (err, result) {
                    if (err) {
                        console.log("Err", err);
                    }
                });

                if (employer.profile_image_updated == false) {
                    employer.profile_image = employer.socialLogin.image;
                } else {
                    employer.profile_image = config.liveUrl + employer.profile_image;
                }

                if (employer.profile_image == null) {
                    employer.profile_image = config.liveUrl + config.userDemoPicPath;
                }


                let last_updated = commonModule.updateDate(employer.updatedAt);
                let pecentage = commonModule.employerProfileCompleted(employer);

                var all_result = {
                    _id: employer._id,
                    fname: employer.fname,
                    lname: employer.lname,
                    email: employer.email,
                    country_code: employer.country_code,
                    phone_no: employer.phone_no,
                    profile_image: employer.profile_image,
                    user_type: "employers",
                    company_details: company,
                    pecentage: pecentage,
                    last_updated: last_updated

                }

                callback({
                    "response_code": 2000,
                    "response_message": "User Profile Details.",
                    "response_data": all_result
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
    // Edit Profile
    editProfile: function (data, callback) {

        if (data) {
            EmployerSchema.findOne({
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
                        } else {


                            EmployerSchema.updateOne({
                                email: data.email
                            }, {
                                $set: {
                                    fname: data.fname,
                                    lname: data.lname,
                                    country_code: data.country_code,
                                    phone_no: data.phone_no

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
                                        "response_message": "Profile updated successfully.",
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
    //Update Profile image
    editProfileImage: function (data, callback) {
        if (data) {
            EmployerSchema.findOne({
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


                            if (result.profile_image !== null) {

                                let pf_image = `./public/${result.profile_image}`;
                                fs.unlink(pf_image, (err) => {
                                    if (err) {
                                        console.log('err', err);
                                    } else {
                                        console.log(result.profile_image + ' was deleted');
                                    }

                                });
                            }
                            EmployerSchema.updateOne({
                                email: data.email
                            }, {
                                $set: {
                                    profile_image: data.profile_image,
                                    profile_image_updated: true
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
   //Company List
   listCompany: function (data, callback) {

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
    if (data.name) {
        // query = {
        //     "$or": [{
        //         "name": new RegExp(data.name, 'i')
        //     }, {
        //         "ar_name": new RegExp(data.name, 'i')
        //     }]
        // }
        query['name'] = new RegExp(data.name, 'i');
    }
    if (data.employerId) {
        query['employerId'] = data.employerId;
    }
    if (data.status) {
        query['status'] = data.status;
    }
    if (data._id) {
        query['_id'] = data._id;
    }

    var aggregate = CompanySchema.aggregate();
    aggregate.match(query);
    aggregate.lookup({
        from: 'employers',
        localField: 'employerId',
        foreignField: '_id',
        as: 'employers_details'
    });
    aggregate.lookup({
        from: 'job-countries',
        localField: 'country',
        foreignField: '_id',
        as: 'company_country'
    });
    aggregate.lookup({
        from: 'job-cities',
        localField: 'city',
        foreignField: '_id',
        as: 'company_city'
    });

    aggregate.project({
        _id: 1,
        createdAt: 1,
        name: 1,
        designation: 1,
        email: 1,
        logo: {
            $cond: {
                if: {
                    $eq: ["$logo", null]
                },
                then: {
                    $concat: [config.liveUrl, companyDemoLogo]
                },
                else: {
                    $concat: [config.liveUrl, "$logo"]
                }

            }
        },
        country: 1,
        country_details: {
            '$arrayElemAt': [
                [{
                    _id: {
                        '$arrayElemAt': ['$company_country._id', 0]
                    },
                    name: {
                        '$arrayElemAt': ['$company_country.name', 0]
                    },
                }], 0
            ]
        },
        city: 1,
        city_details: {
            '$arrayElemAt': [
                [{
                    _id: {
                        '$arrayElemAt': ['$company_city._id', 0]
                    },
                    name: {
                        '$arrayElemAt': ['$company_city.name', 0]
                    },
                }], 0
            ]
        },
        description: 1,
        ar_description: 1,
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
        status: 1,
    });

    aggregate.sort({
        'createdAt': 1
    })
    var options = {
        page: page,
        limit: limit
    }

    CompanySchema.aggregatePaginate(aggregate, options, function (err, results, pageCount, count) {
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
                "response_message": "Company list.",
                "response_data": data
            });

        }
    });
},
//Add Company
addCompany: async function (data, callback) {

    if (data) {
        let employer = await EmployerSchema.findOne({
            _id: data.employerId
        }, {
            "_id": 1,
            "companyId": 1

        }, function (err, result) {
            if (err) {
                callback({
                    "response_code": 5005,
                    "response_message": err,
                    "response_data": {}
                });

            }
        });

        if (employer != null) {

            if (employer.companyId == null) {

                await new CompanySchema(data).save(function (err, result) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": {}
                        });
                    } else {

                        EmployerSchema.updateOne({
                            _id: data.employerId
                        }, {
                            $set: {
                                companyId: data._id,
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
                                    "response_message": "Company add successfully."
                                });
                            }
                        });

                    }
                });
            } else {
                callback({
                    "response_code": 5002,
                    "response_message": "Company already exist.",
                    "response_data": {}
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
//Edit Company
editCompany: async function (data, fileData, callback) {

        if (data) {

                    let resData = await CompanySchema.findOne({
                        _id: data.companyId
                    }, function (err, result) {
                        if (err) {

                            callback({
                            "success": false,
                            "response_code": 5005,
                            "response_message": "Error Occur while editing Company",
                            "response_data": err
                            });
                        }
                    });

                    if (resData !== null) {

                        data.ar_description = data.ar_description?data.ar_description:resData.ar_description;
                        data.description = data.description?data.description:resData.description;
                        data.country = data.country?data.country:resData.country;
                        data.designation = data.designation?data.designation:resData.designation;
                        data.name = data.name?data.name:resData.name;
                        data.email = data.email?data.email:resData.email;


                       await CompanySchema.updateOne({
                            _id: data.companyId
                        }, {
                            $set: {
                                    name: data.name,
                                    email: data.email,
                                    designation: data.designation,
                                    country: data.country,
                                    city: data.city,
                                    description: data.description,
                                    ar_description: data.ar_description
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

                                let resumeImageFilename = resData.logo
                                let resumeImagefileName = resData.logo
                                if (fileData !== null && fileData.logo) {

                                            let resumePicFile = fileData.logo;
                                            resumeImagefileName = resumePicFile.name;

                                            var folderpath = config.uploadcompanylogoPath ;
                                            let companylogoPath = config.companylogoPath;

                                            resumeImageFilename = companylogoPath+resumeImagefileName
                                            data.resumeImageName = resumeImagefileName;

                                            //resumeImageFilename = resumeImageFilename.replace(',','.')
                                            console.log('FrontPic--->',resumeImageFilename)


                                            let oldResumeImageFile = `./public/${resData.resumeImage}`;
                                            if (fs.existsSync(oldResumeImageFile)) {
                                                fs.unlink(oldResumeImageFile, (err) => {
                                                })
                                            }

                                            resumePicFile.mv(`${folderpath}/${resumeImagefileName}`, async function (err) {
                                                                             
                                            });

                                            await CompanySchema.updateOne({_id: data.companyId}, {
                                                $set: {
                                                    "logo": resumeImageFilename
                                                }           
                                            });

                                              let responseUpdated =    await CompanySchema.findOne({_id: data.companyId})
                                callback({
                                    "response_code": 2000,
                                    "response_message": "Resume Updated Successfully",
                                    "response_data": responseUpdated
                                });
                                }

                              

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
    deleteCompany: function (data, callback) {
        if (data) {
            CompanySchema.findOne({
                    _id: data.companyId
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
                            CompanySchema.remove({
                                    _id: data.companyId
                                },
                                async function (err, result) {
                                    if (err) {
                                        callback({
                                            "response_code": 5005,
                                            "response_message": "INTERNAL DB ERROR",
                                            "response_data": err
                                        });
                                    } else {

                                        EmployerSchema.updateOne({
                                            _id: resData.employerId
                                        }, {
                                            $set: {
                                                companyId: null,
                                            }
                                        }, function (err, resUpdate) {
                                            if (err) {
                                                console.log("Error to update employer company");

                                            }
                                        });

                                        if (resData.logo !== null) {
                                            let logo = `./public/${resData.logo}`;
                                            if (fs.existsSync(logo)) {
                                                await fs.unlink(logo, (err) => {
                                                    if (err) throw err;
                                                    console.log('successfully deleted');
                                                });
                                            }
                                        }

                                        callback({
                                            "response_code": 2000,
                                            "response_message": "Company deleted successfully.",
                                            "response_data": {}
                                        });
                                    }
                                }
                            )
                        } else {
                            callback({
                                "response_code": 5002,
                                "response_message": "Company not found.",
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
    //Update Company Status
    updateCompanyStatus: async function (data, callback) {
        if (data) {

            let company = await CompanySchema.findOne({
                _id: data.companyId
            }, {
                "_id": 1,
            }, function (err, result) {
                if (err) {
                    callback({
                        "response_code": 5005,
                        "response_message": err,
                        "response_data": {}
                    });

                }
            });

            if (company != null) {

                CompanySchema.updateOne({
                    _id: data.companyId
                }, {
                    $set: {
                        status: data.status,
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
                            "response_message": "Status Updated Successfully"

                        });
                    }
                });

            } else {
                callback({
                    "response_code": 5002,
                    "response_message": "Company not found.",
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
    //Company List
    orderList: function (data, callback) {

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
        if (data.orderId) {
            query['orderId'] = new RegExp(data.orderId, 'i');
        }
        if (data.buyer_email) {
            query['buyer_email'] = new RegExp(data.buyer_email, 'i');

        }
        if (data.buyer_name) {
            query['buyer_name'] = new RegExp(data.buyer_name, 'i');
        }
        if (data.orderStatus) {
            query['orderStatus'] = data.orderStatus;
        }
        if (data.userId) {
            query['userId'] = data.userId;
        }

        var aggregate = OrderSchema.aggregate();
        aggregate.match(query);

        aggregate.lookup({
            from: 'employers',
            localField: 'userId',
            foreignField: '_id',
            as: 'User'
        });

        aggregate.project({
            _id: 1,
            createdAt: 1,
            orderId: 1,
            userId: 1,
            buyer_name: 1,
            buyer_email: 1,
            order_Details: 1,
            transactionAmount: 1,
            transactionFees: 1,
            message: 1,
            paymentMode: 1,
            paymentStatus: 1,
            employer_details: {
                '$arrayElemAt': [
                    [{
                        _id: {
                            '$arrayElemAt': ['$User._id', 0]
                        },
                        fname: {
                            '$arrayElemAt': ['$User.fname', 0]
                        },
                        lname: {
                            '$arrayElemAt': ['$User.lname', 0]
                        },
                        profile_image: {
                            $cond: {
                                if: {
                                    $in: [false, "$User.profile_image_updated"]
                                },
                                then: config.liveUrl + config.userDemoPicPath,
                                else: {
                                    $concat: [config.liveUrl, {
                                        "$arrayElemAt": ["$User.profile_image", 0]
                                    }]
                                }
                            }
                        },
                        email: {
                            '$arrayElemAt': ['$User.email', 0]
                        },
                        phone_no: {
                            '$arrayElemAt': ['$User.phone_no', 0]
                        },

                    }], 0
                ]
            },
            invoice: {
                $cond: { // Checking if user type social and image not uploaded
                    if: {
                        $eq: ["$invoice", null]
                    },
                    then: "$invoice",
                    else: {
                        $concat: [config.liveUrl, "$invoice"]
                    },
                }
            }

        });

        aggregate.sort({
            'createdAt': 1
        })
        var options = {
            page: page,
            limit: limit
        }

        OrderSchema.aggregatePaginate(aggregate, options, function (err, results, pageCount, count) {
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
                    "response_message": "Order list.",
                    "response_data": data
                });

            }
        });
    },
    //order checkout
    checkOut: async function (data, callback) {

        if (data) {

            let job_package_details = await JobPackageSchema.findOne({
                    _id: data.job_package_id
                },
                function (err, result) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": err,
                            "response_data": {}
                        });

                    }
                });


            if (job_package_details != null) {

                data.orderDetails = job_package_details;

                if (data.paymentStatus == "Succeed") {

                    var date = new Date();
                    date.setDate(date.getDate() + job_package_details.package_expire_date);

                    var job_package = {
                        orderId: data.orderId,
                        job_post_limit: job_package_details.job_post_limit,
                        job_display_duration: job_package_details.job_display_duration,
                        package_expire_date: date
                    }

                    let employer = await EmployerSchema.updateOne({
                        _id: data.userId
                    }, {
                        $set: {
                            job_package_purchase: true,
                            job_package: job_package
                        }
                    }, function (err, employer) {
                        if (err) {
                            callback({
                                "response_code": 5005,
                                "response_message": err,
                                "response_data": {}
                            });

                        } else {
                            callback({
                                "response_code": 2000,
                                "response_message": "Submitted successfully.",
                                "response_data": {}
                            });
                        }
                    })
                }
            } else {
                callback({
                    "response_code": 5005,
                    "response_message": "Job package not exist.",
                    "response_data": {}
                });
            }

            // new OrderSchema(data).save(function (err, result) {
            //     if (err) {
            //         callback({
            //             "response_code": 5005,
            //             "response_message": err,
            //             "response_data": {}
            //         });

            //     } else { 



            //     }
            // });

        } else {
            callback({
                "response_code": 5005,
                "response_message": "INTERNAL DB ERROR",
                "response_data": {}
            });
        }
    },

    //list Job Shortlisted Employee 
    listJobShortlistedEmployee: async function (data, callback) {

        //console.log('data----------->',data)
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

        //console.log('query----------->',query)

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
            from: 'job-applications',
            localField: '_id',
            foreignField: 'jobId',
            as: 'JobApplicationsDetails'
        });
        
        aggregate.unwind({
            path: "$JobApplicationsDetails",
            preserveNullAndEmptyArrays: true
        });


        aggregate.lookup({
            from: 'resumes',
            localField: 'JobApplicationsDetails.resumeId',
            foreignField: '_id',
            as: 'JobApplicationsDetails.resumeId'
        });
        
        aggregate.unwind({
            path: "$JobApplicationsDetails.resumeId",
            preserveNullAndEmptyArrays: true
        }); 

        aggregate.lookup({
            from: 'employees',
            localField: 'JobApplicationsDetails.employeeId',
            foreignField: '_id',
            as: 'JobApplicationsDetails.employeeId'
        });
        
        aggregate.unwind({
            path: "$JobApplicationsDetails.employeeId",
            preserveNullAndEmptyArrays: true
        });
        aggregate.lookup({
            from: 'job-countries',
            localField: 'JobApplicationsDetails.employeeId.country',
            foreignField: '_id',
            as: 'JobApplicationsDetails.employeeId.country'
        });
        
        aggregate.unwind({
            path: "$JobApplicationsDetails.employeeId.country",
            preserveNullAndEmptyArrays: true
        });

        aggregate.lookup({
            from: 'job-cities',
            localField: 'JobApplicationsDetails.employeeId.city',
            foreignField: '_id',
            as: 'JobApplicationsDetails.employeeId.city'
        });
        
        aggregate.unwind({
            path: "$JobApplicationsDetails.employeeId.city",
            preserveNullAndEmptyArrays: true
        });

        aggregate.lookup({
            from: 'job-skills',
            localField: 'JobApplicationsDetails.employeeId.skills.skill_id',
            foreignField: '_id',
            as: 'JobApplicationsDetails.employeeId.skills.skill_id'
        });


        aggregate.lookup({
            from: 'job-levels',
            localField: 'JobApplicationsDetails.employeeId.preferJob.job_level',
            foreignField: '_id',
            as: 'JobApplicationsDetails.employeeId.preferJob.job_level'
        });
        
        aggregate.unwind({
            path: "$JobApplicationsDetails.employeeId.preferJob.job_level",
            preserveNullAndEmptyArrays: true
        });

        aggregate.lookup({
            from: 'job-countries',
            localField: 'JobApplicationsDetails.employeeId.preferJob.job_country',
            foreignField: '_id',
            as: 'JobApplicationsDetails.employeeId.preferJob.job_country'
        });
        
        aggregate.unwind({
            path: "$JobApplicationsDetails.employeeId.preferJob.job_country",
            preserveNullAndEmptyArrays: true
        });

        aggregate.lookup({
            from: 'job-cities',
            localField: 'JobApplicationsDetails.employeeId.preferJob.job_city',
            foreignField: '_id',
            as: 'JobApplicationsDetails.employeeId.preferJob.job_city'
        });
        
        aggregate.unwind({
            path: "$JobApplicationsDetails.employeeId.preferJob.job_city",
            preserveNullAndEmptyArrays: true
        });

        aggregate.lookup({
            from: 'job-industries',
            localField: 'JobApplicationsDetails.employeeId.preferJob.job_industry',
            foreignField: '_id',
            as: 'JobApplicationsDetails.employeeId.preferJob.job_industry'
        });

        
        
        aggregate.lookup({
            from: 'job-types',
            localField: 'JobApplicationsDetails.employeeId.preferJob.job_employment_type',
            foreignField: '_id',
            as: 'JobApplicationsDetails.employeeId.preferJob.job_employment_type'
        });
        
        aggregate.unwind({
            path: "$JobApplicationsDetails.employeeId.preferJob.job_employment_type",
            preserveNullAndEmptyArrays: true
        });

        aggregate.lookup({
            from: 'job-titles',
            localField: 'JobApplicationsDetails.employeeId.preferJob.job_role',
            foreignField: '_id',
            as: 'JobApplicationsDetails.employeeId.preferJob.job_role'
        });
        
        aggregate.unwind({
            path: "$JobApplicationsDetails.employeeId.preferJob.job_role",
            preserveNullAndEmptyArrays: true
        });
        
        aggregate.lookup({
            from: 'job-titles',
            localField: 'JobApplicationsDetails.employeeId.current_job_title',
            foreignField: '_id',
            as: 'JobApplicationsDetails.employeeId.current_job_title'
        });
        
        aggregate.unwind({
            path: "$JobApplicationsDetails.employeeId.current_job_title",
            preserveNullAndEmptyArrays: true
        });

        aggregate.match({ "JobApplicationsDetails.status" : "shortlisted" });


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
            JobApplicationsDetails:{
                "$addToSet" : "$JobApplicationsDetails"
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
            JobApplicationsDetails: 1,
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


 
                if(results.length > 0)
                {

                        results.map( (outputresult) => {

                            outputresult.JobApplicationsDetails.map( (output) => {
            

                                output.employeeId.profile_image = 
                                ( output.employeeId.profile_image == null && output.employeeId.socialLogin.image !== null ) ? 
                                 output.employeeId.socialLogin.image:
                                ( output.employeeId.profile_image !== null && output.employeeId.socialLogin.image == null ) ? 
                                config.liveUrl + output.employeeId.profile_image : config.liveUrl + config.userDemoPicPath



                                if(output.resumeId !== undefined)
                                {
                                    output.resumeId.resumeImage = config.liveUrl + output.resumeId.resumeImage
                                    output.resumeId.resume_file = config.liveUrl + output.resumeId.resume_file
                                }
            
                            })

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


    //list Job Applied 
    listJobApplied: async function (data, callback) {

        //console.log('data----------->',data)
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
            from: 'job-applications',
            localField: '_id',
            foreignField: 'jobId',
            as: 'JobApplicationsDetails'
        });
        
        aggregate.unwind({
            path: "$JobApplicationsDetails",
            preserveNullAndEmptyArrays: true
        });

        aggregate.lookup({
            from: 'resumes',
            localField: 'JobApplicationsDetails.resumeId',
            foreignField: '_id',
            as: 'JobApplicationsDetails.resumeId'
        });
        
        aggregate.unwind({
            path: "$JobApplicationsDetails.resumeId",
            preserveNullAndEmptyArrays: true
        }); 

        aggregate.lookup({
            from: 'employees',
            localField: 'JobApplicationsDetails.employeeId',
            foreignField: '_id',
            as: 'JobApplicationsDetails.employeeId'
        });
        
        aggregate.unwind({
            path: "$JobApplicationsDetails.employeeId",
            preserveNullAndEmptyArrays: true
        });

        aggregate.lookup({
            from: 'job-countries',
            localField: 'JobApplicationsDetails.employeeId.country',
            foreignField: '_id',
            as: 'JobApplicationsDetails.employeeId.country'
        });
        
        aggregate.unwind({
            path: "$JobApplicationsDetails.employeeId.country",
            preserveNullAndEmptyArrays: true
        });

        aggregate.lookup({
            from: 'job-cities',
            localField: 'JobApplicationsDetails.employeeId.city',
            foreignField: '_id',
            as: 'JobApplicationsDetails.employeeId.city'
        });
        
        aggregate.unwind({
            path: "$JobApplicationsDetails.employeeId.city",
            preserveNullAndEmptyArrays: true
        });

        aggregate.lookup({
            from: 'job-skills',
            localField: 'JobApplicationsDetails.employeeId.skills.skill_id',
            foreignField: '_id',
            as: 'JobApplicationsDetails.employeeId.skills.skill_id'
        });


        aggregate.lookup({
            from: 'job-levels',
            localField: 'JobApplicationsDetails.employeeId.preferJob.job_level',
            foreignField: '_id',
            as: 'JobApplicationsDetails.employeeId.preferJob.job_level'
        });
        
        aggregate.unwind({
            path: "$JobApplicationsDetails.employeeId.preferJob.job_level",
            preserveNullAndEmptyArrays: true
        });

        aggregate.lookup({
            from: 'job-countries',
            localField: 'JobApplicationsDetails.employeeId.preferJob.job_country',
            foreignField: '_id',
            as: 'JobApplicationsDetails.employeeId.preferJob.job_country'
        });
        
        aggregate.unwind({
            path: "$JobApplicationsDetails.employeeId.preferJob.job_country",
            preserveNullAndEmptyArrays: true
        });

        aggregate.lookup({
            from: 'job-cities',
            localField: 'JobApplicationsDetails.employeeId.preferJob.job_city',
            foreignField: '_id',
            as: 'JobApplicationsDetails.employeeId.preferJob.job_city'
        });
        
        aggregate.unwind({
            path: "$JobApplicationsDetails.employeeId.preferJob.job_city",
            preserveNullAndEmptyArrays: true
        });

        aggregate.lookup({
            from: 'job-industries',
            localField: 'JobApplicationsDetails.employeeId.preferJob.job_industry',
            foreignField: '_id',
            as: 'JobApplicationsDetails.employeeId.preferJob.job_industry'
        });

        
        
        aggregate.lookup({
            from: 'job-types',
            localField: 'JobApplicationsDetails.employeeId.preferJob.job_employment_type',
            foreignField: '_id',
            as: 'JobApplicationsDetails.employeeId.preferJob.job_employment_type'
        });
        
        aggregate.unwind({
            path: "$JobApplicationsDetails.employeeId.preferJob.job_employment_type",
            preserveNullAndEmptyArrays: true
        });

        aggregate.lookup({
            from: 'job-titles',
            localField: 'JobApplicationsDetails.employeeId.preferJob.job_role',
            foreignField: '_id',
            as: 'JobApplicationsDetails.employeeId.preferJob.job_role'
        });
        
        aggregate.unwind({
            path: "$JobApplicationsDetails.employeeId.preferJob.job_role",
            preserveNullAndEmptyArrays: true
        });
        
        aggregate.lookup({
            from: 'job-titles',
            localField: 'JobApplicationsDetails.employeeId.current_job_title',
            foreignField: '_id',
            as: 'JobApplicationsDetails.employeeId.current_job_title'
        });
        
        aggregate.unwind({
            path: "$JobApplicationsDetails.employeeId.current_job_title",
            preserveNullAndEmptyArrays: true
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
            JobApplicationsDetails:{
                "$addToSet" : "$JobApplicationsDetails"
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
            JobApplicationsDetails: 1,
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
 
                if(results.length > 0)
                {

                        results.map( (outputresult) => {

                            outputresult.JobApplicationsDetails.map( (output) => {

                                output.employeeId.profile_image = output.employeeId.profile_image !== undefined ? 
                                config.liveUrl + output.employeeId.profile_image:null
            
                                if(output.resumeId !== undefined)
                                {
                                    output.resumeId.resumeImage = config.liveUrl + output.resumeId.resumeImage
                                    output.resumeId.resume_file = config.liveUrl + output.resumeId.resume_file
                                }
            
                            })

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

  //list Block Employee
    listBlockEmployee: async function (data, callback) {

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

        var aggregate = CandidateSchema.aggregate();

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
            as: 'preferJob.job_role'
        });
        aggregate.lookup({
            from: 'job-levels',
            localField: 'preferJob.job_level',
            foreignField: '_id',
            as: 'preferJob.job_level'
        });
        aggregate.lookup({
            from: 'job-countries',
            localField: 'preferJob.job_country',
            foreignField: '_id',
            as: 'preferJob.job_country'
        });
        aggregate.lookup({
            from: 'job-cities',
            localField: 'preferJob.job_city',
            foreignField: '_id',
            as: 'preferJob.job_city'
        });

        aggregate.lookup({
            from: 'job-applications',
            localField: '_id',
            foreignField: 'employeeId',
            as: 'JobApplicationsDetails'
        });

        aggregate.unwind({
            path: "$JobApplicationsDetails",
            preserveNullAndEmptyArrays: true
        });

        aggregate.match(
            {
                 "JobApplicationsDetails.employerId" : data.employerId ,
                 "JobApplicationsDetails.status" : 'block'
            });
        
       
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
            current_company:{
                "$first": "$current_company"
            },
            
            country:{
                "$first": "$country"
            },
            
            city:{
                "$first": "$city"
            },
            profile_image: {
                "$first": "$profile_image"
            }

        });

        aggregate.project({
            _id: 1,
            createdAt: 1,
            fname: 1,
            lname: 1,
            email: 1,
            current_company:1,
            country:1,
            city:1,
            profile_image: 1,
            socialLogin: 1,
        });

        aggregate.sort({
            'createdAt': 1
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


 
                if(results.length > 0)
                {

                            results.map( (output) => {

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
                    "response_message": "Employee Block list.",
                    "response_data": data
                });

            }
        });
    },


    //Employee Dashboard List
    employerDashboard: async function (data, callback) {

        var query = {};

        if (data.employerId) {
            query['employerId'] = data.employerId;
        }
        let companyDemoLogo = config.companyDemoLogoPath;
        let employerdetails =   await EmployerSchema.aggregate([
            {
                    "$match": { _id : data.employerId }
            },
            {
                $lookup: {
                    from: "companies",
                    localField: "companyId",
                    foreignField: "_id",
                    as: "employer_company_details"
                }

            },
            
            {
                $project: {
                _id: 1,
                profile_image: 1,
                employer_company_details: 1,
                fname: 1,
                updatedAt: 1,
                lname: 1,
                socialLogin:1
                }
            }]);
            console.log('employerdetails----',employerdetails)
            if(employerdetails.length > 0)
            {
               employerdetails = employerdetails[0]
                
                let last_updated                        = commonModule.updateDate(employerdetails.updatedAt);

                let employer_company_details            = employerdetails.employer_company_details 

                let fname                               = employerdetails.fname   

                let lname                               = employerdetails.lname  

                //for profile image setup
                let profile_image                       = employerdetails.profile_image  

                if (employerdetails.socialLogin.image === null) {
                    profile_image =  config.liveUrl + employerdetails.profile_image
                } else {
                    profile_image =  employerdetails.socialLogin.image;
                }

                if (profile_image == '' || profile_image == null) {
                    profile_image = config.liveUrl + config.userDemoPicPath;
                }
                
                employerdetails = {
                                        profile_image:profile_image,
                                        fname:fname,
                                        lname:lname,
                                        employer_company_details:employer_company_details,
                                        updatedAt:last_updated,
                                    }


            }

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
        let jobpostedvalue = ''
        await JobSchema.aggregatePaginate(aggregate, {}, function (err, results, pageCount, count) {
            if (err) {
                callback({
                    "response_code": 5005,
                    "response_message": err,
                    "response_data": {}
                });

            } else {
                jobpostedvalue = results
                
            }
        });
            
        let shortlistedemployeevalue =   await ApplicationSchema.aggregate([
                {
                        "$match": { ...query , status : "shortlisted" }
                },
                {
                    $lookup: {
                        from: "employees",
                        localField: "employeeId",
                        foreignField: "_id",
                        as: "employee_details"
                    }
    
                },
                {
                    $group: {
                    _id :  "$_id",
                    employee_details: { $first: "$employee_details" },
                    }
                }, 
                {
                    $project: {
                    _id: 1,
                    employee_details: 1,
                    }
                }]);
        let recruitedemployeevalue   =   await ApplicationSchema.aggregate([
                    {
                            "$match": { ...query , status : "selected" }
                    },
                    {
                        $lookup: {
                            from: "employees",
                            localField: "employeeId",
                            foreignField: "_id",
                            as: "employee_details"
                        }
        
                    },
                    {
                        $group: {
                        _id :  "$_id",
                        employee_details: { $first: "$employee_details" },
                        }
                    }, 
                    {
                        $project: {
                        _id: 1,
                        employee_details: 1,
                        }
                    }]);
                        
//            selected
        callback({
            "response_code": 2000,
            "response_message": "Employer Dashboard list.",
            "response_data": {
                 employerdetails            : employerdetails,
                 jobpostedcount             : jobpostedvalue.length,
                 shortlistedemployeecount   : shortlistedemployeevalue.length,
                 recruitedemployeecount     : recruitedemployeevalue.length,
                 jobpostedvalue             : jobpostedvalue,
                 shortlistedemployeevalue   : shortlistedemployeevalue,
                 recruitedemployeevalue     : recruitedemployeevalue,
                }
        });

           
    },

    //updateApplicantStatus

    updateApplicantStatus: async function (data, callback) {
        if (data) {

            let jobApplicant = await ApplicationSchema.findOne({
                _id: data.applicationId
            }, function (err, result) {
                if (err) {
                    callback({
                        "response_code": 5005,
                        "response_message": err,
                        "response_data": {}
                    });

                }
            });

            if (jobApplicant !== null) {

                ApplicationSchema.updateOne({
                    _id: data.applicationId
                }, {
                    $set: {
                        status: data.status
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
                            "response_message": "Job Application updated Successfully",
                            "response_data": {}
                        });
                    }
                });

            } else {
                callback({
                    "response_code": 5002,
                    "response_message": "No Job Application Found.",
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


    //Job List
    listJob: async function (data, callback) {

        console.log('data----------->',data)
        let check_employee_id =''
        let check_employer =null
        if(data.decoded !='')
        {

             check_employee_id = data.decoded.id

             check_employer = await EmployerSchema.findOne({
                    _id: data.employer_id
                }, function (err, result) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": err,
                            "response_data": {}
                        });

                    }
                });

        }

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

        if (data.searchText) {

            let jobSkillDetails = await JobSkillSchema.find(
                                    {
                                            $or: [
                                                { name: { $regex: data.searchText, $options: "i" } },
                                                { ar_name: { $regex: data.searchText, $options: "i" } }
                                            ]
                                    }
                                    )

                let skillSet = []
                if(jobSkillDetails.length > 0)
                {
                    jobSkillDetails.map( (skill) => {  
                        skillSet.push(skill._id)
                    })



                }

                querySearchText = {
                    $or: [
                        { name: { $regex: data.searchText, $options: "i" } },
                        { ar_name: { $regex: data.searchText, $options: "i" } },
                        { company: { $regex: data.searchText, $options: "i" } },
                        { job_skill: { $in: skillSet } }

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

      

        query = (data.name !== undefined || data.name !== '') ? { ...query ,...queryName} : query

        query = (data.searchText !== undefined || data.searchText !== '') ? { ...query ,...querySearchText} : query

        console.log('query----------->',query)
        console.log('check_employee_id----------->',check_employee_id)

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
            from: 'job-applications',
            localField: '_id',
            foreignField: 'jobId',
            as: 'JobApplication'
        });
        aggregate.unwind({
            path: "$JobApplication",
            preserveNullAndEmptyArrays: true
        });


        aggregate.lookup({
            from: 'save-jobs',
            localField: '_id',
            foreignField: 'jobId',
            as: 'SaveJob'
        });
        aggregate.unwind({
            path: "$SaveJob",
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
            JobApplication: {
                "$addToSet": "$JobApplication"
            },
            SaveJob: {
                "$addToSet": "$SaveJob"
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
            // remoteArea: {
            //     "$first": "$remoteArea"
            // },
            // onsite: {
            //     "$first": "$onsite"
            // },
            // minExp: {
            //     "$first": "$minExp"
            // },
            // maxExp: {
            //     "$first": "$maxExp"
            // },
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
                                        then: config.liveUrl + companyDemoLogo,
                                        else: {
                                            $concat: [config.liveUrl, {
                                                "$arrayElemAt": ["$Company.logo", 0]
                                            }]
                                            // "$arrayElemAt": ["$User.profile_image", 0]
                                        }
                              }      
                        }

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

            SaveJob: {
                            $cond: {
                                        if: {
                                            $in: [check_employee_id, "$SaveJob.employeeId"]
                                        },
                                        then: 'Already Saved',
                                        else: null
                              }      
                        },

            description: 1,
            ar_description: 1,
            application_email_id: 1,
            // remoteArea: 1,
            // onsite: 1,
            // minExp: 1,
            // maxExp: 1,
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
                let jobtagarray = []
                if(results.length > 0)
                {
                    results.map( async (output) => {

                        let o_jobTag = output.job_tag
                        if(o_jobTag.length > 0)
                        {
                            o_jobTag.map( (output_job) => {

                                jobtagarray.push( output_job.name )

                            })
                        }


                        // start for log
                        if(check_employer  !== null)
                        {
                                console.log('check_employer------->',check_employer)
                                let logdata = {
                                        employee_id: output._id,
                                        employer_id: check_employer._id,
                                        action:'search',
                                        keyword:'',
                                        body:''
                                }
                                await employeeDashoardLog(logdata)
                        }
                        // end for log


                    }
                    )

                    if(jobtagarray.length > 0)
                    {
                        jobtagarray.map((obj) => {
                            var key = obj
                            counter[key] = (counter[key] || 0) + 1
                        })
                      //  console.log('counter---->',counter)
                    }
                }

                var data = {
                    docs: results,
                    jobtag: counter,
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
    //Add Job
    // addJob: async function (data, fileData, callback) {

    //     if (data) {

    //         async.waterfall([
    //             function (nextCb) {

    //                 employerModels.can_post_job({
    //                     _id: data.employerId
    //                 }, function (response) {

    //                     if (response.response_data) {

    //                         if (fileData != null && fileData.logo) {

    //                             var imageFile = fileData.logo;
    //                             var timeStamp = Date.now();
    //                             var fileName = timeStamp + imageFile.name;
    //                             var folderpath = config.uploadjoblogoPath;
    //                             let joblogoPath = config.joblogoPath;
    //                             let split = imageFile
    //                                 .mimetype
    //                                 .split("/");
    //                             if (split[1] = "jpeg" || "png" || "jpg") {
    //                                 imageFile.mv(
    //                                     folderpath + fileName,
    //                                     function (err) {

    //                                         if (err) {
    //                                             callback({
    //                                                 "response_code": 5005,
    //                                                 "response_message": "INTERNAL DB ERROR",
    //                                                 "response_data": err
    //                                             });
    //                                         } else {
    //                                             data.logo = joblogoPath + fileName;
    //                                             nextCb(null, {
    //                                                 "response_code": 2000,
    //                                                 "response_data": {}

    //                                             });
    //                                         }
    //                                     }
    //                                 )

    //                             } else {
    //                                 callback({
    //                                     status: 5002,
    //                                     message: "MIME type not allowed please upload jpg or png file"
    //                                 })
    //                             }

    //                         } else {
    //                             nextCb(null, {
    //                                 "response_code": 2000,
    //                                 "response_data": {}

    //                             });
    //                         }
    //                     } else {

    //                         callback({
    //                             "response_code": 5005,
    //                             "response_message": "You can not post job. Please upgrade package.",
    //                             "response_data": {}
    //                         });
    //                     }
    //                 })


    //             },
    //             function (arg1, nextCb) {
    //                 if (arg1.response_code == 2000) {

    //                     EmployerSchema.findOne({
    //                             _id: data.employerId
    //                         },
    //                         function (err, findRes) {
    //                             if (err) {
    //                                 callback({
    //                                     "response_code": 5005,
    //                                     "response_message": "INTERNAL DB ERROR",
    //                                     "response_data": {}
    //                                 });
    //                             } else {
    //                                 if (findRes != null) {

    //                                     nextCb(null, {
    //                                         "response_code": 2000,
    //                                         "response_data": findRes

    //                                     });

    //                                 } else {
    //                                     callback({
    //                                         "response_code": 5002,
    //                                         "response_message": "Employer not exist.",
    //                                         "response_data": {}
    //                                     });
    //                                 }

    //                             }
    //                         });

    //                 }
    //             },
    //             function (arg1, nextCb) {
    //                 if (arg1.response_code == 2000) {

    //                     var date = new Date();
    //                     var jobCount = arg1.response_data.jobCount + 1;
    //                     data.job_expire_date = date.setDate(date.getDate() + arg1.response_data.job_package.job_display_duration);


    //                     new JobSchema(data).save(function (err, result) {
    //                         if (err) {
    //                             callback({
    //                                 "response_code": 50051,
    //                                 "response_message": "INTERNAL DB ERROR",
    //                                 "response_data": err
    //                             });
    //                         } else {
    //                             // console.log({
    //                             //     email: arg1.response_data.email,
    //                             //     name: arg1.response_data.fname + ' ' + arg1.response_data.lname,
    //                             //     jobTitle: data.language == 'ar' ? data.name : data.ar_name,
    //                             //     site_url: config.liveUrl
    //                             // });
    //                             mailProperty('newJobMail')(arg1.response_data.email, {
    //                                 name: arg1.response_data.fname + ' ' + arg1.response_data.lname,
    //                                 jobTitle: data.language == 'ar' ? data.ar_name : data.name,
    //                                 site_url: config.liveUrl,
    //                                 date: new Date()
    //                             }).send();

    //                             EmployerSchema.updateOne({
    //                                 _id: data.employerId
    //                             }, {
    //                                 $set: {
    //                                     jobCount: jobCount
    //                                 }
    //                             }, function (err, resUpdate) {
    //                                 if (err) {
    //                                     callback({
    //                                         "response_code": 5005,
    //                                         "response_message": "INTERNAL DB ERROR",
    //                                         "response_data": {}
    //                                     });
    //                                 } else {

    //                                     nextCb(null, {
    //                                         "response_code": 2000,
    //                                         "response_data": {}

    //                                     });

    //                                 }
    //                             });

    //                         }
    //                     });

    //                 }
    //             },
    //         ], function (err, result) {
    //             if (err) {
    //                 callback({
    //                     "response_code": 5005,
    //                     "response_message": "INTERNAL DB ERROR",
    //                     "response_data": {}
    //                 });
    //             } else {
    //                 callback({
    //                     "response_code": 2000,
    //                     "response_message": "Job Posted Successfully",
    //                     "response_data": {}
    //                 });
    //             }
    //         });

    //     } else {
    //         callback({
    //             "response_code": 5005,
    //             "response_message": "INTERNAL DB ERROR",
    //             "response_data": {}
    //         });
    //     }

    // },
    //Add Job
    addJob: async function (data, callback) {

        if (data) {

            let employer = await EmployerSchema.findOne({
                _id: data.employerId
            }, function (err, result) {
                if (err) {
                    callback({
                        "response_code": 5005,
                        "response_message": err,
                        "response_data": {}
                    });

                }
            });

            if (employer != null) {

                // employerModels.can_post_job({
                //     _id: data.employerId
                // }, function (response) {

                //     if (response.response_data) {

                var date = new Date();
                var jobCount = employer.jobCount + 1;
                data.job_expire_date = date.setDate(date.getDate() + 30);

                new JobSchema(data).save(function (err, result) {
                    if (err) {
                        callback({
                            "response_code": 50051,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": err
                        });
                    } else {
                        var jobTitle = data.language == 'ar' ? data.ar_name : data.name;

                        mailProperty('newJobMail')(employer.email, {
                            name: employer.fname + ' ' + employer.lname,
                            jobTitle: data.language == 'ar' ? data.ar_name : data.name,
                            site_url: config.liveUrl,
                            date: new Date()
                        }).send();

                        var message = 'New Job ' + jobTitle + ' has been posted successfully.';
                        var title = 'New Job Posted';
                        var notification_code = 1000;
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
                            notification_for: 'job_post',
                        }
                        NotificationModels.addNotification(addData, function (notiResult) {
                            if (employer.apptype == 'IOS') {
                                pushNotification.iosPushNotificationUser(pushData, function (pushStatus) {
                                    console.log('pushStatus', pushStatus);
                                });
                            } else if (employer.apptype = 'ANDROID') {
                                pushNotification.androidPushNotification(pushData, function (pushStatus) {
                                    console.log('pushStatus', pushStatus);
                                });
                            }
                        });

                        var admin_message = employer.fname + ' ' + employer.lname + ' posted a new job ' + jobTitle;
                        var admin_title = 'New Job Posted';
                        var addData = {
                            _id: new ObjectID,
                            user_id: employer._id,
                            user_type: 'employer',
                            message: admin_message,
                            title: admin_title,

                        }
                        AdminNotificationModels.addNotification(addData, function (notiResult) {});

                        EmployerSchema.updateOne({
                            _id: data.employerId
                        }, {
                            $set: {
                                jobCount: jobCount
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
                                    "response_message": "Job Posted Successfully",
                                    "response_data": result
                                });

                            }
                        });

                    }
                });

                //     } else {

                //         callback({
                //             "response_code": 5005,
                //             "response_message": "You can not post job. Please upgrade package.",
                //             "response_data": {}
                //         });
                //     }
                // })
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
    //Edit Job
    // editJob: async function (data, fileData, callback) {
    //     if (data) {

    //         var timeStamp = Date.now();
    //         var folderpath = config.uploadjoblogoPath;
    //         let joblogoPath = config.joblogoPath;

    //         async.waterfall([
    //             function (nextCb) {
    //                 JobSchema.findOne({
    //                         _id: data.jobId
    //                     },
    //                     function (err, resData) {
    //                         if (err) {
    //                             nextcb(err);
    //                         } else {
    //                             if (resData == null) {
    //                                 callback({
    //                                     "response_code": 5002,
    //                                     "response_message": "Job not found.",
    //                                     "response_data": {}
    //                                 });
    //                             } else {
    //                                 data.logo = resData.logo;

    //                                 if (fileData != null && fileData.logo) {
    //                                     var logoFile = fileData.logo;
    //                                     var logoName = timeStamp + logoFile.name;
    //                                     let split = logoFile
    //                                         .mimetype
    //                                         .split("/");

    //                                     if (split[1] = "jpeg" || "png" || "jpg") {
    //                                         logoFile.mv(
    //                                             folderpath + logoName,
    //                                             function (err) {

    //                                                 if (err) {
    //                                                     callback({
    //                                                         "success": false,
    //                                                         "STATUSCODE": 5005,
    //                                                         "message": "Restaurant logo not uploaded",
    //                                                     });
    //                                                 } else {
    //                                                     data.logo = joblogoPath + logoName;

    //                                                     let logo = `./public/${resData.logo}`;

    //                                                     if (fs.existsSync(logo)) {
    //                                                         fs.unlink(logo, (err) => {
    //                                                             if (err) throw err;
    //                                                             console.log('successfully deleted');
    //                                                         });
    //                                                     }

    //                                                     nextCb(null, {
    //                                                         "response_code": 2000,
    //                                                         "response_data": resData

    //                                                     });
    //                                                 }

    //                                             }
    //                                         )
    //                                     } else {
    //                                         callback({
    //                                             "success": false,
    //                                             "STATUSCODE": 5002,
    //                                             "message": "MIME type not allowed please upload jpg or png file",
    //                                         });
    //                                     }

    //                                 } else {
    //                                     nextCb(null, {
    //                                         "response_code": 2000,
    //                                         "response_data": resData

    //                                     });
    //                                 }


    //                             }
    //                         }
    //                     });
    //             },
    //             function (arg1, nextCb) {
    //                 if (arg1.response_code == 2000) {


    //                     JobSchema.updateOne({
    //                         _id: data.jobId
    //                     }, {
    //                         $set: {
    //                             name: data.name,
    //                             ar_name: data.ar_name,
    //                             logo: data.logo,
    //                             job_type: data.job_type,
    //                             job_tag: data.job_tag,
    //                             location: data.location,
    //                             description: data.description,
    //                             ar_description: data.ar_description,
    //                             tagLine: data.tagLine,
    //                             remoteArea: data.remoteArea == "true" ? true : false,
    //                             onsite: data.onsite == "true" ? true : false,
    //                             minExp: data.minExp,
    //                             maxExp: data.maxExp
    //                         }
    //                     }, function (err, resUpdate) {
    //                         if (err) {
    //                             callback({
    //                                 "response_code": 5005,
    //                                 "response_message": err,
    //                                 "response_data": {}
    //                             });
    //                         } else {
    //                             nextCb(null, {
    //                                 "response_code": 2000,
    //                                 "response_data": {}

    //                             });
    //                         }
    //                     });
    //                 } else {
    //                     nextCb(null, arg1);
    //                 }
    //             }


    //         ], function (err, result) {
    //             if (err) {
    //                 callback({
    //                     "response_code": 5005,
    //                     "response_message": "INTERNAL DB ERROR",
    //                     "response_data": {}
    //                 });
    //             } else {
    //                 callback({
    //                     "response_code": 2000,
    //                     "response_message": "Job Updated Successfully",
    //                     "response_data": {}
    //                 });
    //             }
    //         });

    //     } else {
    //         callback({
    //             "response_code": 5005,
    //             "response_message": "INTERNAL DB ERROR",
    //             "response_data": {}
    //         });
    //     }
    // },
    //Publish Job
    publishJob: async function (data, callback) {
        if (data) {

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

            if (job != null) {

                JobSchema.updateOne({
                    _id: data.jobId
                }, {
                    $set: {
                        status: "publish"
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
                            "response_message": "Job Publish Successfully",
                            "response_data": {}
                        });
                    }
                });

            } else {
                callback({
                    "response_code": 5002,
                    "response_message": "Job not found.",
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
    //Edit Job
    editJob: async function (data, callback) {
        if (data) {

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

            if (job != null) {

                JobSchema.updateOne({
                    _id: data.jobId
                }, {
                    $set: {
                        name: data.name,
                        ar_name: data.ar_name,
                        country: data.country,
                        city: data.city,
                        job_tag: data.job_tag,
                        job_type: data.job_type,
                        job_industry: data.job_industry,
                        job_level: data.job_level,
                        description: data.description,
                        ar_description: data.ar_description,
                        job_skill: data.job_skill,
                        application_email_id: data.application_email_id
                        // remoteArea: data.remoteArea,
                        // onsite: data.onsite,
                        // minExp: data.minExp,
                        // maxExp: data.maxExp
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
                            "response_message": "Job Updated Successfully",
                            "response_data": {}
                        });
                    }
                });

            } else {
                callback({
                    "response_code": 5002,
                    "response_message": "Job not found.",
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
    //Delete Job
    deleteJob: async function (data, callback) {
        if (data) {
            JobSchema.findOne({
                    _id: data.jobId
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
                            JobSchema.remove({
                                    _id: data.jobId
                                },
                                async function (err, result) {
                                    if (err) {
                                        callback({
                                            "response_code": 5005,
                                            "response_message": "INTERNAL DB ERROR",
                                            "response_data": err
                                        });
                                    } else {

                                        if (resData.logo !== null) {
                                            let logo = `./public/${resData.logo}`;
                                            if (fs.existsSync(logo)) {
                                                await fs.unlink(logo, (err) => {
                                                    if (err) throw err;
                                                    console.log('successfully deleted');
                                                });
                                            }
                                        }
                                        EmployerSchema.updateOne({
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
                                                    "response_message": "Job deleted successfully.",
                                                });
                                            }
                                        });

                                        await EmployerSchema.updateOne({
                                            _id: resData.employerId
                                        }, {
                                            $inc: {
                                                jobCount: -1
                                            }
                                        }, function (err, result) {
                                            if (err) {
                                                callback({
                                                    "response_code": 5005,
                                                    "response_message": err,
                                                    "response_data": {}
                                                });
                                            }

                                        });

                                        callback({
                                            "response_code": 2000,
                                            "response_message": "Job deleted successfully.",
                                            "response_data": {}
                                        });
                                    }
                                }
                            )
                        } else {
                            callback({
                                "response_code": 5002,
                                "response_message": "Job not found.",
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
    //Status Change Job
    updateJobStatus: function (data, callback) {
        if (data) {
            JobSchema.findOne({
                    _id: data.jobId
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

                            JobSchema.updateOne({
                                _id: data.jobId
                            }, {
                                $set: {
                                    status: data.status,
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
                                        "response_message": "Job status updated successfully.",
                                        "response_data": {}
                                    });
                                }
                            });

                        } else {
                            callback({
                                "response_code": 5002,
                                "response_message": "Job not found.",
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
                        employeeStatus: data.status
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

        //list Interested Not Interested Employee
    listInterestedNotInterestedEmployee: async function (data, callback) {

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
        if (data.employerId) {
            query['employerId'] = data.employerId;
        }

        console.log('query----------->',query)

        var aggregate = Interested_Not_InterestedSchema.aggregate();
        aggregate.match(query)
        aggregate.lookup({
            from: 'employees',
            localField: 'employeeId',
            foreignField: '_id',
            as: 'employeeId'
        });
        
        aggregate.unwind({
            path: "$employeeId",
            preserveNullAndEmptyArrays: true
        });

        aggregate.lookup({
            from: 'job-countries',
            localField: 'employeeId.country',
            foreignField: '_id',
            as: 'employeeId.country'
        });
        
        aggregate.unwind({
            path: "$employeeId.country",
            preserveNullAndEmptyArrays: true
        });

        aggregate.lookup({
            from: 'job-cities',
            localField: 'employeeId.city',
            foreignField: '_id',
            as: 'employeeId.city'
        });
        
        aggregate.unwind({
            path: "$employeeId.city",
            preserveNullAndEmptyArrays: true
        });


        aggregate.group({
            "_id": "$_id",
            createdAt: {
                "$first": "$createdAt"
            },
            employeeId: {
                "$first": "$employeeId"
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
            employeeId: 1,
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

                                output.employeeId.profile_image = 
                                ( output.employeeId.profile_image == null && output.employeeId.socialLogin.image !== null ) ? 
                                 output.employeeId.socialLogin.image:
                                ( output.employeeId.profile_image !== null && output.employeeId.socialLogin.image == null ) ? 
                                config.liveUrl + output.employeeId.profile_image : config.liveUrl + config.userDemoPicPath
            



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
                    "response_message": "Employee Interested Not Interested list.",
                    "response_data": data
                });

            }
        });
    },

    //employers Interested Not Interested 
    employersInterestedNotInterested: async function (data, callback) {
    if (data) {

        let employerInterested = await Interested_Not_InterestedSchema.findOne({
            employeeId: data.employeeId, employerId: data.employerId, employerStatus: 'default'
        }, function (err, result) {
            if (err) {
                callback({
                    "response_code": 5005,
                    "response_message": err,
                    "response_data": {}
                });

            }
        });

        console.log('employerInterested---',employerInterested);
        
        if(employerInterested !== null) {
            
            
            await Interested_Not_InterestedSchema.update({
                employeeId: data.employeeId, employerId: data.employerId, employerStatus: 'default'
            }, {
                $set: {
                    employeeStatus:data.employeeStatus
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

    //deleteEmployer
    deleteEmployer: function (data, callback) {
        if (data) {
            EmployerSchema.findOne({
                    _id: data.employerId
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
                            EmployerSchema.remove({
                                    _id: data.employerId
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
                                            "response_message": "Employer deleted successfully.",
                                            "response_data": {}
                                        });
                                    }
                                }
                            )
                        } else {
                            callback({
                                "response_code": 5002,
                                "response_message": "Employer not found.",
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
module.exports = employerModels;