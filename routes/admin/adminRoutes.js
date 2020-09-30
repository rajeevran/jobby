'use strict';
var express = require("express");
var adminService = require('../../services/adminService');
var anotherAdminService=require('../../services/anotherAdminService');

var bodyParser = require('body-parser');
var jwt = require('jsonwebtoken');
var config = require('../../config');
var secretKey = config.secretKey;

var admin = express.Router();
admin.use(bodyParser.json());
admin.use(bodyParser.urlencoded({
    extended: false
}));

admin.post('/adminSignup', function (req, res) {
    var adminData = req.body;
    adminService.adminSignup(adminData, function (response) {
        res.send(response);
    });
});
admin.post('/adminLogin', function (req, res) {
    var adminData = req.body;
    adminService.adminLogin(adminData, function (response) {
        response.message = res.__(response.message)
        res.send(response);
    });
});
admin.post('/adminForgotPassword', function (req, res) {
    var adminData = req.body;
    adminService.adminForgotPassword(adminData, function (response) {
        res.send(response);
    });
});

/******************************
 *  Middleware to check token
 ******************************/
admin.use(function (req, res, next) {
    var token = req.body.token || req.query.token || req.headers['x-access-token'];
    if (token) {
        jwt.verify(token, secretKey, function (err, decoded) {
            if (err) {
                res.send({
                    STATUSCODE: 4002,
                    success: false,
                    error: true,
                    message: "Failed to authenticate or token expired."
                });
            } else {
                req.decoded = decoded;
                next();
            }
        });
    } else {
        res.send({
            success: false,
            error: true,
            message: "Please provide token"
        });
    }
});
/******************************
 *  Middleware to check token
 ******************************/

admin.post('/adminChangePassword', function (req, res) {
    adminService.adminChangePassword(req.body, function (response) {
        res.send(response);
    });
});
//Admin Notification List
admin.get('/admin-notification-list', function (req, res) {
    adminService.listAdminNotification(req.query, function (result) {
        res.send(result);
    })
});

//Delete Admin Notification
admin.post('/delete-admin-notification', function (req, res) {
    adminService.deleteAdminNotification(req.body, function (response) {
        res.send(response);
    });
});

//Job Type List
admin.get('/job-type-list', function (req, res) {
    adminService.listJobType(req.query, function (result) {
        res.send(result);
    })
});
//Add Job Type
admin.post('/add-job-type', function (req, res) {
    adminService.addJobType(req.body, function (response) {
        res.send(response);
    });
});
//Edit Job Type
admin.post('/edit-job-type', function (req, res) {
    adminService.editJobType(req.body, function (response) {
        res.send(response);
    });
});
//Delete Job Type
admin.post('/delete-job-type', function (req, res) {
    adminService.deleteJobType(req.body, function (response) {
        res.send(response);
    });
});

//Job tag List
admin.get('/job-tag-list', function (req, res) {
    adminService.listJobTag(req.query, function (result) {
        res.send(result);
    })
});
//Add Job Tag
admin.post('/add-job-tag', function (req, res) {
    adminService.addJobTag(req.body, function (response) {
        res.send(response);
    });
});
//Edit Job Tag
admin.post('/edit-job-tag', function (req, res) {
    adminService.editJobTag(req.body, function (response) {
        res.send(response);
    });
});
//Delete Job Type
admin.post('/delete-job-tag', function (req, res) {
    adminService.deleteJobTag(req.body, function (response) {
        res.send(response);
    });
});

// Employer List
admin.get('/employer-list', function (req, res) {
    adminService.employerList(req.query, function (result) {
        res.send(result);
    });
})


// Employee List
admin.get('/employee-list', function (req, res) {
    adminService.employeeList(req.query, function (result) {
        res.send(result);
    });
})

//Block Employer
admin.post('/block-employer', function (req, res) {
    adminService.blockEmployer(req.body, function (response) {
        res.send(response);
    });
});

//Block Employee
admin.post('/block-employee', function (req, res) {
    adminService.blockEmployee(req.body, function (response) {
        res.send(response);
    });
});

// Company List
admin.get('/company-list', function (req, res) {
    adminService.listCompany(req.query, function (result) {
        res.send(result);
    });
});

//Update Company Status
admin.post('/update-company-status', function (req, res) {
    adminService.updateCompanyStatus(req.body, function (response) {
        res.send(response);
    });
});

// Delete Company
admin.post('/delete-company', function (req, res) {
    adminService.deleteCompany(req.body, function (result) {
        res.send(result);
    });
});

//Job Package List
admin.get('/job-package-list', function (req, res) {
    adminService.listJobPackage(req.query, function (result) {
        res.send(result);
    })
});
//Add Job Package
admin.post('/add-job-package', function (req, res) {
    adminService.addJobPackage(req.body, function (response) {
        res.send(response);
    });
});
//Edit Job Package
admin.post('/edit-job-package', function (req, res) {
    adminService.editJobPackage(req.body, function (response) {
        res.send(response);
    });
});
//Delete Job Package
admin.post('/delete-job-package', function (req, res) {
    adminService.deleteJobPackage(req.body, function (response) {
        res.send(response);
    });
});

//Job Title List
admin.get('/job-title-list', function (req, res) {
    adminService.listJobTitle(req.query, function (result) {
        res.send(result);
    })
});
//Add Job Title
admin.post('/add-job-title', function (req, res) {
    adminService.addJobTitle(req.body, function (response) {
        res.send(response);
    });
});
//Edit Job Title
admin.post('/edit-job-title', function (req, res) {
    adminService.editJobTitle(req.body, function (response) {
        res.send(response);
    });
});
//Delete Job Title
admin.post('/delete-job-title', function (req, res) {
    adminService.deleteJobTitle(req.body, function (response) {
        res.send(response);
    });
});

