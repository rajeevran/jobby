'use strict';
var express = require("express");
var EmployeeService = require('../../services/EmployeeService');
var bodyParser = require('body-parser');
var jwt = require('jsonwebtoken');
var config = require('../../config');
var secretKey = config.secretKey;

var employeeApi = express.Router();
employeeApi.use(bodyParser.json());
employeeApi.use(bodyParser.urlencoded({
    extended: false
}));

//Register
employeeApi.post('/register', function (req, res) {
    //console.log('locale', res.__('Email address already exist'));
    EmployeeService.register(req.body, function (response) {
        response.response_message = res.__(response.response_message);
        res.send(response);
    });
});

//Email Verification
employeeApi.post('/emailVerification', function (req, res) {
    EmployeeService.emailVerification(req.body, function (response) {
        response.response_message = res.__(response.response_message);
        res.send(response);
    });
});
//Resend email verification code
employeeApi.post('/resendEmailVerifyCode', function (req, res) {
    EmployeeService.resendEmailVerifyCode(req.body, function (response) {
        response.response_message = res.__(response.response_message);
        res.send(response);
    });
});
//login
employeeApi.post('/login', function (req, res) {
    EmployeeService.login(req.body, function (response) {
        response.response_message = res.__(response.response_message);
        res.send(response);
    });
});

// Social login
employeeApi.post('/social-login', (req, res) => {

    EmployeeService.socialLogin(req.body, function (response) {
        res.send(response);
    });
});

//Forgot password
employeeApi.post('/forgotPassword', function (req, res) {
    EmployeeService.forgotPassword(req.body, function (response) {
        res.send(response);
    });
});
//Reset password
employeeApi.post('/resetPassword', function (req, res) {
    EmployeeService.resetPassword(req.body, function (response) {
        res.send(response);
    });
});
/******************************
 *  Middleware to check token
 ******************************/
