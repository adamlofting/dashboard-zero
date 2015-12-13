Format of config.json
---------------------------

OAuth2 Token: https://developer.github.com/v3/#authentication

````
{
  "token": "<github api token>",
  "repo_list": [{
    "org": "org1",
    "repo": "repo1"
  }, {
    "org": "org1",
    "repo": "repo2"
  }, {
    "org": "org2",
    "repo": "repo3"
  }]
}
````
