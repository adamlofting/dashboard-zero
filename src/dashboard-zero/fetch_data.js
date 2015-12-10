var async = require('async')
var GitHubApi = require('github')
var toTrack = require('.././to_track')
var data = require('./data')
var util = require('./util')
var NodeCache = require('node-cache')
var myCache = new NodeCache()

var OLDEST_DATE_WE_CARE_ABOUT = '2013-01-01'

// ****
// https://raw.githubusercontent.com/adamlofting/gitribution-2/master/lib/fetch_data.js
// ******

/**
 * createGithubClient()
 * @return {GitHubApi}
 */
function createGithubClient () {
  var githubClient = new GitHubApi({
    version: '3.0.0',
    protocol: 'https'
  })
  github.authenticate({
    type: 'token',
    token: process.env.GH_TOKEN
  })
  return githubClient
}

/**
 * A util
 */
function truthy (o) {
  if (o) {
    return true
  }
  return false
}

/**
 * Extract the values we want from all the data available in the API
 * @param  {JSON} ghRes, a single respsonse from the github API
 * @param  {String} org, the github org name
 * @return {Array}
 */
function getSelectedRepoValues (ghRes, org) {
  var arr = []
  if (ghRes) {
    for (var i = 0; i < ghRes.length; i++) {
      var r = ghRes[i]
      if (r.name && r.updated_at) {
        arr.push({
          org: org,
          name: r.name,
          updated_at: r.updated_at,
          has_issues: r.has_issues,
          default_branch: r.default_branch
        })
      } else {
        console.log('FUNNY BUSINESS:', r)
      }
    }
  }
  return arr
}

/**
 * Get a list of the repos linked to an org
 * @param  {String}   org      github org name
 * @param  {Function} callback
 * @return {Object}
 */
function getOrgRepos (org, callback) {
  var repos = []
  var githubClient = createGithubClient()

  // The options msg we send to the client http://mikedeboer.github.io/node-github/#repos.prototype.getFromOrg
  var msg = {
    org: org,
    type: 'public',
    per_page: 100
  };

  // To see the data from github: curl -i https://api.github.com/orgs/mozilla/repos?per_page=1
  githubClient.repos.getFromOrg(msg, function gotFromOrg (err, res) {
    if (err) {
      console.log(err)
    }
    // this has loaded the first page of results
    // get the values we want out of this response
    repos = repos.concat(getSelectedRepoValues(res, org))

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
          // get the values we want out of this response
          repos = repos.concat(getSelectedRepoValues(res, org))

          // update the variables used in the whilst logic
          ghResult = res
          hasNextPage = truthy(githubClient.hasNextPage(res))

          callback(null)
        })
      },
      function done (err) {
        callback(null, repos)
      })
  })
}

// /**
//  * Save commits given to use from Gitub
//  * @param  {JSON}   ghRes - the response from github
//  * @param  {Object}   repo, reference object for which repo we're working on
//  * @param  {Function} callback
//  */
// function saveCommits (ghRes, repo, callback) {
//   var toSave = []
//   // look through the results from github
//   if (ghRes) {
//     for (var i = 0; i < ghRes.length; i++) {
//       var r = ghRes[i]
//
//       if (r.commit && r.commit.author && r.commit.author.date) {
//         var login = (r.author && r.author.login) ? r.author.login : null
//         var email = (r.commit.author.email) ? r.commit.author.email : null
//         var url = (r.html_url) ? r.html_url : null
//         var commitId = (r.sha) ? r.sha : null
//         var commitMsg = (r.commit.message) ? r.commit.message : null
//         if (commitMsg) {
//           // Just keep the ASCII chars
//           commitMsg = util.cleanDescriptionForDB(commitMsg)
//         }
//         toSave.push([new Date(r.commit.author.date), repo.org, repo.name, login, email, url, 'commit-author', commitId, commitMsg])
//       } else {
//         console.log('FORMAT EXCEPTION:', r)
//       }
//     }
//   }
//   if (toSave.length > 0) {
//     data.saveItems(toSave, function saved (err) {
//       console.log('Saved', toSave.length, 'commits for:', repo.org, repo.name)
//       callback(null)
//     })
//   } else {
//     callback(null)
//   }
// }

