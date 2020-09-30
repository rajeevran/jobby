var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var mongooseAggregatePaginate = require('mongoose-aggregate-paginate');
var Schema = mongoose.Schema;
var resumeschema = new Schema({
    _id: {
        type: String,
        required: true
    },
    employeeId: {
        type: String,
        required: true
    },
    title: {
        type: String,
        default: ''
    },
    name: {
        type: String,
        default: ''
    },
    email: {
        type: String,
        default: ''
    },
    work_summary: {
        type: String,
        default: ''
    },

    resumeImage: {
        type: String,
        default: null
    },
    resume_file: {
        type: String,
        default: null
    },
    resumeImageName: {
        type: String,
        default: null
    },    
    resumeFileName: {
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
    skills: [{
        type: String,
        default: ''
    }],
    job_tag: [{
        type: String,
        default: ''
    }],
    employement_type: [{
        type: String,
        default: ''
    }],
    remoteArea: {
        type: Boolean,
        enum: [true, false],
        default: false
    },
    onsite: {
        type: Boolean,
        enum: [true, false],
        default: false
    },
    relocation: {
        type: Boolean,
        enum: [true, false],
        default: false
    },
    status: {
        type: String,
        enum: ["publish", "pending", "hidden"],
        default: "pending"
    },

}, {
    timestamps: true
});

resumeschema.plugin(mongoosePaginate);
resumeschema.plugin(mongooseAggregatePaginate);
module.exports = mongoose.model('Resume', resumeschema);