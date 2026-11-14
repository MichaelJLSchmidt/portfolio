'use client'

import { useEffect, useRef, useState } from 'react'

/*
 * The inventory's section index: marks the section in view (aria-current) and filters the
 * items by reference ID or text. Filtering hides non-matching items and groups left empty.
 */
export function SectionSpy() {
  useEffect(() => {
    const links = [...document.querySelectorAll<HTMLAnchorElement>('.inv-index a[href^="#"]')]
    const sections = links
      .map((a) => document.getElementById(decodeURIComponent(a.hash.slice(1))))
      .filter((s): s is HTMLElement => Boolean(s))
    const mark = () => {
      const line = innerHeight * 0.3
      let current = sections[0]
      for (const s of sections) if (s.getBoundingClientRect().top <= line) current = s
      for (const a of links) {
        if (a.hash === `#${current?.id}`) a.setAttribute('aria-current', 'true')
        else a.removeAttribute('aria-current')
      }
    }
    mark()
    addEventListener('scroll', mark, { passive: true })
    return () => removeEventListener('scroll', mark)
  }, [])
  return null
}

export function Filter() {
  const [query, setQuery] = useState('')
  const [shown, setShown] = useState<number | null>(null)
  const timer = useRef(0)
  useEffect(() => {
    clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      const q = query.trim().toLowerCase()
      const items = [...document.querySelectorAll<HTMLElement>('.inv-item')]
      let n = 0
      for (const item of items) {
        const id = item.querySelector('.inv-id')?.textContent ?? ''
        const hit = !q || id.toLowerCase().includes(q) || (item.textContent ?? '').toLowerCase().includes(q)
        item.hidden = !hit
        if (hit) n++
      }
      for (const group of document.querySelectorAll<HTMLElement>('.inv-group')) {
        const own = group.querySelectorAll('.inv-item')
        group.hidden = Boolean(q) && own.length > 0 && [...own].every((i) => (i as HTMLElement).hidden)
      }
      setShown(q ? n : null)
    }, 120)
  }, [query])
  return (
    <div className="inv-filter">
      <label htmlFor="inv-filter" className="inv-k">
        Filter by ID or text
      </label>
      <input
        id="inv-filter"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="gradient.tide, ember, --dur"
        autoComplete="off"
        spellCheck={false}
      />
      <span className="inv-k" aria-live="polite">
        {shown === null ? '' : `${shown} shown`}
      </span>
    </div>
  )
}
