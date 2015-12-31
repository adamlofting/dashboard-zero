process.on('uncaughtException', function (err) {
  console.log('Caught exception: ' + err)
  console.trace()
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
