function error (message) {
  console.error(message)
  console.trace()
  process.exit(1)
}

module.exports = {
  error: error
}
