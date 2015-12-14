/* global angular */
// Dashboard Zero
(function () {
  angular.module('dashboardzero', ['dashboardzero-filters', 'dashboardzero-frontpage', 'dashboardzero-about', 'dashboardzero-contact', 'ngRoute'])

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
  angular.module('dashboardzero-frontpage', [])

  .controller('FrontPageController', ['$http', '$scope', function ($http, $scope) {
    var frontpage = this
    frontpage.scope = $scope

    frontpage.milestones = {}

    function updateData (frontpage) {
      $http.get('/milestones.json').then(function (r) {
          frontpage.milestones = r.data
      })
    }
    //
    // // setInterval(function (scope) {
    // //   updateData(frontpage)
    // // }, 5000)
    //
    updateData(frontpage)
  }])
})();

// Dashboard Zero Filters
(function () {
  angular.module('dashboardzero-filters', [])

  .filter('ascclean', function () {
    return function (input) {
      var str = input.replace(/[^\x20-\x7E]/g, '')
      return str
    }
  })
})();

// Dashboard Zero About Page
(function () {
  angular.module('dashboardzero-about', [])

  .controller('AboutController', ['$http', '$scope', function ($http, $scope) {
  }])
})();

// Dashboard Zero Contact Page
(function () {
  angular.module('dashboardzero-contact', [])

  .controller('ContactController', ['$http', '$scope', function ($http, $scope) {
  }])
})()
