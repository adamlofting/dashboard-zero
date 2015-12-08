var Promise = require('bluebird')
var fs = require('fs')
Promise.promisifyAll(fs)
var GitHubApi = require('github')

// Holds the total number of repos
var total_repos = 0

// The repo list in csv form
var csv_repos = []

var github
var ORG_NAME

function init (org_name) {
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
}

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

module.exports.init = init
module.exports.setToken = setToken
