var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var Schema = mongoose.Schema;
var AdminSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        index: {
            unique: true
        }
    },
    password: {
        type: String,
        required: true,
        select: false
    }
}, {
    timestamps: true
});
AdminSchema.pre('save', function (next) {
    var admin = this;
    if (!admin.isModified('password'))
        return next();

    const saltRounds = 10;
    bcrypt.hash(admin.password, saltRounds, function (err, hash) {
        // Store hash in your password DB.
        if (err) {
            return next(err);
        }
        admin.password = hash;
        next();
    });
});

module.exports = mongoose.model('Admin', AdminSchema);