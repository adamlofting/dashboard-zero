var async = require('async')
var fs = require('fs')
var express = require('express')
var app = express()
var GitHubApi = require('github')

// Holds the totals
var total_repositories = 0
var total_issues = 0
var total_comments = 0
var total_members = 0
var total_milestones = 0
var total_labels = 0

// The lists in csv form
var csv_issues = []
var csv_comments = []
var csv_members = []
var csv_milestones = []
var csv_labels = []

// The lists in json form
var json_issues = []
var json_comments = []
var json_members = []
var json_milestones = []
var json_labels = []

var repo_index = 0

var CONFIG = []
var github
var REPO_LIST
var SERVER_PORT

var json_stats = []

function init (callback) {
  fs.readFile('config.json', function (err, data) {
    if (err) throw err
    try {
      var config = JSON.parse(data)
    } catch (e) {
      throw e
    } finally {
      github = new GitHubApi({
        // required
        version: '3.0.0',
        // optional
        protocol: 'https',
        host: 'api.github.com', // should be api.github.com for GitHub
        pathPrefix: '', // for some GHEs; none for GitHub
        timeout: 5000,
        headers: {
          'user-agent': 'drazisil' // GitHub is happy with a unique user agent
        }
      })
      CONFIG = config
      REPO_LIST = config['repo_list']
      SERVER_PORT = config['server_port'] || 3000
      total_repositories = REPO_LIST.length
      callback()
    }
  })
}

function setToken (callback) {
  if (CONFIG['token'] !== undefined) {
    github.authenticate({
      type: 'token',
      token: CONFIG['token']
    })

    github.misc.rateLimit({}, function cb_rateLimit (err, res) {
      if (err) {
        throw err
      }
      console.info('GitHub Login: Success')
      callback()
    })
  } else {
    console.error('GutHub Login: No Token')
    callback()
  }
}

function startServer (callback) {
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
  app.use(express.static(__dirname + '../../../public'))
  app.use(express.static(__dirname + '../../../data'))

  // app.use(express.static('data'))

  app.listen(SERVER_PORT)
  console.log('Server now running on http://localhost:' + SERVER_PORT)
}

// ********************************
// ISSUES
// ********************************

/**
 * Get a list of the members linked to an org
 * @param  {String}   org      github org name
 * @param  {Function} callback
 * @return {Object}
 */
function getRepoIssues (callback) {
  // console.log(repo)

  var githubClient = github

  // The options msg we send to the client http://mikedeboer.github.io/node-github/#repos.prototype.getFromOrg
  var msg = {
    user: REPO_LIST[repo_index].org,
    repo: REPO_LIST[repo_index].repo,
    per_page: 100
  }

  // To see the data from github: curl -i https://api.github.com/orgs/mozilla/repos?per_page=1
  github.issues.repoIssues(msg, function gotFromOrg (err, res) {
    if (err) {
      console.trace(err)
    }
    // this has loaded the first page of results
    // get the values we want out of this response
    getSelectedIssueValues(res)

    // setup variables to use in the whilst loop below
    var ghResult = res
    var hasNextPage = truthy(githubClient.hasNextPage(res))

    // now we work through any remaining pages
    async.whilst(
      function test () {
        return hasNextPage
      },
      function doThis (callback) {
        githubClient.getNextPage(ghResult, function gotNextPage (err, res) {
          if (err) {
            throw err
          }
          // get the values we want out of this response
          getSelectedIssueValues(res)

          // update the variables used in the whilst logic
          ghResult = res
          hasNextPage = truthy(githubClient.hasNextPage(res))

          callback(null)
        })
      },
      function done (err) {
        if (err) {
          throw err
        }
        if (repo_index < (REPO_LIST.length - 1)) {
          repo_index++
          getRepoIssues(callback)
        } else {
          repo_index = 0
          callback()
        }
      })
  })
}

/**
 * Extract the values we want from all the data available in the API
 * @param  {JSON} ghRes, a single respsonse from the github API
 * @return {Array}
 */
