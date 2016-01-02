var fs = require('fs')
var express = require('express')
var app = express()
var gh = require('./github.js')
var sqlite3 = require('sqlite3').verbose()
var logger = require('./logger.js')
// Database setup
var dbDashZero = new sqlite3.Database('data/dash_zero.db')

var CONFIG = []
var SERVER_PORT
var timerId

function init (callback) {
  fs.readFile('config.json', function (err, data) {
    if (err) {
      if (err.message === "ENOENT, open 'config.json'") {
        console.error("'config.json' not found, launching setup wizard...")
        setup(function cb_setup_done () {
          console.info('Setup complete')
          callback()
        })
      }
      logger.error(err.message)
    }
    try {
      CONFIG = JSON.parse(data)
    } catch (err) {
      console.error(err.message)
      logger.error(err.message)
    } finally {
      SERVER_PORT = CONFIG['server_port'] || 3000
      gh.init(CONFIG, logger, callback)
    }
  })
}

// *************
// WEB
// *************

/*
* Start the expressjs server
*/
function startServer () {
  // Start web server
  console.info('Starting webserver...')
  app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
    next()
  })
  app.get('/api/all/comments', function (req, res) {
    var sql = 'SELECT * FROM comments'
    dbFetchAll(sql, function cb_db_fetch_comments (err, rows) {
      if (err) {
        console.error(err.message)
        logger.error(err.message)
      }
      if (req.query.export) {
        res.send('Export not supported...yet')
      } else {
        res.send(rows)
      }
    })
  })
  app.get('/api/all/issues', function (req, res) {
    var sql = 'SELECT * FROM issues'
    dbFetchAll(sql, function cb_db_fetch_issues (err, rows) {
      if (err) {
        console.error(err.message)
        logger.error(err.message)
      }
      if (req.query.export) {
        res.send('Export not supported...yet')
      } else {
        res.send(rows)
      }
    })
  })
  app.get('/api/all/issues/untouched', function (req, res) {
    var sql = 'SELECT * FROM issues WHERE comments_count = 0 AND labels = "none" and milestone_id = "none"'
    dbFetchAll(sql, function cb_db_fetch_issues_untouched (err, rows) {
      if (err) {
        console.error(err.message)
        logger.error(err.message)
      }
      if (req.query.export) {
        res.send('Export not supported...yet')
      } else {
        res.send(rows)
      }
    })
  })
  app.get('/api/all/labels', function (req, res) {
    var sql = 'SELECT * FROM labels'
    dbFetchAll(sql, function cb_db_fetch_labels (err, rows) {
      if (err) {
        console.error(err.message)
        logger.error(err.message)
      }
      if (req.query.export) {
        res.send('Export not supported...yet')
      } else {
        res.send(rows)
      }
    })
  })
  app.get('/api/all/members', function (req, res) {
    var sql = 'SELECT * FROM members'
    dbFetchAll(sql, function cb_db_fetch_members (err, rows) {
      if (err) {
        console.error(err.message)
        logger.error(err.message)
      }
      if (req.query.export) {
        res.send('Export not supported...yet')
      } else {
        res.send(rows)
      }
    })
  })
  app.get('/api/all/milestones', function (req, res) {
    var sql = 'SELECT * FROM milestones'
    dbFetchAll(sql, function cb_db_fetch_milestones (err, rows) {
      if (err) {
        console.error(err.message)
        logger.error(err.message)
      }
      if (req.query.export) {
        res.send('Export not supported...yet')
      } else {
        res.send(rows)
      }
    })
  })
  app.get('/api/all/stats', function (req, res) {
    var sql = 'SELECT * FROM stats'
    dbFetchAll(sql, function cb_db_fetch_stats (err, rows) {
      if (err) {
        console.error(err.message)
        logger.error(err.message)
      }
      if (req.query.export) {
        res.send('Export not supported...yet')
      } else {
        res.send(rows)
      }
    })
  })
  app.use(express.static(__dirname + '../../../public'))

  app.listen(SERVER_PORT)
  console.info('Server now running on http://localhost:' + SERVER_PORT)
}

// *****************************
// DB
// ****************************

function dbFetchAll (sql, callback) {
  dbDashZero.all(sql, callback)
}

