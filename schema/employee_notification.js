var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var mongooseAggregatePaginate = require('mongoose-aggregate-paginate');
var Schema = mongoose.Schema;
var EmployeeNotoficationSchema = new Schema({
    _id: {
        type: String,
        required: true
    },
    user_id: {
        type: String,
        default: ''
    },
    notification_code: {
        type: Number,
        default: ''
    },
    notification_for: {
        type: String,
        enum: ['resume_post', 'application'],
        default: 'resume_post'
    },
    title: {
        type: String,
        default: ''
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
EmployeeNotoficationSchema.plugin(mongoosePaginate);
EmployeeNotoficationSchema.plugin(mongooseAggregatePaginate);
module.exports = mongoose.model('Employee-Notification', EmployeeNotoficationSchema);