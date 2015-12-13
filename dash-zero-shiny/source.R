#
## This R script will fetch data from GitHub's Api - using jsonlite package.

library(jsonlite)
library(curl)
### WEBMAKER CORE ###
comments_webmaker_core <- fromJSON("https://api.github.com/repos/mozilla/webmaker-core/issues/comments")
user <- fromJSON("https://api.github.com/repos/mozilla/webmaker-core/issues/comments")

## There's a specific fetch for users because users is a dataframe itself
#names(comments_webmaker_core)
## Check correct lines of code we want to retrieve, if needed - remove previous hashtag

## Re-arranging the datasets to a specific order (and dropping stuff that is not needed)
wmc_issues <- subset(comments_webmaker_core, select = c(id, created_at, updated_at, html_url, issue_url))
wmc_users <- subset(user$user, select = c(login, id))

setwd("~/GitHub/dashboard-zero/dash-zero-shiny/data")
write.csv(wmc_issues, file = "wmc_issues.csv", sep= ",")
write.csv(wmc_users, file = "wmc_users.csv", sep= ",")

### MOZILLA REPOS ###
moz_contributors <- fromJSON("https://api.github.com/repos/mozilla/zamboni/contributors")
moz_assignees <- fromJSON("https://api.github.com/repos/mozilla/zamboni/assignees")
moz_labels <- fromJSON("https://api.github.com/repos/mozilla/zamboni/labels")
moz_pulls <- fromJSON("https://api.github.com/repos/mozilla/zamboni/pulls")
moz_issues <- fromJSON("https://api.github.com/repos/mozilla/zamboni/issues")

## Organizing datasets ##
moz_contributors <- subset(moz_contributors, select = c(login, id, contributions))
moz_assignees <- subset(moz_assignees, select = c(login, id))
moz_labels <- subset(moz_labels, select = c(name, color))
#moz_pulls <- subset(moz_pulls, select = c())
moz_issues <- subset(moz_issues, select = c(id, number, html_url, comments, created_at, updated_at))

setwd("~/GitHub/dashboard-zero/dash-zero-shiny/data")
write.csv(moz_contributors, file = "moz_contributors.csv", sep= ",")
write.csv(moz_assignees, file = "moz_assignees.csv", sep= ",")
write.csv(moz_labels, file = "moz_labels.csv", sep= ",")
write.csv(moz_pulls, file = "moz_pulls.csv", sep= ",")
write.csv(moz_issues, file = "moz_issues.csv", sep= ",")


# Code does not retrieve data?

### MOZILLA APPMAKER - COMMITS ###
mappm_commits <- fromJSON("https://api.github.com/repos/mozilla-appmaker/appmaker/commits?per_page=1")

### MOZILLA APPMAKER - PULLS ###
mappm_pulls <- fromJSON("https://api.github.com/repos/mozilla-appmaker/appmaker/pulls?per_page=1")
