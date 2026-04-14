// src/webview/BranchesViewHtml.ts
import { Branch } from "../utils/gitActions";
import { BranchAction } from "../constants/MessageTypes";
import { getStyles } from "./viewStyle";

export function getBranchesHtml(branches: Branch[], selectedBranch: Branch | null): string {
   const currentBranch = branches.find(b => b.isCurrent);

   return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
         <meta charset="UTF-8">
         <meta name="viewport" content="width=device-width, initial-scale=1.0">
         <title>Git Branches Manager</title>
         <style>${getStyles()}</style>
      </head>
      <body>
         ${renderHeader(currentBranch)}
         ${branches.length === 0 ? renderEmptyState() : renderBranchList(branches, selectedBranch)}
         ${renderCreateSection(selectedBranch)}
         <div class="status-bar">
               <span id="selected-count">0 branches selected</span>
               <span>${branches.length} total branches</span>
         </div>
         <script>${getScript(selectedBranch)}</script>
      </body>
      </html>
   `;
}

export function getErrorHtml(message: string): string {
   return `
      <!DOCTYPE html>
      <html>
      <body style="padding: 20px; color: var(--vscode-errorForeground); font-family: var(--vscode-font-family);">
         <h3>⚠️ Error</h3>
         <p>${message}</p>
         <button onclick="vscode.postMessage({ type: '${BranchAction.Refresh}' })" 
                  style="padding: 8px 16px; margin-top: 10px; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; border-radius: 4px; cursor: pointer;">
               Retry
         </button>
         <script>const vscode = acquireVsCodeApi();</script>
      </body>
      </html>
   `;
}

// ─── Sections HTML ────────────────────────────────────────────────────────────

function renderHeader(currentBranch: Branch | undefined): string {
   return `
      <div class="header">
         <h3 style="margin: 0;">Git Branches Manager</h3>
         ${currentBranch
         ? `<div class="current-branch-badge">Current: ${currentBranch.name}</div>`
         : ''
      }
      </div>
   `;
}

function renderEmptyState(): string {
   return `
      <div class="empty-state">
         <p>No branches found in this repository</p>
      </div>
   `;
}

function renderBranchList(branches: Branch[], selectedBranch: Branch | null): string {
   return `
      <div class="branches-container" id="branches-container">
         ${branches.map(renderBranchItem).join('')}
      </div>
      ${renderControls()}
      <div class="note">
         📝 <strong>Note:</strong> 
         • This extension for better Git branch management.
         • <strong>Create</strong> • <strong>Update</strong> • <strong>Delete</strong> • <strong>Rebase</strong>
      </div>
   `;
}

function renderBranchItem(branch: Branch): string {
   return `
      <div class="branch-item ${branch.isCurrent ? 'current' : ''}" data-branch-id="${branch.id}">
         <input type="checkbox" 
                  class="branch-checkbox" 
                  id="branch-${branch.id}"
                  data-branch-id="${branch.id}">
         <div class="branch-info">
               <div class="branch-name">
                  ${branch.name}
                  ${branch.isCurrent ? ' (current)' : ''}
                  ${branch.isProtected ? '<span class="protected-badge">protected</span>' : ''}
               </div>
         </div>
         <div class="branch-actions">
               ${renderBranchActions(branch)}
         </div>
      </div>
   `;
}

function renderBranchActions(branch: Branch): string {
   const checkoutBtn = `
      <button class="branch-action-btn checkout" 
               onclick="postAction('${BranchAction.Checkout}', { branchId: '${branch.id}' })"
               title="Checkout this branch">
         Checkout
      </button>`;

   const sourceBtn = `
      <button class="branch-action-btn source" 
               onclick="postAction('${BranchAction.SelectForCreate}', { branchId: '${branch.id}' })"
               title="Create new branch from this branch">
         Source
      </button>`;

   const rebaseBtn = !branch.isCurrent && !branch.isProtected
      ? `<button class="branch-action-btn rebase" 
                  onclick="postAction('${BranchAction.Rebase}', { branchId: '${branch.id}' })"
                  title="Rebase current branch onto this branch">
            Rebase
         </button>`
      : '';

   const protectedBtn = !branch.isCurrent && branch.isProtected
      ? `<button class="branch-action-btn delete-only" 
                  onclick="showProtectedNote('${branch.name}')"
                  title="Protected branch - cannot be deleted">
            Protected
         </button>`
      : '';

   return checkoutBtn + sourceBtn + rebaseBtn + protectedBtn;
}

function renderControls(): string {
   return `
      <div class="controls">
         <button class="main-btn checkout" id="checkout-btn" disabled>Checkout Selected</button>
         <button class="main-btn update"   id="update-btn"   disabled>Update Selected</button>
         <button class="main-btn rebase"   id="rebase-btn"   disabled>Rebase Selected</button>
         <button class="main-btn delete"   id="delete-btn"   disabled>Delete Selected</button>
         <button class="main-btn"          id="refresh-btn"  style="grid-column: span 2;">
               🔄 Refresh All Branches
         </button>
      </div>
   `;
}

function renderCreateSection(selectedBranch: Branch | null): string {
   const sourceInfo = selectedBranch
      ? `New branch will be created from: 
         <span class="branch-name">${selectedBranch.name}</span>
         <button class="clear-source-btn" 
                  onclick="postAction('${BranchAction.SelectForCreate}', { branchId: null })">
            Clear
         </button>`
      : 'New branch will be created from current branch';

   return `
      <div class="create-section">
         <h4 style="margin: 0 0 8px 0;">Create New Branch</h4>
         <div class="source-branch-info">${sourceInfo}</div>
         <div class="create-input-group">
               <input type="text" 
                     class="create-input" 
                     id="new-branch-input" 
                     placeholder="Enter new branch name..."
                     oninput="this.value = this.value.replace(/\\s+/g, '-')">
               <button class="main-btn checkout" id="create-btn">Create Branch</button>
         </div>
         <div style="font-size: 11px; opacity: 0.7; margin-top: 5px;">
               Spaces will be automatically replaced with hyphens (-)
         </div>
      </div>
   `;
}

// ─── Script ───────────────────────────────────────────────────────────────────

function getScript(selectedBranch: Branch | null): string {
   const sourceBranchId = selectedBranch ? `'${selectedBranch.id}'` : 'null';

   return `
      const vscode = acquireVsCodeApi();
      let selectedBranchIds = new Set();

      function postAction(type, payload) {
         vscode.postMessage({ type, ...payload });
      }

      function updateSelection() {
         selectedBranchIds.clear();
         document.querySelectorAll('.branch-checkbox:checked:not(:disabled)').forEach(cb => {
               selectedBranchIds.add(cb.dataset.branchId);
         });

         const count = selectedBranchIds.size;
         document.getElementById('checkout-btn').disabled = count !== 1;
         document.getElementById('update-btn').disabled   = count !== 1;
         document.getElementById('rebase-btn').disabled   = count !== 1;
         document.getElementById('delete-btn').disabled   = count < 1;

         document.getElementById('selected-count').textContent =
               \`\${count} branch\${count !== 1 ? 'es' : ''} selected\`;

         document.querySelectorAll('.branch-item').forEach(item => {
               item.classList.toggle('selected', selectedBranchIds.has(item.dataset.branchId));
         });
      }

      function showProtectedNote(branchName) {
         alert(\`\${branchName} is a protected branch.\\n\\n✅ Can: Checkout, Update, Use as source\\n❌ Cannot: Delete, Rebase\`);
      }

      // Clic sur un item → toggle checkbox
      document.querySelectorAll('.branch-item').forEach(item => {
         item.addEventListener('click', (e) => {
               if (e.target.closest('.branch-action-btn')) { return; }
               const cb = item.querySelector('.branch-checkbox');
               if (cb && !cb.disabled) {
                  cb.checked = !cb.checked;
                  updateSelection();
               }
         });
      });

      document.addEventListener('change', (e) => {
         if (e.target.classList.contains('branch-checkbox')) { updateSelection(); }
      });

      document.getElementById('checkout-btn').addEventListener('click', () =>
         postAction('${BranchAction.Checkout}', { branchId: Array.from(selectedBranchIds)[0] }));

      document.getElementById('update-btn').addEventListener('click', () =>
         postAction('${BranchAction.Update}', { branchId: Array.from(selectedBranchIds)[0] }));

      document.getElementById('rebase-btn').addEventListener('click', () =>
         postAction('${BranchAction.Rebase}', { branchId: Array.from(selectedBranchIds)[0] }));

      document.getElementById('delete-btn').addEventListener('click', () =>
         postAction('${BranchAction.Delete}', { branchIds: Array.from(selectedBranchIds) }));

      document.getElementById('refresh-btn').addEventListener('click', () =>
         postAction('${BranchAction.Refresh}', {}));

      document.getElementById('create-btn').addEventListener('click', () => {
         const input = document.getElementById('new-branch-input');
         const branchName = input.value.trim();
         if (!branchName) { alert('Please enter a branch name'); return; }
         postAction('${BranchAction.Create}', { name: branchName, sourceBranchId: ${sourceBranchId} });
         input.value = '';
      });

      document.getElementById('new-branch-input').addEventListener('keypress', (e) => {
         if (e.key === 'Enter') { document.getElementById('create-btn').click(); }
      });

      updateSelection();
   `;
}

