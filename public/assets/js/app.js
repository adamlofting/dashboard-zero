/* global angular $ */
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

  .controller('NavController', ['$http', '$scope', '$location', function ($http, $scope, $location) {
    $scope.$location = $location
  }])
})();

// Dashboard Zero Frontpage
(function () {
  angular.module('dashboardzero-frontpage', [])

  .controller('FrontPageController', ['$http', '$rootScope', '$scope', '$window', function ($http, $scope, $rootScope, $window) {
    var frontpage = this

    frontpage.stats = {}

    function updateData (frontpage) {
      $http.get('/api/all/stats').then(function (r) {
        frontpage.stats = r.data
        $('#last_updated').text(new Date(Number(frontpage.stats[0].last_updated)).toLocaleString())
      })
      $http.get('/api/all/issues/untouched').then(function (r) {
        frontpage.issues_untouched = r.data
        frontpage.issues_untouched = frontpage.issues_untouched.map(function (d) {
          d.values = d.values.sort(function (a, b) {
            return new Date(b.created_date) - new Date(a.created_date)
          })
          return d
        })
      })
    }

    setInterval(function (scope) {
      updateData(frontpage)
    }, 2100000) // 35 minutes

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

  .filter('reverse', function () {
    return function (input, uppercase) {
      input = input || ''
      var out = ''
      for (var i = 0; i < input.length; i++) {
        out = input.charAt(i) + out
      }
      // conditional based on optional argument
      if (uppercase) {
        out = out.toUpperCase()
      }
      return out
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
