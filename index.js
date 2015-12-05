var github = require('./src/github.js')

var api_timer_id

// Holds the total number of repos
var total_repos = 0
// Holds the current repo counter
var repo_counter = 0

// List of repos for org
var org_repos

// The GitHub org name we are scanning
var ORG_NAME = 'mozilla'

github.getRepoCount('org', ORG_NAME, function cb_fetchOrgs (err, headers) {
  if (err) {
    // Exit with error
    end(1)
  }

  console.log(headers.link)
  end(0)
})

// github.fetchRepoList('org', ORG_NAME, function cb_fetchOrgs (err, res) {
//   if (err) {
//     // Exit with error
//     end(1)
//   }
//
//   processOrgResults(res, end)
// })

// *****************************
// Ends with relevent exit code
// ******************************
function end (exit_code) {
  if (exit_code !== 0) {
    // There was an error
    console.log('Total API Calls: ' + github.total_api_calls)
    process.exit(exit_code)
  }

  // Everything went well
  console.log('Total API Calls: ' + github.total_api_calls)
  process.exit()
}

// ******************
// Process the list of projects to find ones with open issues
// Calls addition processing for projects that do
// TODO: exports the complete list of projects in csv
// ********************************************
function processOrgResults (results, exit_code) {
  // list of projects with open issues

  // This holds all the data for the Mozilla org on GitHub
  org_repos = results
  total_repos = results.length

  if (total_repos === undefined) {
    // There was an error
    console.log('Error: ' + results.message)
    end(1)
  }

  console.log('Mozilla has ' + total_repos + ' repos on GitHub with the following stats:')

  api_timer_id = setInterval(processRepos, github.call_interval, repo_counter)
}

// **********************************************************
// Called by a timer to avoid hitting the GitHub rate limits
//
// Processes each repo for open issues and adds to projectsWithIssues
// **********************************************************
function processRepos (exit_code) {
  clearInterval(api_timer_id)
  // First off, end loop if we have reached the end
  if (repo_counter === total_repos) {
    exit_code(0)
  }

  var this_repo = org_repos[repo_counter]

  // Todo: export as csv
  var repo_header = 'name,stars,forks,open_issues'
  var repo_line =
    this_repo.name + ',' +
    this_repo.stargazers_count + ',' +
    this_repo.forks_count + ',' +
    this_repo.open_issues_count

  console.log(repo_header)
  console.log(repo_line)

  // Check if repo has open issues
  if (this_repo.open_issues_count > 0) {
    // Start loop for this repo
    // TODO: Not sure we need the delay here
    api_timer_id = setInterval(processIssues, github.call_interval, this_repo.name, processRepos)
  }
}

// **********************************************************
// Called by a timer to avoid hitting the GitHub rate limits
//
// Processes each issue to get details regarding age and if is pull request
// **********************************************************
function processIssues (repo_name, callback) {
  clearInterval(api_timer_id)

  var project_issues_path = '/repos/mozilla/' + repo_name + '/issues'
  github.fetchFromGithub(project_issues_path, function cb_fetchOrgs (err, res) {
    if (err) {
      // Exit with error
      end(1)
    }

    var issuesList = res
    var issueTotalCount = res.length

    var issue_header = 'number,title,age,is_pull'

    for (var issueCounter = 0; issueCounter < issueTotalCount; issueCounter++) {
      var currentIssue = issuesList[issueCounter]

      var issue_line =
        currentIssue.number + ',' +
        currentIssue.title + ',' +
        getAge(currentIssue.created_at) + ','

      if (currentIssue.pull_request) {
        issue_line += 'true'
      } else {
        issue_line += 'false'
      }

      // TODO: export as csv
      console.log(issue_header)
      console.log(issue_line)
    }

    // Increment the issue counter
    repo_counter++
    callback()
  })
}

// *******************************
// Return time difference in hours
// *******************************
function getAge (created_date) {
  // Set the two dates
  created_date = new Date(created_date)
  var today = new Date()

  // Get 1 day in milliseconds
  var one_day = (1000 * 60 * 60 * 24)

  // Calculate difference btw the two dates, and convert to days
  var ageDays = Math.ceil((today.getTime() - created_date.getTime()) / (one_day))
  return ageDays
}