function getCommitsForRepoUntil(repo, dateUntil, dateSince, callback) {
  var githubClient = createGithubClient()
  // The options msg we send to the client http://mikedeboer.github.io/node-github/#repos.prototype.getCommits
  var msg = {
    sha: repo.default_branch,
    user: repo.org,
    repo: repo.name,
    per_page: 100,
    since: dateSince,
  }
  if (dateUntil) {
    // if there is existing data stored for this repo, only fetch older records
    msg.until = dateUntil.toISOString()
  }

  // To see the data from github: curl -i https://api.github.com/repos/mozilla-appmaker/appmaker/commits?per_page=1
  githubClient.repos.getCommits(msg, function gotFromOrg (err, res) {
    if (err) {
      console.log(msg)
      console.log(err)
    }

    // setup variables to use in the doUntil loop below
    var ghResult = res
    var hasNextPage = truthy(githubClient.hasNextPage(ghResult))

    if (ghResult && ghResult.length) {
      async.doUntil(
        function repeatedly (callback) {
          saveCommits(ghResult, repo, function saved (err) {
            // check if there's another page
            hasNextPage = truthy(githubClient.hasNextPage(ghResult))
            // if there is, set this to work on in the next loop
            if (hasNextPage) {
              githubClient.getNextPage(ghResult, function gotNextPage (err, res) {
                ghResult = res
                callback(null)
              })
            } else {
              // nothing else to work on here
              callback(null)
            }
          })
        },
        function untilTest () {
          return !hasNextPage
        },
        function done (err) {
          callback(null)
        }
      )
    } else {
      console.log('> Nothing to do on:', repo.name)
      callback(null)
    }
  })
}

function getCacheKey (login) {
  return 'login' + login
}

// function getEmailForLoginFromGitHub (login, callback) {
//   var githubClient = createGithubClient()
//   // The options msg we send to the client http://mikedeboer.github.io/node-github/#user.prototype.get
//   var msg = {
//     user: login
//   }
//
//   // To see the data from github: curl -i https://api.github.com/repos/mozilla-appmaker/appmaker/pulls?per_page=1
//   githubClient.user.getFrom(msg, function gotFromRepo (err, res) {
//     if (err) {
//       console.log(msg)
//       console.log(err)
//     }
//     if (res && res.email) {
//       myCache.set(getCacheKey(login), res.email, 600)
//       return callback(null, res.email)
//     } else {
//       return callback(null, null)
//     }
//   })
// }
//
// function getEmailForLoginFromDB (login, callback) {
//   data.getEmailFromLogin(login, function gotEmailFromLogin (err, res) {
//     if (res) {
//       myCache.set(getCacheKey(login), res, 600)
//       return callback(null, res)
//     } else {
//       return callback(null, null)
//     }
//   })
// }
//
// function getEmailForLoginFromCache (login) {
//   // we use node-cache to reduce the number of requests we need to make to github
//   var cacheKey = getCacheKey(login)
//   var cache = myCache.get(cacheKey)
//   if (cache[cacheKey]) {
//     return cache[cacheKey]
//   }
//   return null
// }
//
// function getEmailForLogin (login, callback) {
//   var email = getEmailForLoginFromCache(login)
//   if (email) {
//     return callback(null, email)
//   }
//
//   async.waterfall([
//     // if this isn't in the cache, we check out existing DB for a match
//     function (callback) {
//       getEmailForLoginFromDB(login, function (err, res) {
//         var email = res
//         callback(null, email)
//       })
//     },
//     function (email, callback) {
//       // if we found the email in the DB, skip this
//       if (email) {
//         return callback(null, email)
//       }
//       // or if it's completely new to us, we check with github
//       getEmailForLoginFromGitHub(login, function gotFromGithub (err, res) {
//         email = res
//         return callback(null, email)
//       })
//     }
//   ], function (err, result) {
//      return callback(null, result)
//   })
// }
//
// /**
//  * Save Pull Requests given to us from Gitub
//  * @param  {JSON}   ghRes - the response from github
//  * @param  {Object}   repo, reference object for which repo we're working on
//  * @param  {Datetime} since - oldest date we care about
//  * @param  {Dateimte} until - the most recent date we care about
//  * @param  {Function} callback
//  */
// function savePullRequests (ghRes, repo, since, until, callback) {
//   var toSave = []
//   var keepLooking = true
//
//   console.log(repo.org, repo.name, ': saving PRs')
//
//   // look through the results from github
//   if (ghRes) {
//     async.eachSeries(ghRes,
//       function checkEach (ghItem, callback) {
//         var r = ghItem
//
//         if (r && r.user) {
//           var createdAt = new Date(r.created_at)
//           var login = (r.user && r.user.login) ? r.user.login : null
//           var url = (r.html_url) ? r.html_url : null
//           var pullNumber = (r.number) ? r.number : null
//           var pullID = repo.org + '/' + repo.name + '/pull/' + pullNumber
//           pullID = pullID.slice(-44)
//           var pullTitle = (r.title) ? r.title : null
//           if (pullTitle) {
//             pullTitle = util.cleanDescriptionForDB(pullTitle)
//           }
//
//           // check if this happened in a time period we care about
//           since = new Date(since)
//           if ((createdAt > since) && (createdAt < until)) {
//             getEmailForLogin(login, function gotEmail (err, res) {
//               var email = res
//               toSave.push([createdAt, repo.org, repo.name, login, email, url, 'pull-request-opened', pullID, pullTitle])
//               return callback(null)
//             })
//           } else {
//             // we're outsite the range we care about now, so flag this up
//             keepLooking = false
//             callback(null)
//           }
//         } else {
//           // unusual result we should skip
//           // PR from an unknown repo
//           callback(null)
//         }
//       },
//       function checkedAll (err) {
//         if (toSave.length > 0) {
//           data.saveItems(toSave, function saved (err) {
//             console.log(repo.org, repo.name, ': saved', toSave.length, 'pull-requests')
//             callback(null, keepLooking)
//           })
//         } else {
//           console.log(repo.org, repo.name, ': no more pull-requests to save')
//           callback(null, keepLooking)
//         }
//       })
//   }
// }

