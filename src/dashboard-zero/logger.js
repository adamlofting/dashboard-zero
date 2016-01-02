var fs = require('fs')

process.on('uncaughtException', function (err) {
  console.log('Caught exception: ' + err)
  console.trace()
  fs.appendFile('./logs/error.log', 'data to append', function (err) {
    if (err) throw err
    console.log('Error logged')
  })
  process.exit(1)
})

function error (message) {
  console.error(message)
  console.trace()
  process.exit(1)
}

module.exports = {
  error: error
}
