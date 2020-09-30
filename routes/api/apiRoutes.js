'use strict';
var express = require("express");
var apiService = require('../../services/apiService');
var anotherAdminService=require('../../services/anotherAdminService');

var bodyParser = require('body-parser');
var jwt = require('jsonwebtoken');
var config = require('../../config');
var secretKey = config.secretKey;

var api = express.Router();
api.use(bodyParser.json());
api.use(bodyParser.urlencoded({
    extended: false
}));

//Job Title List
api.get('/job-role-list', function (req, res) {
    apiService.listJobTitle(req.query, function (result) {
        res.send(result);
    })
});


api.post('/send-mail',function(req,res){
    apiService.sendMail(req.body,function(response){
        res.send(response);
    })
})

// ************************New api Routes By Jayanta ******************************//
// ***************************************************************************//

api.get('/list-term-condition',function(req,res){
    apiService.listTermAndConditionService(req.query,function(response){
        res.send(response);
    })
})

api.get('/list-faq',function(req,res){
    apiService.listFaq(req.query,function(response){
        res.send(response);
    })
})

//Job Country List
api.get('/job-country-list', function (req, res) {
    apiService.listJobCountry(req.query, function (result) {
        res.send(result);
    })
});
//Job City List
api.get('/job-city-list', function (req, res) {
    apiService.listJobCity(req.query, function (result) {
        res.send(result);
    })
});

//Job tag List
api.get('/job-tag-list', function (req, res) {
    apiService.listJobTag(req.query, function (result) {
        res.send(result);
    })
});


/******************************
 *  Middleware to check token
 ******************************/
api.use(function (req, res, next) {

    //console.log('req.body------>',req.body)
    //console.log('req.headers------>',req.headers)
    //console.log('req.query------>',req.query)

    var token = req.body.authtoken || req.query.authtoken || req.headers['x-access-token'];
    if (token) {
        jwt.verify(token, secretKey, function (err, decoded) {
            if (err) {
                res.send({
                    response_code: 4000,
                    response_message: "Session timeout! Please login again.",
                    response_data: err
                });
            } else {
                req.decoded = decoded;
                next();
            }
        });
    } else {
        res.send({
            "response_code": 5002,
            "response_message": "Please provide required information"
        });
    }
});
/******************************
 *  Middleware to check token
 ******************************/

//Job Type List
api.get('/job-type-list', function (req, res) {
    apiService.listJobType(req.query, function (result) {
        res.send(result);
    })
});




//Job Level List
api.get('/job-level-list', function (req, res) {
    apiService.listJobLevel(req.query, function (result) {
        res.send(result);
    })
});

//Job Skill List
api.get('/job-skill-list', function (req, res) {
    apiService.listJobSkill(req.query, function (result) {
        res.send(result);
    })
});

//Degree List
api.get('/degree-list', function (req, res) {
    apiService.listDegree(req.query, function (result) {
        res.send(result);
    })
});

//Job Industry List
api.get('/job-industry-list', function (req, res) {
    apiService.listJobIndustry(req.query, function (result) {
        res.send(result);
    })
});






module.exports = api