function getPullRequestsForRepoUntil (repo, dateUntil, dateSince, callback) {
  var githubClient = createGithubClient()
  // The options msg we send to the client http://mikedeboer.github.io/node-github/#pullRequests.prototype.getAll
  var msg = {
    user: repo.org,
    repo: repo.name,
    per_page: 100,
    sort: 'created',
    state: 'all' // open and closed
  }

  // This Github API endpoint doesn't have 'since' and 'util' parameters,
  // so we need to add this logic in here manually.

  // To see the data from github: curl -i https://api.github.com/repos/mozilla-appmaker/appmaker/pulls?per_page=1
  githubClient.pullRequests.getAll(msg, function gotFromRepo (err, res) {
    if (err) {
      console.log(msg)
      console.log(err)
    }

    // setup variables to use in the doUntil loop below
    var ghResult = res
    var hasNextPage = truthy(githubClient.hasNextPage(ghResult))

    if (ghResult && ghResult.length) {
      async.doUntil(
        function repeatedly (callback) {
          console.log('-- get a batch')
          savePullRequests(ghResult, repo, dateSince, dateUntil, function saved (err, keepLooking) {
            console.log(repo.org, repo.name, ': saved PRs')
            // check if there's another page
            // keepLooking will be false once we stray beyond the dates
            // we care about
            hasNextPage = (keepLooking && truthy(githubClient.hasNextPage(ghResult)))
            // if there is, set this to work on in the next loop
            if (hasNextPage) {
              githubClient.getNextPage(ghResult, function gotNextPage (err, res) {
                ghResult = res
                callback(null)
              })
            } else {
              // nothing else to work on here
              callback(null)
            }
          })
        },
        function untilTest () {
          return !hasNextPage
        },
        function done (err) {
          callback(null)
        }
      )
    } else {
      console.log(repo.org, repo.name, '> Nothing to do')
      callback(null)
    }
  })
}