//Job Level List
admin.get('/job-level-list', function (req, res) {
    adminService.listJobLevel(req.query, function (result) {
        res.send(result);
    })
});
//Add Job Level
admin.post('/add-job-level', function (req, res) {
    adminService.addJobLevel(req.body, function (response) {
        res.send(response);
    });
});
//Edit Job Level
admin.post('/edit-job-level', function (req, res) {
    adminService.editJobLevel(req.body, function (response) {
        res.send(response);
    });
});
//Delete Job Level
admin.post('/delete-job-level', function (req, res) {
    adminService.deleteJobLevel(req.body, function (response) {
        res.send(response);
    });
});

//Job Skill List
admin.get('/job-skill-list', function (req, res) {
    adminService.listJobSkill(req.query, function (result) {
        res.send(result);
    })
});
//Add Job Skill
admin.post('/add-job-skill', function (req, res) {
    adminService.addJobSkill(req.body, function (response) {
        res.send(response);
    });
});
//Edit Job Skill
admin.post('/edit-job-skill', function (req, res) {
    adminService.editJobSkill(req.body, function (response) {
        res.send(response);
    });
});
//Delete Job Skill
admin.post('/delete-job-skill', function (req, res) {
    adminService.deleteJobSkill(req.body, function (response) {
        res.send(response);
    });
});
//Degree List
admin.get('/degree-list', function (req, res) {
    adminService.listDegree(req.query, function (result) {
        res.send(result);
    })
});
//Add Degree
admin.post('/add-degree', function (req, res) {
    adminService.addDegree(req.body, function (response) {
        res.send(response);
    });
});
//Edit Degree
admin.post('/edit-degree', function (req, res) {
    adminService.editDegree(req.body, function (response) {
        res.send(response);
    });
});
//Delete Degree
admin.post('/delete-degree', function (req, res) {
    adminService.deleteDegree(req.body, function (response) {
        res.send(response);
    });
});

//Job Industry List
admin.get('/job-industry-list', function (req, res) {
    adminService.listJobIndustry(req.query, function (result) {
        res.send(result);
    })
});
//Add Job Industry
admin.post('/add-job-industry', function (req, res) {
    adminService.addJobIndustry(req.body, function (response) {
        res.send(response);
    });
});
//Edit Job Industry
admin.post('/edit-job-industry', function (req, res) {
    adminService.editJobIndustry(req.body, function (response) {
        res.send(response);
    });
});
//Delete Job Industry
admin.post('/delete-job-industry', function (req, res) {
    adminService.deleteJobIndustry(req.body, function (response) {
        res.send(response);
    });
});

//Job Country List
admin.get('/job-country-list', function (req, res) {
    adminService.listJobCountry(req.query, function (result) {
        res.send(result);
    })
});
//Add Job Country
admin.post('/add-job-country', function (req, res) {
    adminService.addJobCountry(req.body, function (response) {
        res.send(response);
    });
});
//Edit Job Country
admin.post('/edit-job-country', function (req, res) {
    adminService.editJobCountry(req.body, function (response) {
        res.send(response);
    });
});
//Delete Job Country
admin.post('/delete-job-country', function (req, res) {
    adminService.deleteJobCountry(req.body, function (response) {
        res.send(response);
    });
});
//Job City List
admin.get('/job-city-list', function (req, res) {
    adminService.listJobCity(req.query, function (result) {
        res.send(result);
    })
});
//Add Job City
admin.post('/add-job-city', function (req, res) {
    adminService.addJobCity(req.body, function (response) {
        res.send(response);
    });
});
//Edit Job City
admin.post('/edit-job-city', function (req, res) {
    adminService.editJobCity(req.body, function (response) {
        res.send(response);
    });
});
//Delete Job City
admin.post('/delete-job-city', function (req, res) {
    adminService.deleteJobCity(req.body, function (response) {
        res.send(response);
    });
});
//Job List
admin.get('/job-list', function (req, res) {

    adminService.listJob(req.query, function (response) {
        response.response_message = res.__(response.response_message);
        res.send(response);
    });
});



// ************************New Routes By Jayanta ******************************//
// ***************************************************************************//

admin.post('/add-term-condition',function(req,res){
    anotherAdminService.addTermAndConditionService(req.body,function(response){
        res.send(response);
    })
})

admin.get('/list-term-condition',function(req,res){
    anotherAdminService.listTermAndConditionService(req.query,function(response){
        res.send(response);
    })
})

admin.post('/update-term-condition',function(req,res){
    anotherAdminService.updateTermAndConditionSercice(req.body,function(response){
        res.send(response);
    })
})

// ***********************FAQ Routes*****************************************//


admin.post('/add-faq',function(req,res){
    anotherAdminService.addFaq(req.body,function(response){
        res.send(response);
    })
})

admin.get('/list-faq',function(req,res){
    anotherAdminService.listFaq(req.query,function(response){
        res.send(response);
    })
})

admin.post('/update-faq',function(req,res){
    anotherAdminService.updateFaq(req.body,function(response){
        res.send(response);
    })
})

admin.post('/delete-faq',function(req,res){
    anotherAdminService.deleteFaq(req.body,function(response){
        res.send(response);
    })
})
//Job Country List
admin.get('/dashboard-list', function (req, res) {
    adminService.listDashboard(req.query, function (result) {
        res.send(result);
    })
});

// **************************************************************************//



module.exports = admin;