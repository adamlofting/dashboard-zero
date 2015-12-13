---
title: "Code book"
author: "gsilva"
date: "9th December 2015"
output: pdf_document
---

# Metrics Codebook

The purpose of this document is to create some standards for future
collaborations, as well as an overview of all the data that has been used.

## Data Source Files

Most of the data comes from GitHub's API.
Here follows a list of the APIs that were used to retrieve the data:

*Webmaker_core_comments:* https://api.github.com/repos/mozilla/webmaker-core/issues/comments

*Mozilla_repos:* https://api.github.com/orgs/mozilla/repos?per_page=1

*Mozilla_appmaker_commits:* https://api.github.com/repos/mozilla-appmaker/appmaker/commits?per_page=1

*Mozilla_appmaker_pulls:* https://api.github.com/repos/mozilla-appmaker/appmaker/pulls?per_page=1


## CSV files under /data

- wmc_issues.csv - This files is in regard to Webmaker_core_comments issues
- wmc_users.csv - This file comes also from Webmaker_core_comments, but focus
only on the information available about the users, namely if
they're volunteers or not.
-