// /**
//  * Save issues given to use from Gitub
//  * @param  {JSON}   ghRes - the response from github
//  * @param  {Object}   repo, reference object for which repo we're working on
//  * @param  {Function} callback
//  */
// function saveIssues (ghRes, repo, callback) {
//   var toSave = []
//   // look through the results from github
//   if (ghRes) {
//     async.eachSeries(ghRes,
//       function checkEach (ghItem, callback) {
//         var r = ghItem
//
//         if (r && r.user) {
//           var login = (r.user && r.user.login) ? r.user.login : null
//           var url = (r.html_url) ? r.html_url : null
//           var issueNumber = (r.number) ? r.number : null
//           var issueID = repo.org + '/' + repo.name + '/issue/' + issueNumber
//           issueID = issueID.slice(-44)
//           var issueTitle = (r.title) ? r.title : null
//           if (issueTitle) {
//             issueTitle = util.cleanDescriptionForDB(issueTitle)
//           }
//
//           if (url.indexOf('/issues/') === -1) {
//             // It's an autogenerated issue to go with a Pull Request which
//             // is being counted in the PR data already, so skip it
//             return callback(null)
//           }
//
//           getEmailForLogin(login, function gotEmail (err, res) {
//             var email = res
//             toSave.push([new Date(r.created_at), repo.org, repo.name, login, email, url, 'issue-opened', issueID, issueTitle])
//             return callback(null)
//           })
//         } else {
//           console.log('FORMAT EXCEPTION:', r)
//           callback(null)
//         }
//       },
//       function checkedAll (err) {
//         if (toSave.length > 0) {
//           data.saveItems(toSave, function saved (err) {
//             console.log(repo.org, repo.name, ': saved', toSave.length, 'issues')
//             callback(null)
//           })
//         } else {
//           console.log(repo.org, repo.name, ': no more pull-requests to save')
//           callback(null)
//         }
//       }
//     )
//   }
// }

function getIssuesForRepoUntil (repo, dateUntil, dateSince, callback) {
  var githubClient = createGithubClient()
  // The options msg we send to the client http://mikedeboer.github.io/node-github/#issues.prototype.repoIssues
  var msg = {
    user: repo.org,
    repo: repo.name,
    per_page: 100,
    since: dateSince,
    state: 'all'
  }
  if (dateUntil) {
    // if there is existing data stored for this repo, only fetch older records
    msg.until = dateUntil.toISOString()
  }

  // To see the data from github: curl -i https://api.github.com/repos/mozilla-appmaker/appmaker/commits?per_page=1
  githubClient.issues.repoIssues(msg, function gotFromOrg (err, res) {
    if (err) {
      console.log(msg)
      console.log(err)
    }

    // setup variables to use in the doUntil loop below
    var ghResult = res
    var hasNextPage = truthy(githubClient.hasNextPage(ghResult))

    if (ghResult && ghResult.length) {
      async.doUntil(
        function repeatedly (callback) {
          saveIssues(ghResult, repo, function saved (err) {
            // check if there's another page
            hasNextPage = truthy(githubClient.hasNextPage(ghResult))
            // if there is, set this to work on in the next loop
            if (hasNextPage) {
              githubClient.getNextPage(ghResult, function gotNextPage (err, res) {
                ghResult = res
                callback(null)
              })
            } else {
              // nothing else to work on here
              callback(null)
            }
          })
        },
        function untilTest () {
          return !hasNextPage
        },
        function done (err) {
          callback(null)
        }
      );
    } else {
      console.log('> Nothing to do on:', repo.name)
      callback(null)
    }
  })
}

function workOnRepoCommits (repo, callback) {
  // When a new repo is worked on, we start from today's date and work back
  // through the API pages until the oldest date we care about.
  // If the script or process is interupted, the next time we get to this repo
  // we check the oldest date we have process and carry on working back from
  // there.
  // Once we have captured the historic activity we care about, future runs
  // of the script look for any activity that is newer than what we have in
  // our records
  var now = new Date()

  async.waterfall([

    // Commits
    function waterfallCommitsHistoric (callback) {
      data.getOldestCommitDate(repo, function gotOldest (err, oldestDateInOurDB) {
        // use the oldest date for another pass over the API
        getCommitsForRepoUntil(repo, oldestDateInOurDB, OLDEST_DATE_WE_CARE_ABOUT, function gotNew (err) {
          console.log(repo.org, repo.name, ': commits, updated historic:')
          callback(null)
        })
      })
    },
    function waterfallCommitsNew (callback) {
      data.getLatestCommitDate(repo, function gotLatest (err, latestDateInOurDB) {
        // because this function runs after the one above, there will always be existing data
        // unless a repo has no PRs in which case we should skip this fetch
        if (!latestDateInOurDB) {
          return callback(null)
        }
        // use the latest date for another pass over the API
        getCommitsForRepoUntil(repo, now, latestDateInOurDB, function gotNew (err) {
          console.log(repo.org, repo.name, ': commits, updated recent:')
          callback(null)
        })
      })
    }
  ], function waterfallDone (err) {
    callback(null)
  })
}

