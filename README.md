# dashboard-zero
An engineering dashboard for tracking the numbers we want to keep at zero.

This is a new project. Please jump into the [issues](https://github.com/drazisil/dashboard-zero/issues) to get involved in the design and planning phase.

## Project Vision

This is a Mozilla Foundation project, designed to support our engineers by surfacing numbers and data from our Github repositories in a way that helps them to take actions. While we are designing this initially for Mozilla Foundation engineers, we will keep in mind that these kind of tools can be useful for any Mozilla teams using Github to manage their project, and many other open source projects.

As an example, we know that when a volunteer contributor first submits an issue or code to an open source project, how quickly the team first respond has a huge impact on whether that volunteer continues to contribute to the project. It can be hard for the engineering team to keep a track of all the Github issues across the many repositories we work with (there are hundreds of them), but dashboard-zero could gather up that data and present a single count (and list) of how many tickets or pull requests have been opened by volunteers but which have not yet had a reply from someone on the team. This is a number we should continually aim to keep at zero.

The vision is to create a tool that the engineers can look at and very quickly see what actions need to be taken.

### Want to get involved?

This will be a collaborative open source project and we'd love your input. [Get in touch here](https://wiki.mozilla.org/Foundation/Metrics/Contribute).

### Running the report

````
GH_TOKEN=<token> node index.js
````
