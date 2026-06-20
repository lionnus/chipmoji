import { readFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import ts from 'typescript'
import puppeteer from 'puppeteer'

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
      case 'category': case 'type': case 'example':
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

// ---------------------------------------------------------------------------
// 2. Group by category (preserving first-seen order)
// ---------------------------------------------------------------------------

const categoryColors = {
  Git: '#f59e0b',
  RTL: '#863bff',
  Timing: '#ef4444',
  PPA: '#10b981',
  Verification: '#3b82f6',
  Python: '#eab308',
  Scripts: '#f97316',
  CI: '#14b8a6',
  Docs: '#6366f1',
  Dependencies: '#ec4899',
  Infrastructure: '#64748b',
}

const grouped = new Map()
for (const item of chipmojis) {
  const bucket = grouped.get(item.category)
  if (bucket) bucket.push(item)
  else grouped.set(item.category, [item])
}
const groups = [...grouped.entries()]

// ---------------------------------------------------------------------------
// 3. Column distribution (LPT / largest-first greedy bin-packing)
// ---------------------------------------------------------------------------

function estimateGroupHeight(entries, charsPerLine) {
  let height = 3
  for (const entry of entries) {
    const descLines = Math.ceil(entry.description.length / charsPerLine)
    height += 2 + descLines
  }
  return height
}

function distributeColumns(groups, columnCount, charsPerLine) {
  const sorted = [...groups].sort((a, b) =>
    estimateGroupHeight(b[1], charsPerLine) - estimateGroupHeight(a[1], charsPerLine),
  )
  const columns = Array.from({ length: columnCount }, () => ({ groups: [], load: 0 }))
  for (const group of sorted) {
    const lightest = columns.reduce((a, b) => (b.load < a.load ? b : a))
    lightest.groups.push(group)
    lightest.load += estimateGroupHeight(group[1], charsPerLine)
  }
  return columns.map((c) => c.groups)
}

// ---------------------------------------------------------------------------
// 4. HTML builder
// ---------------------------------------------------------------------------

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function buildHtml(columns, { width: pageWidth, height: pageHeight }) {

  const columnHtml = columns.map((groups) => {
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
            </div>`).join('')
      return `
          <section class="group">
            <h2 style="color:${color}">
              ${escapeHtml(category)}
              <span class="count" style="color:${color};background:${color}1f">${entries.length}</span>
            </h2>
            <div class="grid">${entriesHtml}
            </div>
          </section>`
    }).join('')
    return `
        <div class="col">${groupsHtml}
        </div>`
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
    padding: 5mm 7mm;
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
    display: flex;
    align-items: flex-start;
    gap: 5mm;
    flex: 1 1 auto;
  }
  .col {
    flex: 1 1 0;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .group h2 {
    display: flex;
    align-items: center;
    gap: 5px;
    margin-bottom: 3px;
    font-size: 8.5px;
    text-transform: uppercase;
    letter-spacing: 0.07em;
  }
  .count {
    font-size: 7.5px;
    font-weight: 700;
    border-radius: 999px;
    padding: 0.5px 5px;
  }
  .grid {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .card {
    display: flex;
    flex-direction: column;
    gap: 1.5px;
    padding: 2px 4px;
    border: 1px solid #e4e4e7;
    border-radius: 4px;
    background: #ffffff;
  }
  .card-head {
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .emoji {
    font-size: 12px;
    line-height: 1;
  }
  .code {
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 8px;
    font-weight: 600;
    color: #18181b;
    word-break: break-all;
  }
  .rule {
    height: 1.5px;
    width: 100%;
    border-radius: 999px;
  }
  .desc {
    font-size: 7.5px;
    line-height: 1.2;
    color: #3f3f46;
  }
  .footer {
    margin-top: 4px;
    border-top: 1px solid #e4e4e7;
    padding-top: 4px;
    font-size: 8px;
    color: #a1a1aa;
    display: flex;
    justify-content: space-between;
    flex: none;
  }
</style>
</head>
<body>
  <header class="masthead">
    <h1>chip<span>moji</span></h1>
    <p class="tagline">An emoji guide for chip development commits.</p>
  </header>
  <div class="columns">${columnHtml}
  </div>
  <footer class="footer">
    <span>github.com/lionnus/chipmoji</span>
    <span>Format: &lt;intention&gt; [scope?]: &lt;message&gt;</span>
  </footer>
</body>
</html>`
}

// ---------------------------------------------------------------------------
// 5. Generate PDFs with Puppeteer
// ---------------------------------------------------------------------------

const variants = [
  { name: 'landscape', columns: 4, width: 297, height: 210, charsPerLine: 55 },
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
  const cols = distributeColumns(groups, variant.columns, variant.charsPerLine)
  const html = buildHtml(cols, variant)
  const page = await browser.newPage()
  await page.setContent(html, { waitUntil: 'networkidle0' })
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
