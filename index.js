var Promise = require('bluebird')
var fs = require('fs')
Promise.promisifyAll(fs)
var github = require('./src/github.js')

var api_timer_id

// Holds total pages and current page
var total_pages = 0
var page_counter = 1

// Holds the total number of repos
var total_repos = 0
// Holds the current repo counter
var repo_counter = 0

// List of repos for org
var org_repos = []

// The repo list in csv form
var csv_repos = []

// The GitHub org name we are scanning
var ORG_NAME = 'mozilla'

// *******************************
// Start of code
// ****************************
github.setToken()
github.getRepoCount('org', ORG_NAME, function cb_fetchOrgs (err, headers) {
  if (err) {
    console.error('Error getting repo count: ' + err)
    end(1)
  }

  if (headers.link) {
    total_pages = headers.link.split(',')[1].split('=')[2].split('>')[0]
  }

  console.info('There are ' + total_pages + ' pages of results.')
  api_timer_id = setInterval(fetchPage, github.call_interval, ORG_NAME)
})

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

// *****************************
// Process one page of the results
// ********************************
function fetchPage (org_name) {
  console.info('Processing page ' + page_counter)
  clearInterval(api_timer_id)

  github.fetchRepoList('org', org_name, page_counter, function cb_fetchOrgs (err, res) {
    if (err) {
      console.error('Error fetching repo list ' + err)
      end(1)
    }

    console.info('This page has ' + res.length + ' repos listed on it')

    // Add this page's repos to list
    for (var i = 0; i < res.length; i++) {
      org_repos.push(res[i])
    }

    // Increase the page counter
    page_counter++

    total_repos = org_repos.length
    console.log('We now have ' + total_repos + ' repos to process')

    // Have we reached the end?
    if (page_counter > total_pages) {
      console.info('Total repos: ' + total_repos)
      repo_counter = 0
      // api_timer_id = setInterval(processRepos, github.call_interval)
      processRepos()
    } else {
      api_timer_id = setInterval(fetchPage, github.call_interval, ORG_NAME)
    }
  })
}

// // ******************
// // Process the list of projects to find ones with open issues
// // Calls addition processing for projects that do
// // TODO: exports the complete list of projects in csv
// // ********************************************
// function processOrgResults (results, callback) {
//   // list of projects with open issues
//   if (total_repos === undefined) {
//     // There was an error
//     console.error('Error: ' + results.message)
//     end(1)
//   }
//   total_repos += results.length
//   console.info('Found ' + results.length + ' repos')
//   console.info('Total repos: ' + total_repos)

//   callback(null, results)

//   api_timer_id = setInterval(processRepos, github.call_interval, repo_counter)
// }

// **********************************************************
// Called by a timer to avoid hitting the GitHub rate limits
//
// Processes each repo for open issues and adds to projectsWithIssues
// **********************************************************
function processRepos () {
  clearInterval(api_timer_id)
  // First off, end loop if we have reached the end
  if (repo_counter === total_repos) {
    console.info(total_repos + ' total repos fetched.')
    console.info('All Repos processed')
    var repo_header = 'name,stars,forks,open_issues,language'
    updateFile(repo_header, csv_repos, 'data/repos.csv', function cb_update_file (err, res) {
      if (err) {
        console.error('Error updating file: ' + err)
        end(1)
      }
      end(0)
    })
  } else {
    // Not yet done
    var this_repo = org_repos[repo_counter]

    // What nunber are we on?
    console.info('Processing repo number: ' + repo_counter)
    console.info('Processing repo: ' + this_repo.name)

    var repo_line =
      this_repo.name + ',' +
      this_repo.stargazers_count + ',' +
      this_repo.forks_count + ',' +
      this_repo.open_issues_count + ',' +
      this_repo.language +
      '\n'

    // Add to list to be saved to csv
    // console.info('Line to insert: ' + repo_line)
    csv_repos += repo_line

    repo_counter++

    // Have we reached the end?
    if (repo_counter <= total_repos) {
      // api_timer_id = setInterval(processRepos, github.call_interval)
      processRepos()
    }

    // // Check if repo has open issues
    // if (this_repo.open_issues_count > 0) {
    //   // Start loop for this repo
    //   // TODO: Not sure we need the delay here
    //   api_timer_id = setInterval(processIssues, github.call_interval, this_repo.name, processRepos)
    // }
  }
}

// // **********************************************************
// // Called by a timer to avoid hitting the GitHub rate limits
// //
// // Processes each issue to get details regarding age and if is pull request
// // **********************************************************
// function processIssues (repo_name, callback) {
//   clearInterval(api_timer_id)
//
//   var project_issues_path = '/repos/mozilla/' + repo_name + '/issues'
//   github.fetchFromGithub(project_issues_path, function cb_fetchOrgs (err, res) {
//     if (err) {
//       console.error('Error fetching issues from github: ' + err)
//       end(1)
//     }
//
//     var issuesList = res
//     var issueTotalCount = res.length
//
//     var issue_header = 'number,title,age,is_pull'
//
//     for (var issueCounter = 0; issueCounter < issueTotalCount; issueCounter++) {
//       var currentIssue = issuesList[issueCounter]
//
//       var issue_line =
//         currentIssue.number + ',' +
//         currentIssue.title + ',' +
//         getAge(currentIssue.created_at) + ','
//
//       if (currentIssue.pull_request) {
//         issue_line += 'true'
//       } else {
//         issue_line += 'false'
//       }
//
//       // TODO: export as csv
//       console.info(issue_header)
//       console.info(issue_line)
//     }
//
//     // Increment the issue counter
//     repo_counter++
//     callback()
//   })
// }

// // *******************************
// // Return time difference in hours
// // *******************************
// function getAge (created_date) {
//   // Set the two dates
//   created_date = new Date(created_date)
//   var today = new Date()
//
//   // Get 1 day in milliseconds
//   var one_day = (1000 * 60 * 60 * 24)
//
//   // Calculate difference btw the two dates, and convert to days
//   var ageDays = Math.ceil((today.getTime() - created_date.getTime()) / (one_day))
//   return ageDays
// }

// *****************************
// Ends with relevent exit code
// ******************************
function end (exit_code) {
  if (exit_code !== 0) {
    // There was an error
    console.trace('ERROR: Total API Calls: ' + github.total_api_calls)
    process.exit(exit_code)
  }

  // Everything went well
  console.info('Total API Calls: ' + github.total_api_calls)
  process.exit()
}
