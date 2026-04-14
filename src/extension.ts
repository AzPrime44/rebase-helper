import * as vscode from 'vscode';
import { BranchesViewProvider } from './webview/BranchesViewProvider';

export function activate(context: vscode.ExtensionContext) {

    // Créer le provider
    const provider = new BranchesViewProvider(context.extensionUri);
    
    // Enregistrer le provider
    const providerRegistration = vscode.window.registerWebviewViewProvider(
        'rebaseHelper.branchesView',
        provider,
        {
            webviewOptions: {
                retainContextWhenHidden: true
            }
        }
    );
    
    context.subscriptions.push(providerRegistration);

    // Commande de test
    const testCommand = vscode.commands.registerCommand('rebaseHelper.test', () => {
        vscode.window.showInformationMessage('Rebase Helper is working!');
        // Focus sur la vue
        vscode.commands.executeCommand('rebaseHelper.branchesView.focus');
    });
    
    context.subscriptions.push(testCommand);

    // Commande pour afficher les branches
    const showBranchesCommand = vscode.commands.registerCommand('rebaseHelper.showBranches', () => {
        vscode.commands.executeCommand('rebaseHelper.branchesView.focus');
    });
    
    context.subscriptions.push(showBranchesCommand);
}

export function deactivate() {}