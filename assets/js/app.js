/* global angular */
// Dashboard Zero
(function () {
  angular.module('dashboardzero', ['dashboardzero-filters', 'dashboardzero-frontpage', 'dashboardzero-about', 'dashboardzero-contact', 'ngRoute'])

  .config(['$routeProvider', function ($routeProvider) {
    $routeProvider
      .when('/about', {
        templateUrl: '/templates/about.html',
        controller: 'AboutController'
      })
      .when('/contact', {
        templateUrl: '/templates/contact.html',
        controller: 'ContactController'
      })
      .otherwise({
        templateUrl: '/templates/index.html',
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

    frontpage.myData = {
      modalShown: false
    }
    $scope.logClose = function () {
      frontpage.myData.modalShown = true
    }

    frontpage.data = {}

    // function updateData (frontpage) {
    //   var req = {
    //     method: 'GET',
    //     url: '/issues.csv'
    //     // headers: {
    //     //   'Accept': 'application/json'
    //     // }
    //   }
    //   try {
    //     $http(req).then(function cb_response (r) {
    //       try {
    //         // Received data are not parsed
    //         console.dir(r)
    //         frontpage.data.foo = r.last_updated
    //       } catch (e) {
    //         console.log('moo')
    //         throw e
    //       }
    //       if (!frontpage.data.last_updates) {
    //         frontpage.myData.modalShown = true
    //       } else {
    //         console.log(frontpage.data)
    //       }
    //     })
    //   } catch (e) {
    //     console.log('moo2')
    //     throw e
    //   }
    // }

    // setInterval(function (scope) {
    //   updateData(frontpage)
    // }, 5000)

    // updateData(frontpage)
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
