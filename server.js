var dz = require('./src/dashboard-zero/index.js')

// *******************************
// Start of code
// ****************************

POST()

function POST () {
  dz.init(function done () {
    dz.checkDataFiles(function done () {
      dz.updateData(function done () {
        dz.timerId = setTimeout(dz.updateData, 1800000, function done () { // 30 minutes
        })
        dz.startServer()
      })
    })
  })
}