function getSelectedIssueValues (ghRes) {
  if (ghRes) {
    ghRes.forEach(function fe_repo (element, index, array) {
      // Check if PR
      var is_pr = false
      if (element.pull_request) {
        is_pr = 'true'
      }

      var issue_line =
        REPO_LIST[repo_index].org + ',' +
        REPO_LIST[repo_index].repo + ',' +
        element.id + ',"' +
        element.title.replace(/"/g, '&quot;') + '",' +
        element.created_at + ',' +
        element.updated_at + ',' +
        element.comments + ',' +
        is_pr + ',' + ',' +
        element.html_url + ',' +
        element.url +
        '\n'

      // Add to list to be saved to csv
      csv_issues += issue_line

      issue_line = {
        'org': REPO_LIST[repo_index].org,
        'repository': REPO_LIST[repo_index].repo,
        'id': element.id,
        'title': element.title.replace(/"/g, '&quot;'),
        'created_at': element.created_at,
        'updated_at': element.updated_at,
        'comments': element.comments,
        'is_pullrequest': is_pr,
        'html_url': element.html_url.replace(/"/g, '&quot;').replace(/,/g, '%2C'),
        'url': element.url
      }

      // Add to list to be saved to csv
      json_issues.push(issue_line)

      // Process comments
      getCommentsFromIssue(element.number)

      total_issues++
    })
  }
  return ghRes
}

// ********************************
// MILESTONES
// ********************************

/**
 * Get a list of the members linked to an org
 * @param  {String}   org      github org name
 * @param  {Function} callback
 * @return {Object}
 */
function getRepoMilestones (callback) {
  var githubClient = github

  // The options msg we send to the client http://mikedeboer.github.io/node-github/#repos.prototype.getFromOrg
  var msg = {
    user: REPO_LIST[repo_index].org,
    repo: REPO_LIST[repo_index].repo,
    per_page: 100
  }

  // To see the data from github: curl -i https://api.github.com/orgs/mozilla/repos?per_page=1
  github.issues.getAllMilestones(msg, function gotFromOrg (err, res) {
    if (err) {
      console.throw(err)
    }
    // this has loaded the first page of results
    // get the values we want out of this response
    getSelectedMilestoneValues(res)

    // setup variables to use in the whilst loop below
    var ghResult = res
    var hasNextPage = truthy(githubClient.hasNextPage(res))

    // now we work through any remaining pages
    async.whilst(
      function test () {
        return hasNextPage
      },
      function doThis (callback) {
        githubClient.getNextPage(ghResult, function gotNextPage (err, res) {
          if (err) {
            throw err
          }
          // get the values we want out of this response
          getSelectedMilestoneValues(res)

          // update the variables used in the whilst logic
          ghResult = res
          hasNextPage = truthy(githubClient.hasNextPage(res))

          callback(null)
        })
      },
      function done (err) {
        if (err) {
          throw err
        }
        if (repo_index < (REPO_LIST.length - 1)) {
          repo_index++
          getRepoMilestones(callback)
        } else {
          repo_index = 0
          callback()
        }
      })
  })
}

/**
 * Extract the values we want from all the data available in the API
 * @param  {JSON} ghRes, a single respsonse from the github API
 * @return {Array}
 */
function getSelectedMilestoneValues (ghRes) {
  if (ghRes) {
    ghRes.forEach(function fe_repo (element, index, array) {
      var milestone_line =
        REPO_LIST[repo_index].org + ',' +
        REPO_LIST[repo_index].repo + ',' +
        '"' + element.title.replace(/"/g, '&quot;') + '",' +
        element.state + ',' +
        element.open_issues + ',' +
        element.due_on + ',' +
        '"' + element.html_url.replace(/"/g, '&quot;').replace(/,/g, '%2C') + '",' +
        element.url +
        '\n'

      // Add to list to be saved to csv
      csv_milestones += milestone_line

      milestone_line = {
        'org': REPO_LIST[repo_index].org,
        'repository': REPO_LIST[repo_index].repo,
        'title': element.title.replace(/"/g, '&quot;'),
        'state': element.state,
        'open_issues': element.open_issues,
        'due_on': element.due_on,
        'html_url': element.html_url.replace(/"/g, '&quot;').replace(/,/g, '%2C'),
        'url': element.url
      }

      // Add to list to be saved to csv
      json_milestones.push(milestone_line)

      total_milestones++
    })
  }
  return ghRes
}

// ********************************
// LABELS
// ********************************

/**
 * Get a list of the members linked to an org
 * @param  {String}   org      github org name
 * @param  {Function} callback
 * @return {Object}
 */
function getRepoLabels (callback) {
  var githubClient = github

  // The options msg we send to the client http://mikedeboer.github.io/node-github/#repos.prototype.getFromOrg
  var msg = {
    user: REPO_LIST[repo_index].org,
    repo: REPO_LIST[repo_index].repo,
    per_page: 100
  }

  // To see the data from github: curl -i https://api.github.com/orgs/mozilla/repos?per_page=1
  github.issues.getLabels(msg, function gotFromOrg (err, res) {
    if (err) {
      console.throw(err)
    }
    // this has loaded the first page of results
    // get the values we want out of this response
    getSelectedLabelValues(res)

    // setup variables to use in the whilst loop below
    var ghResult = res
    var hasNextPage = truthy(githubClient.hasNextPage(res))

    // now we work through any remaining pages
    async.whilst(
      function test () {
        return hasNextPage
      },
      function doThis (callback) {
        githubClient.getNextPage(ghResult, function gotNextPage (err, res) {
          if (err) {
            throw err
          }
          // get the values we want out of this response
          getSelectedMilestoneValues(res)

          // update the variables used in the whilst logic
          ghResult = res
          hasNextPage = truthy(githubClient.hasNextPage(res))

          callback(null)
        })
      },
      function done (err) {
        if (err) {
          throw err
        }
        if (repo_index < (REPO_LIST.length - 1)) {
          repo_index++
          getRepoLabels(callback)
        } else {
          repo_index = 0
          callback()
        }
      })
  })
}

/**
 * Extract the values we want from all the data available in the API
 * @param  {JSON} ghRes, a single respsonse from the github API
 * @return {Array}
 */
function getSelectedLabelValues (ghRes) {
  if (ghRes) {
    ghRes.forEach(function fe_repo (element, index, array) {
      var label_line =
        REPO_LIST[repo_index].org + ',' +
        REPO_LIST[repo_index].repo + ',' +
        '"' + element.name.replace(/"/g, '&quot;') + '",' +
        element.url +
        '\n'

      // Add to list to be saved to csv
      csv_labels += label_line

      total_labels++
    })
  }
  return ghRes
}

// ********************************
// COMMENTS
// ********************************

function getCommentsFromIssue (issue_id) {
  github.issues.getComments({'user': REPO_LIST[repo_index].org, 'repo': REPO_LIST[repo_index].repo, 'number': issue_id, 'per_page': 100}, function cb_1 (err, res) {
    fetchIssueComments(null, processIssueComments(err, res))
  })
}

function fetchIssueComments (err, res) {
  if (err) {
    throw err
  }
  if (github.hasNextPage(res)) {
    github.getNextPage(res, function cb_1 (err, res) {
      processIssueCommentsPage(null, processIssueComments(err, res))
    })
  } else {
    processIssueCommentsPage('No more pages')
  }
}

function processIssueComments (err, res) {
  // console.log('ProcessIssues: ' + REPO_LIST[repo_index])
  if (err) {
    if (err.message === 'No next page found') {
      return 'Done with this repo'
    } else {
      // Why does this error?
      console.log('=' + err.message + '=')
      console.trace(err)
      throw err
    }
  }
  res.forEach(function fe_repo (element, index, array) {
    var comment_line =
      REPO_LIST[repo_index].org + ',' +
      REPO_LIST[repo_index].repo + ',' +
      element.id + ',"' +
      element.user.login + '",' +
      element.updated_at + ',' +
      element.html_url + ',' +
      element.issue_url +
      '\n'

    // Add to list to be saved to csv
    csv_comments += comment_line

    total_comments++
  })
  return res
}

function processIssueCommentsPage (err, res) {
  if (err) {
    if (err === 'No more pages') {
      // We are done with this repo
    } else {
      throw err
    }
  } else {
    if (github.hasNextPage(res)) {
      github.getNextPage(res, function cb_1 (err, res) {
        processIssueCommentsPage(null, processIssueComments(err, res))
      })
    } else {
      processIssueCommentsPage('No more pages')
    }
  }
}

// ********************************
// MEMBERS
// ********************************

/**
 * Get a list of the members linked to an org
 * @param  {String}   org      github org name
 * @param  {Function} callback
 * @return {Object}
 */
function getOrgMembers (callback) {
  var githubClient = github

  // The options msg we send to the client http://mikedeboer.github.io/node-github/#repos.prototype.getFromOrg
  var msg = {
    org: REPO_LIST[repo_index].org,
    type: 'public',
    per_page: 100
  }

  // To see the data from github: curl -i https://api.github.com/orgs/mozilla/repos?per_page=1
  github.orgs.getMembers(msg, function gotFromOrg (err, res) {
    if (err) {
      console.log(REPO_LIST[repo_index].org)
      console.trace(err)
    }
    // this has loaded the first page of results
    // get the values we want out of this response
    getSelectedMemberValues(res)

    // setup variables to use in the whilst loop below
    var ghResult = res
    var hasNextPage = truthy(githubClient.hasNextPage(res))

    // now we work through any remaining pages
    async.whilst(
      function test () {
        return hasNextPage
      },
      function doThis (callback) {
        githubClient.getNextPage(ghResult, function gotNextPage (err, res) {
          if (err) {
            throw err
          }
          // get the values we want out of this response
          getSelectedMemberValues(res)

          // update the variables used in the whilst logic
          ghResult = res
          hasNextPage = truthy(githubClient.hasNextPage(res))

          callback(null)
        })
      },
      function done (err) {
        if (err) {
          throw err
        }
        callback()
      })
  })
}

/**
 * Extract the values we want from all the data available in the API
 * @param  {JSON} ghRes, a single respsonse from the github API
 * @return {Array}
 */
function getSelectedMemberValues (ghRes) {
  if (ghRes) {
    ghRes.forEach(function fe_repo (element, index, array) {
      var member_line =
        REPO_LIST[repo_index].org + ',' +
        element.id + ',"' +
        element.login + '",' +
        element.avatar_url + ',' +
        element.type +
        '\n'

      // Add to list to be saved to csv
      csv_members += member_line

      total_members++
    })
  }
  return ghRes
}

// ********************************
// SAVING
// ********************************

function saveAll (callback) {
  saveFileMembers(function done () {
    saveFileIssues(function done () {
      saveFileMilestones(function done () {
        saveFileLabels(function done () {
          saveFileComments(function done () {
            var stats = {
              last_updated: new Date(),
              total_repositories: total_repositories,
              total_members: total_members,
              total_issues: total_issues,
              total_comments: total_comments,
              total_milestones: total_milestones,
              total_labels: total_labels
            }
            json_stats = JSON.stringify(stats)
            saveFileStats(function done () {
              console.log('Done m: ' + total_members)
              console.log('Done i: ' + total_issues)
              console.log('Done m2: ' + total_milestones)
              console.log('Done c: ' + total_comments)
              console.log('Done l: ' + total_labels)
              callback()
            })
          })
        })
      })
    })
  })
}

function getRateLeft (callback) {
  github.misc.rateLimit({}, function cb_rateLimit (err, res) {
    if (err) {
      console.log('Error getting rate: ' + err)
      throw err
    }
    callback(res.rate.remaining + ' calls remaining, resets at ' + new Date(res.rate.reset * 1000))
  })
}

function saveFileMembers (callback) {
  console.info('All Members processed')
  var repo_header = 'org,id,login,avatar_url,type'
  updateFile(repo_header, csv_members, 'data/members.csv', function cb_update_file (err, res) {
    if (err) {
      console.error('Error updating file: ' + err)
      process.exit(1)
    }
    callback()
  })
}

function saveFileIssues (callback) {
  console.info('All Issues processed')
  var repo_header = 'org,repository,id,title,created_date,updated_date,comments_count,is_pullrequest,html_url,url'
  updateFile(repo_header, csv_issues, 'data/issues.csv', function cb_update_file (err, res) {
    if (err) {
      console.error('Error updating file: ' + err)
      process.exit(1)
    }
    fs.writeFile('data/issues.json', JSON.stringify(json_issues), function (err) {
      if (err) callback(err)
      // console.info('It\'s saved!')
      callback(null)
    })
  })
}

function saveFileMilestones (callback) {
  console.info('All Milestones processed')
  var repo_header = 'org,repository,title,state,open_issues,due_on,html_url,url'
  updateFile(repo_header, csv_milestones, 'data/milestones.csv', function cb_update_file (err, res) {
    if (err) {
      console.error('Error updating file: ' + err)
      process.exit(1)
    }
    fs.writeFile('data/milestones.json', JSON.stringify(json_milestones), function (err) {
      if (err) callback(err)
      // console.info('It\'s saved!')
      callback(null)
    })
  })
}

function saveFileLabels (callback) {
  console.info('All Labels processed')
  var repo_header = 'org,repository,name,url'
  updateFile(repo_header, csv_labels, 'data/labels.csv', function cb_update_file (err, res) {
    if (err) {
      console.error('Error updating file: ' + err)
      process.exit(1)
    }
    callback()
  })
}

function saveFileComments (callback) {
  console.info('All Comments processed')
  var repo_header = 'org,repository,id,creator,updated_date,html_url,issue_url'
  updateFile(repo_header, csv_comments, 'data/comments.csv', function cb_update_file (err, res) {
    if (err) {
      console.error('Error updating file: ' + err)
      process.exit(1)
    }
    callback()
  })
}

function saveFileStats (callback) {
  console.info('Saving stats')
  fs.writeFile('data/stats.json', json_stats, function (err) {
    if (err) callback(err)
    // console.info('It\'s saved!')
    callback(null)
  })
}

// ***********************************
// save the file
// ***********************
function updateFile (header, contents, file_name, callback) {
  fs.writeFile(file_name, header + '\n' + contents, function (err) {
    if (err) callback(err)
    // console.info('It\'s saved!')
    callback(null)
  })
}

// ****************
// MISC
// ***************

/**
 * A util
 */
function truthy (o) {
  if (o) {
    return true
  }
  return false
}

function checkDataFiles (callback) {
  var files = [
    'members.csv',
    'issues.csv', 'issues.json',
    'milestones.csv', 'milestones.json',
    'comments.csv',
    'labels.csv',
    'stats.json'
  ]
  var stats = []
  try {
    files.forEach(function fe_file (element, index, array) {
      stats.push(fs.statSync('data/' + element))
    })
    stats.forEach(function fe_file (element, index, array) {
      // console.log(element.isFile())
    })
    callback()
  } catch (e) {
    if (e.code === 'ENOENT') {
      console.error(e.path + ' not found.')
      cleanAll(function done () {
        console.info('Rebulding files...')
        updateAll(function done () {
          console.log('All files rebuilt')
          callback()
        })
      })
    } else {
      console.error(e)
      throw e
    }
  }
}

function checkConfig (callback) {
  var stats = []
  try {
    stats.push(fs.statSync('config.json'))
    stats.forEach(function fe_repo (element, index, array) {
      // console.log(element.isFile())
    })
    callback()
  } catch (e) {
    if (e.code === 'ENOENT') {
      console.error(e.path + ' not found.')
      cleanAll(function done () {
        console.info('Launching setup wizard...')
        setup(function done () {
          console.log('Setup complete')
          callback()
        })
      })
    } else {
      console.error(e)
      throw e
    }
  }
}

function cleanAll (callback) {
  fs.unlink('data/members.csv', function done () {
    fs.unlink('data/issues.csv', function done () {
      fs.unlink('data/issues.json', function done () {
        fs.unlink('data/labels.csv', function done () {
          fs.unlink('data/milestones.csv', function done () {
            fs.unlink('data/milestones.json', function done () {
              fs.unlink('data/comments.csv', function done () {
                fs.unlink('data/stats.json', function done () {
                  console.log('All files cleaned')
                  callback()
                })
              })
            })
          })
        })
      })
    })
  })
}

function updateAll (callback) {
  setToken(
    function cb_setTokenIssues (status) {
      getOrgMembers(function done () {
        getRepoMilestones(function done () {
          getRepoLabels(function done () {
            getRepoIssues(function done () {
              saveAll(function done () {
                getRateLeft(function done (rateLeft) {
                  console.log(rateLeft)
                  callback()
                })
              })
            })
          })
        })
      })
    }
  )
}

function setup (callback) {
  console.log('Please create config.json')
  process.exit(1)
}

module.exports = {
  init: init,
  setToken: setToken,
  saveFileIssues: saveFileIssues,
  csv_issues: csv_issues,
  getOrgMembers: getOrgMembers,
  getRepoIssues: getRepoIssues,
  getRepoMilestones: getRepoMilestones,
  saveAll: saveAll,
  getRateLeft: getRateLeft,
  checkDataFiles: checkDataFiles,
  checkConfig: checkConfig,
  startServer: startServer
}
