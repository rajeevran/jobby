var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var mongoosePaginate = require('mongoose-paginate');
var mongooseAggregatePaginate = require('mongoose-aggregate-paginate');
var JobPackage = new mongoose.Schema({
    _id: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    ar_name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    ar_description: {
        type: String,
        default: ''
    },
    price: {
        type: Number,
        default: 0
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
        type: Number,
        default: ''
    }
}, {
    timestamps: true
});

JobPackage.plugin(mongoosePaginate);
JobPackage.plugin(mongooseAggregatePaginate);
module.exports = mongoose.model('Job-Package', JobPackage);