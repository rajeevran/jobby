var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var mongooseAggregatePaginate = require('mongoose-aggregate-paginate');
var Schema = mongoose.Schema;
var EmployerNotoficationSchema = new Schema({
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
        enum: ['job_post', 'application_received'],
        default: 'job_post'
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
EmployerNotoficationSchema.plugin(mongoosePaginate);
EmployerNotoficationSchema.plugin(mongooseAggregatePaginate);
module.exports = mongoose.model('Employer-Notification', EmployerNotoficationSchema);