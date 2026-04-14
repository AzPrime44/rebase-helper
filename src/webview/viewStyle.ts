
export function getStyles(): string {
    return `
        :root { --vscode-font-family: -apple-system, BlinkMacSystemFont, 'Segoe WPC', 'Segoe UI', sans-serif; }

        body { padding: 15px; color: var(--vscode-foreground); font-family: var(--vscode-font-family); background-color: transparent; margin: 0; font-size: 13px; }

        .header { margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid var(--vscode-panel-border); }
        .current-branch-badge { display: inline-block; background: var(--vscode-badge-background); color: var(--vscode-badge-foreground); padding: 2px 8px; border-radius: 10px; font-size: 11px; margin-top: 5px; }

        .branches-container { max-height: 350px; overflow-y: auto; margin: 15px 0; border: 1px solid var(--vscode-panel-border); border-radius: 4px; padding: 5px; }

        .branch-item { display: flex; align-items: center; padding: 8px; margin: 3px 0; border-radius: 3px; cursor: pointer; transition: background 0.2s; user-select: none; }
        .branch-item:hover { background: var(--vscode-list-hoverBackground); }
        .branch-item.selected { background: var(--vscode-list-activeSelectionBackground); color: var(--vscode-list-activeSelectionForeground); }
        .branch-item.current { border-left: 3px solid var(--vscode-gitDecoration-untrackedResourceForeground); background: var(--vscode-editor-selectionBackground); }

        .branch-checkbox { margin-right: 10px; }
        .branch-info { flex: 1; min-width: 0; }
        .branch-name { font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .branch-meta { font-size: 11px; opacity: 0.7; margin-top: 2px; }

        .branch-actions { margin-left: 10px; display: flex; gap: 5px; opacity: 0; transition: opacity 0.2s; }
        .branch-item:hover .branch-actions { opacity: 1; }

        .branch-action-btn { border: 1px solid var(--vscode-button-border); color: var(--vscode-button-foreground); cursor: pointer; font-size: 11px; padding: 2px 6px; border-radius: 3px; background: var(--vscode-button-background); white-space: nowrap; }
        .branch-action-btn:hover { background: var(--vscode-button-hoverBackground); }
        .branch-action-btn.checkout  { background: var(--vscode-gitDecoration-addedResourceForeground);    color: white; border-color: var(--vscode-gitDecoration-addedResourceForeground); }
        .branch-action-btn.source    { background: var(--vscode-textLink-foreground);                      color: white; border-color: var(--vscode-textLink-foreground); }
        .branch-action-btn.rebase    { background: var(--vscode-gitDecoration-modifiedResourceForeground); color: white; border-color: var(--vscode-gitDecoration-modifiedResourceForeground); }
        .branch-action-btn.delete-only { background: var(--vscode-errorForeground);                        color: white; border-color: var(--vscode-errorForeground); }

        .controls { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin: 15px 0; }
        .main-btn { padding: 8px 12px; border: none; border-radius: 4px; background: var(--vscode-button-background); color: var(--vscode-button-foreground); cursor: pointer; font-size: 12px; transition: background 0.2s; text-align: center; }
        .main-btn:hover:not(:disabled) { background: var(--vscode-button-hoverBackground); }
        .main-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .main-btn.update   { background: var(--vscode-gitDecoration-modifiedResourceForeground); color: white; }
        .main-btn.rebase   { background: linear-gradient(45deg, #ff6b6b, #ffa500); color: white; }
        .main-btn.delete   { background: var(--vscode-errorForeground); color: white; }
        .main-btn.checkout { background: var(--vscode-gitDecoration-addedResourceForeground); color: white; }

        .create-section { margin-top: 20px; padding-top: 15px; border-top: 1px solid var(--vscode-panel-border); }
        .create-input-group { display: flex; gap: 10px; margin-top: 10px; }
        .create-input { flex: 1; padding: 8px 12px; border: 1px solid var(--vscode-input-border); background: var(--vscode-input-background); color: var(--vscode-input-foreground); border-radius: 4px; font-size: 13px; }
        .create-input:focus { outline: 1px solid var(--vscode-focusBorder); outline-offset: -1px; }

        .source-branch-info { font-size: 11px; opacity: 0.7; margin-top: 5px; padding: 5px; background: var(--vscode-input-background); border-radius: 3px; border: 1px solid var(--vscode-input-border); }
        .source-branch-info .branch-name { font-weight: bold; color: var(--vscode-textLink-foreground); }

        .empty-state { text-align: center; padding: 30px 20px; color: var(--vscode-descriptionForeground); font-size: 12px; }

        .status-bar { display: flex; justify-content: space-between; margin-top: 10px; font-size: 11px; opacity: 0.7; }

        .clear-source-btn { margin-left: 10px; font-size: 11px; padding: 1px 6px; background: var(--vscode-input-background); border: 1px solid var(--vscode-input-border); color: var(--vscode-input-foreground); border-radius: 3px; cursor: pointer; }
        .clear-source-btn:hover { background: var(--vscode-inputOption-hoverBackground); }

        .protected-badge { display: inline-block; background: var(--vscode-textBlockQuote-border); color: var(--vscode-textBlockQuote-foreground); padding: 1px 4px; border-radius: 3px; font-size: 9px; margin-left: 5px; vertical-align: middle; }

        .note { font-size: 11px; color: var(--vscode-descriptionForeground); margin-top: 10px; padding: 8px; background: var(--vscode-textBlockQuote-background); border-radius: 4px; border-left: 3px solid var(--vscode-textBlockQuote-border); }
    `;
}