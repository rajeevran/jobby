var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var mongoosePaginate = require('mongoose-paginate');
var mongooseAggregatePaginate = require('mongoose-aggregate-paginate');
var termAndCondition = new mongoose.Schema({
    _id: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    ar_title: {
        type: String,
        required: true
    },
    content_type: {
        type: String,
        default: ''
    },
    description: {
        type: String,
        required: true
    },
    ar_description: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

termAndCondition.plugin(mongoosePaginate);
termAndCondition.plugin(mongooseAggregatePaginate);
module.exports = mongoose.model('term-condition', termAndCondition);