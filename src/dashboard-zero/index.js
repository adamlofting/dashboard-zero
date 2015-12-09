var Promise = require('bluebird')
var fs = require('fs')
Promise.promisifyAll(fs)
var GitHubApi = require('github')

// Holds the total number of issues
var total_issues = 0

// The issues list in csv form
var csv_issues = []

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
      console.log('Success')
      callback()
    })
  } else {
    console.log('No Token')
    callback()
  }
}

function getIssuesFromRepo (callback) {
  github.issues.repoIssues({'user': ORG_NAME, 'repo': REPO_LIST[repo_index], 'per_page': 100}, function cb_1 (err, res) {
    callback(null, processIssues(err, res))
  })
}

function getIssuesFromRepoPage (res, callback) {
  if (github.hasNextPage(res)) {
    github.getNextPage(res, function cb_1 (err, res) {
      callback(null, processIssues(err, res))
    })
  } else {
    callback('No more pages')
  }
}

function processIssues (err, res) {
  // console.log('ProcessIssues: ' + REPO_LIST[repo_index])
  if (err) {
    if (err.message === 'No next page found') {
      return 'Done with this repo'
    } else {
      throw err
    }
  }
  // var issues_count = res.length
  // console.log('res: ' + issues_count)
  processRepoIssueResults(res)
  // if (issues_count === 100) {
  //   getIssuesFromRepoPage(res, ProcessIssuesPage)
  // }
  return res
}

function fetchIssues (err, res) {
  if (err) {
    throw err
  }
  // console.log('Results inside fetchIssues: ' + REPO_LIST[repo_index] + ' ' + res.length)
  getIssuesFromRepoPage(res, ProcessIssuesPage)
}

function ProcessIssuesPage (err, res) {
  if (err) {
    if (err === 'No more pages') {
      // We are done with this repo
      if (repo_index !== (REPO_LIST.length - 1)) {
        // Do the next one
        repo_index++
        getIssuesFromRepo(fetchIssues)
      } else {
        // We should be done and this should only get called once
        saveFileIssues()
        console.log('Done 3: ' + total_issues)
      }
    } else {
      throw err
    }
  } else {
    // console.log('ProcessIssuesPage: ' + REPO_LIST[repo_index] + ' ' + res.length)
    getIssuesFromRepoPage(res, ProcessIssuesPage)
  }
}

function processRepoIssueResults (res) {
  // console.log('processRepoIssueResults: ' + REPO_LIST[repo_index] + ' ' + res.length)
  res.forEach(function fe_repo (element, index, array) {
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
    issue_line += element.html_url +
      '\n'

    // Add to list to be saved to csv
    csv_issues += issue_line

    total_issues++
  })
  return res
}

function saveFileIssues () {
  console.info('All Repos processed')
  var repo_header = 'id,title,created_date,updated_date,comments_count,is_pullrequest,html_url'
  updateFile(repo_header, csv_issues, 'data/issues.csv', cb_update_file)
}

function cb_update_file (err, res) {
  if (err) {
    console.error('Error updating file: ' + err)
    process.exit(1)
  }
  github.misc.rateLimit({}, function cb_rateLimit (err, res) {
    if (err) {
      console.log('Error getting rate: ' + err)
      throw err
    }
    console.log(res.rate.remaining + ' calls remaining, resets at ' + new Date(res.rate.reset * 1000))
    process.exit()
  })
}

// ***********************************
// save the file
// ***********************
function updateFile (header, contents, file_name, callback) {
  fs.writeFile(file_name, header + '\n' + contents, function (err) {
    if (err) callback(err)
    console.info('It\'s saved!')
    callback(null)
  })
}

// =================================================
// =================================================
// =================================================
// =================================================
// =================================================
// =================================================
// =================================================
// =================================================
// =================================================
// =================================================
// =================================================
// =================================================

// function cb_getIssuesFromRepo (err, res, callback) {
//   if (err) {
//     console.log('Error: ' + err)
//     console.log('Error: ' + res)
//     console.log('Error: ' + callback)
//     console.trace(err)
//   }
//   processRepoIssueResults(res, cb_processRepoIssueResults)
//   callback()
// }
//
// function cb_processRepoIssueResults (err, res) {
//   if (err) {
//     if (err.message === 'No next page found') {
//       return
//     } else {
//       if (err.message) {
//         console.log('Why Error?: ' + err)
//         console.log('Why Error?: ' + err)
//       } else {
//         // This is actually a success
//         res = err
//       }
//     }
//   }
//   try {
//     github.getNextPage(res, cb_processRepoIssueResults)
//   } catch (e) {
//     console.error('ERR: ' + e)
//     console.trace(e)
//   }
// }
//
// function getTeamReposByPage (callback) {
//   github.repos.getFromOrg({'org': ORG_NAME, 'type': 'sources', 'per_page': 100}, callback)
// }

module.exports.init = init
module.exports.setToken = setToken
// module.exports.getTeamReposByPage = getTeamReposByPage
module.exports.getIssuesFromRepo = getIssuesFromRepo
module.exports.getIssuesFromRepoPage = getIssuesFromRepoPage
module.exports.processRepoIssueResults = processRepoIssueResults
module.exports.saveFileIssues = saveFileIssues
// module.exports.cb_getIssuesFromRepo = cb_getIssuesFromRepo
module.exports.csv_issues = csv_issues
module.exports.processIssues = processIssues
module.exports.fetchIssues = fetchIssues
