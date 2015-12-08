/* global describe it */

var Promise = require('bluebird')
var fs = require('fs')
Promise.promisifyAll(fs)

var assert = require('assert')
describe('Files', function () {
  it('reposByOrg.json exists', function (done) {
    fs.stat('data/reposByOrg.json', function (err, stats) {
      if (err) {
        assert.equal('ENOENT', err.code)
        done()
      } else {
        assert.equal(true, stats.isFile())
        done()
      }
    })
  })
})

describe('Database', function () {
  it('orgs.db exists', function (done) {
    fs.stat('data/orgs.db', function (err, stats) {
      if (err) {
        assert.equal('ENOENT', err.code)
        done()
      } else {
        assert.equal(true, stats.isFile())
        done()
      }
    })
  })
})
