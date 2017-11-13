var Strategy = require('passport-local').Strategy;
var users = require('./config').users;

module.exports = function(passport) {

    passport.serializeUser(function(user, done) {
        done(null, user.name);
    });

    passport.deserializeUser(function(name, done) {
        var user = users.find(function(user) {
            return name === user.name;
        });

        var err = null;
        if(!user) {
            err = {message: 'No user was found'};
        }

        done(err, user);
    });


    passport.use('login', new Strategy({
        passReqToCallback : true
    },
    function(req, username, password, done) {
        var user = users.find(function(user) {
            return username === user.name && password === user.password;
        });

        if(!user) {
            return done(null, false);
        }

        return done(null, user);

    }));

};