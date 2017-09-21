var app = angular.module('appRoutes', ['ngRoute']);

app.config(function($routeProvider, $locationProvider){
	$routeProvider

	.when('/', {
		templateUrl: 'app/views/pages/home.html'
	})
	.when('/about', {
		templateUrl: 'app/views/pages/about.html'
	})
	.when('/register', {
		templateUrl: 'app/views/pages/users/register.html',
		controller: 'regCtrl',
		controllerAs: 'register',
		authenticated: false
	})
	.when('/login', {
		templateUrl: 'app/views/pages/users/login.html',
		authenticated: false
	})
	.when('/logout', {
		templateUrl: 'app/views/pages/users/logout.html',
		authenticated: true
	})
	.when('/profile', {
		templateUrl: 'app/views/pages/users/profile.html',
		authenticated: true
	})
	.when('/facebook/:token', {
		templateUrl: 'app/views/pages/users/social/social.html',
		controller: 'facebookCtrl',
		controllerAs: 'facebook',
		authenticated: false
	})
	.when('/twitter/:token', {
		templateUrl: 'app/views/pages/users/social/social.html',
		controller: 'twitterCtrl',
		controllerAs: 'twitter',
		authenticated: false
	})
	.when('/google/:token', {
		templateUrl: 'app/views/pages/users/social/social.html',
		controller: 'googleCtrl',
		controllerAs: 'google',
		authenticated: false
	})
	.when('/facebookerror', {
		templateUrl: 'app/views/pages/users/login.html',
		controller: 'facebookCtrl',
		controllerAs: 'facebook',
		authenticated: false
	})
	.when('/twittererror', {
		templateUrl: 'app/views/pages/users/login.html',
		controller: 'twitterCtrl',
		controllerAs: 'twitter',
		authenticated: false
	})
	.when('/googleerror', {
		templateUrl: 'app/views/pages/users/login.html',
		controller: 'googleCtrl',
		controllerAs: 'google',
		authenticated: false
	})
	.when('/facebook/inactive/error', {
		templateUrl: 'app/views/pages/users/login.html',
		controller: 'facebookCtrl',
		controllerAs: 'facebook',
		authenticated: false
	})
	.when('/google/inactive/error', {
		templateUrl: 'app/views/pages/users/login.html',
		controller: 'googleCtrl',
		controllerAs: 'google',
		authenticated: false
	})
	.when('/twitter/inactive/error', {
		templateUrl: 'app/views/pages/users/login.html',
		controller: 'twitterCtrl',
		controllerAs: 'twitter',
		authenticated: false
	})
	.when('/activate/:token', {
		templateUrl: 'app/views/pages/users/activation/activate.html',
		controller: 'emailCtrl',
		controllerAs: 'email',
		authenticated: false
	})
	.when('/resend', {
		templateUrl: 'app/views/pages/users/activation/resend.html',
		controller: 'resendCtrl',
		controllerAs: 'resend',
		authenticated: false
	})
	.when('/resetusername', {
		templateUrl: 'app/views/pages/users/reset/username.html',
		controller: 'usernameCtrl',
		controllerAs: 'username',
		authenticated: false
	})
	.when('/resetpassword', {
		templateUrl: 'app/views/pages/users/reset/password.html',
		controller: 'passwordCtrl',
		controllerAs: 'password',
		authenticated: false
	})
	.when('/reset/:token', {
		templateUrl: 'app/views/pages/users/reset/newpassword.html',
		controller: 'resetCtrl',
		controllerAs: 'reset',
		authenticated: false
	})
	.when('/management', {
		templateUrl: 'app/views/pages/management/management.html',
		controller: 'managementCtrl',
		controllerAs: 'management',
		authenticated: true,
		permission: ['admin', 'moderator']
	})
	.when('/edit/:id', {
		templateUrl: 'app/views/pages/management/edit.html',
		controller: 'editCtrl',
		controllerAs: 'edit',
		authenticated: true,
		permission: ['admin', 'moderator']
	})
	.when('/search', {
		templateUrl: 'app/views/pages/management/search.html',
		controller: 'managementCtrl',
		controllerAs: 'management',
		authenticated: true,
		permission: ['admin', 'moderator']
	})

	.otherwise({redirectTo: '/'});

	$locationProvider.html5Mode({enabled:true, requireBase:false});
});

app.run(['$rootScope', 'Auth', '$location', 'User', function($rootScope, Auth, $location, User){
	$rootScope.$on('$routeChangeStart', function(event, next, current){
		if(next.$$route.authenticated == true){
			if(!Auth.isLoggedIn()){
				event.preventDefault();
				$location.path('/');
			}
			else if(next.$$route.permission){
				User.getPermission().then(function(data){
					if(next.$$route.permission[0] !== data.data.permission){
						if(next.$$route.permission[1] !== data.data.permission){
							event.preventDefault();
							$location.path('/');
						}
					}
				});
			}
		}
		else if(next.$$route.authenticated == false){
			if(Auth.isLoggedIn()){
				event.preventDefault();
				$location.path('/profile');
			}	
		}
	});
}]);