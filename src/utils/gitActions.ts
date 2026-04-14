/// <reference types="node" />
import * as vscode from 'vscode';   
import { exec } from 'child_process';
import { promisify } from 'util';
import {MAIN_BRANCH_NAME} from "../constants/mainBranchName";
const execAsync = promisify(exec);

export interface Branch {
   id: string; 
   name: string;
   isCurrent: boolean;
   isProtected: boolean;
   isRemote: boolean;
   commitHash?: string;
}

export class GitActions {
   private branchesCache: Branch[] | null = null;
   private getWorkspaceRoot(): string | undefined {
      return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
   }

   private async executeGitCommand(command: string): Promise<string> {
      const cwd = this.getWorkspaceRoot();
      if (!cwd) {
         throw new Error('No workspace folder open');
      }

      try {
         const { stdout, stderr } = await execAsync(command, { cwd });
         if (stderr && !stderr.includes('warning')) {
            console.error(`Git stderr: ${stderr}`);
         }
         return stdout.trim();
      } catch (error: any) {
         console.error(`Git command failed: ${command}`, error.message);
         throw new Error(`Git command failed: ${error.message}`);
      }
   }

   private generateBranchId(branchName: string, commitHash?: string): string {
      const hash = commitHash ? commitHash.substring(0, 8) : 'no-hash';
      return `${branchName.replace(/[^a-zA-Z0-9-]/g, '-')}-${hash}`;
   }

   async fetchBranches(): Promise<Branch[]> {
      try {
         const output = await this.executeGitCommand(
            'git for-each-ref refs/heads --format="%(refname:short)|%(objectname)|%(committerdate:relative)|%(contents:subject)"'
         );

         const currentBranchOutput = await this.executeGitCommand('git branch --show-current');
         const currentBranch = currentBranchOutput.trim();

         if (!output) {
            return [];
         }

         const lines = output.split('\n').filter(line => line.trim().length > 0);
         const branches: Branch[] = [];

         for (const line of lines) {
            const [name, hash, date, message] = line.split('|');
            if (!name || name.trim().length === 0) {
               continue;

            }

            const isCurrent = name === currentBranch;

            const isProtected = MAIN_BRANCH_NAME.includes(name);

            branches.push({
               id: this.generateBranchId(name, hash),
               name: name.trim(),
               isCurrent,
               isProtected,
               isRemote: false,
               commitHash: hash
            });
         }

         branches.sort((a, b) => {
            if (a.isCurrent && !b.isCurrent) {
               return -1;
            }

            if (!a.isCurrent && b.isCurrent) {
               return 1;

            }
            return a.name.localeCompare(b.name);
         });
         this.branchesCache = branches;
         return branches;

      } catch (error) {
         console.error('Error fetching branches:', error);
         return [];
      }
   }

   async getCurrentBranch(): Promise<string> {
      try {
         const output = await this.executeGitCommand('git branch --show-current');
         return output.trim();
      } catch (error) {
         console.error('Error getting current branch:', error);
         return '';
      }
   }

   async createBranch(newBranchName: string, sourceBranch?: string): Promise<void> {
      if (!newBranchName || newBranchName.trim().length === 0) {
         throw new Error('Branch name cannot be empty');
      }

      const cleanName = newBranchName
         .trim()
         .replace(/\s+/g, '-')
         .replace(/[^a-zA-Z0-9\-_/]/g, '');

      if (cleanName.length === 0) {
         throw new Error('Invalid branch name');
      }

      const existingBranch = this.branchesCache?.find(b => b.name === cleanName);
      if (existingBranch) {
         throw new Error(`Branch '${cleanName}' already exists`);
      }

      const currentBranch = await this.getCurrentBranch();
      const source = sourceBranch || currentBranch;

      if (source === cleanName) {
         throw new Error('Cannot create branch with the same name as source branch');
      }

      if (source === currentBranch) {
         await this.executeGitCommand(`git branch ${cleanName}`);
         vscode.window.showInformationMessage(`Branch '${cleanName}' created from '${source}'`);
      } else {
         await this.executeGitCommand(`git checkout ${source}`);
         await this.executeGitCommand(`git checkout -b ${cleanName}`);
         vscode.window.showInformationMessage(`Branch '${cleanName}' created from '${source}'`);
      }
   }