function workOnRepoPullRequests (repo, callback) {
  // When a new repo is worked on, we start from today's date and work back
  // through the API pages until the oldest date we care about.
  // If the script or process is interupted, the next time we get to this repo
  // we check the oldest date we have process and carry on working back from
  // there.
  // Once we have captured the historic activity we care about, future runs
  // of the script look for any activity that is newer than what we have in
  // our records
  var now = new Date()

  async.waterfall([

    // Pull Requests
    function waterfallPRsHistoric (callback) {
      data.getOldestPullRequestDate(repo, function gotOldest (err, oldestDateInOurDB) {
        // if there is no data in our DB, it's new so we check up to today's date
        var until = (oldestDateInOurDB) ? oldestDateInOurDB : new Date()

        getPullRequestsForRepoUntil(repo, until, OLDEST_DATE_WE_CARE_ABOUT, function gotNew (err) {
          console.log(repo.org, repo.name, ': updated historic pull requests')
          callback(null)
        })
      })
    },
    function waterfallPRsNew (callback) {
      data.getLatestPullRequestDate(repo, function gotLatest (err, latestDateInOurDB) {
        // because this function runs after the one above, there will always be existing data
        // unless a repo has no PRs in which case we should skip this fetch
        if (!latestDateInOurDB) {
          return callback(null)
        }
        // to limit how much we ping the github api, we don't need to check for
        // new commits constantly, if we've picked up something in the last
        // few hours skip this repo this time.
        var checkDate = new Date(latestDateInOurDB)
        checkDate.setHours(latestDateInOurDB.getHours() + 3)
        if (now < checkDate) {
          return callback(null)
        }
        // use the latest date for another pass over the API
        getPullRequestsForRepoUntil(repo, now, latestDateInOurDB, function gotNew (err) {
          console.log(repo.org, repo.name, ': updated recent pull requests')
          callback(null)
        })
      })
    }
  ], function waterfallDone (err) {
    callback(null)
  })
}

function workOnRepoIssues (repo, callback) {
  // When a new repo is worked on, we start from today's date and work back
  // through the API pages until the oldest date we care about.
  // If the script or process is interupted, the next time we get to this repo
  // we check the oldest date we have process and carry on working back from
  // there.
  // Once we have captured the historic activity we care about, future runs
  // of the script look for any activity that is newer than what we have in
  // our records
  var now = new Date()

  async.waterfall([

    // Pull Requests
    function waterfallHistoric (callback) {
      data.getOldestIssueDate(repo, function gotOldest (err, oldestDateInOurDB) {
        // if there is no data in our DB, it's new so we check up to today's date
        var until = (oldestDateInOurDB) ? oldestDateInOurDB : new Date()

        getIssuesForRepoUntil(repo, until, OLDEST_DATE_WE_CARE_ABOUT, function gotNew (err) {
          console.log(repo.org, repo.name, ': updated historic issues')
          callback(null)
        })
      })
    },
    function waterfallNew (callback) {
      data.getLatestIssueDate(repo, function gotLatest (err, latestDateInOurDB) {
        // because this function runs after the one above, there will always be existing data
        // unless a repo has no PRs in which case we should skip this fetch
        if (!latestDateInOurDB) {
          return callback(null)
        }
        // to limit how much we ping the github api, we don't need to check for
        // new commits constantly, if we've picked up something in the last
        // few hours skip this repo this time.
        var checkDate = new Date(latestDateInOurDB)
        checkDate.setHours(latestDateInOurDB.getHours() + 3)
        if (now < checkDate) {
          return callback(null)
        }
        // use the latest date for another pass over the API
        getIssuesForRepoUntil(repo, now, latestDateInOurDB, function gotNew (err) {
          console.log(repo.org, repo.name, ': updated recent issues')
          callback(null)
        })
      })
    }

  ], function waterfallDone (err) {
    callback(null)
  })
}

