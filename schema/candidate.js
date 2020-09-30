var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var mongoosePaginate = require('mongoose-paginate');
var mongooseAggregatePaginate = require('mongoose-aggregate-paginate');
var Schema = mongoose.Schema;
var candidatechema = new Schema({
    _id: {
        type: String,
        required: true
    },
    current_job_title: {
        type: String,
        default: ''
    },
    /* Personal Information */
    fname: {
        type: String,
        default: ''
    },
    lname: {
        type: String,
        default: ''
    },
    profile_image: {
        type: String,
        default: null
    },

    country: {
        type: String,
        default: ''
    },
    city: {
        type: String,
        default: ''
    },
    dob: {
        type: Date,
        default: null
    },
    nationality: {
        type: String,
        default: ''
    },
    resident_country: {
        type: String,
        default: ''
    },
    material_status: {
        type: String,
        default: ''
    },
    employeeType: {
        type: String,
        enum: ["Fresher", "Experience", ''],
        default: ''
    },
    ar_fname: {
        type: String,
        default: ''
    },
    ar_lname: {
        type: String,
        default: ''
    },
    gender: {
        type: String,
        enum: ["Male", "Female"],
        default: 'Male'
    },
    additional_nationality: [{
        type: String,
        default: ''
    }],
    profile_image_updated: {
        type: Boolean,
        enum: [true, false],
        default: false
    },
    current_company: {
        type: String,
        default: ''
    },
    visa_status: {
        type: String,
        default: ''
    },
    driving_licence: {
        type: String,
        enum: ['yes', 'no'],
        default: 'no'
    },
    profile_complete_percentage: {
        type: Number,
        default: 0 // 1.25 for 10(upto employeeType ) each field
    },
    /* Contact Information */
    email: {
        type: String,
        default: ''
    },
    country_code: {
        type: String,
        default: ''
    },
    phone_no: {
        type: String,
        default: ''
    },
    contact_complete_percentage: {
        type: Number,
        default: 0 // 6.25 for 2 each field
    },
    /* Preffer Job */
    preferJob: {

        job_title: {
            type: String,
            default: ''
        },
        job_role: {
            type: String,
            default: ''
        },
        job_level: {
            type: String,
            default: ''
        },
        job_country: {
            type: String,
            default: ''
        },
        job_city: {
            type: String,
            default: ''
        },
        job_summary: {
            type: String,
            default: ''
        },
        job_industry: [{
            type: String,
            default: ''
        }],
        job_employment_type: {
            type: String,
            default: ''
        },
        job_salary: {
            type: Number,
            default: 0
        },
        job_notice_period: {
            type: String,
            default: ''
        },
        currency: {
            type: String,
            default: ''
        },
    },
    preferJob_complete_percentage: {
        type: Number,
        default: 0 // 1.25 for 10 each field
    },
    /* Work Experience  */
    workExperience: [{

        title: {
            type: String,
            default: ''
        },
        company_name: {
            type: String,
            default: ''
        },
        industry: {
            type: String,
            default: ''
        },
        country: {
            type: String,
            default: ''
        },
        city: {
            type: String,
            default: ''
        },
        present_company: {
            type: String,
            enum: ['yes', 'no'],
            default: 'no'
        },
        start: {
            type: Date,
            default: ''
        },
        end: {
            type: Date,
            default: ''
        },
        description: {
            type: String,
            default: ''
        },
    }],
    workExperience_complete_percentage: {
        type: Number,
        default: 0 // 12.5 for a single record
    },
    /* Salary Range  */
    salary: {
        current_salary: {
            type: Number,
            default: 0
        },
        current_salary_currency: {
            type: String,
            default: ''
        },
        expected_salary: {
            type: Number,
            default: 0
        },
        expected_salary_currency: {
            type: String,
            default: ''
        },
    },
    salary_complete_percentage: {
        type: Number,
        default: 0 // 12.5 for(expected_salary) a single record
    },
    /* Education Details  */
    education: [{

        degree: {
            type: String,
            default: ''
        },
        university: {
            type: String,
            default: ''
        },
        country: {
            type: String,
            default: ''
        },
        majorSubject: {
            type: String,
            default: ''
        },
        gaduationDate: {
            type: Date,
            default: ''
        },
        grade: {
            type: String,
            default: ''
        },
        grade_score: {
            type: String,
            default: ''
        },
        description: {
            type: String,
            default: ''
        },
    }],
    education_complete_percentage: {
        type: Number,
        default: 0 // 12.5 for a single record
    },
    /* Language Known  */
    language: [{

        name: {
            type: String,
            default: ''
        },
        level: {
            type: String,
            default: ''
        }
    }],
    language_complete_percentage: {
        type: Number,
        default: 0 // 12.5 for a single record
    },
    /* Skills  */
    skills: [{

        // _id: {
        //     type: String,
        //     default: ''
        // },
        skill_id: {
            type: String,
            default: ''
        },
        level: {
            type: String,
            default: ''
        }
    }],
    skills_complete_percentage: {
        type: Number,
        default: 0 // 12.5 for a single record
    },
    password: {
        type: String,
        default: ''
    },
    type: {
        type: String,
        enum: ['FACEBOOK', 'GOOGLE', 'LINKEDIN', 'NORMAL'],
        default: 'NORMAL'
    },
    socialLogin: {
        type: {
            type: String,
            enum: ['FACEBOOK', 'GOOGLE', 'LINKEDIN', 'NORMAL'],
            default: 'NORMAL'
        },
        socialId: {
            type: String,
            default: null
        },
        image: {
            type: String,
            default: null
        }
    },
    devicetoken: {
        type: String,
        default: ''
    },
    verification_method: {
        type: String,
        enum: ['EMAIL', 'SMS'],
        default: 'EMAIL'
    },
    verification_code: {
        type: String,
        default: ''
    },
    otp: {
        type: String,
        default: ''
    },
    apptype: {
        type: String,
        enum: ['IOS', 'ANDROID', 'BROWSER'],
        default: ''
    },
    status: {
        type: String,
        enum: ['yes', 'no'],
        default: 'yes'
    },
    email_verify: {
        type: String,
        enum: ['yes', 'no'],
        default: 'no'
    },

    video_cv: {

        link :{
            type : String,
            default:''
        },
        description :{
            type : String,
            default:''
        }
        
    },

    references:[{

        name:{
            type:String,
            default:''
        },
        job_title:{
            type:String,
            default:''
        },
        company_name:{
            type:String,
            default:''
        },
        email:{
            type:String,
            default:''
        },
        country_code:{
            type:String,
            default:''
        },
        phone_no:{
            type:String,
            default:''
        }
          
    }]





}, {
    timestamps: true
});
candidatechema.pre('save', function (next) {
    var user = this;
    if (!user.isModified('password'))
        return next();

    const saltRounds = 10;
    bcrypt.hash(user.password, saltRounds, function (err, hash) {
        // Store hash in your password DB.
        if (err) {
            return next(err);
        }
        user.password = hash;
        next();
    });
});
candidatechema.plugin(mongoosePaginate);
candidatechema.plugin(mongooseAggregatePaginate);
module.exports = mongoose.model('Employee', candidatechema);