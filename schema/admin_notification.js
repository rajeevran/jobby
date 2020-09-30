var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var mongoosePaginate = require('mongoose-paginate');
var mongooseAggregatePaginate = require('mongoose-aggregate-paginate');
var AdminNotification = new mongoose.Schema({
    _id: {
        type: String,
        required: true
    },
    user_id: {
        type: String,
        default: ''
    },
    user_type: {
        type: String,
        enum: ['employer', 'employee'],
        default: 'employer'
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        default: ''
    },
    read_status: {
        type: String,
        enum: ['yes', 'no'],
        default: 'no'
    }
}, {
    timestamps: true
});

AdminNotification.plugin(mongoosePaginate);
AdminNotification.plugin(mongooseAggregatePaginate);
module.exports = mongoose.model('Admin-Notification', AdminNotification);