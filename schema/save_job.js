var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var mongoosePaginate = require('mongoose-paginate');
var mongooseAggregatePaginate = require('mongoose-aggregate-paginate');
var SaveJob = new mongoose.Schema({
    _id: {
        type: String,
        required: true
    },
    employeeId: {
        type: String,
        required: true
    },
    jobId: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

SaveJob.plugin(mongoosePaginate);
SaveJob.plugin(mongooseAggregatePaginate);
module.exports = mongoose.model('Save-Job', SaveJob);