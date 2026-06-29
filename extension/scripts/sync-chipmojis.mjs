// Copies the single source of truth (../src/data/chipmojis.ts) into the
// extension bundle so the extension and the website never diverge.
// Run via `npm run sync` (also runs automatically before compile/package).
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const source = resolve(here, '../../src/data/chipmojis.ts')
const dest = resolve(here, '../src/chipmojis.ts')

const banner = `// AUTO-GENERATED — do not edit.
// Synced from ../../src/data/chipmojis.ts by scripts/sync-chipmojis.mjs.
// Edit the source of truth instead, then run \`npm run sync\`.

`

writeFileSync(dest, banner + readFileSync(source, 'utf8'))
console.log(`Synced chipmojis -> ${dest}`)
