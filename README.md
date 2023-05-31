# Pull Request Alert (Under Active Development right now 5/30/23)

This extension allows you to check the difference between the current branch and the branch it was created from, and receive a warning when the sum of changes reaches a certain threshold.

![Pull Request Alert](PullRequestAlertLogo.png)

## Installation

This extension can be installed from the VS Code marketplace.

## Usage

To check the difference between the current branch and the branch it was created from, execute the command `Check Diff` from the command palette. You can also configure the extension to automatically check when a file is saved.

## Configuration

This extension provides the following configuration options:

- `pullRequestAlert.threshold`: The diff threshold for displaying a warning to the user. This is calculated as the sum of additions, modifications and deletions. Default is 200.
- `pullRequestAlert.autoCheck`: Automatically check when a file is saved. Default is false.

## Contributing

Bug reports and pull requests are welcome on GitHub at [https://github.com/asa-leholland/pull-request-alert](https://github.com/asa-leholland/pull-request-alert)

## License

The extension is available as open source under the terms of the [MIT License](https://opensource.org/licenses/MIT).
