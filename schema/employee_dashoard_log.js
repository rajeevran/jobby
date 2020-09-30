var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var mongoosePaginate = require('mongoose-paginate');
var mongooseAggregatePaginate = require('mongoose-aggregate-paginate');
var employee_dashoard_log = new mongoose.Schema({
    _id: {
        type: String,
        required: true
    },
    employee_id: {
        type: String,
        required: true
    },
    employer_id: {
        type: String,
        required: true
    },
    action: {
        type: String,
        required: true
    },
    keyword: {
        type: String,
        default: '',
        required: false
    },
    body: {
        type: String,
        default: '',
        required: false
    }
    
}, {
    timestamps: true
});

employee_dashoard_log.plugin(mongoosePaginate);
employee_dashoard_log.plugin(mongooseAggregatePaginate);
module.exports = mongoose.model('Employee_Dashoard_Log', employee_dashoard_log);