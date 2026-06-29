import * as vscode from 'vscode'

// Minimal shape of the bits of the built-in `vscode.git` extension API we use.
// Full typings live in the git extension's `git.d.ts`; we declare only what we need.
interface GitChange {
  readonly uri: vscode.Uri
}
interface GitInputBox {
  value: string
}
interface GitRepositoryState {
  readonly indexChanges: readonly GitChange[]
  readonly workingTreeChanges: readonly GitChange[]
}
export interface GitRepository {
  readonly rootUri: vscode.Uri
  readonly inputBox: GitInputBox
  readonly state: GitRepositoryState
  diff(cached?: boolean): Promise<string>
}
interface GitAPI {
  readonly repositories: GitRepository[]
}
interface GitExtension {
  getAPI(version: 1): GitAPI
}

export function getGitApi(): GitAPI | undefined {
  const extension = vscode.extensions.getExtension<GitExtension>('vscode.git')
  if (!extension) {
    return undefined
  }
  // extensionDependencies in package.json guarantees this is active, but guard anyway.
  return extension.isActive ? extension.exports.getAPI(1) : undefined
}

/** Pick the repository the user is most likely committing to. */
export function pickRepository(api: GitAPI): GitRepository | undefined {
  const repos = api.repositories
  if (repos.length <= 1) {
    return repos[0]
  }
  // Prefer the repo containing the active editor's file.
  const activeUri = vscode.window.activeTextEditor?.document.uri
  if (activeUri) {
    const match = repos.find((r) => activeUri.fsPath.startsWith(r.rootUri.fsPath))
    if (match) {
      return match
    }
  }
  return repos[0]
}

export interface DiffContext {
  diff: string
  files: string[]
  staged: boolean
}

/**
 * Collect the diff to analyze. Prefers staged changes; falls back to the
 * working tree so the command is still useful before `git add`.
 */
export async function collectDiff(repo: GitRepository): Promise<DiffContext | undefined> {
  const stagedFiles = repo.state.indexChanges.map((c) => c.uri.fsPath)
  if (stagedFiles.length > 0) {
    return { diff: await repo.diff(true), files: stagedFiles, staged: true }
  }
  const workingFiles = repo.state.workingTreeChanges.map((c) => c.uri.fsPath)
  if (workingFiles.length > 0) {
    return { diff: await repo.diff(false), files: workingFiles, staged: false }
  }
  return undefined
}