function dbUpdateComments (callback) {
  console.info('Saving issue comments to database...')
  var stmt = dbDashZero.prepare('REPLACE INTO comments   (org,repository,id,creator,updated_date,html_url,issue_url) VALUES (?,?,?,?,?,?,?)')
  gh.json_comments.forEach(function fe_db_comments (element, index, array) {
    var e = element
    stmt.run(e.org, e.repository, e.id, e.creator, e.updated_date, e.html_url, e.issue_url)
  })
  stmt.finalize(callback)
}

function dbUpdateIssues (callback) {
  console.info('Saving issues to database...')
  var stmt = dbDashZero.prepare('REPLACE INTO issues   (org,repository,title,created_date,comments_count,is_pullrequest,milestone_id,labels,html_url,url) VALUES (?,?,?,?,?,?,?,?,?,?)')
  gh.json_issues.forEach(function fe_db_issues (element, index, array) {
    var e = element
    stmt.run(e.org, e.repository, e.title, e.created_at, e.comments, e.is_pullrequest, e.milestone_id, e.labels, e.html_url, e.url)
  })
  stmt.finalize(callback)
}

function dbUpdateMembers (callback) {
  console.info('Saving members to database...')
  var stmt = dbDashZero.prepare('REPLACE INTO members (org,id,login,avatar_url,type) VALUES (?,?,?,?,?)', function done () {
    gh.json_members.forEach(function fe_db_members (element, index, array) {
      var e = element
      stmt.run(e.org, e.id, e.login, e.avatar_url, e.type)
    })
    stmt.finalize(callback)
  })
}

function dbUpdateMilestones (callback) {
  console.info('Saving milestones to database...')
  var stmt = dbDashZero.prepare('REPLACE INTO milestones (org,repository,id,title,state,open_issues,due_on,html_url,url) VALUES (?,?,?,?,?,?,?,?,?)')
  gh.json_milestones.forEach(function fe_db_milestones (element, index, array) {
    var e = element
    stmt.run(e.org, e.repository, e.id, e.title, e.state, e.open_issues, e.due_on, e.html_url, e.url)
  })
  stmt.finalize(callback)
}

function dbUpdateLabels (callback) {
  console.info('Saving labels to database...')
  var stmt = dbDashZero.prepare('REPLACE INTO labels (org,repository,name,url) VALUES (?,?,?,?)')
  gh.json_labels.forEach(function fe_db_labels (element, index, array) {
    var e = element
    stmt.run(e.org, e.repository, e.name, e.url)
  })
  stmt.finalize(callback)
}

function dbUpdateStats (callback) {
  console.info('Saving stats to database...')
  dbDashZero.run('DROP TABLE IF EXISTS stats', function done () {
    dbDashZero.run('CREATE TABLE IF NOT EXISTS stats (last_updated TEXT, total_repositories INTEGER, total_members INTEGER, total_issues INTEGER, total_comments INTEGER, total_milestones INTEGER, total_labels INTEGER)', function done () {
      var stmt = dbDashZero.prepare('INSERT INTO stats (last_updated,total_repositories,total_members,total_issues,total_comments,total_milestones,total_labels) VALUES (?,?,?,?,?,?,?)')
      stmt.run(
        gh.json_stats.last_updated,
        gh.json_stats.total_repositories,
        gh.json_stats.total_members,
        gh.json_stats.total_issues,
        gh.json_stats.total_comments,
        gh.json_stats.total_milestones,
        gh.json_stats.total_labels
      )
      stmt.finalize(callback)
    })
  })
}

function dbCreateTables (callback) {
  dbDashZero.run('CREATE TABLE IF NOT EXISTS comments (org TEXT, repository TEXT, id INTEGER, creator TEXT, updated_date TEXT, html_url TEXT, issue_url TEXT, PRIMARY KEY(id))')
  dbDashZero.run('CREATE TABLE IF NOT EXISTS issues (org TEXT, repository TEXT, title TEXT, created_date TEXT, comments_count INTEGER, is_pullrequest TEXT, milestone_id TEXT, labels TEXT, html_url TEXT, url TEXT, PRIMARY KEY(url))')
  dbDashZero.run('CREATE TABLE IF NOT EXISTS members (org TEXT, id INTEGER, login TEXT, avatar_url TEXT, type TEXT, PRIMARY KEY(id))')
  dbDashZero.run('CREATE TABLE IF NOT EXISTS milestones (org TEXT, repository TEXT, id INTEGER, title TEXT, state TEXT, open_issues INTEGER, due_on TEXT, html_url TEXT, url TEXT, PRIMARY KEY(id))')
  dbDashZero.run('CREATE TABLE IF NOT EXISTS labels (org TEXT, repository TEXT, name TEXT, url TEXT, PRIMARY KEY(url))')
  callback()
}

