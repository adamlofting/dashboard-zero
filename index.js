var dashboard_zero = require('./src/dashboard-zero/index.js')

// The GitHub org name we are scanning
var ORG_NAME = 'mozilla'

var REPO_LIST = ['login.webmaker.org', 'webmaker-login-ux', 'webmaker-core']

// *******************************
// Start of code
// ****************************
dashboard_zero.init(ORG_NAME, REPO_LIST)
dashboard_zero.setToken(
  function cb_setTokenIssues (status) {
    // Process members
    dashboard_zero.getMembersFromOrg(ORG_NAME)

    dashboard_zero.getIssuesFromRepo()
  }
)

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
