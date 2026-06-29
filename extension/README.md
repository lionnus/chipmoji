# Chipmoji for VS Code

Propose the correct [chipmoji](https://chipmoji.lionn.us/) — a curated, Gitmoji-inspired
commit-emoji guide for chip/hardware development — straight from your staged changes, and
autocomplete shortcodes in the Source Control commit box.

## Features

- **Suggest from your diff** — run **Chipmoji: Suggest emoji from staged changes** (also the
  ✨ button in the Source Control title bar). It reads your staged diff (or the working tree
  if nothing is staged), ranks the chipmojis that best match the *intention* of the change,
  and prepends the one you pick to the commit message.
- **Commit-box autocomplete** — type `:` in the commit message box to complete any shortcode.
  You can also type a keyword (e.g. `cdc`, `backpressure`, `area`) and it still resolves to
  the right entry.
- **Browse & insert** — run **Chipmoji: Browse & insert emoji** to search the full catalog.
- **Offline by default, optional Claude refinement** — ranking runs locally with no network.
  Enable `chipmoji.useAI` and provide an Anthropic API key to let Claude read the diff and
  refine the pick; it falls back to the offline heuristic whenever AI is off, offline, or
  unkeyed.

## How suggestions work

| Mode | When | What it does |
| --- | --- | --- |
| Heuristic (default) | always available | Scores each chipmoji by keyword overlap with the diff and changed file paths (aliases, titles, descriptions, categories, plus chip-aware path hints). Deterministic, instant, offline. |
| Claude (opt-in) | `chipmoji.useAI` on + API key set | Sends the staged diff and the chipmoji catalog to Claude and asks for the best entries. Falls back to the heuristic on any error. |

## Settings

| Setting | Default | Description |
| --- | --- | --- |
| `chipmoji.useAI` | `false` | Refine suggestions with Claude when a key is available. |
| `chipmoji.anthropicApiKey` | `""` | Anthropic API key. Leave blank to use the `ANTHROPIC_API_KEY` environment variable instead (preferred on shared machines). |
| `chipmoji.model` | `claude-opus-4-8` | Model for AI suggestions. Use `claude-haiku-4-5` for a faster/cheaper pick. |
| `chipmoji.insert` | `shortcode` | Insert the `:shortcode:` (matches the chipmoji commit format) or the rendered emoji. |
| `chipmoji.maxSuggestions` | `5` | Number of ranked suggestions to show. |

## Develop

```bash
cd extension
npm install
npm run compile      # syncs the data file, then bundles to dist/
# Press F5 in VS Code to launch an Extension Development Host
npm run package      # build a .vsix (requires @vscode/vsce)
```

The chipmoji data is **not** edited here — it is synced from the single source of truth at
[`../src/data/chipmojis.ts`](../src/data/chipmojis.ts) by `npm run sync` (which runs
automatically before every compile/package). Edit the source, then rebuild.

## License

[Apache-2.0](../LICENSE) © Lionnus Kesting