// ********************************
// SAVING
// ********************************

function saveAll (callback) {
  dbUpdateMembers(function done () {
    dbUpdateMilestones(function done () {
      dbUpdateIssues(function done () {
        dbUpdateComments(function done () {
          dbUpdateLabels(function done () {
            gh.json_stats = {
              last_updated: new Date(),
              total_repositories: gh.total_repositories,
              total_members: gh.total_members,
              total_issues: gh.total_issues,
              total_comments: gh.total_comments,
              total_milestones: gh.total_milestones,
              total_labels: gh.total_labels
            }
            dbUpdateStats(callback)
          })
        })
      })
    })
  })
}

// ****************
// MISC
// ***************

function checkDataFiles (callback) {
  var args = process.argv
  if (args[2] === 'rebuild') {
    updateAll(function done () {
      console.info('All files rebuilt')
      callback()
    })
  } else if (args[2] === 'getRate') {
    gh.setToken(
      function cb_setToken (status) {
        gh.getRateLeft(function done (rateLeft) {
          console.info(rateLeft)
          callback()
        })
      })
  } else if (args[2] === 'updateLabels') {
    gh.setToken(
      function cb_setToken (status) {
        gh.getRepoLabels(function done () {
          dbUpdateLabels(function done () {
            gh.getRateLeft(function done (rateLeft) {
              console.info(rateLeft)
              callback()
            })
          })
        })
      })
  } else {
    var sql = 'SELECT * FROM stats'
    dbFetchAll(sql, function cb_db_fetch_stats (err, rows) {
      if (err) {
        if (err.message === 'SQLITE_ERROR: no such table: stats') {
          dbCreateTables(function done () {
            updateAll(function done () {
              console.info('All files rebuilt')
              callback()
            })
          })
        } else {
          console.error(err.message)
          logger.error(err.message)
        }
      } else {
        callback()
      }
    })
  }
}

function updateAll (callback) {
  gh.setToken(
    function cb_setTokenIssues (status) {
      gh.getOrgMembers(function done () {
        gh.getRepoMilestones(function done () {
          gh.getRepoLabels(function done () {
            gh.getRepoIssues(function done () {
              saveAll(function done () {
                gh.getRateLeft(function done (rateLeft) {
                  console.info(rateLeft)
                  callback()
                })
              })
            })
          })
        })
      })
    })
}

function updateData (callback) {
  clearTimeout(timerId)
  gh.setToken(
    function cb_setTokenUpdateData (status) {
      var sql = 'SELECT last_updated FROM stats'
      dbFetchAll(sql, function cb_db_fetch_stats (err, rows) {
        if (err) {
          console.error(err.message)
          logger.error(err.message)
        }
        if (new Date() - new Date(Number(rows[0].last_updated)) > 1700000) {
          console.info('Updating data...')
          gh.getRepoMilestones(function done () {
            gh.getRepoLabels(function done () {
              gh.getRepoIssues(function done () {
                saveAll(function done () {
                  gh.getRateLeft(function done (rateLeft) {
                    console.info('Data updated: ' + new Date().toLocaleString())
                    console.info(rateLeft)
                    timerId = setTimeout(updateData, 1800000, function done () { // 30 minutes
                    })
                    callback()
                  })
                })
              })
            })
          })
        } else {
          console.log('Data not stale yet')
          timerId = setTimeout(updateData, 1800000, function done () { // 30 minutes
          })
          callback()
        }
      })
    })
}

function setup (callback) {
  console.error('Please create config.json')
  process.exit()
}

module.exports = {
  init: init,
  checkDataFiles: checkDataFiles,
  updateData: updateData,
  startServer: startServer,
  timerId: timerId
}
