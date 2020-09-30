var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var mongoosePaginate = require('mongoose-paginate');
var mongooseAggregatePaginate = require('mongoose-aggregate-paginate');
var JobCountry = new mongoose.Schema({
    _id: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

JobCountry.plugin(mongoosePaginate);
JobCountry.plugin(mongooseAggregatePaginate);
module.exports = mongoose.model('Job-country', JobCountry);