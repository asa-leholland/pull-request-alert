/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import * as vscode from 'vscode';

let myStatusBarItem: vscode.StatusBarItem;
const terminalLogFile = 'git-diff.log';

export function activate({ subscriptions }: vscode.ExtensionContext) {
	// register a command that is invoked when the status bar
	// item is selected
	const myCommandId = 'sample.showGitDiff';
	subscriptions.push(vscode.commands.registerCommand(myCommandId, async () => {
		try {
			const gitDiffOutput = await vscode.workspace.fs.readFile(vscode.Uri.file(terminalLogFile));
			const { total, added, deleted } = parseGitDiffStats(gitDiffOutput.toString());
			vscode.window.showInformationMessage(`Total: ${total} | Added: ${added} | Deleted: ${deleted}`);
		} catch (error) {
			vscode.window.showInformationMessage('Git diff information is not available. Please try again later.');
		}
	}));

	// create a new status bar item that we can now manage
	myStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	myStatusBarItem.command = myCommandId;
	subscriptions.push(myStatusBarItem);

	// register some listeners to make sure the status bar
	// item is always up-to-date
	subscriptions.push(vscode.window.onDidChangeActiveTextEditor(updateStatusBarItem));
	subscriptions.push(vscode.window.onDidChangeTextEditorSelection(updateStatusBarItem));

	// update status bar item once at start
	updateStatusBarItem();


	// Create a terminal and redirect its output to a file
	const terminal = vscode.window.createTerminal({ name: 'Git Diff Terminal' });
	terminal.sendText(`git diff --stat > ${terminalLogFile}`);
	terminal.sendText('exit');
}

function parseGitDiffStats(output: string): { total: number; added: number; deleted: number } {
	let total = 0;
	let added = 0;
	let deleted = 0;

	const statLines = output.split('\n');
	for (const line of statLines) {
		const insertionsMatches = line.match(/(\d+) insertions\(\+\)/);
		if (insertionsMatches && insertionsMatches.length === 2) {
			added += parseInt(insertionsMatches[1]);
			total += parseInt(insertionsMatches[1]);
		}

		const deletionsMatches = line.match(/(\d+) deletions/);
		if (deletionsMatches && deletionsMatches.length === 2) {
			deleted += parseInt(deletionsMatches[1]);
			total += parseInt(deletionsMatches[1]);
		}

	}

	return { total, added, deleted };
}

async function updateStatusBarItem(): Promise<void> {
	try {
		const gitDiffOutput = await vscode.workspace.fs.readFile(vscode.Uri.file(terminalLogFile));
		const { total, added, deleted } = parseGitDiffStats(gitDiffOutput.toString());
		myStatusBarItem.text = `Total: ${total} | Added: ${added} | Deleted: ${deleted}`;
		myStatusBarItem.show();
	} catch (error) {
		myStatusBarItem.text = 'Git Diff Information Not Available';
		myStatusBarItem.show();
	}
}

export function deactivate() { }
