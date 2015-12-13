// Dashboard Zero
(function() {
    var app = angular.module('dashboardzero', ['dashboardzero-filters', 'dashboardzero-frontpage', 'dashboardzero-about', 'dashboardzero-contact', 'ngRoute'])

    .config(['$routeProvider',
        function($routeProvider) {
            $routeProvider.
                when('/about', {
                    templateUrl: 'templates/about.html',
                    controller: 'AboutController'
                }).
                when('/contact', {
                    templateUrl: 'templates/contact.html',
                    controller: 'ContactController'
                }).
                otherwise({
                    templateUrl: 'templates/index.html',
                    controller: 'FrontPageController'

                });
        }])
        
    .controller('NavController', ['$scope', '$location', function($scope, $location) {
        $scope.$location = $location;
    }])
    
})();

// Dashboard Zero Frontpage
(function() {
    var app = angular.module('dashboardzero-frontpage', [])

    .controller('FrontPageController',  [  '$http', '$scope', function($http, $scope) {
        var frontpage = this;
        frontpage.scope = $scope;
        
        frontpage.peers = {};

        function updatePeers(frontpage) {
            $http.get('./common/fetch.php').then(function(r){
                frontpage.peers = r.data;
            })
        };
        
        setInterval(function(scope) {
            updatePeers(frontpage);
        }, 120000);
        
        updatePeers(frontpage);
    }]);
    
  
})();

// Dashboard Zero Filters
(function() {
    var app = angular.module('dashboardzero-filters', [])
    
    .filter('hashrate', function() {
        return function(input) {
            if (input > 1000000000000) {
                return ((input / 1000000000000).toFixed(4) + " TH/s");
            }
            if (input > 1000000000) {
                return ((input / 1000000000).toFixed(4) + " GH/s");
            }
            if (input > 1000000) {
                return ((input / 1000000).toFixed(4) + " MH/s");
            }
            if (input > 1000) {
                return ((input / 1000).toFixed(4) + " KH/s");
            }
            return (input + " H/s");
        };
    })

    .filter('hex2asc', function() {
        return function(input) {
            input = input.substr(10);
            var hex = input.toString();//force conversion
            var str = '';
            for (var i = 0; i < hex.length; i += 2) {
                str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
            }
            return str;  
        };
    })
    
    .filter('ascclean', function() {
        return function(input) {
            var str = input.replace(/[^\x20-\x7E]/g, "");
            return str;  
        };
    })
    
    .filter('parsecoinbase', function() {
        return function(input) {
            if (input.indexOf('AntPool') > -1) {
                return 'Antpool';
            }
            else if (input.indexOf('BitClub Network') > -1) {
                return 'BitClub Network';
            }
            else if (input.indexOf('/BitFury/') > -1) {
                return 'BitFury';
            }
            else if (input.indexOf('[BTCChina.com]') > -1) {
                return 'BTCChina.com';
            }
            else if (input.indexOf('/BW Pool/') > -1) {
                return 'BW Pool';
            }
            else if (input.indexOf('Eligius') > -1) {
                return 'Eligius';
            }
            else if (input.indexOf('KnCMiner') > -1) {
                return 'KnCMiner';
            }
            else if (input.indexOf('Mined by ') > -1) {
                return input.substr(input.indexOf('Mined by '));
            }
            else if (input.indexOf('/slush/') > -1) {
                return 'slush';
            }
            else {
                return input;  
            }
        };
    })
    .filter('millSecondsToTimeString', function() {
  return function(millseconds) {
    var seconds = Math.floor(millseconds / 1000);
    var days = Math.floor(seconds / 86400);
    var hours = Math.floor((seconds % 86400) / 3600);
    var minutes = Math.floor(((seconds % 86400) % 3600) / 60);
    var timeString = '';
    if(days > 0) timeString += (days > 1) ? (days + " days ") : (days + " day ");
    if(hours > 0) timeString += (hours > 1) ? (hours + " hours ") : (hours + " hour ");
    if(minutes >= 0) timeString += (minutes > 1) ? (minutes + " minutes ") : (minutes + " minute ");
    return timeString;
}
})

})();

// Dashboard Zero About Page
(function() {
    var app = angular.module('dashboardzero-about', [])

    .controller('AboutController',  [  '$http', '$scope', function($http, $scope) {
    }]);
    
  
})();

// Dashboard Zero Contact Page
(function() {
    var app = angular.module('dashboardzero-contact', [])

    .controller('ContactController',  [  '$http', '$scope', function($http, $scope) {
    }]);
    
  
})();
