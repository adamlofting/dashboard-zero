var Promise = require('bluebird')
var fs = require('fs')
Promise.promisifyAll(fs)
// var github = require('./src/github.js')
var GitHubApi = require('github')

// Holds the total number of repos
var total_repos = 0

// The repo list in csv form
var csv_repos = []

// The GitHub org name we are scanning
var ORG_NAME = 'mozilla'

var github = new GitHubApi({
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

// *******************************
// Start of code
// ****************************
setToken()

function setToken (callback) {
  if (process.env.GH_TOKEN !== undefined) {
    github.authenticate({
      type: 'token',
      token: process.env.GH_TOKEN
    })

    github.misc.rateLimit({}, function cb_rateLimit (err, res) {
      if (err) {
        console.log('err?')
        throw err
      }
      console.log('Success')
      getTeamReposByPage()
    })
  } else {
    console.log('No Token')
    callback()
  }
}

function getTeamReposByPage () {
  github.repos.getFromOrg({'org': ORG_NAME, 'type': 'sources', 'per_page': 100}, function cb_getTeamReposByPage (err, res) {
    if (err) {
      console.log('err?')
      console.error(err)
      process.exit(1)
    }
    cb_getTeamRepos(null, res)
    github.getNextPage(res)
  })
}

function saveFile () {
  console.info(total_repos + ' total repos fetched.')
  console.info('All Repos processed')
  var repo_header = 'name,stars,forks,open_issues,language'
  updateFile(repo_header, csv_repos, 'data/repos.csv', function cb_update_file (err, res) {
    if (err) {
      console.error('Error updating file: ' + err)
      process.exit(1)
    }
    github.misc.rateLimit({}, function cb_rateLimit (err, res) {
      if (err) {
        console.log('err?')
        throw err
      }
      console.log(res.rate.remaining + ' calls remaining, resets at ' + new Date(res.rate.reset * 1000))
      process.exit()
    })
  })
}
function cb_getTeamRepos (err, res) {
  if (err) {
    if (err.message === 'No next page found') {
      saveFile()
    } else {
      console.log('err?')
      console.trace(err)
    }
  } else {
    console.log(res.length)
    res.forEach(function fe_repo (element, index, array) {
      var repo_line =
        element.name + ',' +
        element.stargazers_count + ',' +
        element.forks_count + ',' +
        element.open_issues_count + ',' +
        element.language +
        '\n'

      // Add to list to be saved to csv
      csv_repos += repo_line

      total_repos++
    })
    github.getNextPage(res, cb_getTeamRepos)
  }
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

// // // **********************************************************
// // // Called by a timer to avoid hitting the GitHub rate limits
// // //
// // // Processes each issue to get details regarding age and if is pull request
// // // **********************************************************
// // function processIssues (repo_name, callback) {
// //   clearInterval(api_timer_id)
// //
// //   var project_issues_path = '/repos/mozilla/' + repo_name + '/issues'
// //   github.fetchFromGithub(project_issues_path, function cb_fetchOrgs (err, res) {
// //     if (err) {
// //       console.error('Error fetching issues from github: ' + err)
// //       end(1)
// //     }
// //
// //     var issuesList = res
// //     var issueTotalCount = res.length
// //
// //     var issue_header = 'number,title,age,is_pull'
// //
// //     for (var issueCounter = 0; issueCounter < issueTotalCount; issueCounter++) {
// //       var currentIssue = issuesList[issueCounter]
// //
// //       var issue_line =
// //         currentIssue.number + ',' +
// //         currentIssue.title + ',' +
// //         getAge(currentIssue.created_at) + ','
// //
// //       if (currentIssue.pull_request) {
// //         issue_line += 'true'
// //       } else {
// //         issue_line += 'false'
// //       }
// //
// //       // TODO: export as csv
// //       console.info(issue_header)
// //       console.info(issue_line)
// //     }
// //
// //     // Increment the issue counter
// //     repo_counter++
// //     callback()
// //   })
// // }
//
// // // *******************************
// // // Return time difference in hours
// // // *******************************
// // function getAge (created_date) {
// //   // Set the two dates
// //   created_date = new Date(created_date)
// //   var today = new Date()
// //
// //   // Get 1 day in milliseconds
// //   var one_day = (1000 * 60 * 60 * 24)
// //
// //   // Calculate difference btw the two dates, and convert to days
// //   var ageDays = Math.ceil((today.getTime() - created_date.getTime()) / (one_day))
// //   return ageDays
// // }
//
