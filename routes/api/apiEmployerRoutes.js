'use strict';
var express = require("express");
var EmployerService = require('../../services/EmployerService');
var bodyParser = require('body-parser');
var jwt = require('jsonwebtoken');
var config = require('../../config');
var secretKey = config.secretKey;

var employerApi = express.Router();
employerApi.use(bodyParser.json());
employerApi.use(bodyParser.urlencoded({
    extended: false
}));

//Register
employerApi.post('/register', function (req, res) {
    //console.log('locale', res.__('Email address already exist'));
    EmployerService.register(req.body, function (response) {
        response.response_message = res.__(response.response_message);
        res.send(response);
    });
});

//Email Verification
employerApi.post('/emailVerification', function (req, res) {
    EmployerService.emailVerification(req.body, function (response) {
        response.response_message = res.__(response.response_message);
        res.send(response);
    });
});
//Resend email verification code
employerApi.post('/resendEmailVerifyCode', function (req, res) {
    EmployerService.resendEmailVerifyCode(req.body, function (response) {
        response.response_message = res.__(response.response_message);
        res.send(response);
    });
});
//login
employerApi.post('/login', function (req, res) {
    EmployerService.login(req.body, function (response) {
        response.response_message = res.__(response.response_message);
        res.send(response);
    });
});
// Social login
employerApi.post('/social-login', (req, res) => {

    EmployerService.socialLogin(req.body, function (response) {
        res.send(response);
    });
});

//Forgot password
employerApi.post('/forgotPassword', function (req, res) {
    EmployerService.forgotPassword(req.body, function (response) {
        res.send(response);
    });
});
//Reset password
employerApi.post('/resetPassword', function (req, res) {
    EmployerService.resetPassword(req.body, function (response) {
        res.send(response);
    });
});

// Company List
employerApi.get('/company-list', function (req, res) {

    //req.query.language = req.headers['accept-language'] ? req.headers['accept-language'] : 'en';
    EmployerService.listCompany(req.query, function (response) {
        response.response_message = res.__(response.response_message);
        res.send(response);
    });
});

// Job List
employerApi.get('/job-list', async function (req, res) {

    //req.query.language = req.headers['accept-language'] ? req.headers['accept-language'] : 'en';
     var token = req.body.authtoken || req.params.authtoken || req.headers['x-access-token'];
     var decoded = ''
 
     if(token){
            try {
               decoded = await jwt.verify(token, secretKey)
            }
            catch(err) {
              decoded = ''
            } 
     }

    let data = {
        ...req.query,
        decoded: decoded
        }
       

     //console.log('decoded------>',data)
    EmployerService.listJob(data, function (response) {
        response.response_message = res.__(response.response_message);
        res.send(response);
    });
});

/******************************
 *  Middleware to check token
 ******************************/
