var dz = require('./src/dashboard-zero/index.js')

// *******************************
// Start of code
// ****************************

POST()

function POST () {
  dz.checkConfig(function done () {
    dz.init(function done () {
      dz.checkDataFiles(function done () {
        dz.startServer(function done () {
        })
      })
    })
  })
}
