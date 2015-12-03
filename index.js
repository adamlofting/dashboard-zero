var https = require('https')

// // Rate limits
// // What as rate per hour?
// var ratePerHour = 120
// // In milliseconds
// var howOftenPerPage = 45000
//
// var pageTimerId
//
// // Results stats
// var totalResults
// var resultsPerPage
// var totalPages
// var estimatedHours
// var estimatedDays

var apiUrlGhOrgPath = '/orgs/mozilla/repos'

fetchFromGithub(apiUrlGhOrgPath, function cb_fetchOrgs (err, res) {
  if (err) {
    // Exit with error
    console.log('ERROR: ' + err)
    process.exit(1)
  }

  processOrgResults(res, process.exit)
})

// ******************
// Process the list of projects to find ones with open issues
// Calls addition processing for projects that do
// TODO: exports the complete list of projects in csv
// ********************************************
function processOrgResults (results, exit_code) {
  // list of projects with open issues
  var projectsWithIssues = []

  // This holds all the data for the Mozilla org on GitHub
  var orgData = results
  var repoTotalCount = results.length

  console.log('Mozilla has ' + repoTotalCount + ' repos on GitHub with the following stats:')

  console.log('name,stars,forks,open_issues')
  for (var repoCounter = 0; repoCounter < repoTotalCount; repoCounter++) {
    var currentRepo = orgData[repoCounter]

    // Todo: export as csv
    console.log(currentRepo.name + ',' +
      currentRepo.stargazers_count + ',' +
      currentRepo.forks_count + ',' +
      currentRepo.open_issues_count)

    // Check if repo has open issues
    if (currentRepo.open_issues_count > 0) {
      projectsWithIssues.push(currentRepo)
    }

    if (projectsWithIssues.length > 0) {
      projectsWithIssues.reverse()
      processIssues(projectsWithIssues, process.exit)
    } else {
      // Nothing more to do, exit with success
      exit_code(0)
    }
  }
}

function processIssues (projectsWithIssues, exit_code) {
  if (projectsWithIssues.length === 0) {
    exit_code(0)
  }

  for (var projectCounter = 0; projectCounter < projectsWithIssues.length;
     projectCounter++) {
    var currentProject = projectsWithIssues[projectCounter]
    var projectIssueUrl = '/repos/mozilla/' + currentProject.name + '/issues'
    fetchFromGithub(projectIssueUrl, function cb_fetchOrgs (err, res) {
      if (err) {
        // Exit with error
        console.log('ERROR: ' + err)
        process.exit(1)
      }

      var issuesList = res
      var issueTotalCount = res.length

      console.log('number,title,age,is_pull')
      for (var issueCounter = 0; issueCounter < issueTotalCount; issueCounter++) {
        var currentIssue = issuesList[issueCounter]

        // Todo: export as csv
        var csvIssueLine = currentIssue.number + ','

        csvIssueLine = csvIssueLine + currentIssue.title + ','

        csvIssueLine = csvIssueLine + getAge(currentIssue.created_at) + ','

        if (currentIssue.pull_request) {
          csvIssueLine = csvIssueLine + 'true'
        } else {
          csvIssueLine = csvIssueLine + 'false'
        }

        console.log(csvIssueLine)
      }

      // TODO: figure out best way to callback this
      exit_code(0)
    })
  }
}

function getAge (created_date) {
  //Set the two dates
  created_date = new Date(created_date)
  var today = new Date()

  //Get 1 day in milliseconds
  var one_day = (1000 * 60 * 60 * 24)

  //Calculate difference btw the two dates, and convert to days
  var ageDays = Math.ceil((today.getTime() - created_date.getTime()) / (one_day))
  return ageDays
}

// ***************************
// fetched from GitHub using API
// Returns: JSON
// ****************************
function fetchFromGithub (path, callback) {
  var options = {
    host: 'api.github.com',
    path: path,
    headers: {
      'User-Agent': 'drazisil'
    }
  }
  var body = ''
  https.get(options, function (res) {
    // console.log('statusCode: ', res.statusCode)
    // console.log('headers: ', res.headers)

    res.on('data', function (d) {
      body = body + d
    })
    res.on('end', function () {
      callback(null, JSON.parse(body))
    })
  }).on('error', function (e) {
    callback(e)
  })
}
