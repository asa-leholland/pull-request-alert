# Pull Request Alert (pre-pre-alpha WIP)

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

To configure the extension, go to the **Extensions** view in the VS Code sidebar, click on the gear icon next to the "Pull Request Alert" extension, and select **Extension Settings**. Alternatively, you can click [here](command:workbench.action.openSettings?%22%22) to open the settings directly.

## Contributing

Bug reports and pull requests are welcome on GitHub at [https://github.com/asa-leholland/pull-request-alert](https://github.com/asa-leholland/pull-request-alert)

## License

The extension is available as open source under the terms of the [MIT License](https://opensource.org/licenses/MIT).
