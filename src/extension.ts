import * as vscode from 'vscode';
import * as cp from 'child_process';

const DEFAULT_THRESHOLD = 200;

let outputChannel: vscode.OutputChannel;

export function activate(context: vscode.ExtensionContext) {
	outputChannel = vscode.window.createOutputChannel('Pull Request Alert');

	const disposable = vscode.commands.registerCommand('pull-request-alert.checkDiff', async () => {
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

async function calculateDeletedLines(): Promise<number> {
	const currentWorkspace = vscode.workspace.workspaceFolders?.[0];

	if (!currentWorkspace) {
		vscode.window.showErrorMessage('No workspace is open. Please open a workspace to run the Pull Request Alert extension.');
		return 0;
	}

    let numDeletedLines = 0;
    try {
        const numDeletedLinesCommand = 'git diff --cached --numstat | findstr /R /C:"^[0-9]*[[:space:]]+[0-9]*[[:space:]]" | for /F "tokens=2" %a in (\'findstr /R /C:"^[0-9]*[[:space:]]+[0-9]*[[:space:]]"\') do set /a s+=%a';
        numDeletedLines = parseInt(await executeCommand(numDeletedLinesCommand, currentWorkspace.uri.fsPath));
    } catch (error) {
        console.log(`Error: ${error}`);
        outputChannel.appendLine(`Error: ${error}`);
    }

    console.log(`Number of deleted lines: ${numDeletedLines}`);
    outputChannel.appendLine(`Number of deleted lines: ${numDeletedLines}`);

    return numDeletedLines;
}

async function checkDiff() {
	const currentWorkspace = vscode.workspace.workspaceFolders?.[0];

	if (!currentWorkspace) {
		vscode.window.showErrorMessage('No workspace is open. Please open a workspace to run the Pull Request Alert extension.');
		return;
	}

	try {

		const config = vscode.workspace.getConfiguration('pullRequestAlert');
		const threshold = config.get<number>('threshold') || DEFAULT_THRESHOLD;

		let numStagedLinesCommand = '';
		if (process.platform === 'win32') {
			// console.log('Windows');
			numStagedLinesCommand = 'git diff --numstat | findstr /R /C:"^[0-9]*" | for /F "tokens=1" %a in (\'findstr /R /C:"^[0-9]*"\') do set /a s+=%a';
		} else {
			// console.log('Not Windows');

			numStagedLinesCommand = 'git diff --cached --numstat | grep -E "^[0-9]+" | cut -f1 | paste -sd+ - | bc';
		}

		const numAddedAndModifiedLines: number = await executeCommandToInt(numStagedLinesCommand, currentWorkspace.uri.fsPath);

		console.log(`Number of staged lines added and modified: ${numAddedAndModifiedLines}`);
		outputChannel.appendLine(`Number of staged lines added and modified: ${numAddedAndModifiedLines}`);

	} catch (err: any) {
		vscode.window.showErrorMessage(err.message);
		const errorMessage = `Error: ${err.message}\n${err.stack}`;
		outputChannel.appendLine(`Error: ${errorMessage}`);
	}
}

async function executeCommandToInt(command: string, cwd: string): Promise<number> {
	return new Promise((resolve, reject) => {
	  cp.exec(command, { cwd }, (error, stdout, stderr) => {
		if (error) {
		  reject(error);
		} else if (stderr) {
		  reject(new Error(stderr));
		} else {
			const num = parseInt(stdout.trim().split(' ')[stdout.trim().split(' ').length - 1], 10);
			if (isNaN(num)) {
				reject(new Error(`Failed to parse output of command "${command}" as a number: ${stdout}`));
			} else {
				resolve(num);
			}
		}
	  });
	});
  }

interface DiffStats {
	total: number;
	additions: number;
	modifications: number;
	deletions: number;
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
