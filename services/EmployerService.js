'use strict';
var config = require('../config');
var async = require("async");
var mongo = require('mongodb');
var jwt = require('jsonwebtoken');
var fs = require('fs')
var ObjectID = mongo.ObjectID;

var mailProperty = require('../modules/sendMail');

var Employer = require('../models/employers');
var AdminModels = require('../models/admin');

var apiService = {

    //register Employer
    register: (data, callback) => {

        var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

        if (!data.company_name || typeof data.company_name === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide company name",
                "response_data": {}
            });
        } else if (!data.designation || typeof data.designation === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide designation",
                "response_data": {}
            });
        } else if (!data.fname || typeof data.fname === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide first name",
                "response_data": {}
            });
        } else if (!data.lname || typeof data.lname === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide last name",
                "response_data": {}
            });
        } else if (!data.email || typeof data.email === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide email address",
                "response_data": {}
            });
        } else if (!re.test(String(data.email).toLowerCase())) {
            callback({
                "response_code": 5002,
                "response_message": "please provide valid email address",
                "response_data": {}
            });
        } else if (!data.password || typeof data.password === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide password",
                "response_data": {}
            });
        } else {

            data._id = new ObjectID;
            data.companyId = new ObjectID;
            data.verification_code = Math.random().toString().replace('0.', '').substr(0, 4);
            data.email = String(data.email).toLowerCase();

            Employer.register(data, function (result) {
                callback(result);
            });
        }
    },
    // Social Login
    socialLogin: (data, callback) => {
        var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

        if (!data.fname || typeof data.fname === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide first name",
                "response_data": {}
            });
        } else if (!data.lname || typeof data.lname === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide last name",
                "response_data": {}
            });
        } else if (!data.email || typeof data.email === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide email address",
                "response_data": {}
            });
        } else if (!re.test(String(data.email).toLowerCase())) {
            callback({
                "response_code": 5002,
                "response_message": "please provide valid email address",
                "response_data": {}
            });
        } else if (!data.devicetoken || typeof data.devicetoken === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide devicetoken",
                "response_data": {}
            });
        } else if (!data.apptype || typeof data.apptype === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide apptype",
                "response_data": {}
            });
        } else {

            data.email = String(data.email).toLowerCase();
            Employer.socialLogin(data, function (result) {
                callback(result);
            });
        }
    },
    //Email Verification
    emailVerification: (data, callback) => {
        if (!data.email || typeof data.email === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide email address",
                "response_data": {}
            })
        } else if (!data.verification_code || typeof data.verification_code === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide verification code",
                "response_data": {}
            })
        } else {
            data.email = String(data.email).toLowerCase();
            Employer.emailVerify(data, function (result) {
                callback(result);
            });
        }
    },
    //Resend email verification code
    resendEmailVerifyCode: (data, callback) => {

        if (!data.email || typeof data.email === undefined) {
            callback(null, {
                "response_code": 5002,
                "response_message": "please provide email address",
                "response_data": {}
            });
        } else {
            data.email = String(data.email).toLowerCase();
            data.verification_code = Math.random().toString().replace('0.', '').substr(0, 4);
            Employer.resendEmailVerifyCode(data, function (result) {
                callback(result);
            });
        }
    },
    //login 
    login: (data, callback) => {
        if (!data.email || typeof data.email === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide email address",
                "response_data": {}
            });
        } else if (!data.password || typeof data.password === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide password",
                "response_data": {}
            });
        } else if (!data.devicetoken || typeof data.devicetoken === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide devicetoken",
                "response_data": {}
            });
        } else if (!data.apptype || typeof data.apptype === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide apptype",
                "response_data": {}
            });
        } else {
            Employer.login(data, function (result) {
                callback(result);
            });
        }
    },
    //Forgot password
    forgotPassword: (data, callback) => {
        if (!data.email || typeof data.email === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide email address",
                "response_data": {}
            });
        } else {
            data.email = String(data.email).toLowerCase();
            data.otp = Math.random().toString().replace('0.', '').substr(0, 4);
            Employer.forgotPassword(data, function (result) {

                callback({
                    "response_code": result.response_code,
                    "response_message": result.response_message
                });
            });
        }

    },
    //reset password 
    resetPassword: (data, callback) => {
        if (!data.email || typeof data.email === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide email address",
                "response_data": {}
            });
        } else if (!data.otp || typeof data.otp === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide OTP",
                "response_data": {}
            })
        } else if (!data.password || typeof data.password === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide new password",
                "response_data": {}
            });
        } else {
            data.email = String(data.email).toLowerCase();
            Employer.resetPassword(data, function (result) {
                callback(result);
            });
        }
    },
    //Change password 
    changePassword: (data, callback) => {
        if (!data.email || typeof data.email === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide email address",
                "response_data": {}
            });
        } else if (!data.currentpassword || typeof data.currentpassword === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide current password",
                "response_data": {}
            });
        } else if (!data.password || typeof data.password === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide password",
                "response_data": {}
            });
        } else {
            Employer.changePassword(data, function (result) {
                callback(result);
            });
        }

    },
    //Change email Request 
    changeEmailReq: (data, callback) => {

        if (!data.email || typeof data.email === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide email address",
                "response_data": {}
            });
        }
        if (!data.newemail || typeof data.newemail === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide email address",
                "response_data": {}
            });
        } else {
            data.email = String(data.email).toLowerCase();
            data.newemail = String(data.newemail).toLowerCase();
            data.verification_code = Math.random().toString().replace('0.', '').substr(0, 4);
            Employer.updateEmailReq(data, function (result) {
                callback(result);
            });

        }

    },
    //Change email
    updateEmail: (data, callback) => {

        if (!data.email || typeof data.email === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide email address",
                "response_data": {}
            })
        } else if (!data.verification_code || typeof data.verification_code === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide verification code",
                "response_data": {}
            })
        } else {
            Employer.updateEmail(data, function (result) {
                callback(result);
            });
        }
    },
    //Employer List
    userList: (data, callback) => {


        Employer.userList(data, function (result) {
            callback(result);
        });

    },
    //Profile View
    viewProfile: (data, callback) => {
        if (!data.email || typeof data.email === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide email address",
                "response_data": {}
            });
        } else {
            Employer.viewProfile(data, function (result) {
                callback(result);
            })
        }
    },
    // Edit Profile
    editProfile: (data, callback) => {

        if (!data.email || typeof data.email === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide email address",
                "response_data": {}
            });
        } else {

            Employer.editProfile(data, function (result) {
                callback(result);
            })
        }
    },
    //Edit Profile Image
    editProfileImage: (data, fileData, callback) => {

        if (!data.email || typeof data.email === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide email address",
                "response_data": {}
            });
        } else if (!fileData || typeof fileData === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide profile image",
                "response_data": {}
            });
        } else {
            //console.log("fileData", fileData);
            var imageFile = fileData.file;
            var timeStamp = Date.now();
            var fileName = timeStamp + imageFile.name;
            var folderpath = config.uploadProfilepicPath;
            let profilepicPath = config.profilepicPath;
            let split = imageFile
                .mimetype
                .split("/");
            if (split[1] = "jpeg" || "png" || "jpg") {
                imageFile.mv(
                    folderpath + fileName,
                    function (err) {

                        if (err) {
                            callback({
                                "response_code": 5005,
                                "response_message": "INTERNAL DB ERROR",
                                "response_data": err
                            });
                        } else {
                            data.profile_image = profilepicPath + fileName;
                            Employer.editProfileImage(data, function (result) {
                                callback(result);
                            });
                        }
                    }
                )

            } else {
                callback({
                    status: 5002,
                    message: "MIME type not allowed please upload jpg or png file"
                })
            }
        }
    },
    //Add Company
    addCompany: (data, fileData, callback) => {
        if (!data.employerId || typeof data.employerId === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide employer Id",
                "response_data": {}
            })
        } else if (!data.name || typeof data.name === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide company name",
                "response_data": {}
            })
        } else if (!data.country || typeof data.country === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide company country",
                "response_data": {}
            })
        } else if (!data.city || typeof data.city === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide company city",
                "response_data": {}
            })
        } else {
            data._id = new ObjectID;
            if (fileData != null && fileData.logo) {

                var imageFile = fileData.logo;
                var timeStamp = Date.now();
                var fileName = timeStamp + imageFile.name;
                var folderpath = config.uploadcompanylogoPath;
                let companylogoPath = config.companylogoPath;
                let split = imageFile
                    .mimetype
                    .split("/");
                if (split[1] = "jpeg" || "png" || "jpg") {
                    imageFile.mv(
                        folderpath + fileName,
                        function (err) {

                            if (err) {
                                callback({
                                    "response_code": 5005,
                                    "response_message": "INTERNAL DB ERROR",
                                    "response_data": err
                                });
                            } else {
                                data.logo = companylogoPath + fileName;
                                Employer.addCompany(data, function (result) {
                                    callback(result);
                                });
                            }
                        }
                    )

                } else {
                    callback({
                        status: 5002,
                        message: "MIME type not allowed please upload jpg or png file"
                    })
                }

            } else {

                Employer.addCompany(data, function (result) {
                    callback(result);
                });

            }





        }
    },
    //Company List
    listCompany: (data, callback) => {

        Employer.listCompany(data, function (result) {
            callback(result);
        })

    },
    //Edit Company
    editCompany: (data, fileData, callback) => {
        if (!data.companyId || typeof data.companyId === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide company id",
                "response_data": {}
            });
        } else if (!data.name || typeof data.name === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide company name",
                "response_data": {}
            })
        } else if (!data.country || typeof data.country === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide company country",
                "response_data": {}
            })
        } else if (!data.city || typeof data.city === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide company city",
                "response_data": {}
            })
        } else {
            Employer.editCompany(data, fileData, function (result) {
                callback(result);
            })
        }
    },
    //Delete Company
    deleteCompany: (data, callback) => {
        if (!data.companyId || typeof data.companyId === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide company id",
                "response_data": {}
            });
        } else {
            Employer.deleteCompany(data, function (result) {
                callback(result);
            })
        }
    },
        

    // Employee Job Applied
    listJobApplied: (data, callback) => {

        if (!data.employerId || typeof data.employerId === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide employer Id",
                "response_data": {}
            });
        } else {

            Employer.listJobApplied(data, function (result) {
                callback(result);
            });
        }
    },

    // Employee Dashboard
    employerDashboard: (data, callback) => {

        if (!data.employerId || typeof data.employerId === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide employer Id",
                "response_data": {}
            });
        } else {

            Employer.employerDashboard(data, function (result) {
                callback(result);
            });
        }
    },
    //Job Package List
    listJobPackage: function (data, callback) {

        AdminModels.listJobPackage(data, function (result) {
            callback(result);
        });
    },
    //Order list
    orderList: (data, callback) => {
        if (!data.userId || typeof data.userId === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide user id",
                "response_data": {}
            });
        } else {
            Employer.orderList(data, function (result) {
                callback(result);
            });
        }
    },
    //order checkout
    checkOut: (data, callback) => {
        if (!data.userId || typeof data.userId === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide user id",
                "response_data": {}
            });
        } else if (!data.transactionAmount || typeof data.transactionAmount === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide transactionAmount",
                "response_data": {}
            });
        } else if (!data.paymentMode || typeof data.paymentMode === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide paymentMode",
                "response_data": {}
            });
        } else if (!data.paymentStatus || typeof data.paymentStatus === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide paymentStatus",
                "response_data": {}
            });
        } else if (!data.job_package_id || typeof data.job_package_id === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide job package id",
                "response_data": {}
            });
        } else {
            data._id = new ObjectID;

            Employer.checkOut(data, function (result) {
                callback(result);

            });
        }

    },

    //updateInterestedNotInterestedStatus
    updateInterestedNotInterestedStatus: (data, callback) => {
        //
                if (!data.id || typeof data.id === undefined) {
                    callback({
                        "response_code": 5002,
                        "response_message": "please provide InterestedNotInterested Id",
                        "response_data": {}
                    });
                }else  if (!data.status || typeof data.status === undefined) {
                    callback({
                        "response_code": 5002,
                        "response_message": "please provide InterestedNotInterested Status",
                        "response_data": {}
                    });
                }  else {
        
                    Employer.updateInterestedNotInterestedStatus(data, function (result) {
                        callback(result);
                    });
                }
    },

    // list Interested Not Interested Employee
    listInterestedNotInterestedEmployee: (data, callback) => {

        if (!data.employerId || typeof data.employerId === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide employer Id",
                "response_data": {}
            });
        } else {

            Employer.listInterestedNotInterestedEmployee(data, function (result) {
                callback(result);
            });
        }
    },


        // Employee list Job Shortlisted
    listJobShortlistedEmployee: (data, callback) => {

        if (!data.employerId || typeof data.employerId === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide employer Id",
                "response_data": {}
            });
        } else {

            Employer.listJobShortlistedEmployee(data, function (result) {
                callback(result);
            });
        }
    },
    //
    listJob: (data, callback) => {

        Employer.listJob(data, function (result) {
            callback(result);
        });
    },
    //Add Job
    addJob: (data, callback) => {
        if (!data.employerId || typeof data.employerId === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide employer Id",
                "response_data": {}
            });
        } else if (!data.job_type || typeof data.job_type === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide job type",
                "response_data": {}
            });
        } else if (!data.job_tag || typeof data.job_tag === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide job tag",
                "response_data": {}
            });
        } else if (!data.country || typeof data.country === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide country",
                "response_data": {}
            });
        } else if (!data.city || typeof data.city === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide city",
                "response_data": {}
            });
        } 
        
        // else if (!data.minExp || typeof data.minExp === undefined) {
        //     callback({
        //         "response_code": 5002,
        //         "response_message": "please provide experience",
        //         "response_data": {}
        //     });
        // }
         else {

            // data.remoteArea = data.remoteArea == "true" ? true : false;
            // data.onsite = data.onsite == "true" ? true : false;
            data._id = new ObjectID;

            Employer.addJob(data, function (result) {
                callback(result);

            });
        }

    },

    // list Block Employee
    listBlockEmployee: (data, callback) => {

        if (!data.employerId || typeof data.employerId === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide employee Id",
                "response_data": {}
            });
        } else {

            Employer.listBlockEmployee(data, function (result) {
                callback(result);
            });
        }
    },
    
    //Publish Job
    publishJob: (data, callback) => {
        if (!data.jobId || typeof data.jobId === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide job id",
                "response_data": {}
            });
        } else {
            Employer.publishJob(data, function (result) {
                callback(result);
            })
        }
    },
    //Edit Job
    editJob: (data, callback) => {
        if (!data.jobId || typeof data.jobId === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide job id",
                "response_data": {}
            });
        } else {
            Employer.editJob(data, function (result) {
                callback(result);
            })
        }
    },
    //Delete Job
    deleteJob: (data, callback) => {
        if (!data.jobId || typeof data.jobId === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide job id",
                "response_data": {}
            });
        } else {
            Employer.deleteJob(data, function (result) {
                callback(result);
            })
        }
    },

    //updateApplicantStatus
    updateApplicantStatus: (data, callback) => {
//
        if (!data.applicationId || typeof data.applicationId === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide Application Id",
                "response_data": {}
            });
        }else  if (!data.status || typeof data.status === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide Applicant Status",
                "response_data": {}
            });
        }  else {

            Employer.updateApplicantStatus(data, function (result) {
                callback(result);
            });
        }
    },
    
    // Status Change Job
    updateJobStatus: (data, callback) => {
        if (!data.jobId || typeof data.jobId === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide job id",
                "response_data": {}
            });
        } else if (!data.status || typeof data.status === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide status",
                "response_data": {}
            });
        } else {
            Employer.updateJobStatus(data, function (result) {
                callback(result);
            })
        }
    },

            //employersInterestedNotInterested
        employersInterestedNotInterested: (data, callback) => {
            //
                    if (!data.employeeStatus || typeof data.employeeStatus === undefined) {
                        callback({
                            "response_code": 5002,
                            "response_message": "please provide employee Status ",
                            "response_data": {}
                        });
                    }else  if (!data.employeeId || typeof data.employeeId === undefined) {
                        callback({
                            "response_code": 5002,
                            "response_message": "please provide employeeId ",
                            "response_data": {}
                        });
                    }else  if (!data.employerId || typeof data.employerId === undefined) {
                        callback({
                            "response_code": 5002,
                            "response_message": "please provide employerId",
                            "response_data": {}
                        });
                    }  else {
            
                        Employer.employersInterestedNotInterested(data, function (result) {
                            callback(result);
                        });
                    }
        }, 
           
    // delete Employer
    deleteEmployer: (data, callback) => {

        if (!data.employerId || typeof data.employerId === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide employer Id",
                "response_data": {}
            });
        } else {

            Employer.deleteEmployer(data, function (result) {
                callback(result);
            });
        }
    },

};
module.exports = apiService;