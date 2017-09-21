var User = require('../models/user');
var jwt = require('jsonwebtoken');
var secret = 'harrypotter';
var nodemailer = require('nodemailer');
var sgTransport = require('nodemailer-sendgrid-transport');

module.exports = function(router){

	var options = {
		auth: {
			api_user: 'rajat_maheshwari',
			api_key: 'Rajat@123'
		}
	}

	var client = nodemailer.createTransport(sgTransport(options));

	router.post('/users', function(req, res){
		var user = new User();
		user.username = req.body.username;
		user.password = req.body.password;
		user.email = req.body.email;
		user.name = req.body.name;
		user.temporarytoken = jwt.sign({username:user.username, email:user.email}, secret, {expiresIn:'24h'}); 
		if(req.body.username == null || req.body.username == '' || req.body.password == null || req.body.password == '' || req.body.email == null || req.body.email == '' || req.body.name == null || req.body.name == ''){
			res.json({success:false, message:"Ensure username, email, and password were provided"});
		}
		else{
			user.save(function(err){
				if(err){
					// res.json({success:false, message:"Username or email already exists!"});
					if(err.errors != null){
						if(err.errors.name){
							res.json({success:false, message:err.errors.name.message});
						}
						else if(err.errors.email){
							res.json({success:false, message:err.errors.email.message});
						}
						else if(err.errors.username){
							res.json({success:false, message:err.errors.username.message});
						}
						else if(err.errors.password){
							res.json({success:false, message:err.errors.password.message});
						}
						else{
							res.json({success:false, message:err});
						}
					}
					else if(err){
						if(err.code == 11000){
							if(err.errmsg[61] == 'u'){
								res.json({success:false, message:"That username is already taken"});
							}
							else if(err.errmsg[61] == 'e'){
								res.json({success:false, message:"That e-mail is already taken"});
							}
						}
						else{
							res.json({success:false, message:err});
						}
					}
				}
				else{
					var email = {
						from: 'Localhost Staff, stafff@localhost.com',
						to: user.email,
						subject: 'Localhost Activation Link',
						text: 'Hello ' + user.name + ', thank you for registering at localhost.com. Please click on the following link to complete your activation: http://localhost:8080/activate/' + user.temporarytoken,
						html: 'Hello<strong> ' + user.name + '</strong>,<br><br>Thank you for registering at localhost.com. Please click on the link below to complete your activation:<br><br><a href="http://localhost:8080/activate/' + user.temporarytoken + '">http://localhost:8080/activate/</a>'
					};
					client.sendMail(email, function(err, info){
						if(err){
							console.log(err);
						}
						else{
							console.log("Message sent:" + info.response);
						}
					});
					res.json({success:true, message:"Account registered! Please check your e-mail for activation link."});
				}
			});
		}
	});

	router.post('/checkusername', function(req, res){
		User.findOne({username:req.body.username}).select('username').exec(function(err, user){
			if(err)
				throw err;
			if(user){
				res.json({success:false, message:'That username is already taken'});
			}
			else{
				res.json({success:true, message:'Valid username'});
			}
		});
	});

	router.post('/checkemail', function(req, res){
		User.findOne({email:req.body.email}).select('email').exec(function(err, user){
			if(err)
				throw err;
			if(user){
				res.json({success:false, message:'That e-mail is already taken'});
			}
			else{
				res.json({success:true, message:'Valid e-mail'});
			}
		});
	});

	router.put('/activate/:token', function(req, res){
		User.findOne({temporarytoken:req.params.token}, function(err, user){
			if(err)
				throw err;
			var token = req.params.token;
			jwt.verify(token, secret, function(err, decoded){
				if(err){
					res.json({success:false, message:'Activation link has expired.'});
				}
				else if(!user){
					res.json({success:false, message:'Activation link has expired.'});
				}
				else{
					user.temporarytoken = false;
					user.active = true;
					user.save(function(err){
						if(err){
							console.log(err);
						}
						else{
							var email = {
								from: 'Localhost Staff, stafff@localhost.com',
								to: user.email,
								subject: 'Localhost Account Activated',
								text: 'Hello ' + user.name + ', Your account has been successfully activated!',
								html: 'Hello<strong> ' + user.name + '</strong>,<br><br>Your account has been successfully activated!'
							}
							client.sendMail(email, function(err, info){
								if(err)
									console.log(err);
							});
							res.json({success: true, message:'Account activated!'});
						}
					});
				}
			});
		});
	});

	router.post('/authenticate', function(req, res){
		User.findOne({username: req.body.username}).select('email username password active').exec(function(err, user){
			if(err)
				throw err;
			if(!user){
				res.json({success:false, message:"Could not authenticate user"});
			}
			else if(user){
				if(req.body.password){
					var validPassword = user.comparePassword(req.body.password);
				}
				else{
					res.json({success:false, message:"No password provided"});		
				}
				if(!validPassword){
					res.json({success:false, message:"Could not authenticate password"});
				}
				else if(!user.active){
					res.json({success:false, message:'Account is not yet activated. Please check your e-mail for activation link.', expired:true});
				}
				else{
					var token = jwt.sign({username:user.username, email:user.email}, secret, {expiresIn:'30s'});
					res.json({success:true, message:"User authenticated!", token:token});
				}
			}
		});
	});

	router.post('/resend', function(req, res){
		User.findOne({username:req.body.username}).select('username password active').exec(function(err, user){
			if(err)
				throw err;
			if(!user){
				res.json({success:false, message:"Could not authenticate user"});
			}
			else if(user){
				if(req.body.password){
					var validPassword = user.comparePassword(req.body.password);
				}
				else{
					res.json({success:false, message:"No password provided"});		
				}
				if(!validPassword){
					res.json({success:false, message:"Could not authenticate password"});
				}
				else if(user.active){
					res.json({success:false, message:'Account is already activated'});
				}
				else{
					res.json({success:true, user:user});
				}
			}
		});
	});

	router.put('/resend', function(req, res){
		User.findOne({username:req.body.username}).select('username name email temporarytoken').exec(function(err, user){
			if(err)
				throw err;
			user.temporarytoken = jwt.sign({username:user.username, email:user.email}, secret, {expiresIn:'24h'});
			user.save(function(err){
				if(err){
					console.log(err);
				}
				else{
					var email = {
						from: 'Localhost Staff, staff@localhost.com',
						to: user.email,
						subject: 'Localhost Activation Link Request',
						text: 'Hello ' + user.name + ', Your recently requested a new account link. Please click on the following link to complete you activation:',
						html: 'Hello<strong> ' + user.name + '</strong>,<br><br>recently requested a new account link. Please click on the link below to complete your activation:<br><br><a href="http://localhost:8080/activate/' + user.temporarytoken + '">http://localhost:8080/activate/</a>'
					}
					client.sendMail(email, function(err, info){
						if(err){
							console.log(err);
						}
						else{
							console.log("Message sent: " + info.response);
						}
					});
					res.json({success:true, message:'Activation link has been sent to ' + user.email + '!'});
				}
			});
		});
	});

	router.get('/resetusername/:email', function(req, res){
		User.findOne({email:req.params.email}).select('email name username').exec(function(err, user){
			if(err){
				res.json({success:false, message:err});
			}
			else{
				if(!user){
					res.json({success:false, message:'E-mail was not found'});
				}
				else{
					var email = {
						from: 'Localhost Staff, staff@localhost.com',
						to: user.email,
						subject: 'Localhost Username Request',
						text: 'Hello ' + user.name + ', You recently requested your username. Please save it in your files: ' + user.username,
						html: 'Hello<strong> ' + user.name + '</strong>,<br><br>You recently requested your username. Please save it in your files: ' + user.username
					}
					client.sendMail(email, function(err, info){
						if(err){
							console.log(err);
						}
						else{
							console.log(info);
						}
					});
					res.json({success:true, message:'Username has been sent to e-mail!'});
				}
			}
		});
	});

	router.put('/resetpassword', function(req, res){
		User.findOne({username:req.body.username}).select('username active email resettoken name').exec(function(err, user){
			if(err){
				throw err;
			}
			if(!user){
				res.json({success:false, message:'Username was not found'});
			}
			else if(!user.active){
				res.json({success:false, message:'Account has not yet been activated'});
			}
			else{
				user.resettoken = jwt.sign({username:user.username, email: user.email}, secret, {expiresIn:'24h'});
				user.save(function(err){
					if(err){
						res.json({success:false, message:err});
					}
					else{
						var email = {
							from: 'Localhost Staff, staff@localhost.com',
							to: user.email,
							subject: 'Localhost Reset Password Request',
							text: 'Hello ' + user.name + ', You recently request a password reset link. Please click on the link below to reset your password:<br><br><a href="http://localhost:8080/reset/' + user.resettoken,
							html: 'Hello<strong> ' + user.name + '</strong>,<br><br>You recently request a password reset link. Please click on the link below to reset your password:<br><br><a href="http://localhost:8080/reset/' + user.resettoken + '">http://localhost:8080/reset/</a>'
						}
						client.sendMail(email, function(err, info){
							if(err){
								console.log(err);
							}
						});
						res.json({success:true, message:'Please check your e-mail for password reset link'});
					}
				});
			}
		});
	});

	router.get('/resetpassword/:token', function(req, res){
		User.findOne({resettoken:req.params.token}).select().exec(function(err, user){
			if(err)
				throw err;
			var token = req.params.token;
			jwt.verify(token, secret, function(err, decoded){
				if(err){
					res.json({success:false, message:'Password link has expired'});
				}
				else{
					if(!user){
						res.json({success:false, message:"Passsword link has expired"});
					}
					else{
						res.json({success:true, user:user});
					}
				}
			});
		});
	});

	router.put('/savepassword', function(req, res){
		User.findOne({username:req.body.username}).select('username email name password resettoken').exec(function(err, user){
			if(err)
				throw err;
			if(req.body.password === null || req.body.password === ''){
				res.json({success:false, message:"Password not provided"});
			}
			else{
				user.password = req.body.password;
				user.resettoken = false;
				user.save(function(err){
					if(err){
						res.json({success:false, message:err});
					}
					else{
						var email = {
							from: 'Localhost Staff, staff@localhost.com',
							to: user.email,
							subject: 'Localhost Reset Password',
							text: 'Hello ' + user.name + ', This e-mail is to notify you that your password was recently reset at localhost.com',
							html: 'Hello<strong> ' + user.name + '</strong>,<br><br>This e-mail is to notify you that your password was recently reset at localhost.com'
						}
						client.sendMail(email, function(err, info){
							if(err)
								console.log(err);
						});
						res.json({success:true, message:'Password has been reset!'});
					}
				});
			}
		});
	});

	router.use(function(req, res, next){
		var token = req.body.token || req.body.query || req.headers['x-access-token'];
		if(token){
			jwt.verify(token, secret, function(err, decoded){
				if(err){
					res.json({success:false, message:'Token invalid'});
				}
				else{
					req.decoded = decoded;
					next();
				}
			});
		}
		else{
			res.json({success:false, message:'No token provided'});
		}
	});

	router.post('/me', function(req, res){
		res.send(req.decoded);
	});

	router.get('/renewToken/:username', function(req, res){
		User.findOne({username:req.params.username}).select().exec(function(err, user){
			if(err)
				throw err;
			if(!user){
				res.json({success:false, message:'No user was found'});
			}
			else{
				var newToken = jwt.sign({username:user.username, email:user.email}, secret, {expiresIn:'24h'});
				res.json({success:true, token:newToken});
			}
		});
	});

	router.get('/permission', function(req, res){
		User.findOne({username:req.decoded.username}, function(err, user){
			if(err)
				throw err;
			if(!user){
				res.json({success:false, message:'No user was found'});
			}
			else{
				res.json({success:true, permission:user.permission});
			}
		});
	});

	router.get('/management', function(req, res){
		User.find({}, function(err, users){
			if (err)
				throw err;
			User.findOne({username:req.decoded.username}, function(err, mainUser){
				if(err)
					throw err;
				if(!mainUser){
					res.json({success:false, message:'No user found'});
				}
				else{
					if(mainUser.permission === 'admin' || mainUser.permission === 'moderator'){
						if(!users){
							res.json({success:false, message:'Users not found'});
						}
						else{
							res.json({success:true, users:users, permission:mainUser.permission});
						}
					}
					else{
						res.json({success:false, message:'Insufficient Permissions'});
					}
				}
			});
		});
	});

	router.delete('/management/:username', function(req, res){
		var deletedUser = req.params.username;
		User.findOne({username:req.decoded.username}, function(err, mainUser){
			if(err)
				throw err;
			if(!mainUser){
				res.json({success:false, message:'No user found'});
			}
			else{
				if(mainUser.permission !== 'admin'){
					res.json({success:false, message:'Insufficient Permissions'});
				}
				else{
					User.findOneAndRemove({username:deletedUser}, function(err, user){
						if(err)
							throw err;
						res.json({success:true});
					});
				}
			}
		});
	});

	router.get('/edit/:id', function(req, res){
		var editUser = req.params.id;
		User.findOne({username:req.decoded.username}, function(err, mainUser){
			if(err)
				throw err;
			if(!mainUser){
				res.json({success:false, message:'No user found'});
			}
			else{
				if(mainUser.permission === 'admin' || mainUser.permission === 'moderator'){
					User.findOne({ _id: editUser }, function(err, user){
						if(err)
							throw err;
						if(!user){
							res.json({success:false, message:'No user found'});
						}
						else{
							res.json({success:true, user:user});
						}
					});
				}
				else{
					res.json({success:false, message:'Insufficient Permission'});
				}
			}
		});
	});

	router.put('/edit', function(req, res){
		var editUser = req.body._id;
		if(req.body.name) var newName = req.body.name;
		if(req.body.username) var newUsername = req.body.username;
		if(req.body.email) var newEmail = req.body.email;
		if(req.body.permission) var newPermission = req.body.permission;
		User.findOne({username:req.decoded.username}, function(err, mainUser){
			if(err)
				throw err;
			if(!mainUser){
				res.json({success:false, message:"no user found"});
			}
			else{
				if(newName){
					if(mainUser.permission === 'admin' || mainUser.permission === 'moderator'){
						User.findOne({_id:editUser}, function(err, user){
							if(err)
								throw err;
							if(!user){
								res.json({success:false, message:'No user found'});
							}
							else{
								user.name = newName;
								user.save(function(err){
									if(err){
										console.log(err);
									}
									else{
										res.json({success:true, message:'Name has been updated!'});
									}
								});
							}
						});
					}
					else{
						res.json({success:false, message:'Insufficient Permissions'});
					}
				}
				if(newUsername){
					if(mainUser.permission === 'admin' || mainUser.permission === 'moderator'){
						User.findOne({_id:editUser}, function(err, user){
							if(err)
								throw err;
							if(!user){
								res.json({success:false, message:'No user found'});
							}
							else{
								user.username = newUsername;
								user.save(function(err){
									if(err){
										console.log(err);
									}
									else{
										res.json({success:true, message:'Username has been updated'});
									}
								});
							}
						});
					}
					else{
						res.json({success:false, message:'Insufficient Permissions'});
					}
				}
				if(newEmail){
					if(mainUser.permission === 'admin' || mainUser.permission === 'moderator'){
						User.findOne({_id:editUser}, function(err, user){
							if(err)
								throw err;
							if(!user){
								res.json({success:false, message:'No user found'});
							}
							else{
								user.email = newEmail;
								user.save(function(err){
									if(err){
										console.log(err);
									}
									else{
										res.json({success:true, message:'E-mail has been updated'});
									}
								});
							}
						});
					}
					else{
						res.json({success:false, message:'Insufficient Permissions'});
					}
				}
				if(newPermission){
					if(mainUser.permission === 'admin' || mainUser.permission === 'moderator'){
						User.findOne({_id:editUser}, function(err, user){
							if(err)
								throw err;
							if(!user){
								res.json({success:false, message:'No user found'});
							}
							else{
								if(newPermission === 'user'){
									if(user.permission === 'admin'){
										if(mainUser.permission !== 'admin'){
											res.json({success:false, message:'Insufficient Permissions. You must be an admin to downgrade an admin.'});
										}
										else{
											user.permission = newPermission;
											user.save(function(err){
												if(err){
													console.log(err);
												}
												else{
													res.json({success:true, message:'Permissions have been updated!'});
												}
											});
										}
									}
									else{
										user.permission = newPermission;
										user.save(function(err){
											if(err){
												console.log(err);
											}
											else{
												res.json({success:true, message:'Permissions have been updated!'});
											}
										});
									}
								}
								if(newPermission === 'moderator'){
									if(user.permission === 'admin'){
										if(mainUser.permission !== 'admin'){
											res.json({success:false, message:'Insufficient Permissions. You must be an admin to downgrade another admin'});
										}
										else{
											user.permission = newPermission;
											user.save(function(err){
												if(err){
													console.log(err);
												}
												else{
													res.json({success:true, message:'Permissions have been updated!'});
												}
											});
										}
									}
									else{
										user.permission = newPermission;
										user.save(function(err){
											if(err){
												console.log(err);
											}
											else{
												res.json({success: true, message:'Permissions have been updated!'});
											}
										});
									}
								}
								if(newPermission === 'admin'){
									if(mainUser.permission === 'admin'){
										user.permission = newPermission;
										user.save(function(err){
											if(err){
												console.log(err);
											}
											else{
												res.json({success:true, message:'Permissions have been updated!'});
											}
										});
									}
									else{
										res.json({success:false, message:'Insufficient Permissions. You must be an admin to upgrade someone to the admin level'});
									}
								}
							}
						});
					}
					else{
						res.json({success:false, message:'Insufficient Permissions'});
					}
				}	
			}
		});
	});

	return router;
}