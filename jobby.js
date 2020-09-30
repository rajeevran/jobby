var express = require('express');
var fileUpload = require('express-fileupload');
var mongoose = require('mongoose');
var bodyparser = require('body-parser');
var cookieParser = require('cookie-parser');
var path = require('path');
var methodOverride = require('method-override');
var _ = require('lodash');
var config = require("./config");
var https = require('https');
var fs = require('fs');
var i18n = require('./i18n');

// This line is from the Node.js HTTPS documentation.
// var credentials = {
//     key: fs.readFileSync('/etc/letsencrypt/live/nodeserver.brainiuminfotech.com/privkey.pem', 'utf8'),
//     cert: fs.readFileSync('/etc/letsencrypt/live/nodeserver.brainiuminfotech.com/fullchain.pem', 'utf8')
// };

var app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

var server = require('http').createServer(app);

//var server = https.createServer(credentials, app);

//==============Add middleware necessary for REST API's===============
app.use(bodyparser.urlencoded({
    extended: true
}));
app.use(bodyparser.json());
app.use(fileUpload());
var timeOut = 60 * 10000;
app.use(cookieParser());

app.use(methodOverride('X-HTTP-Method-Override'));
//==========Add module to recieve file from angular to node===========
app.use(express.static(__dirname + '/public'));
//===========================CORS support==============================
app.use(function (req, res, next) {

    req.setEncoding('utf8');
    // Website you wish to allow to connect
    res.setHeader("Access-Control-Allow-Origin", "*");

    // Request methods you wish to allow
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");

    // Request headers you wish to allow
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, x-access-token, user_id, authtoken");
    //res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, x-access-token");
    res.setHeader("Access-Control-Allow-Credentials", true);

    if ('OPTIONS' == req.method) {
        res.sendStatus(200);
    } else {
        next();
    }
});
// i18n module as middleware //
app.use(i18n);
// i18n module as middleware //
//=========================Load the routes===============================


var apiEmployerRoutes = require('./routes/api/apiEmployerRoutes.js');
app.use('/api/employers', apiEmployerRoutes);

var apiEmployeeRoutes = require('./routes/api/apiEmployeeRoutes.js');
app.use('/api/employees', apiEmployeeRoutes);

var apiRoutes = require('./routes/api/apiRoutes.js');
app.use('/api', apiRoutes);

var adminRoutes = require('./routes/admin/adminRoutes.js');
app.use('/admin', adminRoutes);

// catch 404 and forward to error handler
// app.use(function (req, res, next) {
//     var err = new Error('Not Found');
//     err.status = 404;
//     next(err);
// });

//===========================Connect to MongoDB==========================
if (config.dbAccess == 'server') {
    var db = config.database['server'];
    // producation config or local config
    var producationString = "mongodb://" + db.username + ":" + db.password + "@" + db.host + ":" + db.port + "/" + db.dbName + "?authSource=" + db.authDb;
    //var producationString = config.local.database;

    var options = {
        useUnifiedTopology: true,
        useCreateIndex: true,
        useNewUrlParser: true
    };

    var db = mongoose.connect(producationString, options, function (err) {
        if (err) {
            console.log(err + "connection failed");
        } else {
            console.log('Connected to database ');
        }
    });
    //mongo on connection emit
    mongoose.connection.on('connected', function (err) {
        console.log("mongo Db conection successfull");
    });
    //mongo on error emit
    mongoose.connection.on('error', function (err) {
        console.log("MongoDB Error: ", err);
    });
    //mongo on dissconnection emit
    mongoose.connection.on('disconnected', function () {
        console.log("mongodb disconnected and trying for reconnect");
        mongoose.connectToDatabase();
    });
} else {
    var db = config.database['local'];
    var connectionString = "mongodb://" + db.host + ":" + db.port + "/" + db.dbName
    mongoose.connect(connectionString, function (err) {
        if (err) {
            console.log(err)
        } else {
            console.log('Connected to database ' + db.dbName);
        }
    });
}
mongoose.set('debug', true);
//===========================Connect to MongoDB==========================

app.set('port', config.port);
server.listen(app.get('port'), function (err) {
    if (err) {
        throw err;
    } else {
        console.log("Server is running at http://localhost:" + app.get('port'));
    }
});
server.timeout = 5000000;