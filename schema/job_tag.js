var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var mongoosePaginate = require('mongoose-paginate');
var mongooseAggregatePaginate = require('mongoose-aggregate-paginate');
var JobTag = new mongoose.Schema({
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

JobTag.plugin(mongoosePaginate);
JobTag.plugin(mongooseAggregatePaginate);
module.exports = mongoose.model('Job-Tag', JobTag);