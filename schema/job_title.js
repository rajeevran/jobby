var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var mongoosePaginate = require('mongoose-paginate');
var mongooseAggregatePaginate = require('mongoose-aggregate-paginate');
var JobTitle = new mongoose.Schema({
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
    }
}, {
    timestamps: true
});

JobTitle.plugin(mongoosePaginate);
JobTitle.plugin(mongooseAggregatePaginate);
module.exports = mongoose.model('Job-Title', JobTitle);