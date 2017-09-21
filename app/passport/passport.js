var FacebookStrategy = require('passport-facebook').Strategy;
var TwitterStrategy = require('passport-twitter').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var User = require('../models/user');
var session = require('express-session');
var jwt = require('jsonwebtoken');
var secret = 'harrypotter';

module.exports = function(app, passport){

	app.use(passport.initialize());
	app.use(passport.session());
	app.use(session({secret:'keyboard cat', resave:false, saveUninitialized:true, cookie:{secure:false}}));

	passport.serializeUser(function(user, done){
		if(user.active){
			token = jwt.sign({username:user.username, email:user.email}, secret, {expiresIn:'24h'});
		}
		else{
			token = 'inactive/error';
		}
		done(null, user.id);
	});

	passport.deserializeUser(function(id, done){
		User.findById(id, function(err, user){
			done(err, user);
		});
	});

	passport.use(new FacebookStrategy({
			clientID: '1842568379403541',
			clientSecret: '82abfb0d1b0b59deb2f9f61d60878379',
			callbackURL: "http://localhost:8080/auth/facebook/callback",
			profileFields: ['id', 'displayName', 'photos', 'email']
		},
		function(accessToken, refreshToken, profile, done){
			User.findOne({email: profile._json.email}).select('username active password email').exec(function(err, user){
				if(err)
					done(err);
				if(user && user != null){
					done(null, user);
				}
				else{
					done(err);
				}
			});
		}
	));

	app.get('/auth/facebook/callback', passport.authenticate('facebook', {failureRedirect:'/facebookerror'}), function(req, res){
		res.redirect('/facebook/' + token);
	});
	app.get('/auth/facebook', passport.authenticate('facebook', {scope:'email'}));

	passport.use(new TwitterStrategy({
			consumerKey: 'D5TYq1aFQtOYQAT5koaFm3zrf',
			consumerSecret: 'yzsKS9vddygIX5ABkM4OB2Xh53Eobn2UCLCxsyvJ6vtr8c8xmY',
			callbackURL: "http://localhost:8080/auth/twitter/callback",
			userProfileURL: "https://api.twitter.com/1.1/account/verify_credentials.json?include_email=true"
		},
		function(token, tokenSecret, profile, done){
			User.findOne({email:profile.emails[0].value}).select('username active password email').exec(function(err, user){
				if(err){
					done(err);
				}
				else{
					if(user && user !== null){
						done(null, user);
					}
					else{
						done(err);
					}
				}
			});
		}
	));

	app.get('/auth/twitter', passport.authenticate('twitter'));
	app.get('/auth/twitter/callback', passport.authenticate('twitter', {failureRedirect:'/twittererror'}), function(req, res){
		res.redirect('/twitter/' + token);
	});

	passport.use(new GoogleStrategy({
			clientID: '167036852070-hvfg6b9c3r7ng5eat6e8dqu098475iu3.apps.googleusercontent.com',
			clientSecret: '-fOSvrb1rwcrw1S26Ai2xjcR',
			callbackURL: "http://localhost:8080/auth/google/callback"
		},
		function(accessToken, refreshToken, profile, done){
			console.log(profile);
			User.findOne({email:profile.emails[0].value}).select('username active password email').exec(function(err, user){
				if(err)
					done(err);
				if(user && user !== null){
					done(null, user);
				}
				else{
					done(err);
				}
			});
		}
	));

	app.get('/auth/google', passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/plus.login', 'profile', 'email']}));
	app.get('/auth/google/callback', passport.authenticate('google', {failureRedirect:'/googleerror'}), function(req, res){
		res.redirect('/google/' + token);
	});

	return passport;
}