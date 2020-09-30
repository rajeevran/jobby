var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var mongooseAggregatePaginate = require('mongoose-aggregate-paginate');
var Schema = mongoose.Schema;
var interested_not_interestedSchema = new Schema({
    _id: {
        type: String,
        required: true
    },
    employeeId: {
        type: String,
        required: true
    },
    employerId: {
        type: String,
        required: true
    },
    employeeStatus: {
        type: String,
        enum: ["interested", "notinterested","default"],
        default: "default"
    },
    
    employerStatus: {
        type: String,
        enum: ["interested", "notinterested","default"],
        default: "default"
    },

}, {
    timestamps: true
});

interested_not_interestedSchema.plugin(mongoosePaginate);
interested_not_interestedSchema.plugin(mongooseAggregatePaginate);
module.exports = mongoose.model('Interested-Not-Interested', interested_not_interestedSchema);