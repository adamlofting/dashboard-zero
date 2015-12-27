var fs = require('fs')
var express = require('express')
var app = express()
var gh = require('./github.js')
var sqlite3 = require('sqlite3').verbose()

// Database setup
var dbDashZero = new sqlite3.Database('data/dash_zero.db')

var CONFIG = []
var SERVER_PORT

function init (callback) {
  fs.readFile('config.json', function (err, data) {
    if (err) {
      console.trace(err)
      throw err
    }
    try {
      CONFIG = JSON.parse(data)
      console.dir(CONFIG)
    } catch (e) {
      console.trace(e)
      throw e
    } finally {
      SERVER_PORT = CONFIG['server_port'] || 3000
      gh.init(CONFIG, callback)
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
        console.trace(err)
        throw err
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
        console.trace(err)
        throw err
      }
      if (req.query.export) {
        res.send('Export not supported...yet')
      } else {
        res.send(rows)
      }
    })
  })
  app.get('/api/all/issues/unanswered', function (req, res) {
    var sql = 'SELECT * FROM issues WHERE comments_count = 0'
    dbFetchAll(sql, function cb_db_fetch_issues_unanswered (err, rows) {
      if (err) {
        console.trace(err)
        throw err
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
        console.trace(err)
        throw err
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
        console.trace(err)
        throw err
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
        console.trace(err)
        throw err
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
        console.trace(err)
        throw err
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
  try {
    dbDashZero.all(sql, callback)
  } catch (e) {
    console.trace(e)
    throw e
  }
}

function dbUpdateComments (callback) {
  console.info('Saving issue comments to database...')
  try {
    var stmt = dbDashZero.prepare('REPLACE INTO comments   (org,repository,id,creator,updated_date,html_url,issue_url) VALUES (?,?,?,?,?,?,?)')
    gh.json_comments.forEach(function fe_db_comments (element, index, array) {
      var e = element
      stmt.run(e.org, e.repository, e.id, e.creator, e.updated_date, e.html_url, e.issue_url)
    })
    stmt.finalize(callback)
  } catch (e) {
    console.trace(e)
    throw e
  }
}

function dbUpdateIssues (callback) {
  console.info('Saving issues to database...')
  try {
    var stmt = dbDashZero.prepare('REPLACE INTO issues   (org,repository,title,created_date,comments_count,is_pullrequest,html_url,url) VALUES (?,?,?,?,?,?,?,?)')
    gh.json_issues.forEach(function fe_db_issues (element, index, array) {
      var e = element
      stmt.run(e.org, e.repository, e.title, e.created_at, e.comments, e.is_pullrequest, e.html_url, e.url)
    })
    stmt.finalize(callback)
  } catch (e) {
    console.trace(e)
    throw e
  }
}

function dbUpdateMembers (callback) {
  console.info('Saving members to database...')
  try {
    var stmt = dbDashZero.prepare('REPLACE INTO members (org,id,login,avatar_url,type) VALUES (?,?,?,?,?)', function done () {
      gh.json_members.forEach(function fe_db_members (element, index, array) {
        var e = element
        stmt.run(e.org, e.id, e.login, e.avatar_url, e.type)
      })
      stmt.finalize(callback)
    })
  } catch (e) {
    console.trace(e)
    throw e
  }
}

function dbUpdateMilestones (callback) {
  console.info('Saving milestones to database...')
  try {
    var stmt = dbDashZero.prepare('REPLACE INTO milestones (org,repository,id,title,state,open_issues,due_on,html_url,url) VALUES (?,?,?,?,?,?,?,?,?)')
    gh.json_milestones.forEach(function fe_db_milestones (element, index, array) {
      var e = element
      stmt.run(e.org, e.repository, e.id, e.title, e.state, e.open_issues, e.due_on, e.html_url, e.url)
    })
    stmt.finalize(callback)
  } catch (e) {
    console.trace(e)
    throw e
  }
}

function dbUpdateLabels (callback) {
  console.info('Saving labels to database...')
  try {
    var stmt = dbDashZero.prepare('REPLACE INTO labels (org,repository,name,url) VALUES (?,?,?,?)')
    gh.json_labels.forEach(function fe_db_labels (element, index, array) {
      var e = element
      stmt.run(e.org, e.repository, e.name, e.url)
    })
    stmt.finalize(callback)
  } catch (e) {
    console.trace(e)
    throw e
  }
}

function dbUpdateStats (callback) {
  console.info('Saving stats to database...')
  try {
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
  } catch (e) {
    console.trace(e)
    throw e
  }
}

function dbCreateTables (callback) {
  try {
    dbDashZero.run('CREATE TABLE IF NOT EXISTS comments (org TEXT, repository TEXT, id INTEGER, creator TEXT, updated_date TEXT, html_url TEXT, issue_url TEXT, PRIMARY KEY(id))')
    dbDashZero.run('CREATE TABLE IF NOT EXISTS issues (org TEXT, repository TEXT, title TEXT, created_date TEXT, comments_count INTEGER, is_pullrequest TEXT, html_url TEXT, url TEXT, PRIMARY KEY(url))')
    dbDashZero.run('CREATE TABLE IF NOT EXISTS members (org TEXT, id INTEGER, login TEXT, avatar_url TEXT, type TEXT, PRIMARY KEY(id))')
    dbDashZero.run('CREATE TABLE IF NOT EXISTS milestones (org TEXT, repository TEXT, id INTEGER, title TEXT, state TEXT, open_issues INTEGER, due_on TEXT, html_url TEXT, url TEXT, PRIMARY KEY(id))')
    dbDashZero.run('CREATE TABLE IF NOT EXISTS labels (org TEXT, repository TEXT, name TEXT, url TEXT, PRIMARY KEY(url))')
    callback()
  } catch (e) {
    console.trace(e)
    throw e
  }
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
            dbUpdateStats(function done () {
              // console.info('Done m: ' + total_members + ', ' + json_members.length)
              // console.info('Done i: ' + total_issues + ', ' + json_issues.length)
              // console.info('Done m2: ' + total_milestones + ', ' + json_milestones.length)
              // console.info('Done c: ' + total_comments + ', ' + json_comments.length)
              // console.info('Done l: ' + total_labels + ', ' + json_labels.length)
              callback()
            })
          })
        })
      })
    })
  })
}

