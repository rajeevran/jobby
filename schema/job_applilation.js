var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var mongooseAggregatePaginate = require('mongoose-aggregate-paginate');
var Schema = mongoose.Schema;
var applicationSchema = new Schema({
    _id: {
        type: String,
        required: true
    },
    employeeId: {
        type: String,
        required: true
    },
    resumeId: {
        type: String,
        required: true,
    },
    employerId: {
        type: String,
        required: true
    },
    jobId: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ["shortlisted", "pending", "rejected"],
        default: "pending"
    },

}, {
    timestamps: true
});

applicationSchema.plugin(mongoosePaginate);
applicationSchema.plugin(mongooseAggregatePaginate);
module.exports = mongoose.model('Job-Application', applicationSchema);