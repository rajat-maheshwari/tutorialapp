angular.module('userControllers', ['userServices'])

.controller('regCtrl', function($location, $timeout, User){

	var app = this;

	this.regUser = function(regData, valid){
		app.loading = true;
		app.errorMsg = false;
		app.disabled = true;

		if(valid){
			User.create(app.regData).then(function(data){
				if(data.data.success){
					app.loading = false;
					//create success message
					app.successMsg = data.data.message + "....Redirecting";
					//Redirect to home page
					$timeout(function(){
						$location.path('/');
					}, 2000);
				}
				else{
					//create an error message
					app.loading = false;
					app.disabled = false;
					app.errorMsg = data.data.message;
				}
			});
		}
		else{
			//create an error message
			app.loading = false;
			app.disabled = false;
			app.errorMsg = "Please ensure form is filled our properly";
		}
	}

	this.checkUsername = function(regData){
		app.checkingUsername = true;
		app.usernameMsg = false;
		app.usernameInvalid = false;

		User.checkUsername(app.regData).then(function(data){
			if(data.data.success){
				app.checkingUsername = false;
				app.usernameInvalid = false;
				app.usernameMsg = data.data.message;
			}
			else{
				app.checkingUsername = false;
				app.usernameInvalid = true;
				app.usernameMsg = data.data.message;
			}
		});
	}

	this.checkEmail = function(regData){
		app.checkingEmail = true;
		app.emailMsg = false;
		app.emailInvalid = false;

		User.checkEmail(app.regData).then(function(data){
			if(data.data.success){
				app.checkingEmail = false;
				app.emailInvalid = false;
				app.emailMsg = data.data.message;
			}
			else{
				app.checkingEmail = false;
				app.emailInvalid = true;
				app.emailMsg = data.data.message;
			}
		});
	}
})

.directive('match', function(){
	return {
		restrict: 'A',
		controller: function($scope){

			$scope.confirmed = false;

			$scope.doConfirm = function(values){
				values.forEach(function(ele){
					if($scope.confirm == ele){
						$scope.confirmed = true;
					}
					else{
						$scope.confirmed = false;
					}
				});
			};
		},

		link: function(scope, element, attrs){

			attrs.$observe('match', function(){
				scope.matches = JSON.parse(attrs.match);
				scope.doConfirm(scope.matches);
			});

			scope.$watch('confirm', function(){
				scope.matches = JSON.parse(attrs.match);
				scope.doConfirm(scope.matches);
			});
		}
	};
})

.controller('facebookCtrl', function($routeParams, $location, Auth, $window){
	var app = this;
	app.errorMsg = false;
	app.expired = false;
	app.disabled = true;

	if($window.location.pathname == '/facebookerror'){
		app.errorMsg = "Facebook email not found in database.";
	}
	else if($window.location.pathname == '/facebook/inactive/error'){
		app.expired = true;
		app.errorMsg = 'Account is not yet activated. Please check your e-mail for activation link.';
	}
	else{
		Auth.facebook($routeParams.token);
		$location.path('/');
	}
})

.controller('twitterCtrl', function($routeParams, $location, Auth, $window){
	var app = this;
	app.errorMsg = false;
	app.expired = false;
	app.disabled = true;

	if($window.location.pathname == '/twittererror'){
		app.errorMsg = "Twitter email not found in database.";
	}
	else if($window.location.pathname == '/twitter/inactive/error'){
		app.expired = true;
		app.errorMsg = 'Account is not yet activated. Please check your e-mail for activation link.';
	}
	else{
		Auth.twitter($routeParams.token);
		$location.path('/');
	}
})

.controller('googleCtrl', function($routeParams, $location, Auth, $window){
	var app = this;
	app.errorMsg = false;
	app.expired = false;
	app.disabled = true;

	if($window.location.pathname == '/googleerror'){
		app.errorMsg = "Google email not found in database.";
	}
	else if($window.location.pathname == '/google/inactive/error'){
		app.expired = true;
		app.errorMsg = 'Account is not yet activated. Please check your e-mail for activation link.';
	}
	else{
		Auth.google($routeParams.token);
		$location.path('/');
	}
});