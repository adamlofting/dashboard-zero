var dz = require('./src/dashboard-zero/index.js')

// The GitHub org name we are scanning
var ORG_NAME = 'mozilla'

var REPO_LIST = ['login.webmaker.org', 'webmaker-login-ux', 'webmaker-core']

// *******************************
// Start of code
// ****************************
dz.init(ORG_NAME, REPO_LIST)

dz.checkFiles(function done () {
})
