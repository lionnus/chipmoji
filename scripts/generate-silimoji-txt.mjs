import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const repoRoot = resolve(process.cwd())
const sourcePath = resolve(repoRoot, 'src/data/silimojis.ts')
const outputPath = resolve(repoRoot, 'public/silimoji-instructions.txt')

const source = readFileSync(sourcePath, 'utf8')
const silimojis = source
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => line.startsWith('{ emoji: '))
  .map((line) => {
    const match = line.match(
      /^\{\s*emoji: '([^']+)',\s*shortcode: '([^']+)',\s*title: '([^']+)',\s*description: '([^']+)',\s*category: '([^']+)',\s*type: '([^']+)',\s*aliases: \[([^\]]*)\],\s*recommended: (true|false),\s*example: '([^']+)'\s*\},?$/,
    )

    if (!match) {
      throw new Error(`Could not parse silimoji entry: ${line}`)
    }

    const aliases = [...match[7].matchAll(/'([^']+)'/g)].map((alias) => alias[1])

    return {
      emoji: match[1],
      shortcode: match[2],
      title: match[3],
      description: match[4],
      category: match[5],
      type: match[6],
      aliases,
      recommended: match[8] === 'true',
      example: match[9],
    }
  })

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