   async checkoutBranch(branchId: string): Promise<void> {
      const branch = this.branchesCache?.find(b => b.id === branchId);

      if (!branch) {
         throw new Error(`Branch not found: ${branchId}`);
      }

      const currentBranch = await this.getCurrentBranch();
      if (branch.name === currentBranch) {
         vscode.window.showInformationMessage(`Already on branch '${branch.name}'`);
         return;
      }

      await this.executeGitCommand(`git checkout ${branch.name}`);
      vscode.window.showInformationMessage(`Switched to branch '${branch.name}'`);
   }

   async updateBranch(branchId: string): Promise<void> {
      const branch = this.branchesCache?.find(b => b.id === branchId);

      if (!branch) {
         throw new Error(`Branch not found: ${branchId}`);
      }

      const currentBranch = await this.getCurrentBranch();

      // UPDATE peut être fait sur main aussi
      if (branch.name === currentBranch) {
         // Si on est déjà sur la branche, simple pull
         await this.executeGitCommand(`git pull --rebase origin ${branch.name}`);
         vscode.window.showInformationMessage(`Branch '${branch.name}' updated (already on this branch)`);
         return;
      }

      const originalBranch = currentBranch;

      try {
         // Méthode 1: Update sans checkout (pour les branches non-courantes)
         await this.executeGitCommand(`git fetch origin ${branch.name}`);
         await this.executeGitCommand(`git update-ref refs/heads/${branch.name} origin/${branch.name}`);
         vscode.window.showInformationMessage(`Branch '${branch.name}' updated successfully`);
      } catch (error: any) {
         console.log('Using checkout method for update');
         try {
            await this.executeGitCommand(`git checkout ${branch.name}`);
            await this.executeGitCommand(`git pull --rebase origin ${branch.name}`);

            if (originalBranch && originalBranch !== branch.name) {
               await this.executeGitCommand(`git checkout ${originalBranch}`);
            }

            vscode.window.showInformationMessage(`Branch '${branch.name}' updated successfully`);
         } catch (fallbackError) {
            throw new Error(`Failed to update branch: ${fallbackError}`);
         }
      }
   }

   async rebaseBranch(targetBranch: Branch): Promise<void> {
      const currentBranch = await this.getCurrentBranch();

      if (targetBranch.name === currentBranch) {
         throw new Error('Cannot rebase a branch onto itself');
      }
      try {

         // Exécuter le rebase avec l'état local uniquement
         await this.executeGitCommand(`git rebase ${targetBranch.name}`);

         vscode.window.showInformationMessage(
            `Successfully rebased '${currentBranch}' onto '${targetBranch.name}'`
         );

      } catch (error: any) {


         if (currentBranch && currentBranch !== targetBranch.name) {
            await this.executeGitCommand(`git checkout ${currentBranch}`);
         }

         if (error.message.includes('conflict')) {
            throw new Error(`Rebase failed due to conflicts. Rebase aborted. Resolve conflicts manually.`);
         } else {
            // En cas de conflit, on annule le rebase
            try {
               await this.executeGitCommand(`git rebase --abort`);
            } catch (abortError) {
               // Ignorer l'erreur d'abort
            }
            throw new Error(`Rebase failed: ${error.message}. Rebase aborted.`);
         }
      }
   }

   async deleteBranches(branchIds: string[]): Promise<void> {
      if (!branchIds || branchIds.length === 0) {
         throw new Error('No branches selected');
      }

      const allBranches = await this.fetchBranches();
      const branchesToDelete = allBranches.filter(b =>
         branchIds.includes(b.id) && !b.isProtected
      );

      if (branchesToDelete.length === 0) {
         throw new Error('No deletable branches selected (protected branches cannot be deleted)');
      }

      const currentBranch = await this.getCurrentBranch();
      const tryingToDeleteCurrent = branchesToDelete.some(b => b.name === currentBranch);

      if (tryingToDeleteCurrent) {
         throw new Error('Cannot delete the current branch. Please checkout another branch first.');
      }

      for (const branch of branchesToDelete) {
         try {
            await this.executeGitCommand(`git branch -D ${branch.name}`);
            console.log(`Deleted branch: ${branch.name}`);
         } catch (error) {
            console.error(`Failed to delete branch ${branch.name}:`, error);
         }
      }
   }

   async getBranchById(branchId: string): Promise<Branch | undefined> {
      const branches = this.branchesCache ?? await this.fetchBranches();
      return branches.find(b => b.id === branchId);
   }
}