var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var mongoosePaginate = require('mongoose-paginate');
var mongooseAggregatePaginate = require('mongoose-aggregate-paginate');
var faqSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true
    },
   
    user_type: {
        type: String,
        enum: ['employer', 'employee'],
        default: 'employer'
    },
    question: {
        type: String,
        required: true
    },
    ar_question: {
        type: String,
        required: true
    },
    answer: {
        type: String,
        required: true
    },
    ar_answer: {
        type: String,
        required: true
    }
   
   
}, {
    timestamps: true
});

faqSchema.plugin(mongoosePaginate);
faqSchema.plugin(mongooseAggregatePaginate);
module.exports = mongoose.model('Faq', faqSchema);