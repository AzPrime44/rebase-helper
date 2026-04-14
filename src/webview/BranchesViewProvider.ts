
import * as vscode from "vscode";
import { GitActions } from "../utils/gitActions";
import { BranchAction } from "../constants/MessageTypes";
import { getBranchesHtml, getErrorHtml } from "./BranchesViewHtml";

export class BranchesViewProvider implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;
    private _gitActions: GitActions;
    private _selectedBranchId: string | null = null;

    constructor(private readonly _extensionUri: vscode.Uri) {
        this._gitActions = new GitActions();
    }

    public async resolveWebviewView(webviewView: vscode.WebviewView) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        await this.render();

        webviewView.webview.onDidReceiveMessage(async (message) => {
            await this.handleMessage(message);
        });
    }

    private async handleMessage(message: any) {
        try {
            switch (message.type) {
                case BranchAction.Refresh:
                    await this.render();
                    vscode.window.showInformationMessage("Branches refreshed");
                    break;

                case BranchAction.Create:
                    await this.handleCreateBranch(message.name, message.sourceBranchId);
                    break;

                case BranchAction.Checkout:
                    await this.handleCheckoutBranch(message.branchId);
                    break;

                case BranchAction.Update:
                    await this.handleUpdateBranch(message.branchId);
                    break;

                case BranchAction.Rebase:
                    await this.handleRebaseBranch(message.branchId);
                    break;

                case BranchAction.Delete:
                    await this.handleDeleteBranches(message.branchIds);
                    break;

                case BranchAction.SelectForCreate:
                    this._selectedBranchId = message.branchId;
                    await this.render();
                    break;
            }
        } catch (error: any) {
            vscode.window.showErrorMessage(`Error: ${error.message}`);
        }
    }

    private async handleCreateBranch(name: string, sourceBranchId?: string) {
        if (!name || name.trim().length === 0) {
            throw new Error("Branch name cannot be empty");
        }

        const cleanName = name.trim().replace(/\s+/g, '-');

        let sourceBranchName: string | undefined;
        if (sourceBranchId) {
            const sourceBranch = await this._gitActions.getBranchById(sourceBranchId);
            if (sourceBranch) {
                sourceBranchName = sourceBranch.name;
            }
        }

        await this._gitActions.createBranch(cleanName, sourceBranchName);

        this._selectedBranchId = null;
        await this.render();
    }

    private async handleCheckoutBranch(branchId: string) {
        const branch = await this._gitActions.getBranchById(branchId);
        if (!branch) {
            throw new Error("Branch not found");
        }

        await this._gitActions.checkoutBranch(branchId);
        await this.render();
    }

    private async handleUpdateBranch(branchId: string) {
        const branch = await this._gitActions.getBranchById(branchId);
        if (!branch) {
            throw new Error("Branch not found");
        }

        const result = await vscode.window.showWarningMessage(
            `Update branch '${branch.name}'? This will pull latest changes with rebase.`,
            'Update',
        );

        if (result === 'Update') {
            // Main peut être updaté maintenant
            await this._gitActions.updateBranch(branchId);
            await this.render();
        }
    }

    private async handleRebaseBranch(branchId: string) {
        const targetBranch = await this._gitActions.getBranchById(branchId);
        if (!targetBranch) {
            throw new Error("Branch not found");
        }

        const currentBranch = await this._gitActions.getCurrentBranch();

        const result = await vscode.window.showWarningMessage(
            `Rebase '${currentBranch}' onto '${targetBranch.name}'?`,
            {
                modal: true,
                detail: `This will apply commits from ${currentBranch} onto ${targetBranch.name}\n\n                `
            },
            'Rebase'
        );

        if (result === 'Rebase') {
            await this._gitActions.rebaseBranch(targetBranch);
            await this.render();
        }
    }

    private async handleDeleteBranches(branchIds: string[]) {
        if (!branchIds || branchIds.length === 0) {
            return;
        }

        const branches = await this._gitActions.fetchBranches();
        const selectedBranches = branches.filter(b => branchIds.includes(b.id));

        const branchNames = selectedBranches
            .filter(b => !b.isProtected)
            .map(b => b.name);

        if (branchNames.length === 0) {
            vscode.window.showWarningMessage("Cannot delete protected branches (main/master)");
            return;
        }

        const message = branchNames.length === 1
            ? `Delete branch '${branchNames[0]}'?`
            : `Delete ${branchNames.length} branches?\n${branchNames.map(b => `• ${b}`).join('\n')}`;

        const result = await vscode.window.showWarningMessage(
            message,
            { modal: true },
            'Delete',
            'Cancel'
        );

        if (result === 'Delete') {
            await this._gitActions.deleteBranches(branchIds);
            vscode.window.showInformationMessage(
                `Deleted ${branchNames.length} branch${branchNames.length > 1 ? 'es' : ''}`
            );
            await this.render();
        }
    }

    private async render() {
        if (!this._view) {
            return;
        }

        try {
            const branches = await this._gitActions.fetchBranches();
            const selectedBranch = this._selectedBranchId
                ? branches.find(b => b.id === this._selectedBranchId)
                : null;
            if(selectedBranch !== undefined) {
                this._view.webview.html = getBranchesHtml(branches, selectedBranch);
            }
    } catch (error) {
            console.error("Error rendering branches:", error);
            this._view.webview.html = getErrorHtml("Unable to fetch branches.");
        }
    }
}