#
## The second part of the program will crunch the numbers from the data sources.

## sources
setwd("~/Documents/dashboard-zero/data")

comments <- read.table("comments.csv", header = TRUE, sep =",", row.names = NULL)
issues <- read.csv("issues.csv", header = TRUE, sep =",", row.names = NULL)
labels <- read.csv("labels.csv", header = TRUE, sep =",", row.names = NULL)
members <- read.csv("members.csv", header = TRUE, sep =",", row.names = NULL)
milestones <- read.csv("milestones.csv", header = TRUE, sep =",", row.names = NULL)
repos <- read.table("repos.csv", header = TRUE, sep =",", row.names = NULL)