employeeApi.use(function (req, res, next) {

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


// Employee Dashboard
employeeApi.get('/employee-dashboard', function (req, res) {

    EmployeeService.employeeDashboard(req.query, function (result) {
        res.send(result);
    });

});


// Change password
employeeApi.post('/changePassword', function (req, res) {
    EmployeeService.changePassword(req.body, function (result) {
        res.send(result);
    });
});
// Change email request
employeeApi.post('/changeEmail', function (req, res) {
    EmployeeService.changeEmailReq(req.body, function (result) {
        res.send(result);
    });
});
employeeApi.post('/reset-email', function (req, res) {
    EmployeeService.updateEmail(req.body, function (response) {
        res.send(response);
    });
});
// Employee List
employeeApi.get('/employee-list', function (req, res) {
    EmployeeService.userList(req.query, function (result) {
        res.send(result);
    });
});

// View Profile
employeeApi.post('/viewProfile', function (req, res) {
    EmployeeService.viewProfile(req.body, function (result) {
        res.send(result);
    })
});
// Edit Profile Image
employeeApi.post('/editProfileImage', function (req, res) {

    EmployeeService.editProfileImage(req.body, req.files, function (result) {
        res.send(result);
    })
});
// // Edit Profile
// employeeApi.post('/editProfile', function (req, res) {
//     EmployeeService.editProfile(req.body, function (result) {
//         res.send(result);
//     });
// });
// Edit Personal Information
employeeApi.post('/edit-personal-information', function (req, res) {
    EmployeeService.editPersonalInfo(req.body, function (result) {
        res.send(result);
    });
});
// Edit Contact Information
employeeApi.post('/edit-contact-information', function (req, res) {
    EmployeeService.editContactInfo(req.body, function (result) {
        res.send(result);
    });
});
// Edit Prefered Job
employeeApi.post('/edit-prefered-job', function (req, res) {
    EmployeeService.editPreferedJob(req.body, function (result) {
        res.send(result);
    });
});
// Edit Work Experience
employeeApi.post('/edit-work-experience', function (req, res) {
    EmployeeService.editWorkExperience(req.body, function (result) {
        res.send(result);
    });
});
// Delete Work Experience
employeeApi.post('/delete-work-experience', function (req, res) {
    EmployeeService.deleteWorkExperience(req.body, function (result) {
        res.send(result);
    });
});
// Edit Salary Details
employeeApi.post('/edit-salary-information', function (req, res) {
    EmployeeService.editSalaryInfo(req.body, function (result) {
        res.send(result);
    });
});
// Edit Education Details
employeeApi.post('/edit-education-information', function (req, res) {
    EmployeeService.editEducationInfo(req.body, function (result) {
        res.send(result);
    });
});
// Delete Education Details
employeeApi.post('/delete-education-information', function (req, res) {
    EmployeeService.deleteEducationInfo(req.body, function (result) {
        res.send(result);
    });
});
// Edit Language Details
employeeApi.post('/edit-language-information', function (req, res) {
    EmployeeService.editLanguageInfo(req.body, function (result) {
        res.send(result);
    });
});
// Delete Language Details
employeeApi.post('/delete-language-information', function (req, res) {
    EmployeeService.deleteLanguageInfo(req.body, function (result) {
        res.send(result);
    });
});
// Edit Skill Details
employeeApi.post('/edit-skill-information', function (req, res) {
    EmployeeService.editSkillInfo(req.body, function (result) {
        res.send(result);
    });
});
// Delete Skill
employeeApi.post('/delete-skill-information', function (req, res) {
    EmployeeService.deleteSkillInfo(req.body, function (result) {
        res.send(result);
    });
});
//Save Job List
employeeApi.get('/list-save-job', function (req, res) {
    let data = {
    ...req.query,
    decoded: req.decoded
    }
    EmployeeService.listSaveJob(data, function (result) {
        res.send(result);
    });
});
// Add Save Job
employeeApi.post('/save-job', function (req, res) {
    EmployeeService.saveJob(req.body, function (result) {
        res.send(result);
    });
});
// Remove Save Job
employeeApi.post('/remove-save-job', function (req, res) {
    EmployeeService.removeSaveJob(req.body, function (result) {
        res.send(result);
    });
});

//Resume List
employeeApi.get('/list-resume', function (req, res) {
    EmployeeService.listResume(req.query, function (result) {
        res.send(result);
    });
});
// Add Resume
employeeApi.post('/add-resume', function (req, res) {
    EmployeeService.addResume(req.body, req.files, function (result) {
        res.send(result);
    });
});
// Publish Resume
employeeApi.post('/publish-resume', function (req, res) {
    EmployeeService.publishResume(req.body, function (result) {
        res.send(result);
    });
});
// Edit Resume
employeeApi.post('/edit-resume', function (req, res) {
    EmployeeService.editResume(req.body, req.files, function (result) {
        res.send(result);
    });
});
// Delete Resume
employeeApi.post('/delete-resume', function (req, res) {
    EmployeeService.deleteResume(req.body, function (result) {
        res.send(result);
    });
});
// Apply Job List
employeeApi.get('/apply-job-list', function (req, res) {

    let data = {
        ...req.query,
        decoded: req.decoded
      }
    EmployeeService.applyJobList(data, function (result) {
        res.send(result);
    });
    
});
// Apply Job
employeeApi.post('/apply-job', function (req, res) {
    req.body.language = req.headers['accept-language'] ? req.headers['accept-language'] : 'en';
    EmployeeService.applyJob(req.body, function (response) {
        response.response_message = res.__(response.response_message);
        res.send(response);
    });
});
// Revoke Apply Job
employeeApi.post('/revoke-apply-job', function (req, res) {
    EmployeeService.revokeApplyJob(req.body, function (result) {
        res.send(result);
    });
});

// interested not interested employer
employeeApi.get('/interested-not-interested-employer', function (req, res) {

    EmployeeService.listInterestedNotInterestedEmployer(req.query, function (result) {
        res.send(result);
    });

});

//========================= api's by jayanta===============================//

// add / edit video cv
employeeApi.post('/add-video-cv', function (req, res) {
    EmployeeService.addVideoCv(req.body, function (result) {
        res.send(result);
    });
});

//delete video cv
employeeApi.post('/delete-video-cv', function (req, res) {
    EmployeeService.deleteVideoCv(req.body, function (result) {
        res.send(result);
    });
});

// add / edit referencess

employeeApi.post('/edit-references', function (req, res) {
    EmployeeService.editReferences(req.body, function (result) {
        res.send(result);
    });
});

// delete referencess

employeeApi.post('/delete-references', function (req, res) {
    EmployeeService.deleteReferences(req.body, function (result) {
        res.send(result);
    });
});


// shortlisted-list-employee
employeeApi.get('/shortlisted-list-employee', function (req, res) {

    EmployeeService.listShortlistedEmployee(req.query, function (result) {
        res.send(result);
    });

});


// Change Interested Not Interested Status
employeeApi.post('/updateEmployerInterestedNotInterestedStatus', function (req, res) {
    EmployeeService.updateInterestedNotInterestedStatus(req.body, function (response) {
        res.send(response);
    });
});


// add Interested Not Interested 
employeeApi.post('/employeesInterestedNotInterested', function (req, res) {
    EmployeeService.employeesInterestedNotInterested(req.body, function (response) {
        res.send(response);
    });
});

//delete Employee
employeeApi.post('/deleteEmployee', function (req, res) {
    EmployeeService.deleteEmployee(req.body, function (response) {
        res.send(response);
    });
});

module.exports = employeeApi;