// /**
// * Export members from memory to csv
// */
// function saveFileMembers (callback) {
//   console.info('All Members processed')
//   var repo_header = 'org,id,login,avatar_url,type'
//   updateFile(repo_header, csv_members, 'data/members.csv', function cb_update_file (err, res) {
//     if (err) {
//       console.error('Error updating file: ' + err)
//       process.exit(1)
//     }
//     callback()
//   })
// }

// /**
// * Exports issues from memory to csv
// */
// function saveFileIssues (callback) {
//   console.info('All Issues processed')
//   var repo_header = 'org,repository,id,title,created_date,updated_date,comments_count,is_pullrequest,html_url,url'
//   updateFile(repo_header, csv_issues, 'data/issues.csv', function cb_update_file (err, res) {
//     if (err) {
//       console.error('Error updating file: ' + err)
//       process.exit(1)
//     }
//     fs.writeFile('data/issues.json', JSON.stringify(json_issues), function (err) {
//       if (err) callback(err)
//       // console.info('It\'s saved!')
//       callback(null)
//     })
//   })
// }

// /**
// * Export milestones from memory to csv
// */
// function saveFileMilestones (callback) {
//   console.info('All Milestones processed')
//   var repo_header = 'org,repository,title,state,open_issues,due_on,html_url,url'
//   updateFile(repo_header, csv_milestones, 'data/milestones.csv', function cb_update_file (err, res) {
//     if (err) {
//       console.error('Error updating file: ' + err)
//       process.exit(1)
//     }
//     fs.writeFile('data/milestones.json', JSON.stringify(json_milestones), function (err) {
//       if (err) callback(err)
//       // console.info('It\'s saved!')
//       callback(null)
//     })
//   })
// }

// /**
// * Exports issue labels from memory to csv
// */
// function saveFileLabels (callback) {
//   console.info('All Labels processed')
//   var repo_header = 'org,repository,name,url'
//   updateFile(repo_header, csv_labels, 'data/labels.csv', function cb_update_file (err, res) {
//     if (err) {
//       console.error('Error updating file: ' + err)
//       process.exit(1)
//     }
//     callback()
//   })
// }

// /**
// * Export issue comments from memory to csv
// */
// function saveFileComments (callback) {
//   console.info('All Comments processed')
//   var repo_header = 'org,repository,id,creator,updated_date,html_url,issue_url'
//   updateFile(repo_header, csv_comments, 'data/comments.csv', function cb_update_file (err, res) {
//     if (err) {
//       console.error('Error updating file: ' + err)
//       process.exit(1)
//     }
//     callback()
//   })
// }

// /**
// * Exports stats from memory to json
// */
// function saveFileStats (callback) {
//   console.info('Saving stats')
//   fs.writeFile('data/stats.json', json_stats, function (err) {
//     if (err) callback(err)
//     // console.info('It\'s saved!')
//     callback(null)
//   })
// }

// // ***********************************
// // save the file
// // ***********************
// function updateFile (header, contents, file_name, callback) {
//   fs.writeFile(file_name, header + '\n' + contents, function (err) {
//     if (err) callback(err)
//     // console.info('It\'s saved!')
//     callback(null)
//   })
// }

// ****************
// MISC
// ***************

function checkDataFiles (callback) {
  try {
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
                // console.info(json_labels)
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
            console.trace(err)
            throw err
          }
        } else {
          callback()
        }
      })
    }
  } catch (e) {
    console.trace(e)
    throw e
  }
}

function checkConfig (callback) {
  var stats = []
  try {
    stats.push(fs.statSync('config.json'))
    stats.forEach(function fe_repo (element, index, array) {
    })
    callback()
  } catch (e) {
    if (e.code === 'ENOENT') {
      console.error(e.path + ' not found.')
      console.info('Launching setup wizard...')
      setup(function done () {
        console.info('Setup complete')
        callback()
      })
    } else {
      console.error(e)
      throw e
    }
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
  gh.setToken(
    function cb_setTokenUpdateData (status) {
      var sql = 'SELECT last_updated FROM stats'
      dbFetchAll(sql, function cb_db_fetch_stats (err, rows) {
        if (err) {
          console.trace(err)
          throw err
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
                    callback()
                  })
                })
              })
            })
          })
        } else {
          callback()
        }
      })
    })
}

function setup (callback) {
  console.error('Please create config.json')
  process.exit(1)
}

module.exports = {
  init: init,
  checkDataFiles: checkDataFiles,
  updateData: updateData,
  checkConfig: checkConfig,
  startServer: startServer
}
