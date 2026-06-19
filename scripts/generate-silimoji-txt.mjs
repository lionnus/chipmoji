import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const repoRoot = resolve(process.cwd())
const sourcePath = resolve(repoRoot, 'src/data/silimojis.ts')
const outputPath = resolve(repoRoot, 'public/silimoji-instructions.txt')

const source = readFileSync(sourcePath, 'utf8')
const startMarker = 'export const silimojis: Silimoji[] = ['
const startIndex = source.indexOf(startMarker)

if (startIndex === -1) {
  throw new Error(`Could not find silimoji data in ${sourcePath}`)
}

const arrayStart = source.indexOf('[', startIndex)
const arrayEnd = source.lastIndexOf('];')

if (arrayStart === -1 || arrayEnd === -1 || arrayEnd <= arrayStart) {
  throw new Error(`Could not parse silimoji array in ${sourcePath}`)
}

const silimojis = Function(`"use strict"; return (${source.slice(arrayStart, arrayEnd + 1)})`)()

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
      `${item.shortcode} ${item.emoji} | ${item.title} | ${item.category} | ${item.description} | aliases: ${item.aliases.join(', ') || '-'}`,
  ),
  '',
]

mkdirSync(dirname(outputPath), { recursive: true })
writeFileSync(outputPath, `${lines.join('\n')}\n`)
