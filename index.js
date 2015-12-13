var express = require('express')
var app = express()
var dz = require('./src/dashboard-zero/index.js')

// *******************************
// Start of code
// ****************************

POST()

function POST () {
  dz.checkConfig(function done () {
    dz.init(function done () {
      dz.checkDataFiles(function done () {
        // Start web server
        console.log('Starting webserver...')
        // app.get('/', function (req, res) {
        //   res.send('Hello World')
        // })
        app.use(express.static('data'))

        app.listen(3000)
        console.log('Server now running on http://localhost:3000')
      })
    })
  })
}
