var config = require('./config.js');
var express = require('express');
var passport = require('passport');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var path = require('path');

var app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use('/out', express.static('dist'));
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

app.use(session({
    secret: 'fyrabuggochencocacolaspelardiscopahogmusik',
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

mongoose.Promise = global.Promise;
var dbpromise = mongoose.connect(config.dbLogin, {
    useMongoClient: true
});

dbpromise.then(function () {
    console.log('DB connected');
},
    function (err) {
        console.log('ERROR', err);
    });

require('./passport')(passport);

var Temp = require('./models/Temp');
var Brew = require('./models/Brew.js');
//echo "temp=`python temp.py`" | curl -X POST -d @-  "http://192.168.1.245:3000/data"

app.get('/', function (req, res) {
    res.render('index', { 'isLoggedIn': req.isAuthenticated() });
});


app.post('/data', function (req, res) {
    if (req.body.key === config.callKey) {
        Brew.findOne({
            $and: [{ started_at: { $exists: true } }, { ended_at: { $exists: false } }],
        }).then(function (activeBrew) {
            if (activeBrew) {
                var t = req.body.temp;
                console.log('There\'s an active brew, saving:', t);
                var temp = new Temp({
                    temperature: t
                });

                temp.save(function (err) {
                    if (err) { console.log('ERR', err); res.end(); }
                    res.end();
                });
            } else {
                console.log('No active brew');
                res.end();
            }
        });
    }
});

function handleGetTemps(err, temps, res) {
    if (err) { res.send(JSON.stringify({ status: 0, message: err.message })); }

    var responseObject = { status: 1, data: temps, message: 'success' };

    res.send(JSON.stringify(responseObject));
}

app.get('/temp', function (req, res) {
    if (req.query.dateFrom) {
        var dateFrom = new Date(parseInt(req.query.dateFrom));
        if (req.query.dateTo) {
            var dateTo = new Date(parseInt(req.query.dateTo));
            Temp.find({}).where('measured_at').gt(dateFrom).lt(dateTo).sort('measured_at').exec(function (err, temps) {
                handleGetTemps(err, temps, res);
            });
        } else {
            Temp.find({}).where('measured_at').gt(dateFrom).sort('measured_at').exec(function (err, temps) {
                handleGetTemps(err, temps, res);
            });
        }
    } else {
        Temp.find({}, null, { sort: 'measured_at' }, function (err, temps) {
            handleGetTemps(err, temps, res);
        });
    }
});

app.get('/brews', function (req, res) {
    Brew.find({}).then(function (data) {
        res.send(data);
    });
});

app.post('/brews', isLoggedIn, function (req, res) {
    var b = req.body;
    var brew = new Brew({
        name: b.name,
        started_at: b.started_at
    });
    brew.save(function (err) {
        if (err) { res.status(500).send({ message: err.message, status: 0 }) }
        res.send({ message: 'success', status: 1 });
    })

});

app.put('/brews', isLoggedIn, function (req, res) {
    var b = req.body;

    if (!b) {
        return res.status(500).send({ message: 'No brew found', status: 0 });
    }

    Brew.findOne({ name: b.name }).then(function (brew) {
        brew.started_at = b.started_at;
        brew.ended_at = b.ended_at;

        brew.save(function (err) {
            if (err) { return res.status(500).send() }

            res.send(brew);
        });

    });

});

app.get('/signout', function (req, res) {
    req.logout();
    res.redirect('/');
});

app.post('/login', passport.authenticate('login', {
    successRedirect: '/',
    failureRedirect: '/'
}));

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).send();
}

app.listen(config.port, function () {
    console.log('started at port', config.port);
});

function isBrewActive(brew) {
    return Boolean(brew.started_at) && !Boolean(brew.ended_at);
}

function isBrewEnded(brew) {
    return Boolean(brew.started_at) && Boolean(brew.ended_at);
}