var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var mongoosePaginate = require('mongoose-paginate');
var mongooseAggregatePaginate = require('mongoose-aggregate-paginate');
var Schema = mongoose.Schema;
var employerschema = new Schema({
    _id: {
        type: String,
        required: true
    },
    fname: {
        type: String,
        default: ''
    },
    lname: {
        type: String,
        default: ''
    },
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
    profile_image: {
        type: String,
        default: null
    },
    profile_image_updated: {
        type: Boolean,
        enum: [true, false],
        default: false
    },

    newemail: {
        type: String,
        default: ''
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
    companyId: {
        type: String,
        default: null
    },
    jobCount: {
        type: Number,
        default: 0
    },
    job_package_purchase: {
        type: Boolean,
        enum: [true, false],
        default: false
    },
    job_package: {
        orderId: {
            type: String,
            default: ''
        },
        job_post_limit: {
            type: Number,
            default: 0
        },
        job_display_duration: {
            type: Number,
            default: ''
        },
        package_expire_date: {
            type: Date
        }

    }

}, {
    timestamps: true
});
employerschema.pre('save', function (next) {
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
employerschema.plugin(mongoosePaginate);
employerschema.plugin(mongooseAggregatePaginate);
module.exports = mongoose.model('Employer', employerschema);