var https = require('https')

// Rate limits
// https://developer.github.com/v3/#rate-limiting
// What as rate per hour?
// var ratePerHour = 60
// In milliseconds
var call_interval = 60000



// How many API calls did we use?
var total_api_calls = 0

function setToken () {
  // body...
}

// ****************************
// type: [org]
// ****************************
function getRepoCount (type, entity, callback) {
  if (type === 'org') {
    fetchHeadersFromGithub('/orgs/' + entity + '/repos?type=sources', callback)
  } else {
    callback('ERROR: Unsupported type')
  }
  // body...
}

// ****************************
// type: [org]
// https://developer.github.com/v3/repos/#list-organization-repositories
// ****************************
function fetchRepoList (type, entity, page_counter, callback) {
  if (type === 'org') {
    fetchFromGithub('/orgs/' + entity + '/repos?type=sources&page=' + page_counter, callback)
  } else {
    callback('ERROR: Unsupported type')
  }
}

// ***************************
// fetched from GitHub using API
// Returns: JSON
// ****************************
function fetchHeadersFromGithub (path, callback) {
  var options = {
    method: 'HEAD',
    host: 'api.github.com',
    path: path,
    headers: {
      'User-Agent': 'drazisil'
    }
  }

  // Increase the API call counter
  module.exports.total_api_calls++

  https.request(options, function (res) {
    callback(null, res.headers)
  }).on('error', function (e) {
    callback(e)
  })
  .end()
}

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
  module.exports.total_api_calls++

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

exports.getRepoCount = getRepoCount
exports.fetchRepoList = fetchRepoList
exports.total_api_calls = total_api_calls
exports.call_interval = call_interval
