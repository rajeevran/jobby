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
        } else if (data.job_industry.length == 0 || typeof data.job_industry === undefined) {
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
        } else if (!data.job_salary || typeof data.job_salary === undefined) {
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
        } else if (!data.workExperience.title || typeof data.workExperience.title === undefined) {
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
    // Delete Work Experience
    deleteWorkExperience: (data, callback) => {

        if (!data.email || typeof data.email === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide email address",
                "response_data": {}
            });
        } else if (!data.workExperience._id || typeof data.workExperience._id === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide work experience details",
                "response_data": {}
            });
        } else {
            Employee.deleteWorkExperience(data, function (result) {
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
        } else if (!data.education.degree || typeof data.education.degree === undefined) {
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
    // Delete Education Details
    deleteEducationInfo: (data, callback) => {

        if (!data.email || typeof data.email === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide email address",
                "response_data": {}
            });
        } else if (!data.education._id || typeof data.education._id === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide education details",
                "response_data": {}
            });
        } else {
            Employee.deleteEducationInfo(data, function (result) {
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
        } else if (!data.language.name || typeof data.language.name === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide language details",
                "response_data": {}
            });
        } else if (!data.language.level || typeof data.language.level === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide language level",
                "response_data": {}
            });
        } else {
            Employee.editLanguageInfo(data, function (result) {
                callback(result);
            });
        }

    },
    // Delete Language Details
    deleteLanguageInfo: (data, callback) => {

        if (!data.email || typeof data.email === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide email address",
                "response_data": {}
            });
        } else if (!data.language._id || typeof data.language._id === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide language details",
                "response_data": {}
            });
        } else {
            Employee.deleteLanguageInfo(data, function (result) {
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
        } else if (!data.skills.skill_id || typeof data.skills.skill_id === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide skill details",
                "response_data": {}
            });
        } else if (!data.skills.level || typeof data.skills.level === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide skill level",
                "response_data": {}
            });
        } else {
            Employee.editSkillInfo(data, function (result) {
                callback(result);
            });
        }

    },
    // Delete Skill
    deleteSkillInfo: (data, callback) => {

        if (!data.email || typeof data.email === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide email address",
                "response_data": {}
            });
        } else if (!data.skills._id || typeof data.skills._id === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide skill details",
                "response_data": {}
            });
        } else {
            Employee.deleteSkillInfo(data, function (result) {
                callback(result);
            });
        }

    },
    addVideoCv: (data, callback) => {

        const regex = /^(http(s)?:\/\/)?((w){3}.)?youtu(be|.be)?(\.com)?\/.+/gm ;
        if (!data.email || typeof data.email === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide email address",
                "response_data": {}
            });
        } else if (!data.video_cv.link || typeof data.video_cv.link === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide link",
                "response_data": {}
            });
        } else if (!regex.test(String(data.video_cv.link).toLowerCase())) {
            callback({
                "response_code": 5002,
                "response_message": "please provide valid youtube link",
                "response_data": {}
            });
        } else if (!data.video_cv.description || typeof data.video_cv.description === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide description",
                "response_data": {}
            });
        } else {
            

            Employee.addVideoCv(data, function (result) {
                callback(result);
            });

          
        }
    },

    deleteVideoCv: (data, callback) => {

        if (!data.email || typeof data.email === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide email address",
                "response_data": {}
            });
        } else {

            // data._id = new ObjectID;
            Employee.deleteVideoCv(data, function (result) {
                callback(result);
            });
        }
    },

    
    editReferences: (data, callback) => {

        if (!data.email || typeof data.email === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide email address",
                "response_data": {}
            });
        } else if (!data.references.name || typeof data.references.name === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide name",
                "response_data": {}
            });
        } else if (!data.references.job_title || typeof data.references.job_title === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide job_title",
                "response_data": {}
            });
        } else if (!data.references.email || typeof data.references.email === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide email",
                "response_data": {}
            });
        } else if (!data.references.country_code || typeof data.references.country_code === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide country_code",
                "response_data": {}
            });
        } else if (!data.references.phone_no || typeof data.references.phone_no === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide phone_no",
                "response_data": {}
            });
        } else {

            Employee.editReferences(data, function (result) {
                callback(result);
            });
        }
    },

     
    deleteReferences: (data, callback) => {

        if (!data.email || typeof data.email === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide email address",
                "response_data": {}
            });
        } else if (!data.references._id || typeof data.references._id === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide refId",
                "response_data": {}
            });
        } else {

            // data._id = new ObjectID;
            Employee.deleteReferences(data, function (result) {
                callback(result);
            });
        }
    },
    // Save Job List
    listSaveJob: (data, callback) => {

        if (!data.employeeId || typeof data.employeeId === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide employee Id",
                "response_data": {}
            });
        } else {
            Employee.listSaveJob(data, function (result) {
                callback(result);
            });
        }
    },
    // Add Save Job
    saveJob: (data, callback) => {

        if (!data.employeeId || typeof data.employeeId === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide employee Id",
                "response_data": {}
            });
        } else if (!data.jobId || typeof data.jobId === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide job Id",
                "response_data": {}
            });
        } else {

            data._id = new ObjectID;
            Employee.saveJob(data, function (result) {
                callback(result);
            });
        }
    },
    // Remove Save Job
    removeSaveJob: (data, callback) => {

        if (!data.employeeId || typeof data.employeeId === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide employee Id",
                "response_data": {}
            });
        } else if (!data.jobId || typeof data.jobId === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide job Id",
                "response_data": {}
            });
        } else {
            Employee.removeSaveJob(data, function (result) {
                callback(result);
            });
        }

    },


    // Employee Dashboard
    employeeDashboard: (data, callback) => {

        if (!data.employeeId || typeof data.employeeId === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide employee Id",
                "response_data": {}
            });
        } else {

            Employee.employeeDashboard(data, function (result) {
                callback(result);
            });
        }
    },
    
    // Resume List
    listResume: (data, fileData, callback) => {

        if (!data.employeeId || typeof data.employeeId === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide employee Id",
                "response_data": {}
            });
        } else {
            Employee.listResume(data, fileData, function (result) {
                callback(result);
            });
        }    

    },
    // Add Resume
    addResume: (data, fileData, callback) => {

console.log('addResume---------',data)
        if (!data.employeeId || typeof data.employeeId === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide employee Id",
                "response_data": {}
            });
        } else if (!data.title || typeof data.title === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide resume title",
                "response_data": {}
            });
        } else if (!data.work_summary || typeof data.work_summary === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide work summary",
                "response_data": {}
            });
        } else if (!data.employement_type || typeof data.employement_type === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide employement type",
                "response_data": {}
            });
        } else if (!data.employement_type || typeof data.employement_type === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide employement type",
                "response_data": {}
            });
        } else if (!data.job_tag || typeof data.job_tag === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide job_tag",
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

         else if (!fileData || typeof fileData === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide resume file information",
                "response_data": {}
            });
        } else {

            data._id = new ObjectID;
            Employee.addResume(data, fileData, function (result) {
                callback(result);
            });
        }
    },
    // Publish Resume
    publishResume: (data, callback) => {

        if (!data.resumeId || typeof data.resumeId === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide resume Id",
                "response_data": {}
            });
        } else {

            Employee.publishResume(data, function (result) {
                callback(result);
            });
        }
    },
    // Edit Resume
    editResume: (data, fileData, callback) => {

        if (!data.resumeId || typeof data.resumeId === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide resume Id",
                "response_data": {}
            });
        } else {

            data._id = new ObjectID;
            Employee.editResume(data, fileData, function (result) {
                callback(result);
            });
        }
    },
    // Delete Resume
    deleteResume: (data, callback) => {

        if (!data.resumeId || typeof data.resumeId === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide resume Id",
                "response_data": {}
            });
        } else {

            Employee.deleteResume(data, function (result) {
                callback(result);
            });
        }
    },
    // Apply Job List
    applyJobList: (data, callback) => {


            Employee.applyJobList(data, function (result) {
                callback(result);
            });
       
    },
    // Apply Job
    applyJob: (data, callback) => {

        if (!data.employeeId || typeof data.employeeId === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide employee Id",
                "response_data": {}
            });
        } else if (!data.resumeId || typeof data.resumeId === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide resume resumeId",
                "response_data": {}
            });
        } else if (!data.jobId || typeof data.jobId === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide jobId",
                "response_data": {}
            });
        } else {

            data._id = new ObjectID;
            Employee.applyJob(data, function (result) {
                callback(result);
            });
        }
    },
    // Revoke Apply Job
    revokeApplyJob: (data, callback) => {

        if (!data.jobApplicationId || typeof data.jobApplicationId === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide job application Id",
                "response_data": {}
            });
        } else {

            Employee.revokeApplyJob(data, function (result) {
                callback(result);
            });
        }
    },


    // list Shortlisted Employee
    listShortlistedEmployee: (data, callback) => {

        if (!data.employeeId || typeof data.employeeId === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide employee Id",
                "response_data": {}
            });
        } else {

            Employee.listShortlistedEmployee(data, function (result) {
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
        
                    Employee.updateInterestedNotInterestedStatus(data, function (result) {
                        callback(result);
                    });
                }
    },     
    // api's by jayanta
    
    // list Interested Not Interested Employer
    listInterestedNotInterestedEmployer: (data, callback) => {

        if (!data.employeeId || typeof data.employeeId === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide employee Id",
                "response_data": {}
            });
        } else {

            Employee.listInterestedNotInterestedEmployer(data, function (result) {
                callback(result);
            });
        }
    },
    
    //employeesInterestedNotInterested
    employeesInterestedNotInterested: (data, callback) => {
        //
                if (!data.employerStatus || typeof data.employerStatus === undefined) {
                    callback({
                        "response_code": 5002,
                        "response_message": "please provide employer Status ",
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
        
                    Employee.employeesInterestedNotInterested(data, function (result) {
                        callback(result);
                    });
                }
    }, 
   
    // delete Employee
    deleteEmployee: (data, callback) => {

        if (!data.employeeId || typeof data.employeeId === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide employee Id",
                "response_data": {}
            });
        } else {

            Employee.deleteEmployee(data, function (result) {
                callback(result);
            });
        }
    },
    
   


};
module.exports = apiService;