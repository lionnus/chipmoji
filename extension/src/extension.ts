import * as vscode from 'vscode'
import { chipmojis, type Chipmoji } from './chipmojis'
import { collectDiff, getGitApi, pickRepository, type GitRepository } from './git'
import { rankHeuristic, type Suggestion } from './heuristic'
import { rankWithClaude, resolveApiKey } from './ai'

type InsertMode = 'shortcode' | 'emoji'

function config() {
  const c = vscode.workspace.getConfiguration('chipmoji')
  return {
    useAI: c.get<boolean>('useAI', false),
    apiKey: c.get<string>('anthropicApiKey', ''),
    model: c.get<string>('model', 'claude-opus-4-8'),
    insert: c.get<InsertMode>('insert', 'shortcode'),
    max: c.get<number>('maxSuggestions', 5),
  }
}

function token(item: Chipmoji, mode: InsertMode): string {
  return mode === 'emoji' ? item.emoji : item.shortcode
}

/** Prepend the chosen chipmoji to the repository's commit message box. */
function insertIntoCommit(repo: GitRepository, item: Chipmoji, mode: InsertMode): void {
  const existing = repo.inputBox.value
  repo.inputBox.value = `${token(item, mode)} ${existing}`.replace(/\s+$/, existing ? '' : '')
}

// ---------------------------------------------------------------------------
// Commit-box autocomplete
// ---------------------------------------------------------------------------

class ChipmojiCompletionProvider implements vscode.CompletionItemProvider {
  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): vscode.CompletionItem[] {
    const mode = config().insert
    const prefix = document.lineAt(position).text.slice(0, position.character)
    const match = /:[\w+-]*$/.exec(prefix)
    const range = match
      ? new vscode.Range(position.translate(0, -match[0].length), position)
      : undefined

    return chipmojis.map((item) => {
      const completion = new vscode.CompletionItem(
        item.shortcode,
        vscode.CompletionItemKind.Value,
      )
      completion.detail = `${item.emoji}  ${item.title} · ${item.category}`
      completion.documentation = new vscode.MarkdownString(
        `${item.description}\n\n_Example:_ \`${item.example}\``,
      )
      // Let users type aliases/keywords (e.g. "cdc") and still match.
      completion.filterText = `${item.shortcode} ${item.title} ${item.aliases.join(' ')}`
      completion.insertText = `${token(item, mode)} `
      completion.sortText = `${item.recommended ? '0' : '1'}-${item.title}`
      if (range) {
        completion.range = range
      }
      return completion
    })
  }
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

interface PickItem extends vscode.QuickPickItem {
  item: Chipmoji
}

function toPickItem(s: Suggestion): PickItem {
  return {
    label: `${s.item.emoji}  ${s.item.shortcode}`,
    description: s.item.title,
    detail: s.reasons.length ? `matched: ${s.reasons.join(', ')}` : s.item.description,
    item: s.item,
  }
}

async function suggestCommand(): Promise<void> {
  const api = getGitApi()
  if (!api) {
    void vscode.window.showErrorMessage('Chipmoji: the built-in Git extension is not available.')
    return
  }
  const repo = pickRepository(api)
  if (!repo) {
    void vscode.window.showErrorMessage('Chipmoji: no Git repository found in this workspace.')
    return
  }

  const diff = await collectDiff(repo)
  if (!diff) {
    void vscode.window.showInformationMessage(
      'Chipmoji: no changes to analyze. Stage some changes, or run "Chipmoji: Browse & insert emoji".',
    )
    return
  }

  const cfg = config()
  const apiKey = cfg.useAI ? resolveApiKey(cfg.apiKey) : undefined

  const suggestions = await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: 'Chipmoji: analyzing changes…' },
    async (): Promise<Suggestion[]> => {
      if (apiKey) {
        const ai = await rankWithClaude(diff, apiKey, cfg.model, cfg.max)
        if (ai && ai.length) {
          return ai
        }
      }
      return rankHeuristic(diff).slice(0, cfg.max)
    },
  )

  if (!suggestions.length) {
    const browse = 'Browse all'
    const choice = await vscode.window.showInformationMessage(
      'Chipmoji: no confident match for these changes.',
      browse,
    )
    if (choice === browse) {
      await browseCommand(repo)
    }
    return
  }

  const usingAI = Boolean(apiKey) && suggestions[0].score === 0
  const picked = await vscode.window.showQuickPick(suggestions.map(toPickItem), {
    title: `Chipmoji suggestions${usingAI ? ' (Claude)' : ''} · ${diff.staged ? 'staged' : 'working tree'}`,
    placeHolder: 'Select a chipmoji to prepend to your commit message',
    matchOnDescription: true,
    matchOnDetail: true,
  })
  if (picked) {
    insertIntoCommit(repo, picked.item, cfg.insert)
  }
}

async function browseCommand(preselectedRepo?: GitRepository): Promise<void> {
  const api = getGitApi()
  const repo = preselectedRepo ?? (api ? pickRepository(api) : undefined)

  const items: PickItem[] = chipmojis.map((item) => ({
    label: `${item.emoji}  ${item.shortcode}`,
    description: `${item.title} · ${item.category}`,
    detail: item.description,
    item,
  }))

  const picked = await vscode.window.showQuickPick(items, {
    title: 'Chipmoji · all entries',
    placeHolder: 'Search emoji, shortcode, title, category or description',
    matchOnDescription: true,
    matchOnDetail: true,
  })
  if (!picked) {
    return
  }

  const cfg = config()
  if (repo) {
    insertIntoCommit(repo, picked.item, cfg.insert)
  } else {
    // No repo (e.g. invoked outside a Git workspace): copy instead.
    await vscode.env.clipboard.writeText(token(picked.item, cfg.insert))
    void vscode.window.showInformationMessage(
      `Chipmoji: copied ${token(picked.item, cfg.insert)} to the clipboard.`,
    )
  }
}

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      { language: 'scminput' },
      new ChipmojiCompletionProvider(),
      ':',
    ),
    vscode.commands.registerCommand('chipmoji.suggest', suggestCommand),
    vscode.commands.registerCommand('chipmoji.browse', () => browseCommand()),
  )
}

export function deactivate(): void {
  // Nothing to clean up — all disposables are registered via context.subscriptions.
}
