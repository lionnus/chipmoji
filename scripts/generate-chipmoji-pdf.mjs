import { readFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import ts from 'typescript'
import puppeteer from 'puppeteer'

const { version } = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'))

const repoRoot = resolve(process.cwd())
const sourcePath = resolve(repoRoot, 'src/data/chipmojis.ts')
const outputDir = resolve(repoRoot, 'public')

// ---------------------------------------------------------------------------
// 1. Parse chipmojis.ts (same approach as generate-chipmoji-txt.mjs)
// ---------------------------------------------------------------------------

const source = readFileSync(sourcePath, 'utf8')
const sourceFile = ts.createSourceFile(sourcePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
const chipmojisDeclaration = sourceFile.statements
  .filter(ts.isVariableStatement)
  .find((statement) =>
    statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword),
  )?.declarationList.declarations.find(
    (declaration) => ts.isIdentifier(declaration.name) && declaration.name.text === 'chipmojis',
  )

if (!chipmojisDeclaration || !chipmojisDeclaration.initializer || !ts.isArrayLiteralExpression(chipmojisDeclaration.initializer)) {
  throw new Error(`Could not load chipmojis from ${sourcePath}`)
}

const parseString = (node, fieldName) => {
  if (!ts.isStringLiteralLike(node)) throw new Error(`Expected string literal for ${fieldName}`)
  return node.text
}

const parseAliases = (node) => {
  if (!ts.isArrayLiteralExpression(node)) throw new Error('Expected array literal for aliases')
  return node.elements.map((element) => parseString(element, 'aliases entry'))
}

const parseEntry = (node) => {
  if (!ts.isObjectLiteralExpression(node)) throw new Error('Expected object literal entry')
  const entry = {}
  for (const property of node.properties) {
    if (!ts.isPropertyAssignment(property) || !ts.isIdentifier(property.name)) {
      throw new Error('Unexpected chipmoji property shape')
    }
    const key = property.name.text
    switch (key) {
      case 'emoji': case 'shortcode': case 'title': case 'description':
      case 'category': case 'layer': case 'type': case 'example':
        entry[key] = parseString(property.initializer, key)
        break
      case 'aliases':
        entry[key] = parseAliases(property.initializer)
        break
      case 'recommended':
        entry[key] = property.initializer.kind === ts.SyntaxKind.TrueKeyword
        break
      default:
        throw new Error(`Unexpected chipmoji field: ${key}`)
    }
  }
  return entry
}

const chipmojis = chipmojisDeclaration.initializer.elements.map(parseEntry)

// The PDF must fit on one sheet: keep only the first sentence of each description.
for (const item of chipmojis) {
  item.description = item.description.split(/(?<=\.)\s+/)[0]
}

// ---------------------------------------------------------------------------
// 2. Group by category (preserving first-seen order)
// ---------------------------------------------------------------------------

const categoryColors = {
  Git: '#f59e0b',
  RTL: '#863bff',
  Timing: '#ef4444',
  PPA: '#10b981',
  Backend: '#a16207',
  Verification: '#3b82f6',
  Firmware: '#f97316',
  Modeling: '#eab308',
  Build: '#14b8a6',
  Dependencies: '#ec4899',
  Docs: '#6366f1',
}

const grouped = new Map()
for (const item of chipmojis) {
  const bucket = grouped.get(item.category)
  if (bucket) bucket.push(item)
  else grouped.set(item.category, [item])
}
const groups = [...grouped.entries()]



// ---------------------------------------------------------------------------
// 4. HTML builder
// ---------------------------------------------------------------------------

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function buildHtml(groups, { width: pageWidth, height: pageHeight, columns }) {
  const groupsHtml = groups.map(([category, entries]) => {
    const color = categoryColors[category]
    const entriesHtml = entries.map((item) => `
          <div class="card">
            <div class="card-head">
              <span class="emoji">${item.emoji}</span>
              <code class="code">${escapeHtml(item.shortcode)}</code>
            </div>
            <span class="rule" style="background:${color}"></span>
            <span class="desc">${escapeHtml(item.description)}</span>
            <code class="ex">${escapeHtml(item.example)}</code>
          </div>`).join('')
    return `
        <section class="group">
          <h2 style="color:${color}">
            ${escapeHtml(category)}
            <span class="count" style="color:${color};background:${color}1f">${entries.length}</span>
          </h2>${entriesHtml}
        </section>`
  }).join('')

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @page {
    size: ${pageWidth}mm ${pageHeight}mm;
    margin: 0;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    width: ${pageWidth}mm;
    height: ${pageHeight}mm;
    font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
    color: #18181b;
    background: #ffffff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  body {
    display: flex;
    flex-direction: column;
    padding: 4mm 6mm;
  }
  .masthead {
    border-bottom: 2px solid #863bff;
    padding-bottom: 4px;
    margin-bottom: 5px;
    flex: none;
  }
  .masthead h1 {
    font-size: 18px;
    letter-spacing: -0.01em;
  }
  .masthead h1 span { color: #863bff; }
  .tagline {
    margin-top: 1px;
    font-size: 9px;
    color: #71717a;
  }
  .columns {
    column-count: ${columns};
    column-gap: 4mm;
    flex: 1 1 auto;
    min-height: 0;
  }
  .group {
    margin-bottom: 4px;
  }
  .group h2 {
    display: flex;
    align-items: center;
    gap: 5px;
    margin-bottom: 3px;
    font-size: 8px;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    break-after: avoid;
  }
  .count {
    font-size: 7px;
    font-weight: 700;
    border-radius: 999px;
    padding: 0.5px 5px;
  }
  .card {
    display: flex;
    flex-direction: column;
    gap: 1px;
    padding: 1.5px 4px;
    margin-bottom: 1.5px;
    border: 1px solid #e4e4e7;
    border-radius: 4px;
    background: #ffffff;
    break-inside: avoid;
  }
  .card-head {
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .emoji {
    font-size: 10.5px;
  }
  .code {
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 7.5px;
    color: #863bff;
  }
  .rule {
    height: 1.5px;
    border-radius: 999px;
  }
  .desc {
    line-height: 1.25;
    font-size: 7.5px;
    color: #3f3f46;
  }
  .ex {
    line-height: 1.2;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 6px;
    color: #71717a;
  }
  .footer {
    display: flex;
    justify-content: space-between;
    border-top: 1px solid #e4e4e7;
    padding-top: 4px;
    margin-top: 4px;
    font-size: 7.5px;
    color: #71717a;
    flex: none;
  }
</style>
</head>
<body>
  <header class="masthead">
    <h1>chip<span>moji</span></h1>
    <p class="tagline">An emoji guide for chip development commits.</p>
  </header>
  <div class="columns">${groupsHtml}
  </div>
  <footer class="footer">
    <span>github.com/lionnus/chipmoji — v${version}</span>
    <span>Format: &lt;intention&gt; [scope?]: &lt;message&gt;</span>
  </footer>
</body>
</html>`
}

// ---------------------------------------------------------------------------
// 5. Generate PDFs with Puppeteer
// ---------------------------------------------------------------------------

const variants = [
  { name: 'landscape', columns: 5, width: 297, height: 210, charsPerLine: 44 },
  { name: 'portrait', columns: 3, width: 210, height: 297, charsPerLine: 48 },
]

mkdirSync(outputDir, { recursive: true })

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
  ...(process.env.PUPPETEER_EXECUTABLE_PATH
    ? { executablePath: process.env.PUPPETEER_EXECUTABLE_PATH }
    : {}),
})

for (const variant of variants) {
  const html = buildHtml(groups, variant)
  const page = await browser.newPage()
  await page.setContent(html, { waitUntil: 'load' })
  if (process.env.CHIPMOJI_DEBUG) {
    const h = await page.evaluate(() => document.body.scrollHeight)
    console.log(`${variant.name}: body ${h}px, page ${(variant.height * 96 / 25.4).toFixed(0)}px`)
  }
  const outputPath = resolve(outputDir, `chipmoji-${variant.name}.pdf`)
  await page.pdf({
    path: outputPath,
    width: `${variant.width}mm`,
    height: `${variant.height}mm`,
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  })
  await page.close()
  console.log(`Generated ${outputPath}`)
}

await browser.close()
