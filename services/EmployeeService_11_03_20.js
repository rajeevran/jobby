'use strict';
var config = require('../config');
var async = require("async");
var mongo = require('mongodb');
var jwt = require('jsonwebtoken');
var fs = require('fs')
var ObjectID = mongo.ObjectID;

var mailProperty = require('../modules/sendMail');

var Employee = require('../models/employees');

var apiService = {


    //register Employee
    register: (data, callback) => {

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
        } else if (!data.password || typeof data.password === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide password",
                "response_data": {}
            });
        } else if (!data.employeeType || typeof data.employeeType === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide employee type",
                "response_data": {}
            });
        } else if (!data.preferJob.job_role || typeof data.preferJob.job_role === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide prefer job role",
                "response_data": {}
            });
        } else {

            data._id = new ObjectID;
            data.verification_code = Math.random().toString().replace('0.', '').substr(0, 4);
            data.email = String(data.email).toLowerCase();

            Employee.register(data, function (result) {
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
            Employee.socialLogin(data, function (result) {
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
            Employee.emailVerify(data, function (result) {
                callback(result);
            });
        }
    },
    //Resend email verification code
    resendEmailVerifyCode: (data, callback) => {

        if (!data.email || typeof data.email === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide email address",
                "response_data": {}
            });
        } else {
            data.email = String(data.email).toLowerCase();
            data.verification_code = Math.random().toString().replace('0.', '').substr(0, 4);
            Employee.resendEmailVerifyCode(data, function (result) {
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
            Employee.login(data, function (result) {
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
            Employee.forgotPassword(data, function (result) {
                mailProperty('sendOTPdMail')(data.email, {
                    otp: data.otp,
                    email: data.email,
                    name: result.response_data.name,
                    site_url: config.liveUrl,
                    date: new Date()
                }).send();
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
            Employee.resetPassword(data, function (result) {
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
            Employee.changePassword(data, function (result) {
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
        } else if (!data.newemail || typeof data.newemail === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide email address",
                "response_data": {}
            });
        } else {
            data.email = String(data.email).toLowerCase();
            data.newemail = String(data.newemail).toLowerCase();
            data.verification_code = Math.random().toString().replace('0.', '').substr(0, 4);
            Employee.updateEmailReq(data, function (result) {
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
            Employee.updateEmail(data, function (result) {
                callback(result);
            });
        }
    },
    //Employee List
    userList: (data, callback) => {


        Employee.userList(data, function (result) {
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
            Employee.viewProfile(data, function (result) {
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
                            Employee.editProfileImage(data, function (result) {
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
    // Edit Personal Information
    editPersonalInfo: (data, callback) => {
        if (!data.email || typeof data.email === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide email address",
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
        } else {
            Employee.editPersonalInfo(data, function (result) {
                callback(result);
            });
        }

    },
    // Edit Contact Information
    editContactInfo: (data, callback) => {
        if (!data.email || typeof data.email === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide email address",
                "response_data": {}
            });
        } else if (!data.country_code || typeof data.country_code === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide country code",
                "response_data": {}
            });
        } else if (!data.phone_no || typeof data.phone_no === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide phone no",
                "response_data": {}
            });
        } else {
            Employee.editContactInfo(data, function (result) {
                callback(result);
            });
        }

    },
    // Edit Prefered Job
    editPreferedJob: (data, callback) => {
        if (!data.email || typeof data.email === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide email address",
                "response_data": {}
            });
        } else if (!data.job_title || typeof data.job_title === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide job title",
                "response_data": {}
            });
        } else if (!data.job_role || typeof data.job_role === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide job role",
                "response_data": {}
            });
        } else if (!data.job_level || typeof data.job_level === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide job level",
                "response_data": {}
            });
        } else if (!data.job_country || typeof data.job_country === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide job country",
                "response_data": {}
            });
        } else if (!data.job_city || typeof data.job_city === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide job city",
                "response_data": {}
            });
        } else if (!data.job_summary || typeof data.job_summary === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide job summary",
                "response_data": {}
            });
        } else if (!data.job_industry || typeof data.job_industry === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide job industry",
                "response_data": {}
            });
        } else if (!data.job_employment_type || typeof data.job_employment_type === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide job employment time",
                "response_data": {}
            });
        } else if (!data.job_salary_min || typeof data.job_salary_min === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide target salary",
                "response_data": {}
            });
        } else if (!data.job_notice_period || typeof data.job_notice_period === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide job notice period",
                "response_data": {}
            });
        } else {
            Employee.editPreferedJob(data, function (result) {
                callback(result);
            });
        }

    },
    // Edit Work Experience
    editWorkExperience: (data, callback) => {

        if (!data.email || typeof data.email === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide email address",
                "response_data": {}
            });
        } else if (!data.workExperience[0].title || typeof data.workExperience[0].title === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide work experience details",
                "response_data": {}
            });
        } else {
            Employee.editWorkExperience(data, function (result) {
                callback(result);
            });
        }

    },
    // Edit Salary Details
    editSalaryInfo: (data, callback) => {
        if (!data.email || typeof data.email === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide email address",
                "response_data": {}
            });
        } else if (!data.expected_salary || typeof data.expected_salary === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide expected salary",
                "response_data": {}
            });
        } else {
            Employee.editSalaryInfo(data, function (result) {
                callback(result);
            });
        }

    },
    // Edit Education Details
    editEducationInfo: (data, callback) => {

        if (!data.email || typeof data.email === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide email address",
                "response_data": {}
            });
        } else if (!data.education[0].degree || typeof data.education[0].degree === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide education details",
                "response_data": {}
            });
        } else {
            Employee.editEducationInfo(data, function (result) {
                callback(result);
            });
        }

    },
    // Edit Language Details
    editLanguageInfo: (data, callback) => {

        if (!data.email || typeof data.email === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide email address",
                "response_data": {}
            });
        } else if (!data.language[0].name || typeof data.language[0].name === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide language details",
                "response_data": {}
            });
        } else {
            Employee.editLanguageInfo(data, function (result) {
                callback(result);
            });
        }

    },
    // Edit Skill Details
    editSkillInfo: (data, callback) => {

        if (!data.email || typeof data.email === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide email address",
                "response_data": {}
            });
        } else if (!data.skills[0]._id || typeof data.skills[0]._id === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide skill details",
                "response_data": {}
            });
        } else {
            Employee.editSkillInfo(data, function (result) {
                callback(result);
            });
        }

    },

};
module.exports = apiService;