/* global angular */
// Dashboard Zero
(function () {
  var app = angular.module('dashboardzero', ['dashboardzero-filters', 'dashboardzero-frontpage', 'dashboardzero-about', 'dashboardzero-contact', 'ngRoute', 'ngModal'])

  .config(['$routeProvider', function ($routeProvider) {
    $routeProvider
      .when('/about', {
        templateUrl: 'templates/about.html',
        controller: 'AboutController'
      })
      .when('/contact', {
        templateUrl: 'templates/contact.html',
        controller: 'ContactController'
      })
      .otherwise({
        templateUrl: 'templates/index.html',
        controller: 'FrontPageController'
      })
  }])

  .controller('NavController', ['$scope', '$location', function ($scope, $location) {
    $scope.$location = $location
  }])
})();

// Dashboard Zero Frontpage
(function () {
  var app = angular.module('dashboardzero-frontpage', [])

  .controller('FrontPageController', ['$http', '$scope', function ($http, $scope) {
    var frontpage = this
    frontpage.scope = $scope

    frontpage.myData = {
      modalShown: false
    }
    $scope.logClose = function () {
      frontpage.myData.modalShown = true
    }

    frontpage.data = {}

    function updateData (frontpage) {
      var req = {
        method: 'GET',
        url: './data/stats.json',
        headers: {
          'Accept': 'application/json'
        }
      }

      $http(req).then(function (r) {
        console.log(r.status)
        frontpage.peers = r.data
        if (!frontpage.data.last_updates) {
          frontpage.myData.modalShown = true
        } else {
          console.log(frontpage.data)
        }
      })
    }

    setInterval(function (scope) {
      updateData(frontpage)
    }, 5000)

    updateData(frontpage)
  }])
})();

// Dashboard Zero Filters
(function () {
  var app = angular.module('dashboardzero-filters', [])

  .filter('ascclean', function () {
    return function (input) {
      var str = input.replace(/[^\x20-\x7E]/g, '')
      return str
    }
  })
})();

// Dashboard Zero About Page
(function () {
  var app = angular.module('dashboardzero-about', [])

  .controller('AboutController', ['$http', '$scope', function ($http, $scope) {
  }])
})();

// Dashboard Zero Contact Page
(function () {
  var app = angular.module('dashboardzero-contact', [])

  .controller('ContactController', ['$http', '$scope', function ($http, $scope) {
  }])
})()
