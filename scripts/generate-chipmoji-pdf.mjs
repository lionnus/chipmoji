import { readFileSync, writeFileSync, existsSync, mkdirSync, createWriteStream } from 'node:fs'
import { dirname, resolve, join } from 'node:path'
import ts from 'typescript'
import PDFDocument from 'pdfkit'
import SVGtoPDF from 'svg-to-pdfkit'

const repoRoot = resolve(process.cwd())
const sourcePath = resolve(repoRoot, 'src/data/chipmojis.ts')
const twemojiDir = resolve(repoRoot, 'node_modules/@twemoji/svg')
const outDir = resolve(repoRoot, 'public')

const accent = '#863bff'
const ink = '#18181b'
const muted = '#71717a'
const descInk = '#3f3f46'
const hairline = '#e4e4e7'

const categoryOrder = [
  'Git',
  'RTL',
  'Timing',
  'PPA',
  'Verification',
  'Python',
  'Scripts',
  'CI',
  'Docs',
  'Dependencies',
  'Infrastructure',
]

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

// ---- Load the chipmoji data from the TypeScript source of truth (AST parse) ----
function loadChipmojis() {
  const source = readFileSync(sourcePath, 'utf8')
  const sourceFile = ts.createSourceFile(sourcePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const declaration = sourceFile.statements
    .filter(ts.isVariableStatement)
    .find((statement) => statement.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword))
    ?.declarationList.declarations.find(
      (d) => ts.isIdentifier(d.name) && d.name.text === 'chipmojis',
    )

  if (!declaration?.initializer || !ts.isArrayLiteralExpression(declaration.initializer)) {
    throw new Error(`Could not load chipmojis from ${sourcePath}`)
  }

  const str = (node) => {
    if (!ts.isStringLiteralLike(node)) throw new Error('Expected string literal')
    return node.text
  }

  return declaration.initializer.elements.map((node) => {
    if (!ts.isObjectLiteralExpression(node)) throw new Error('Expected object literal')
    const entry = {}
    for (const property of node.properties) {
      if (!ts.isPropertyAssignment(property) || !ts.isIdentifier(property.name)) continue
      const key = property.name.text
      if (['emoji', 'shortcode', 'title', 'description', 'category'].includes(key)) {
        entry[key] = str(property.initializer)
      }
    }
    return entry
  })
}

function groupByCategory(items) {
  const map = new Map()
  for (const item of items) {
    const bucket = map.get(item.category)
    if (bucket) bucket.push(item)
    else map.set(item.category, [item])
  }
  return categoryOrder.filter((c) => map.has(c)).map((c) => [c, map.get(c)])
}

function emojiSvg(emoji) {
  const codepoints = [...emoji].map((c) => c.codePointAt(0))
  const stripped = codepoints.filter((c) => c !== 0xfe0f).map((c) => c.toString(16)).join('-')
  const full = codepoints.map((c) => c.toString(16)).join('-')
  for (const name of [stripped, full]) {
    const file = join(twemojiDir, `${name}.svg`)
    if (existsSync(file)) return readFileSync(file, 'utf8')
  }
  return null
}

