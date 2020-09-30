var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var mongoosePaginate = require('mongoose-paginate');
var mongooseAggregatePaginate = require('mongoose-aggregate-paginate');
var JobCity = new mongoose.Schema({
    _id: {
        type: String,
        required: true
    },
    countryId: {
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

JobCity.plugin(mongoosePaginate);
JobCity.plugin(mongooseAggregatePaginate);
module.exports = mongoose.model('Job-city', JobCity);