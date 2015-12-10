---
title: "Code book"
author: "gsilva"
date: "9th December 2015"
output: pdf_document
---

# Metrics Codebook

The purpose of this document is to create some standards for future collaborations, so that all contributors follow the same steps and quality standards we have previously adopted. 

## Data Source Files

### comments.csv

- Description: Holds the combined comments from all open issues in the requested repositories.

- Source: https://developer.github.com/v3/issues/comments/#list-comments-on-an-issue

* Fields
  * id	          = id
  * creator	      = user.login
  * updated_date	= updated_at
  * html_url	    = html_url
  * issue_url     = url

### issues.csv

- Description: Holds the combined open issues in the requested repositories.

- Source: https://developer.github.com/v3/issues/#list-issues-for-a-repository

* Fields
  * id	            = id
  * title	          = title
  * created_date	  = created_at
  * updated_date	  = updated_at
  * comments_count	= comments
  * is_pullrequest	= (true if exists pull_request else false)
  * html_url	      = html_url
  * url             = url

### repos.csv

- Description: Holds the combined data from the requested repositories.

- Source: https://developer.github.com/v3/repos/#list-organization-repositories

* Fields
  * name	      = name
  * stars	      = stargazers_count
  * forks	      = forks_count
  * open_issues	= open_issues_count
  * language    = language

### milestones.csv

- Description: Holds the combined milestones for the requested repositories

- Source: https://developer.github.com/v3/issues/milestones/#list-milestones-for-a-repository
 
* Fields
 * title
 * state
 * open_issues
 * due_on
 * html_url
 * url

### labels.csv

- Description: Holds the combined labels for the requested repositories

- Source: https://developer.github.com/v3/issues/milestones/#list-milestones-for-a-repository
 
* Fields
 * name
 * url

### members.csv

- Description: Holds the combined members for the requested repositories

- Note: This will only list public members

- Source: https://developer.github.com/v3/orgs/members/#members-list
 
* Fields
 * id
 * login
 * avatar_url
 * type

## Formulas

### Number of unanswered volunteer input in Github issues

result = Count(issues.id) from (issues join comments on (issues.url == comments.issue_url)) where not (members.login in comments.creator) 

### Number of Pull Requests that have had no response at all

result = Count(issues.id) from issues where (issues.is_pullrequest == false && issues.comment_count == 0)

#### Number of Pull Requests that have had no activity for more than X days

result = Count(issues.id) from (issues join comments on (issues.url == comments.issue_url) where (comments.updated_date < (Today - $X_days)))

#### Number of open bugs (total)

result = Count(issues.id)

#### Number of bugs needing triage

result = Count(issues.id) from issues where (not labels.name in issues.labels)

### Number of bugs by triage status

result = Count(issues.id) from issues where (issues.labels <> '') group by labels.name

### Number of bugs assigned to expired Milestones

result = milestones.open_issues from milestones where ((milestones.state == 'closed') && (milestones.open_issues > 0) && (milestones.due_on >= Today))
