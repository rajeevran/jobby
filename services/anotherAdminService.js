
var express = require("express");
var async = require("async");
var mongo = require('mongodb');
var ObjectID = mongo.ObjectID;
var config = require('../config');
var secretKey = config.secretKey;
var anotherAdminModel=require('../models/anotherAdminModel')




var anotherAdminService=
{
    addTermAndConditionService : function(data,callback)
    {

            if (!data.title || typeof data.title === undefined) {
                callback({
                    "response_code"     :   5002,
                    "response_message"  :   "please provide title",
                    "response_data"     :   {}
                });
            } else if (!data.ar_title || typeof data.ar_title === undefined) {
                callback({
                    "response_code"     :   5002,
                    "response_message"  :   "please provide title in arabic",
                    "response_data"     :   {}
                });
            } else if (!data.description || typeof data.description === undefined) {
                callback({
                    "response_code"     :   5002,
                    "response_message"  :   "please provide description",
                    "response_data"     :   {}
                });
            } else if (!data.ar_description || typeof data.ar_description === undefined) {
                callback({
                    "response_code"     :   5002,
                    "response_message"  :   "please provide description in arabic",
                    "response_data"     :   {}
                });
            } else if (!data.content_type || typeof data.content_type === undefined) {
                callback({
                    "response_code"     :   5002,
                    "response_message"  :   "please provide content type",
                    "response_data"     :   {}
                });
            } else {

                anotherAdminModel.addTermAndCondition(data, function (result) {
                    callback(result);
                });

            }
        

    },
    listTermAndConditionService : function(data,callback)
    {
                anotherAdminModel.listTermAndCondition(data, function (result) {
                    callback(result);
                });

    },

    updateTermAndConditionSercice : function(data,callback)
    {

            if (!data._id || typeof data._id === undefined) {
                callback({
                    "response_code"   :   5002,
                    "response_message":   "please provide _id",
                    "response_data"   :   {}
                });
            } else if (!data.title || typeof data.title === undefined) {
                callback({
                    "response_code"   :   5002,
                    "response_message":   "please provide title",
                    "response_data"   :   {}
                });
            } else if (!data.description || typeof data.description === undefined) {
                callback({
                    "response_code"    :   5002,
                    "response_message" :   "please provide description",
                    "response_data"    :   {}
                });
            } else {

                anotherAdminModel.updateTermAndCondition(data, function (result) {
                    callback(result);
                });

            }
        

    },


    addFaq : function(data,callback)
    {
        // console.log("====================>data=============>",data);

            if (!data.user_type || typeof data.user_type === undefined) {
                callback({
                    "response_code"      :    5002,
                    "response_message"   :    "please provide user_type",
                    "response_data"      :    {}
                });
            } else if (!data.question || typeof data.question === undefined) {
                callback({
                    "response_code"     :   5002,
                    "response_message"  :   "please provide question",
                    "response_data"     :   {}
                });
            } else if (!data.ar_question || typeof data.ar_question === undefined) {
                callback({
                    "response_code"     :   5002,
                    "response_message"  :   "please provide question in arabic",
                    "response_data"     :   {}
                });
            } else if (!data.answer || typeof data.answer === undefined) {
                callback({
                    "response_code"      :   5002,
                    "response_message"   :   "please provide answer",
                    "response_data"      :   {}
                });
            } else if (!data.ar_answer || typeof data.ar_answer === undefined) {
                callback({
                    "response_code"      :   5002,
                    "response_message"   :   "please provide answer in arabic",
                    "response_data"      :   {}
                });
            } else {

                anotherAdminModel.addFaq(data, function (result) {
                    callback(result);
                });

            }
        

    },


    listFaq : function(data,callback)
    {
        if ((!data._id || typeof data._id === undefined) && (!data.user_type || typeof user_type === undefined)) 
        {
            callback({
                "response_code"    : 5002,
                "response_message" : "please provide user_type or _id",
                "response_data"    : {}
            });

        }else{

                    anotherAdminModel.listFaq(data, function (result) {
                        callback(result);
                    });

        }
                

    },

    updateFaq : function(data,callback)
    {

            if (!data._id || typeof data._id === undefined) {
                callback({
                    "response_code"   :   5002,
                    "response_message":   "please provide _id",
                    "response_data"   :   {}
                });
            } else {

                anotherAdminModel.updateFaq(data, function (result) {
                    callback(result);
                });

            }
        

    },
    deleteFaq : function(data,callback)
    {

            if (!data._id || typeof data._id === undefined) {
                callback({
                    "response_code"   :   5002,
                    "response_message":   "please provide _id",
                    "response_data"   :   {}
                });
            } else {

                anotherAdminModel.deleteFaq(data, function (result) {
                    callback(result);
                });

            }
        

    },


}

module.exports = anotherAdminService;