function generate(items, { landscape, outPath }) {
  return new Promise((resolvePromise, reject) => {
    const margin = 28
    const doc = new PDFDocument({
      size: 'A4',
      layout: landscape ? 'landscape' : 'portrait',
      // No auto margins: we position everything manually, and a non-zero bottom
      // margin makes pdfkit auto-insert blank pages when text nears the edge.
      margin: 0,
    })
    // Pin metadata so the generated file is byte-for-byte reproducible (it can
    // then be committed and checked in CI, like the TXT export).
    doc.info.Producer = 'Chipmoji'
    doc.info.Creator = 'Chipmoji'
    doc.info.CreationDate = new Date(Date.UTC(2024, 0, 1))
    const stream = createWriteStream(outPath)
    stream.on('finish', resolvePromise)
    stream.on('error', reject)
    doc.pipe(stream)

    const pageW = doc.page.width
    const pageH = doc.page.height
    const left = margin
    const right = pageW - margin
    const top = margin
    const bottom = pageH - margin
    const usableW = right - left

    const cols = landscape ? 6 : 3
    const colGap = 8
    const colW = (usableW - (cols - 1) * colGap) / cols
    const colX = (i) => left + i * (colW + colGap)

    const contentTop = top + 36
    const footerY = bottom - 9
    const contentBottom = bottom - 13

    const padX = 4
    const padY = 3
    const emojiSize = landscape ? 9 : 12
    const fontSize = landscape ? 6.5 : 7
    const codeSize = landscape ? 6 : 7
    const codeGap = landscape ? 4 : 5
    const tileGap = 2
    const groupGap = 5
    const headerH = 11

    let col = 0
    let y = contentTop

    const drawMasthead = () => {
      doc.font('Helvetica-Bold').fontSize(18).fillColor(ink).text('Chip', left, top, { continued: true })
      doc.fillColor(accent).text('moji')
      doc.font('Helvetica').fontSize(9).fillColor(muted)
      doc.text('An emoji guide for chip development commits.', left, top + 22)
      doc.moveTo(left, top + 36).lineTo(right, top + 36).lineWidth(1.5).strokeColor(accent).stroke()
    }

    const drawFooter = () => {
      doc.font('Helvetica').fontSize(8).fillColor('#a1a1aa')
      doc.text('github.com/lionnus/chipmoji', left, footerY, { width: usableW, align: 'left', lineBreak: false })
      doc.text('Format: <intention> [scope?]: <message>', left, footerY, { width: usableW, align: 'right', lineBreak: false })
    }

    const textW = colW - 2 * padX
    const ruleGap = 2.5

    const measureTile = (item) => {
      doc.font('Helvetica').fontSize(fontSize)
      const descH = doc.heightOfString(item.description, { width: textW })
      return padY + emojiSize + ruleGap + 1.5 + ruleGap + descH + padY
    }

    const drawTile = (item, color, h) => {
      const x = colX(col)
      doc.roundedRect(x, y, colW, h, 4).lineWidth(0.75).strokeColor(hairline).stroke()
      const svg = emojiSvg(item.emoji)
      if (svg) SVGtoPDF(doc, svg, x + padX, y + padY, { width: emojiSize, height: emojiSize })
      doc
        .font('Courier-Bold')
        .fontSize(codeSize)
        .fillColor(ink)
        .text(item.shortcode, x + padX + emojiSize + codeGap, y + padY + (emojiSize - codeSize) / 2, {
          width: textW - emojiSize - codeGap,
          lineBreak: false,
          ellipsis: true,
        })
      const ruleY = y + padY + emojiSize + ruleGap
      doc.rect(x + padX, ruleY, textW, 1.5).fill(color)
      doc
        .font('Helvetica')
        .fontSize(fontSize)
        .fillColor(descInk)
        .text(item.description, x + padX, ruleY + 1.5 + ruleGap, { width: textW })
    }

    const nextPage = () => {
      drawFooter()
      doc.addPage()
      drawMasthead()
      col = 0
      y = contentTop
    }

    const ensureSpace = (h) => {
      if (y + h <= contentBottom) return
      col += 1
      if (col < cols) {
        y = contentTop
      } else {
        nextPage()
      }
    }

    const drawHeader = (category, count, color) => {
      const x = colX(col)
      doc
        .font('Helvetica-Bold')
        .fontSize(8)
        .fillColor(color)
        .text(`${category.toUpperCase()}`, x, y, { continued: true, characterSpacing: 0.4 })
      doc.fillColor('#a1a1aa').text(`  ${count}`, { characterSpacing: 0 })
    }

    drawMasthead()
    for (const [category, entries] of groupByCategory(items)) {
      const color = categoryColors[category]
      ensureSpace(headerH + measureTile(entries[0]))
      drawHeader(category, entries.length, color)
      y += headerH
      for (const item of entries) {
        const h = measureTile(item)
        ensureSpace(h)
        drawTile(item, color, h)
        y += h + tileGap
      }
      y += groupGap
    }
    drawFooter()
    doc.end()
  })
}

// pdfkit writes a random trailer /ID; zero it (preserving byte length) so the
// file is reproducible.
function normalizeId(outPath) {
  const text = readFileSync(outPath).toString('latin1')
  const normalized = text.replace(
    /(\/ID \[<)([0-9a-f]+)(> <)([0-9a-f]+)(>\])/i,
    (_, a, id1, b, id2, c) => a + '0'.repeat(id1.length) + b + '0'.repeat(id2.length) + c,
  )
  writeFileSync(outPath, Buffer.from(normalized, 'latin1'))
}

async function main() {
  const items = loadChipmojis()
  mkdirSync(outDir, { recursive: true })
  const targets = [
    { landscape: true, outPath: join(outDir, 'chipmoji-a4-landscape.pdf') },
    { landscape: false, outPath: join(outDir, 'chipmoji-a4-portrait.pdf') },
  ]
  for (const target of targets) {
    await generate(items, target)
    normalizeId(target.outPath)
  }
  console.log(`Generated ${items.length} entries into landscape + portrait A4 PDFs.`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
