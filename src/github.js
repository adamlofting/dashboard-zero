var https = require('https')

// Rate limits
// What as rate per hour?
// var ratePerHour = 120
// In milliseconds
var call_interval = 45000

// How many API calls did we use?
var total_api_calls = 0

// ***************************
// fetched from GitHub using API
// Returns: JSON
// ****************************
function fetchFromGithub (path, callback) {
  var options = {
    host: 'api.github.com',
    path: path,
    headers: {
      'User-Agent': 'drazisil'
    }
  }

  // Increase the API call counter
  total_api_calls++

  var body = ''
  https.get(options, function (res) {
    // console.log('statusCode: ', res.statusCode)
    // console.log('headers: ', res.headers)

    res.on('data', function (d) {
      body = body + d
    })
    res.on('end', function () {
      callback(null, JSON.parse(body))
    })
  }).on('error', function (e) {
    callback(e)
  })
}

exports.fetchFromGithub = fetchFromGithub
exports.totalApiCalls = total_api_calls
exports.call_interval = call_interval