/**
 * fetchMoreCommitData - does the main work keeping the DB up to date with things that have changed in github
 */
function fetchMoreCommitData (callback) {
  // loads the github org names listed in to_track.js
  async.eachLimit(toTrack.orgs, 2,
    // for each github org we care about
    function workOnThisOrg (org, callback) {
      // do things in this order
      async.waterfall([
        // get a list of repos
        function waterfallGetRepos (callback) {
          getOrgRepos(org, function gotOrgRepros (err, res) {
            callback(null, res)
          })
        },
        // do some work on these repos
        function waterfallWorkOnRepos (repos, callback) {
          async.eachLimit(repos, 3,
            function eachRepo (repo, callback) {
              console.log(repo.org, repo.name, ': working on commits')
              workOnRepoCommits(repo, function workedOnRepo (err) {
                callback(null)
              })
            },
            function eachDone (err) {
              if (err) {
                console.log(err)
              }
              callback(null)
            }
          )
        }
      ], function waterfallDone (err, result) {
        callback(null)
      })
    },
    function eachDone (err) {
      // We have iterated through all the orgs
      if (err) {
        console.log(err)
      }
      console.log('--=={{ GH COMMIT FETCH DONE }}==--')
      callback(null)
    }
  )
}

/**
 * fetchMorePullRequestData - does the main work keeping the DB up to date with things that have changed in github
 */
function fetchMorePullRequestData (callback) {
  // loads the github org names listed in to_track.js
  async.eachLimit(toTrack.orgs, 2,
    // for each github org we care about
    function workOnThisOrg (org, callback) {
      // do things in this order
      async.waterfall([
        // get a list of repos
        function waterfallGetRepos (callback) {
          getOrgRepos(org, function gotOrgRepros (err, res) {
            callback(null, res)
          })
        },
        // do some work on these repos
        function waterfallWorkOnRepos (repos, callback) {
          async.eachLimit(repos, 4,
            function eachRepo(repo, callback) {
              console.log(repo.org, repo.name, ': working on pull requests')
              workOnRepoPullRequests(repo, function workedOnRepo (err) {
                callback(null)
              })
            },
            function eachDone (err) {
              if (err) {
                console.log(err)
              }
              callback(null)
            }
          )
        }
      ], function waterfallDone (err, result) {
        callback(null);
      })
    },
    function eachDone (err) {
      // We have iterated through all the orgs
      if (err) {
        console.log(err)
      }
      console.log('--=={{ GH PRS FETCH DONE }}==--')
      callback(null)
    }
  )
}

/**
 * fetchMoreIssuesData - does the main work keeping the DB up to date with things that have changed in github
 */
function fetchMoreIssuesData (callback) {
  // loads the github org names listed in to_track.js
  async.eachLimit(toTrack.orgs, 2,
    // for each github org we care about
    function workOnThisOrg (org, callback) {
      // do things in this order
      async.waterfall([
        // get a list of repos
        function waterfallGetRepos (callback) {
          getOrgRepos(org, function gotOrgRepros (err, res) {
            callback(null, res)
          })
        },
        // do some work on these repos
        function waterfallWorkOnRepos (repos, callback) {
          async.eachLimit(repos, 4,
            function eachRepo(repo, callback) {
              console.log(repo.org, repo.name, ': working on issues')
              workOnRepoIssues(repo, function workedOnRepo (err) {
                callback(null)
              })
            },
            function eachDone (err) {
              if (err) {
                console.log(err)
              }
              callback(null)
            }
          )
        }
      ], function waterfallDone (err, result) {
        callback(null)
      })
    },
    function eachDone (err) {
      // We have iterated through all the orgs
      if (err) {
        console.log(err)
      }
      console.log('--=={{ GH ISSUES FETCH DONE }}==--')
      callback(null)
    }
  )
}

module.exports = {
  fetchMorePullRequestData: fetchMorePullRequestData,
  fetchMoreCommitData: fetchMoreCommitData,
  workOnRepoPullRequests: workOnRepoPullRequests,
  fetchMoreIssuesData: fetchMoreIssuesData
}
