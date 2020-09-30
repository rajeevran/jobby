var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var mongooseAggregatePaginate = require('mongoose-aggregate-paginate');
var Schema = mongoose.Schema;
var jobsShema = new Schema({
    _id: {
        type: String
    },
    name: {
        type: String,
        default: ''
    },
    ar_name: {
        type: String,
        default: ''
    },
    employerId: {
        type: String,
        required: true
    },
    country: {
        type: String,
        default: ''
    },
    city: {
        type: String,
        default: ''
    },
    company: {
        type: String,
        default: ''
    },
    job_tag: [{
        type: String,
        default: ''
    }],
    job_type: [{
        type: String,
        default: ''
    }],
    job_industry: {
        type: String,
        default: ''
    },
    job_level: {
        type: String,
        default: ''
    },
    // logo: {
    //     type: String,
    //     default: null
    // },

    description: {
        type: String,
        default: ''
    },
    ar_description: {
        type: String,
        default: ''
    },
    job_skill: [{
        type: String,
        default: ''
    }],
    application_email_id: {
        type: String,
        default: null
    },
    // remoteArea: {
    //     type: Boolean,
    //     enum: [true, false],
    //     default: false
    // },
    // onsite: {
    //     type: Boolean,
    //     enum: [true, false],
    //     default: false
    // },
    // minExp: {
    //     type: Number,
    //     default: ''
    // },
    // maxExp: {
    //     type: Number,
    //     default: null
    // },
    job_expire_date: {
        type: Date
    },
    status: {
        type: String,
        enum: ["publish", "pending", "hidden", "inactive", "expired"],
        default: "pending"
    },


}, {
    timestamps: true
});
jobsShema.plugin(mongoosePaginate);
jobsShema.plugin(mongooseAggregatePaginate);
module.exports = mongoose.model('Job', jobsShema);