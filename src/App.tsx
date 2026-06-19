import { useEffect, useMemo, useRef, useState } from 'react'
import { silimojis, type Silimoji } from './data/silimojis'
import './index.css'

type Filter = 'All' | 'Recommended' | Silimoji['category']

const filters: Filter[] = [
  'All',
  'Recommended',
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

const repositoryUrl = 'https://github.com/lionnus/silimoji'
const instructionsTxtUrl = `${import.meta.env.BASE_URL}silimoji-instructions.txt`

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')

const buildPrintDocument = (items: Silimoji[]) => {
  const rows = items
    .map(
      (item) =>
        `<tr><td>${escapeHtml(item.emoji)}</td><td>${escapeHtml(item.shortcode)}</td><td>${escapeHtml(item.title)}</td><td>${escapeHtml(item.description)}</td><td>${escapeHtml(item.category)}</td></tr>`,
    )
    .join('')

  return `<!doctype html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Silimoji A4 Sheet</title>
  <style>
    @page { size: A4; margin: 12mm; }
    body { font-family: Inter, Arial, sans-serif; color: #111; margin: 0; }
    h1 { margin: 0 0 8px; font-size: 18px; }
    p { margin: 0 0 10px; font-size: 12px; color: #444; }
    .print-action { margin: 0 0 12px; }
    .print-action button { font: inherit; border: 1px solid #d4d4d4; background: #fff; padding: 4px 10px; border-radius: 6px; cursor: pointer; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th, td { border: 1px solid #d4d4d4; text-align: left; padding: 6px; vertical-align: top; }
    th { background: #f5f5f5; }
    @media print { .print-action { display: none; } }
  </style>
</head>
<body>
  <h1>Silimoji Commit Reference</h1>
  <p>Filtered list prepared for A4 print or PDF export.</p>
  <div class="print-action"><button type="button" onclick="window.print()">Print / Save as PDF</button></div>
  <table>
    <thead><tr><th>Emoji</th><th>Shortcode</th><th>Title</th><th>Description</th><th>Category</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`
}

function App() {
  const searchRef = useRef<HTMLInputElement>(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('All')
  const [copied, setCopied] = useState('')

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return silimojis.filter((item) => {
      const matchesFilter =
        filter === 'All' || (filter === 'Recommended' ? item.recommended : item.category === filter)
      if (!matchesFilter) {
        return false
      }
      if (!q) {
        return true
      }
      return [
        item.emoji,
        item.shortcode,
        item.title,
        item.description,
        item.category,
        item.example,
        ...item.aliases,
      ]
        .join(' ')
        .toLowerCase()
        .includes(q)
    })
  }, [filter, search])

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(value)
      window.setTimeout(() => setCopied(''), 1000)
    } catch {
      setCopied('clipboard unavailable')
      window.setTimeout(() => setCopied(''), 1000)
    }
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const typingInInput =
        target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable

      if (event.key === '/' && !typingInInput) {
        event.preventDefault()
        searchRef.current?.focus()
      }

      if (event.key === 'Escape') {
        setSearch('')
        searchRef.current?.blur()
      }

      if (event.key === 'Enter' && !typingInInput && visible.length > 0) {
        void copy(visible[0].shortcode)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [visible])

  const downloadTxt = () => {
    const link = document.createElement('a')
    link.href = instructionsTxtUrl
    link.download = 'silimoji-instructions.txt'
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  const openPrintableView = () => {
    const printFrame = document.createElement('iframe')
    printFrame.setAttribute('aria-hidden', 'true')
    printFrame.tabIndex = -1
    printFrame.style.position = 'fixed'
    printFrame.style.right = '0'
    printFrame.style.bottom = '0'
    printFrame.style.width = '0'
    printFrame.style.height = '0'
    printFrame.style.border = '0'

    const cleanup = () => {
      printFrame.remove()
    }

    printFrame.onload = () => {
      const frameWindow = printFrame.contentWindow
      if (!frameWindow) {
        cleanup()
        return
      }

      frameWindow.addEventListener('afterprint', cleanup, { once: true })
      frameWindow.focus()
      window.setTimeout(() => frameWindow.print(), 0)
      window.setTimeout(cleanup, 60_000)
    }

    document.body.appendChild(printFrame)
    printFrame.srcdoc = buildPrintDocument(visible)

    if (!printFrame.contentWindow) {
      setCopied('Please allow popups to open PDF view')
      window.setTimeout(() => setCopied(''), 1000)
      return
    }
  }

  return (
    <main className="app">
      <header className="topbar">
        <h1>silimoji</h1>
      </header>

      <section className="controls">
        <input
          ref={searchRef}
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search emoji, shortcode, title, description, category, alias, or example"
          aria-label="Search silimojis"
        />
        <p className="hint">/ focus · Esc clear · Enter copy first visible shortcode</p>
        <div className="filters">
          {filters.map((pill) => (
            <button
              key={pill}
              type="button"
              className={pill === filter ? 'active' : ''}
              onClick={() => setFilter(pill)}
            >
              {pill}
            </button>
          ))}
        </div>
        <div className="actions">
          <button type="button" onClick={openPrintableView}>
            Download PDF (A4)
          </button>
          <button type="button" onClick={downloadTxt}>
            Download TXT
          </button>
        </div>
      </section>

      <section className="results">
        {visible.map((item) => (
          <article className="row" key={item.shortcode}>
            <button type="button" onClick={() => void copy(item.emoji)}>
              {item.emoji}
            </button>
            <button type="button" onClick={() => void copy(item.shortcode)}>
              {item.shortcode}
            </button>
            <p>
              <strong>{item.title}</strong> · {item.description}
            </p>
          </article>
        ))}
      </section>

      {copied && <p className="copied">Copied: {copied}</p>}
      <footer className="footer">
        <p>
          <a href={repositoryUrl} target="_blank" rel="noreferrer">
            GitHub repository
          </a>
        </p>
      </footer>
    </main>
  )
}

export default App
