import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import vm from 'node:vm'
import ts from 'typescript'

const repoRoot = resolve(process.cwd())
const sourcePath = resolve(repoRoot, 'src/data/silimojis.ts')
const outputPath = resolve(repoRoot, 'public/silimoji-instructions.txt')

const source = readFileSync(sourcePath, 'utf8')
const transpiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
})

const module = { exports: {} }
const sandbox = {
  module,
  exports: module.exports,
}

// The build processes a committed repository file, so executing this transpiled module is safe here.
vm.runInNewContext(transpiled.outputText, sandbox, { filename: sourcePath })

const silimojis = module.exports.silimojis

if (!Array.isArray(silimojis)) {
  throw new Error(`Could not load silimojis from ${sourcePath}`)
}

const lines = [
  'silimoji instructions',
  '',
  'Source of truth: src/data/silimojis.ts',
  'Generated from the committed silimoji data.',
  '',
  'commit format:',
  '<intention> [scope?]: <message>',
  '',
  'entries:',
  ...silimojis.map(
    (item) =>
      `${item.shortcode} ${item.emoji} | ${item.title} | ${item.category} | ${item.description} | aliases: ${item.aliases.length > 0 ? item.aliases.join(', ') : '-'}`,
  ),
  '',
]

mkdirSync(dirname(outputPath), { recursive: true })
writeFileSync(outputPath, `${lines.join('\n')}\n`)
