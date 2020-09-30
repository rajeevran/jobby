var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var mongoosePaginate = require('mongoose-paginate');
var mongooseAggregatePaginate = require('mongoose-aggregate-paginate');
var CompanyScema = new mongoose.Schema({
    _id: {
        type: String,
        required: true
    },
    name: {
        type: String,
        default: ''
    },
    email: {
        type: String,
        default: ''
    },
    designation: {
        type: String,
        default: ''
    },
    employerId: {
        type: String,
        required: true,
        index: {
            unique: true
        }
    },
    logo: {
        type: String,
        default: null
    },
    // address: {
    //     type: String,
    //     default: ''
    // },
    country: {
        type: String,
        default: ''
    },
    city: {
        type: String,
        default: ''
    },
    description: {
        type: String,
        default: ''
    },
    ar_description: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ["yes", "no"],
        default: "yes"
    },
}, {
    timestamps: true
});

CompanyScema.plugin(mongoosePaginate);
CompanyScema.plugin(mongooseAggregatePaginate);
module.exports = mongoose.model('Company', CompanyScema);