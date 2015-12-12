var express = require('express')
var app = express()
var dz = require('./src/dashboard-zero/index.js')

// The GitHub org name we are scanning
var ORG_NAME = 'mozilla'

var REPO_LIST = ['login.webmaker.org', 'webmaker-login-ux', 'webmaker-core']

// *******************************
// Start of code
// ****************************
dz.init(ORG_NAME, REPO_LIST)

dz.checkFiles(function done () {
  // Start web server
  console.log('Starting webserver...')
  app.get('/', function (req, res) {
    res.send('Hello World')
  })

  app.listen(3000)
})
