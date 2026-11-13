import Link from 'next/link'
import type { ReactNode } from 'react'
import { PageTitle } from '@/components/page-title'
import { PageTransition } from '@/components/page-transition'
import { getContent } from '@/lib/content'
import { NAV } from '@/motion/transitions'
import { checkLabPages, labPages } from '../pages'
import './tool.css'

/*
 * The frame of the lab's own pages (overview, design inventory): the site's ink page and type, a
 * row of links to every lab page, a kicker that says what this is, the page's h1 (the site's
 * PageTitle: the focus target after a navigation) and one line of intro. English on both
 * locales (lang="en"). Server component.
 */
export async function LabFrame({
  path,
  title,
  intro,
  children,
  className,
}: {
  path: string
  title: string
  intro: ReactNode
  children: ReactNode
  className?: string
}) {
  checkLabPages()
  const { href } = await getContent()
  return (
    <PageTransition>
      <div className={`tool${className ? ` ${className}` : ''}`} data-identity="ink" lang="en">
        <header className="tool-head">
          <nav aria-label="Lab pages" className="tool-pages">
            <ul>
              {labPages.map((p) => (
                <li key={p.path}>
                  <Link
                    href={href(p.path)}
                    className="link"
                    aria-current={p.path === path ? 'page' : undefined}
                    transitionTypes={[NAV]}
                    // The inventory's payload is large: load it only when asked for.
                    prefetch={p.path === '/lab/inventory' ? false : undefined}
                  >
                    {p.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <p className="t-label tool-kicker">Internal tool · only in gated builds · not indexed</p>
          <PageTitle className="tool-title t-h2">{title}</PageTitle>
          <p className="t-body tool-intro">{intro}</p>
        </header>
        {children}
      </div>
    </PageTransition>
  )
}

/** A source pointer: "src/design/palette.ts:42". */
export function Source({ file, line, name }: { file: string; line?: number; name?: string }) {
  return (
    <code className="tool-source">
      {file}
      {line ? `:${line}` : ''}
      {name ? <span className="tool-source-name"> {name}</span> : null}
    </code>
  )
}
