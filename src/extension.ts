import * as vscode from 'vscode'; import * as cp from 'child_process';
const DEFAULT_THRESHOLD = 200;
export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand('extension.checkDiff', async () => { await checkDiff(); });
	context.subscriptions.push(disposable);
	vscode.workspace.onDidSaveTextDocument(async () => { const config = vscode.workspace.getConfiguration('diffChecker'); const autoCheck = config.get<boolean>('autoCheck'); if (autoCheck) { await checkDiff(); } });
}


async function checkDiff() {
	const currentWorkspace = vscode.workspace.workspaceFolders?.[0]; if (!currentWorkspace) { vscode.window.showErrorMessage('No workspace is open'); return; }
	const currentBranch = await executeCommand('git rev-parse --abbrev-ref HEAD', currentWorkspace.uri.fsPath); const branchPoint = await executeCommand(`git merge-base ${currentBranch.trim()} develop`, currentWorkspace.uri.fsPath); const diff = await executeCommand(`git diff ${branchPoint.trim()}..${currentBranch.trim()} --shortstat`, currentWorkspace.uri.fsPath);
	const changes = parseDiff(diff); const config = vscode.workspace.getConfiguration('diffChecker');

	const threshold = config.get<number>('threshold') || DEFAULT_THRESHOLD; if (changes >= threshold) { vscode.window.showWarningMessage(`The sum of changes is ${changes}, it's time to submit a PR`); } else { vscode.window.showInformationMessage(`The sum of changes is ${changes}`); }
}
function parseDiff(diff: string): number {
	const matches = diff.match(/(\d+) insertions.*(\d+) deletions/); if (!matches) { return 0; }
	const insertions = parseInt(matches[1]); const deletions = parseInt(matches[2]); return insertions + deletions;
}


function executeCommand(command: string, cwd: string): Promise<string> {
	return new Promise((resolve, reject) => {
		cp.exec(command, { cwd }, (error, stdout, stderr) => {
			if (error) { reject(error); return; }
			if (stderr) { reject(stderr); return; }
			resolve(stdout);
		});
	});
}
export function deactivate() { }