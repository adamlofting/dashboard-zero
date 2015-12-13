var async = require('async')
var fs = require('fs')
var GitHubApi = require('github')

// Holds the totals
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

var repo_index = 0

var github
var ORG_NAME
var REPO_LIST

function init (org_name, repo_list) {
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
  ORG_NAME = org_name
  REPO_LIST = repo_list
}

function setToken (callback) {
  if (process.env.GH_TOKEN !== undefined) {
    github.authenticate({
      type: 'token',
      token: process.env.GH_TOKEN
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
    user: ORG_NAME,
    repo: REPO_LIST[repo_index],
    per_page: 100
  }

  // To see the data from github: curl -i https://api.github.com/orgs/mozilla/repos?per_page=1
  github.issues.repoIssues(msg, function gotFromOrg (err, res) {
    if (err) {
      console.log(err)
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
      var issue_line =
        element.id + ',"' +
        element.title.replace(/"/g, '&quot;') + '",' +
        element.created_at + ',' +
        element.updated_at + ',' +
        element.comments + ','
      if (element.pull_request) {
        issue_line += 'true' + ','
      } else {
        issue_line += 'false' + ','
      }
      issue_line += element.html_url + ',' +
        element.url +
        '\n'

      // Add to list to be saved to csv
      csv_issues += issue_line

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
    user: ORG_NAME,
    repo: REPO_LIST[repo_index],
    per_page: 100
  }

  // To see the data from github: curl -i https://api.github.com/orgs/mozilla/repos?per_page=1
  github.issues.getAllMilestones(msg, function gotFromOrg (err, res) {
    if (err) {
      console.log(err)
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
        ORG_NAME + ',' +
        REPO_LIST[repo_index] + ',' +
        '"' + element.title.replace(/"/g, '&quot;') + '",' +
        element.state + ',' +
        element.open_issues + ',' +
        element.due_on + ',' +
        element.html_url + ',' +
        element.url +
        '\n'

      // Add to list to be saved to csv
      csv_milestones += milestone_line

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
    user: ORG_NAME,
    repo: REPO_LIST[repo_index],
    per_page: 100
  }

  // To see the data from github: curl -i https://api.github.com/orgs/mozilla/repos?per_page=1
  github.issues.getLabels(msg, function gotFromOrg (err, res) {
    if (err) {
      console.log(err)
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
        ORG_NAME + ',' +
        REPO_LIST[repo_index] + ',' +
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
  github.issues.getComments({'user': ORG_NAME, 'repo': REPO_LIST[repo_index], 'number': issue_id, 'per_page': 100}, function cb_1 (err, res) {
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
      ORG_NAME + ',' +
      REPO_LIST[repo_index] + ',' +
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
    org: ORG_NAME,
    type: 'public',
    per_page: 100
  }

  // To see the data from github: curl -i https://api.github.com/orgs/mozilla/repos?per_page=1
  github.orgs.getMembers(msg, function gotFromOrg (err, res) {
    if (err) {
      console.log(err)
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
            console.log('Done m: ' + total_members)
            console.log('Done i: ' + total_issues)
            console.log('Done m2: ' + total_milestones)
            console.log('Done c: ' + total_comments)
            console.log('Done l: ' + total_labels)
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
  var repo_header = 'id,login,avatar_url,type'
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
    callback()
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
    callback()
  })
}

function saveFileLabels (callback) {
  console.info('All Labels processed')
  var repo_header = 'org,repository,title,state,open_issues,due_on,html_url,url'
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
  var repo_header = 'id,creator,updated_date,html_url,issue_url'
  updateFile(repo_header, csv_comments, 'data/comments.csv', function cb_update_file (err, res) {
    if (err) {
      console.error('Error updating file: ' + err)
      process.exit(1)
    }
    callback()
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

function checkFiles (callback) {
  var stats = []
  try {
    stats.push(fs.statSync('data/members.csv'))
    stats.push(fs.statSync('data/issues.csv'))
    stats.push(fs.statSync('data/milestones.csv'))
    stats.push(fs.statSync('data/comments.csv'))
    stats.push(fs.statSync('data/labels.csv'))
    stats.forEach(function fe_repo (element, index, array) {
      // console.log(element.isFile())
    })
    console.log('All files exist')
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

function cleanAll (callback) {
  fs.unlink('data/members.csv', function done () {
    fs.unlink('data/issues.csv', function done () {
      fs.unlink('data/labels.csv', function done () {
        fs.unlink('data/milestones.csv', function done () {
          fs.unlink('data/comments.csv', function done () {
            console.log('All files cleaned')
            callback()
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
  checkFiles: checkFiles
}
