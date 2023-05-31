import * as vscode from 'vscode';
import * as cp from 'child_process';

const DEFAULT_THRESHOLD = 200;

let outputChannel: vscode.OutputChannel;

export function activate(context: vscode.ExtensionContext) {
	outputChannel = vscode.window.createOutputChannel('Pull Request Alert');

	const disposable = vscode.commands.registerCommand('extension.checkDiff', async () => {
		await checkDiff();
	});

	context.subscriptions.push(disposable);

	vscode.workspace.onDidSaveTextDocument(async () => {
		const config = vscode.workspace.getConfiguration('pullRequestAlert');
		const autoCheck = config.get<boolean>('autoCheck');

		if (autoCheck) {
			await checkDiff();
		}
	});
}

async function checkDiff() {
	const currentWorkspace = vscode.workspace.workspaceFolders?.[0];

	if (!currentWorkspace) {
		vscode.window.showErrorMessage('No workspace is open');
		return;
	}

	try {
		const currentBranch = await executeCommand('git rev-parse --abbrev-ref HEAD', currentWorkspace.uri.fsPath);
		const defaultBranch = await executeCommand('git remote show origin | awk \'/HEAD branch/ {print $NF}\'', currentWorkspace.uri.fsPath);
		outputChannel.appendLine(`Current Branch: ${currentBranch}`);
		outputChannel.appendLine(`Default Branch: ${defaultBranch}`);
		const branchPoint = await executeCommand(`git merge-base ${currentBranch.trim()} ${defaultBranch.trim()}`, currentWorkspace.uri.fsPath);
		outputChannel.appendLine(`Branch Point: ${branchPoint}`);
		const diff = await executeCommand(`git diff ${branchPoint.trim()}..${currentBranch.trim()} --shortstat`, currentWorkspace.uri.fsPath);
		outputChannel.appendLine(`Diff: ${diff}`);

		const changes = parseDiff(diff);
		const config = vscode.workspace.getConfiguration('pullRequestAlert');
		const threshold = config.get<number>('threshold') || DEFAULT_THRESHOLD;

		const details = `Additions: ${changes.additions}, Modifications: ${changes.modifications}, Deletions: ${changes.deletions}`;

		if (changes.total >= threshold && currentBranch.trim() !== defaultBranch.trim()) {
			vscode.window.showWarningMessage(`The sum of changes is ${changes.total}. It's time to submit a pull request. ${details}`);
		} else if (changes.total >= threshold && currentBranch.trim() === defaultBranch.trim()) {
			vscode.window.showWarningMessage(`The sum of changes is ${changes.total}. It's time to submit a pull request to merge your changes. ${details}`);
		} else {
			vscode.window.showInformationMessage(`The sum of changes is ${changes.total}. ${details}`);
		}

	} catch (err: any) {
		vscode.window.showErrorMessage(err.message);
		const errorMessage = `Error: ${err.message}\n${err.stack}`;
		outputChannel.appendLine(`Error: ${errorMessage}`);
	}
}

interface DiffStats {
	total: number;
	additions: number;
	modifications: number;
	deletions: number;
}

function parseDiff(diff: string): DiffStats {
	const matches = diff.match(/(\d+) insertions.*(\d+) deletions/);
	if (!matches) {
		return {
			total: 0,
			additions: 0,
			modifications: 0,
			deletions: 0
		};
	}

	const additions = parseInt(matches[1]);
	const deletions = parseInt(matches[2]);
	const modifications = Math.abs(additions + deletions);
	const total = additions + deletions;

	return {
		total,
		additions,
		modifications,
		deletions
	};
}

function executeCommand(command: string, cwd: string): Promise<string> {
	return new Promise((resolve, reject) => {
		cp.exec(command, { cwd }, (error, stdout, stderr) => {
			if (error) {
				reject(error);
				return;
			}

			if (stderr) {
				reject(new Error(stderr));
				return;
			}

			console.log(`Command: ${command}`);
			console.log(`Output: ${stdout}`);
			resolve(stdout);
		});
	});
}

export function deactivate() { }