employerApi.use(function (req, res, next) {

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
// Employer dashboard
employerApi.get('/employer-dashboard', function (req, res) {

    EmployerService.employerDashboard(req.query, function (result) {
        res.send(result);
    });

});

//Job Applied List
employerApi.get('/job-applied', function (req, res) {
    EmployerService.listJobApplied(req.query, function (response) {
        res.send(response);
    })
});

//Job Shortlisted Employee List
employerApi.get('/job-shortlisted-employee', function (req, res) {
    EmployerService.listJobShortlistedEmployee(req.query, function (response) {
        res.send(response);
    })
});

// Change password
employerApi.post('/changePassword', function (req, res) {
    EmployerService.changePassword(req.body, function (response) {
        res.send(response);
    });
});
// Change email request
employerApi.post('/changeEmail', function (req, res) {
    EmployerService.changeEmailReq(req.body, function (response) {
        res.send(response);
    });
});

employerApi.post('/reset-email', function (req, res) {
    EmployerService.updateEmail(req.body, function (response) {
        res.send(response);
    });
});
// Employer List
employerApi.get('/employer-list', function (req, res) {
    EmployerService.userList(req.query, function (result) {
        res.send(result);
    });
})

// View Profile
employerApi.post('/viewProfile', function (req, res) {
    EmployerService.viewProfile(req.body, function (response) {
        res.send(response);
    })
});
// Edit Profile Image
employerApi.post('/editProfileImage', function (req, res) {
    EmployerService.editProfileImage(req.body, req.files, function (response) {
        res.send(response);
    })
});
// Edit Profile
employerApi.post('/editProfile', function (req, res) {
    EmployerService.editProfile(req.body, function (response) {
        res.send(response);
    });
});


// Change status
employerApi.post('/updateApplicantStatus', function (req, res) {
    EmployerService.updateApplicantStatus(req.body, function (response) {
        res.send(response);
    });
});

// Add Company
employerApi.post('/add-company', function (req, res) {
    //req.body.language = req.headers['accept-language'] ? req.headers['accept-language'] : 'en';
    EmployerService.addCompany(req.body, req.files, function (response) {
        response.response_message = res.__(response.response_message);
        res.send(response);
    });
});
// Edit Company
employerApi.post('/edit-company', function (req, res) {
    EmployerService.editCompany(req.body, req.files, function (response) {
        response.response_message = res.__(response.response_message);
        res.send(response);
    });
});
// Delete Company
employerApi.post('/delete-company', function (req, res) {
    EmployerService.deleteCompany(req.body, function (response) {
        response.response_message = res.__(response.response_message);
        res.send(response);
    });
});

//Job Package List
employerApi.get('/job-package-list', function (req, res) {
    EmployerService.listJobPackage(req.query, function (response) {
        res.send(response);
    })
});

// Order checkout
employerApi.post('/check-out', function (req, res) {
    EmployerService.checkOut(req.body, function (response) {
        res.send(response);
    });
});

// Order list
employerApi.get('/order-list', function (req, res) {
    EmployerService.orderList(req.query, function (response) {
        res.send(response);
    });
});



// block-employee
employerApi.get('/block-employee', function (req, res) {

    EmployerService.listBlockEmployee(req.query, function (result) {
        res.send(result);
    });

});

// Add Job
employerApi.post('/add-job', function (req, res) {
    req.body.language = req.headers['accept-language'] ? req.headers['accept-language'] : 'en';
    EmployerService.addJob(req.body, function (response) {
        response.response_message = res.__(response.response_message);
        res.send(response);
    });
});
// Publish Job
employerApi.post('/publish-job', function (req, res) {
    EmployerService.publishJob(req.body, function (result) {
        res.send(result);
    });
});
// Edit Job
employerApi.post('/edit-job', function (req, res) {
    EmployerService.editJob(req.body, function (response) {
        res.send(response);
    });
});
// Delete Job
employerApi.post('/delete-job', function (req, res) {
    EmployerService.deleteJob(req.body, function (response) {
        res.send(response);
    });
});


// Status Change Job
employerApi.post('/update-job-status', function (req, res) {
    EmployerService.updateJobStatus(req.body, function (response) {
        res.send(response);
    });
});

// Change Interested Not Interested Status
employerApi.post('/updateEmployeeInterestedNotInterestedStatus', function (req, res) {
    EmployerService.updateInterestedNotInterestedStatus(req.body, function (response) {
        res.send(response);
    });
});


// interested not interested employee
employerApi.get('/interested-not-interested-employee', function (req, res) {

    EmployerService.listInterestedNotInterestedEmployee(req.query, function (result) {
        res.send(result);
    });

});

// add Interested Not Interested 
employerApi.post('/employersInterestedNotInterested', function (req, res) {
    EmployerService.employersInterestedNotInterested(req.body, function (response) {
        res.send(response);
    });
});


// delete Employer
employerApi.post('/deleteEmployer', function (req, res) {
    EmployerService.deleteEmployer(req.body, function (response) {
        res.send(response);
    });
});

module.exports = employerApi;