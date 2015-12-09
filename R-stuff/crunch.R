# created by gsilva
## dashboard-zero project

### Data inputs
repos_data <- read.csv("repos.csv", header = T, sep ="," )

issues_data <- read.csv("issues.csv", header = T, sep = ",", stringsAsFactors = FALSE)
## number of unanswered inputs in git
sum(issues_data$comments_count == "0")

## Arrange dates appropriately 
issues_data$created_date <- as.Date(issues_data$created_date)
issues_data$updated_date <- as.Date(issues_data$updated_date)

## Requests
### 1 - Top 10 projects that need most attention
#### Cleaning data
repos_data_clean <- subset(repos_data, open_issues != "0")

ordered_by_issues <- repos_data_clean[order(repos_data_clean$open_issues, decreasing = TRUE), ]
head(ordered_by_issues, n = 10)

### (extra) See most used languages in these projects
sum(repos_data$language == "JavaScript")
sum(repos_data$language == "Java")
sum(repos_data$language == "TypeScript")
sum(repos_data$language == "Python")
sum(repos_data$language == "C")
sum(repos_data$language == "C++")
sum(repos_data$language == "CSS")
sum(repos_data$language == "HTML")

### 2 - Number of unanswered inputs
#### sum issues without comments
#### Retrieves HTML + most urgent (less comments)

sum(issues_data$comments_count == "0")
showURL <- subset(issues_data, issues_data$comments_count > 0, select = c(title, comments_count, html_url))
head(order_showURL <- showURL[, 2:3][order(showURL$comments_count, decreasing = FALSE), ], n = 151, floating = FALSE) 
#ead(order_showURL, n = 151)

### 3 - Number of pull requests without answer
#### sumif is pull request = T

sum(issues_data$is_pullrequest == "true")

### 4 - Top 10 projects with less activity
#### Order by last update, ascending order

ordered_by_lastUpdate <- issues_data[order(issues_data$updated_date, decreasing = TRUE), ]
head(ordered_by_lastUpdate, n = 20)

### 5 - Bug triage
#### Considering is_pull_request == True, order by last update date

issues_data_isPull <- subset(issues_data, is_pullrequest == "true")
head(ordered_by_lastUpdate <- issues_data_isPull[order(issues_data_isPull$updated_date, decreasing = FALSE), ], n=10)
#head(ordered_by_lastUpdate, n = 10)

### 6 - Total number of issues
sum(repos_data$open_issues > 0)
