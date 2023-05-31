import * as vscode from 'vscode';
import * as cp from 'child_process';

const DEFAULT_THRESHOLD = 200;

export function activate(context: vscode.ExtensionContext) {
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
		console.log(`Current Branch: ${currentBranch}`);
		console.log(`Default Branch: ${defaultBranch}`);
		const branchPoint = await executeCommand(`git merge-base ${currentBranch.trim()} ${defaultBranch.trim()}`, currentWorkspace.uri.fsPath);
		console.log(`Branch Point: ${branchPoint}`);
		const diff = await executeCommand(`git diff ${branchPoint.trim()}..${currentBranch.trim()} --shortstat`, currentWorkspace.uri.fsPath);
		console.log(`Diff: ${diff}`);

		const changes = parseDiff(diff);
		const config = vscode.workspace.getConfiguration('pullRequestAlert');
		const threshold = config.get<number>('threshold') || DEFAULT_THRESHOLD;

		if (changes >= threshold && currentBranch.trim() !== defaultBranch.trim()) {
			vscode.window.showWarningMessage(`The sum of changes is ${changes}. It's time to submit a pull request.`);
		} else if (changes >= threshold && currentBranch.trim() === defaultBranch.trim()) {
			vscode.window.showWarningMessage(`The sum of changes is ${changes}. It's time to submit a pull request to merge your changes.`);
		} else {
			vscode.window.showInformationMessage(`The sum of changes is ${changes}.`);
		}

	} catch (err: any) {
		vscode.window.showErrorMessage(err.message);
	}
}

function parseDiff(diff: string): number {
	const matches = diff.match(/(\d+) insertions.*(\d+) deletions/);
	if (!matches) {
		return 0;
	}

	const insertions = parseInt(matches[1]);
	const deletions = parseInt(matches[2]);
	return insertions + deletions;
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
