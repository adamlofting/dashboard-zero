var dz = require('./src/dashboard-zero/index.js')

// *******************************
// Start of code
// ****************************

POST()

function POST () {
  dz.checkConfig(function done () {
    dz.init(function done () {
      dz.checkDataFiles(function done () {
        dz.updateData(function done () {
          setInterval(dz.updateData, 1800000, function done () { // 30 minutes
          })
          dz.startServer()
        })
      })
    })
  })
}
