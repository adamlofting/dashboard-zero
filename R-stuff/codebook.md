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

- Description
 
Holds the combined comments from all open issues in the requested repositories.

- Source: https://developer.github.com/v3/issues/comments/#list-comments-on-an-issue

* Fields
  * id	          = id
  * creator	      = user.login
  * updated_date	= updated_at
  * html_url	    = html_url
  * issue_url     = url

### issues.csv

- Description
 
Holds the combined open issues in the requested repositories.

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

- Description
 
Holds the combined data from the requested repositories.

- Source: https://developer.github.com/v3/repos/#list-organization-repositories

* Fields
  * name	      = name
  * stars	      = stargazers_count
  * forks	      = forks_count
  * open_issues	= open_issues_count
  * language    = language
