import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import ts from 'typescript'

const repoRoot = resolve(process.cwd())
const sourcePath = resolve(repoRoot, 'src/data/silimojis.ts')
const outputPath = resolve(repoRoot, 'public/silimoji-instructions.txt')

const source = readFileSync(sourcePath, 'utf8')
const sourceFile = ts.createSourceFile(sourcePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
const silimojisDeclaration = sourceFile.statements
  .filter(ts.isVariableStatement)
  .find((statement) =>
    statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword),
  )?.declarationList.declarations.find(
    (declaration) => ts.isIdentifier(declaration.name) && declaration.name.text === 'silimojis',
  )

if (!silimojisDeclaration || !silimojisDeclaration.initializer || !ts.isArrayLiteralExpression(silimojisDeclaration.initializer)) {
  throw new Error(`Could not load silimojis from ${sourcePath}`)
}

const parseString = (node, fieldName) => {
  if (!ts.isStringLiteralLike(node)) {
    throw new Error(`Expected string literal for ${fieldName}`)
  }
  return node.text
}

const parseAliases = (node) => {
  if (!ts.isArrayLiteralExpression(node)) {
    throw new Error('Expected array literal for aliases')
  }
  return node.elements.map((element) => parseString(element, 'aliases entry'))
}

const parseEntry = (node) => {
  if (!ts.isObjectLiteralExpression(node)) {
    throw new Error('Expected object literal entry')
  }

  const entry = {}

  for (const property of node.properties) {
    if (!ts.isPropertyAssignment(property) || !ts.isIdentifier(property.name)) {
      throw new Error('Unexpected silimoji property shape')
    }

    const key = property.name.text

    switch (key) {
      case 'emoji':
      case 'shortcode':
      case 'title':
      case 'description':
      case 'category':
      case 'type':
      case 'example':
        entry[key] = parseString(property.initializer, key)
        break
      case 'aliases':
        entry[key] = parseAliases(property.initializer)
        break
      case 'recommended':
        if (
          property.initializer.kind !== ts.SyntaxKind.TrueKeyword &&
          property.initializer.kind !== ts.SyntaxKind.FalseKeyword
        ) {
          throw new Error('Expected boolean literal for recommended')
        }
        entry[key] = property.initializer.kind === ts.SyntaxKind.TrueKeyword
        break
      default:
        throw new Error(`Unexpected silimoji field: ${key}`)
    }
  }

  return entry
}

const silimojis = silimojisDeclaration.initializer.elements.map(parseEntry)

const lines = [
  'Silimoji Instructions',
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
