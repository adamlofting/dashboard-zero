var https = require('https')
var DomParser = require('dom-parser')
var parser = new DomParser()

// Rate limits
// What as rate per hour?
var ratePerHour = 120
// In milliseconds
var howOftenPerPage = 45000

var pageNumber = 1
var pageTimerId

// Results stats
var totalResults
var resultsPerPage
var totalPages
var estimatedHours
var estimatedDays

// Run it
fetchpage(pageNumber)

function fetchpage (pageNumber) {
  fetchGitSearchResultsByPage(pageNumber)
  pageNumber++
  // if (pageNumber >= totalPages) {
  if (pageNumber === 2) {
    clearInterval(pageTimerId)
  } else {
    pageTimerId = setInterval(fetchpage, howOftenPerPage, pageNumber)
  }
}

function fetchGitSearchResultsByPage (pageNumber) {
  var url = 'https://github.com/search?l=YAML&p=' + pageNumber + '&q=%22circle.yml%22+in%3Apath+language%3AYAML+path%3A%2F+language%3AYAML&ref=advsearch&type=Code&utf8=%E2%9C%93'

  fetchGitSearchResults(url, function cb_fetch (data) {
    var oDOM = parser.parseFromString(data, 'text/html')
    // Lets get the total results count
    var sortDataDom = oDOM.getElementsByClassName('sort-bar')[0].childNodes

    // Get the results list
    var results = oDOM.getElementsByClassName('code-list-item')

    // If this is the first page do some basic setup
    if (pageNumber === 1) {
      // How many results?
      if (isNaN(sortDataDom[3].textContent.trim().split(' ')[1].toString().replace(',', ''))) {
        totalResults = sortDataDom[3].textContent.trim().split(' ')[2].toString().replace(',', '').trim()
        console.log('There are ' + totalResults + ' results.')
      } else {
        totalResults = sortDataDom[3].textContent.trim().split(' ')[1].toString().replace(',', '').trim()
        console.log('Search timed out, only able to get ' + totalResults + ' at this time')
        process.exit(1)
      }

      // How many results per page?
      resultsPerPage = results.length
      console.log('There are ' + resultsPerPage + ' results per page')

      // So how many pages?
      totalPages = Math.ceil(totalResults / resultsPerPage)
      console.log('There are ' + totalPages + ' pages of results')

      console.log('The rate limit is ' + ratePerHour + ' per hour')

      // So how long will this take?
      estimatedHours = totalPages / (ratePerHour)
      console.log('With a little extra time to avoid hitting the cap, it is estimated it will take ' + estimatedHours + ' hour(s) to complete')

      if (estimatedHours > 24) {
        estimatedDays = estimatedHours / 24
        console.log("That's " + estimatedDays + ' days, in case you were wondering')
      }
    }

    for (var i = 0; i < resultsPerPage; i++) {
      parseGitSearchResultItem(results[i])
    }
  })
}

function parseGitSearchResultItem (nodeResultItem) {
  console.log(
    nodeResultItem.getElementsByClassName('title')[0].childNodes[1].getAttribute('href') +
    ',' +
    nodeResultItem.getElementsByClassName('language')[0].childNodes[0].textContent.trim()
  )
}

function fetchGitSearchResults (url, callback) {
  var body = ''
  https.get(url, function (res) {
    // console.log('statusCode: ', res.statusCode)
    // console.log('headers: ', res.headers)

    res.on('data', function (d) {
      body = body + d
    })
    res.on('end', function () {
      callback(body)
    })
  }).on('error', function (e) {
    console.error(e)
  })
}
