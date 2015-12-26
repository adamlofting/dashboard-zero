#
## The second part of the program will crunch the numbers from the data sources.

## sources
setwd("~/Documents/dashboard-zero/data")

comments <- read.csv("comments.csv", header = TRUE, sep =",")
issues <- read.csv("issues.csv", header = TRUE, sep =",", row.names = NULL)
labels <- read.csv("labels.csv", header = TRUE, sep =",", row.names = NULL)
members <- read.csv("members.csv", header = TRUE, sep =",", row.names = NULL)
milestones <- read.csv("milestones.csv", header = TRUE, sep =",", row.names = NULL)
#repos <- read.csv("repos.csv", header = TRUE, sep =",")

## Treat every data format
comments$updated_date <- as.Date(comments$updated_date)
issues$created_date <- as.Date(issues$created_date)
issues$updated_date <- as.Date(issues$updated_date)
milestones$due_on <- as.Date(milestones$due_on)
