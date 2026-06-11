import { jsPDF } from 'jspdf'
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

  const conciseLines = useMemo(
    () =>
      visible.map(
        (item) => `${item.shortcode} - ${item.title.toLowerCase()} (${item.category.toLowerCase()})`
      ),
    [visible]
  )

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

  const downloadTxt = () => {
    const content = [
      'silimoji concise instruction set',
      '',
      'Format: <intention> [scope?]: <message>',
      ...conciseLines,
    ].join('\n')

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'silimoji-concise.txt'
    link.click()
    URL.revokeObjectURL(url)
  }

  const downloadPdf = () => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' })
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 48
    const maxWidth = pageWidth - margin * 2
    let cursorY = margin

    doc.setFontSize(16)
    doc.text('silimoji - A4 quick reference', margin, cursorY)
    cursorY += 24

    doc.setFontSize(11)
    const intro = doc.splitTextToSize('Format: <intention> [scope?]: <message>', maxWidth)
    doc.text(intro, margin, cursorY)
    cursorY += intro.length * 16

    for (const line of conciseLines) {
      const wrapped = doc.splitTextToSize(line, maxWidth)
      const neededHeight = wrapped.length * 14 + 4
      if (cursorY + neededHeight > pageHeight - margin) {
        doc.addPage()
        cursorY = margin
      }
      doc.text(wrapped, margin, cursorY)
      cursorY += wrapped.length * 14 + 4
    }

    doc.save('silimoji-a4-reference.pdf')
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

  return (
    <main className="app">
      <header className="topbar">
        <h1>silimoji</h1>
        <p className="tagline">Minimal commit emoji guide for silicon teams.</p>
      </header>

      <section className="controls">
        <div className="toolbar">
          <input
            ref={searchRef}
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search emoji, shortcode, title, description, category, alias, or example"
            aria-label="Search silimojis"
          />
          <button type="button" onClick={downloadPdf}>
            Download PDF (A4)
          </button>
          <button type="button" onClick={downloadTxt}>
            Download TXT
          </button>
        </div>
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
      </section>

      <section className="list">
        {visible.map((item) => (
          <article className="dense-item" key={item.shortcode}>
            <p className="row-title">
              <span>{item.emoji}</span> <strong>{item.shortcode}</strong> — {item.title}
            </p>
            <p className="row-meta">{item.category}</p>
            <p className="row-description">{item.description}</p>
            <button type="button" onClick={() => void copy(item.shortcode)}>
              Copy shortcode
            </button>
          </article>
        ))}
      </section>

      {copied && <p className="copied">Copied: {copied}</p>}
      <footer className="footer">
        <a href={repositoryUrl} target="_blank" rel="noreferrer">
          GitHub repository
        </a>
      </footer>
    </main>
  )
}

export default App
