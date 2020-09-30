var express = require("express");
var bcrypt = require('bcrypt');
var async = require("async");
var mongo = require('mongodb');
var ObjectID = mongo.ObjectID;
var config = require('../config');
var jwt = require('jsonwebtoken');
var fs = require('fs');
var secretKey = config.secretKey;

var AdminModels = require('../models/admin');
var Employer = require('../models/employers');
var Employee = require('../models/employees');
var NotificationModels = require('../models/admin_notification');
// var mailProperty = require('../modules/sendMail');

createToken = (admin) => {
    var tokenData = {
        id: admin._id
    };
    var token = jwt.sign(tokenData, secretKey, {
        expiresIn: 86400
    });
    return token;
};

var adminService = {
    adminSignup: function (data, callback) {
        var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if (!data.name || typeof data.name === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide name",
                "response_data": {}
            });
        } else if (!data.email || typeof data.email === undefined) {
            callback(null, {
                "response_code": 5002,
                "response_message": "please provide email address",
                "response_data": {}
            });
        } else if (!re.test(String(data.email).toLowerCase())) {
            callback(null, {
                "response_code": 5002,
                "response_message": "please provide valid email address",
                "response_data": {}
            });
        } else if (!data.password || typeof data.password === undefined) {
            callback(null, {
                "response_code": 5002,
                "response_message": "please provide password",
                "response_data": {}
            });
        } else {

            data._id = new ObjectID;
            data.email = String(data.email).toLowerCase();

            AdminModels.register(data, function (result) {
                callback(result);
            });

        }
    },
    adminLogin: function (data, callback) {
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
        } else {
            AdminModels.login(data, function (result) {
                callback(result);
            });
        }
    },
    adminForgotPassword: (data, callback) => {
        if (!data.email || typeof data.email === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide email address",
                "response_data": {}
            });
        } else {
            AdminModels.forgotPassword(data, function (result) {
                callback(result);
            });
        }
    },
    adminChangePassword: function (data, callback) {

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
        } else {
            AdminModels.changePassword(data, function (result) {
                callback(result);
            });
        }

    },
    //Admin Notification List
    listAdminNotification: function (data, callback) {

        AdminModels.listAdminNotification(data, function (result) {
            callback(result);
        });
    },
    //Delete Admin Notification
    deleteAdminNotification: function (data, callback) {

        if (!data._id || typeof data._id === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide notification id",
                "response_data": {}
            });
        } else {
            AdminModels.deleteAdminNotification(data, function (result) {
                callback(result);
            });
        }

    },
    //Job type List
    listJobType: function (data, callback) {

        AdminModels.listJobType(data, function (result) {
            callback(result);
        });
    },
    //Add Job Type
    addJobType: function (data, callback) {

        if (!data.name || typeof data.name === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide name",
                "response_data": {}
            });
        } else if (!data.ar_name || typeof data.ar_name === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide arabic name",
                "response_data": {}
            });
        } else {
            data._id = new ObjectID;
            AdminModels.addJobType(data, function (result) {
                callback(result);
            });
        }

    },
    //Edit Job Type
    editJobType: function (data, callback) {

        if (!data._id || typeof data._id === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide job type id",
                "response_data": {}
            });
        } else if (!data.name || typeof data.name === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide name",
                "response_data": {}
            });
        } else if (!data.ar_name || typeof data.ar_name === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide arabic name",
                "response_data": {}
            });
        } else {
            AdminModels.editJobType(data, function (result) {
                callback(result);
            });
        }

    },
    //Delete Job Type
    deleteJobType: function (data, callback) {

        if (!data._id || typeof data._id === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide job type id",
                "response_data": {}
            });
        } else {
            AdminModels.deleteJobType(data, function (result) {
                callback(result);
            });
        }

    },
    //Job tag List
    listJobTag: function (data, callback) {

        AdminModels.listJobTag(data, function (result) {
            callback(result);
        });
    },
    //Add Job Tag
    addJobTag: function (data, callback) {

        if (!data.name || typeof data.name === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide name",
                "response_data": {}
            });
        } else if (!data.ar_name || typeof data.ar_name === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide arabic name",
                "response_data": {}
            });
        } else {
            data._id = new ObjectID;
            AdminModels.addJobTag(data, function (result) {
                callback(result);
            });
        }

    },
    //Edit Job Tag
    editJobTag: function (data, callback) {

        if (!data._id || typeof data._id === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide job tag id",
                "response_data": {}
            });
        } else if (!data.name || typeof data.name === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide name",
                "response_data": {}
            });
        } else if (!data.ar_name || typeof data.ar_name === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide arabic name",
                "response_data": {}
            });
        } else {
            AdminModels.editJobTag(data, function (result) {
                callback(result);
            });
        }

    },
    //Delete Job Type
    deleteJobTag: function (data, callback) {

        if (!data._id || typeof data._id === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide job tag id",
                "response_data": {}
            });
        } else {
            AdminModels.deleteJobTag(data, function (result) {
                callback(result);
            });
        }

    },
    // Employer List
    employerList: function (data, callback) {

        Employer.userList(data, function (result) {
            callback(result);
        });

    },
    // Employee List
    employeeList: function (data, callback) {

        Employee.userList(data, function (result) {
            callback(result);
        });

    },
    // block Employer
    blockEmployer: function (data, callback) {
        if (!data._id || typeof data._id === undefined) {
            callback({
                "success": false,
                "STATUSCODE": 5002,
                "message": "please provide user id",
                "response": []
            });
        } else if (!data.status || typeof data.status === undefined) {
            callback({
                "success": false,
                "STATUSCODE": 5002,
                "message": "please provide status",
                "response": []
            });
        } else {
            Employer.blockEmployer(data, function (result) {
                callback(result);
            });
        }

    },
    // block Employee
    blockEmployee: function (data, callback) {
        if (!data._id || typeof data._id === undefined) {
            callback({
                "success": false,
                "STATUSCODE": 5002,
                "message": "please provide user id",
                "response": []
            });
        } else if (!data.status || typeof data.status === undefined) {
            callback({
                "success": false,
                "STATUSCODE": 5002,
                "message": "please provide status",
                "response": []
            });
        } else {
            Employee.blockEmployee(data, function (result) {
                callback(result);
            });
        }

    },
    //Company List
    listCompany: (data, callback) => {

        Employer.listCompany(data, function (result) {
            callback(result);
        })

    },
    //Update Company Status
    updateCompanyStatus: function (data, callback) {

        if (!data.companyId || typeof data.companyId === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide company id",
                "response_data": {}
            });
        } else if (!data.status || typeof data.status === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide status",
                "response_data": {}
            });
        } else {
            Employer.updateCompanyStatus(data, function (result) {
                callback(result);
            });
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

    //Job Package List
    listJobPackage: function (data, callback) {

        AdminModels.listJobPackage(data, function (result) {
            callback(result);
        });
    },
    //Add Job Package
    addJobPackage: function (data, callback) {

        if (!data.name || typeof data.name === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide name",
                "response_data": {}
            });
        } else if (!data.ar_name || typeof data.ar_name === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide arabic name",
                "response_data": {}
            });
        } else if (!data.description || typeof data.description === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide description",
                "response_data": {}
            });
        } else if (!data.ar_description || typeof data.ar_description === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide arabic description",
                "response_data": {}
            });
        } else if (!data.price || typeof data.price === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide price",
                "response_data": {}
            });
        } else if (!data.job_post_limit || typeof data.job_post_limit === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide job post limit",
                "response_data": {}
            });
        } else if (!data.job_display_duration || typeof data.job_display_duration === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide job display days",
                "response_data": {}
            });
        } else if (!data.package_expire_date || typeof data.package_expire_date === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide package expire date",
                "response_data": {}
            });
        } else {
            data._id = new ObjectID;
            AdminModels.addJobPackage(data, function (result) {
                callback(result);
            });
        }

    },
    //Edit Job Package
    editJobPackage: function (data, callback) {

        if (!data._id || typeof data._id === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide job package id",
                "response_data": {}
            });
        } else {
            AdminModels.editJobPackage(data, function (result) {
                callback(result);
            });
        }

    },
    //Delete Job Package
    deleteJobPackage: function (data, callback) {

        if (!data._id || typeof data._id === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide job package id",
                "response_data": {}
            });
        } else {
            AdminModels.deleteJobPackage(data, function (result) {
                callback(result);
            });
        }

    },
    //Job Title List
    listJobTitle: function (data, callback) {

        AdminModels.listJobTitle(data, function (result) {
            callback(result);
        });
    },
    //Add Job Title
    addJobTitle: function (data, callback) {

        if (!data.name || typeof data.name === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide name",
                "response_data": {}
            });
        } else if (!data.ar_name || typeof data.ar_name === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide arabic name",
                "response_data": {}
            });
        } else {
            data._id = new ObjectID;
            AdminModels.addJobTitle(data, function (result) {
                callback(result);
            });
        }

    },
    //Edit Job Title
    editJobTitle: function (data, callback) {

        if (!data._id || typeof data._id === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide job title id",
                "response_data": {}
            });
        } else if (!data.name || typeof data.name === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide name",
                "response_data": {}
            });
        } else if (!data.ar_name || typeof data.ar_name === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide arabic name",
                "response_data": {}
            });
        } else {
            AdminModels.editJobTitle(data, function (result) {
                callback(result);
            });
        }

    },
    //Delete Job Title
    deleteJobTitle: function (data, callback) {

        if (!data._id || typeof data._id === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide job title id",
                "response_data": {}
            });
        } else {
            AdminModels.deleteJobTitle(data, function (result) {
                callback(result);
            });
        }

    },
    //Job Level List
    listJobLevel: function (data, callback) {

        AdminModels.listJobLevel(data, function (result) {
            callback(result);
        });
    },
    //Add Job Level
    addJobLevel: function (data, callback) {

        if (!data.name || typeof data.name === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide name",
                "response_data": {}
            });
        } else if (!data.ar_name || typeof data.ar_name === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide arabic name",
                "response_data": {}
            });
        } else {
            data._id = new ObjectID;
            AdminModels.addJobLevel(data, function (result) {
                callback(result);
            });
        }

    },
    //Edit Job Level
    editJobLevel: function (data, callback) {

        if (!data._id || typeof data._id === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide id",
                "response_data": {}
            });
        } else if (!data.name || typeof data.name === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide name",
                "response_data": {}
            });
        } else if (!data.ar_name || typeof data.ar_name === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide arabic name",
                "response_data": {}
            });
        } else {
            AdminModels.editJobLevel(data, function (result) {
                callback(result);
            });
        }

    },
    //Delete Job Level
    deleteJobLevel: function (data, callback) {

        if (!data._id || typeof data._id === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide id",
                "response_data": {}
            });
        } else {
            AdminModels.deleteJobLevel(data, function (result) {
                callback(result);
            });
        }

    },

    //Job Skill List
    listJobSkill: function (data, callback) {

        AdminModels.listJobSkill(data, function (result) {
            callback(result);
        });
    },
    //Add Job Skill
    addJobSkill: function (data, callback) {

        if (!data.name || typeof data.name === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide name",
                "response_data": {}
            });
        } else if (!data.ar_name || typeof data.ar_name === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide arabic name",
                "response_data": {}
            });
        } else {
            data._id = new ObjectID;
            AdminModels.addJobSkill(data, function (result) {
                callback(result);
            });
        }

    },
    //Edit Job Skill
    editJobSkill: function (data, callback) {

        if (!data._id || typeof data._id === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide id",
                "response_data": {}
            });
        } else if (!data.name || typeof data.name === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide name",
                "response_data": {}
            });
        } else if (!data.ar_name || typeof data.ar_name === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide arabic name",
                "response_data": {}
            });
        } else {
            AdminModels.editJobSkill(data, function (result) {
                callback(result);
            });
        }

    },
    //Delete Job Skill
    deleteJobSkill: function (data, callback) {

        if (!data._id || typeof data._id === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide id",
                "response_data": {}
            });
        } else {
            AdminModels.deleteJobSkill(data, function (result) {
                callback(result);
            });
        }

    },

    //Degree List
    listDegree: function (data, callback) {

        AdminModels.listDegree(data, function (result) {
            callback(result);
        });
    },
    //Add Degree
    addDegree: function (data, callback) {

        if (!data.name || typeof data.name === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide name",
                "response_data": {}
            });
        } else if (!data.ar_name || typeof data.ar_name === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide arabic name",
                "response_data": {}
            });
        } else {
            data._id = new ObjectID;
            AdminModels.addDegree(data, function (result) {
                callback(result);
            });
        }

    },
    //Edit Degree
    editDegree: function (data, callback) {

        if (!data._id || typeof data._id === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide id",
                "response_data": {}
            });
        } else if (!data.name || typeof data.name === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide name",
                "response_data": {}
            });
        } else if (!data.ar_name || typeof data.ar_name === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide arabic name",
                "response_data": {}
            });
        } else {
            AdminModels.editDegree(data, function (result) {
                callback(result);
            });
        }

    },
    //Delete Degree
    deleteDegree: function (data, callback) {

        if (!data._id || typeof data._id === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide id",
                "response_data": {}
            });
        } else {
            AdminModels.deleteDegree(data, function (result) {
                callback(result);
            });
        }

    },
    //Job Industry List
    listJobIndustry: function (data, callback) {

        AdminModels.listJobIndustry(data, function (result) {
            callback(result);
        });
    },
    //Add Job Industry
    addJobIndustry: function (data, callback) {

        if (!data.name || typeof data.name === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide name",
                "response_data": {}
            });
        } else if (!data.ar_name || typeof data.ar_name === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide arabic name",
                "response_data": {}
            });
        } else {
            data._id = new ObjectID;
            AdminModels.addJobIndustry(data, function (result) {
                callback(result);
            });
        }

    },
    //Edit Job Industry
    editJobIndustry: function (data, callback) {

        if (!data._id || typeof data._id === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide id",
                "response_data": {}
            });
        } else if (!data.name || typeof data.name === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide name",
                "response_data": {}
            });
        } else if (!data.ar_name || typeof data.ar_name === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide arabic name",
                "response_data": {}
            });
        } else {
            AdminModels.editJobIndustry(data, function (result) {
                callback(result);
            });
        }

    },
    //Delete Job Industry
    deleteJobIndustry: function (data, callback) {

        if (!data._id || typeof data._id === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide id",
                "response_data": {}
            });
        } else {
            AdminModels.deleteJobIndustry(data, function (result) {
                callback(result);
            });
        }

    },

    //Job Country List
    listJobCountry: function (data, callback) {

        AdminModels.listJobCountry(data, function (result) {
            callback(result);
        });
    },
    //Add Job Country
    addJobCountry: function (data, callback) {

        if (!data.name || typeof data.name === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide name",
                "response_data": {}
            });
        }  else {
            data._id = new ObjectID;
            AdminModels.addJobCountry(data, function (result) {
                callback(result);
            });
        }

    },
    //Edit Job Country
    editJobCountry: function (data, callback) {

        if (!data._id || typeof data._id === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide id",
                "response_data": {}
            });
        } else if (!data.name || typeof data.name === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide name",
                "response_data": {}
            });
        } else {
            AdminModels.editJobCountry(data, function (result) {
                callback(result);
            });
        }

    },
    //Delete Job Country
    deleteJobCountry: function (data, callback) {

        if (!data._id || typeof data._id === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide id",
                "response_data": {}
            });
        } else {
            AdminModels.deleteJobCountry(data, function (result) {
                callback(result);
            });
        }

    },
    //Job City List
    listJobCity: function (data, callback) {

        AdminModels.listJobCity(data, function (result) {
            callback(result);
        });
    },
    //Add Job City
    addJobCity: function (data, callback) {

        if (!data.name || typeof data.name === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide name",
                "response_data": {}
            });
        } else if (!data.countryId || typeof data.countryId === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide country",
                "response_data": {}
            });
        }  else {
            data._id = new ObjectID;
            AdminModels.addJobCity(data, function (result) {
                callback(result);
            });
        }

    },
    //Edit Job City
    editJobCity: function (data, callback) {

        if (!data._id || typeof data._id === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide id",
                "response_data": {}
            });
        } else if (!data.name || typeof data.name === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide name",
                "response_data": {}
            });
        } else if (!data.countryId || typeof data.countryId === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide country",
                "response_data": {}
            });
        } else {
            AdminModels.editJobCity(data, function (result) {
                callback(result);
            });
        }

    },
    //Delete Job City
    deleteJobCity: function (data, callback) {

        if (!data._id || typeof data._id === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide id",
                "response_data": {}
            });
        } else {
            AdminModels.deleteJobCity(data, function (result) {
                callback(result);
            });
        }

    },
    //Job List
    listJob: (data, callback) => {

        AdminModels.listJob(data, function (result) {
            callback(result);
        })

    },


    //list Dashboard
    listDashboard: (data, callback) => {

        AdminModels.listDashboard(data, function (result) {
            callback(result);
        })

    },
};
module.exports = adminService;