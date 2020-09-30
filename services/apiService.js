'use strict';
var config = require('../config');
var async = require("async");
var mongo = require('mongodb');
var jwt = require('jsonwebtoken');
var fs = require('fs')
var ObjectID = mongo.ObjectID;

var mailProperty = require('../modules/sendMail');

var UserModels = require('../models/user');
var AdminModels = require('../models/admin');
var anotherAdminModel = require('../models/anotherAdminModel');
var JobCitySchema = require('../schema/job_city');
var JobCountrySchema = require('../schema/job_country');
var apiService = {

    //Job type List
    listJobType: function (data, callback) {

        AdminModels.listJobType(data, function (result) {
            callback(result);
        });
    },

    //Job tag List
    listJobTag: function (data, callback) {

        AdminModels.listJobTag(data, function (result) {
            callback(result);
        });
    },
    //Job Title List
    listJobTitle: function (data, callback) {

        AdminModels.listJobTitle(data, function (result) {
            callback(result);
        });
    },
    //Job Level List
    listJobLevel: function (data, callback) {

        AdminModels.listJobLevel(data, function (result) {
            callback(result);
        });
    },
    //Job Skill List
    listJobSkill: function (data, callback) {

        AdminModels.listJobSkill(data, function (result) {
            callback(result);
        });
    },
    //Degree List
    listDegree: function (data, callback) {

        AdminModels.listDegree(data, function (result) {
            callback(result);
        });
    },
    //Job Industry List
    listJobIndustry: function (data, callback) {

        AdminModels.listJobIndustry(data, function (result) {
            callback(result);
        });
    },
    //Job Country List
    listJobCountry: async function (data, callback) {
        var query = {};
        if (data.name) {
            query['name'] = new RegExp(data.name, 'i');
        } 
        let country = await JobCountrySchema.find(query).exec(function (err, result) {
            if (err) {
                callback({
                    "response_code": 5005,
                    "response_message": "INTERNAL DB ERROR",
                    "response_data": err
                });
            } else {
                callback({
                    "response_code": 2000,
                    "response_message": "Country List",
                    "response_data": result
                });
            }
        });
    },

    
    sendMail: (data, callback) => {
    
        if (!data.email || typeof data.email === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide email",
                "response_data": {}
            });
        } else {

            anotherAdminModel.sendMail(data, function (result) {
                callback(result);
            });

        }             

    },
    
    //Job City List
    listJobCity: async function (data, callback) {

        if (!data.countryId || typeof data.countryId === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide country",
                "response_data": {}
            });
        } else {
            var query = {countryId: data.countryId};
            if (data.name) {
                query['name'] = new RegExp(data.name, 'i');
            }  
            let cities = await JobCitySchema.find(query).exec(function (err, result) {
                if (err) {
                    callback({
                        "response_code": 5005,
                        "response_message": "INTERNAL DB ERROR",
                        "response_data": err
                    });
                } else {
                    callback({
                        "response_code": 2000,
                        "response_message": "City List",
                        "response_data": result
                    });
                }
            });
        }
    },
    listTermAndConditionService : (data, callback) => {
        anotherAdminModel.listTermAndCondition(data, function (result) {
            callback(result);
        });

    },
    listFaq: (data, callback) => {
    
        if (!data.user_type || typeof data.user_type === undefined) {
            callback({
                "response_code": 5002,
                "response_message": "please provide user_type",
                "response_data": {}
            });
        } else {

            anotherAdminModel.listFaq(data, function (result) {
                callback(result);
            });

        }             

    },
};
module.exports = apiService;