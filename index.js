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
        // app.use(function (req, res, next) {
        //   res.header('Access-Control-Allow-Origin', '*')
        //   res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
        //   next()
        // })
        app.use(express.static(__dirname + '/public'))
        app.use(express.static(__dirname + '/data'))

        // app.use(express.static('data'))

        app.listen(3000)
        console.log('Server now running on http://mc.drazisil.com:3000')
      })
    })
  })
}
