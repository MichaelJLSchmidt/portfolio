import type { Metadata } from 'next'
import { PageTitle } from '@/components/page-title'
import { PageTransition } from '@/components/page-transition'
import { FirstLoadSequence, Reveal } from '@/components/reveals'
import { IdleHint } from '@/eggs/idle-hint'
import { getContent, pad2 } from '@/lib/content'
import { pageAlternates } from '@/lib/metadata'
import { asLocale, setRequestLocale } from '@/lib/request-locale'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { alternates: pageAlternates(asLocale((await params).locale), '/') }
}

/**
 * Home: exactly one screen (100dvh; it scrolls only when the viewport is too
 * small for its content). The label, the name in display type on two lines,
 * role and intro beside it from 1024, "What I bring to the table" under a
 * drawn divider, and the hint just above the hand. The hand sits below; no
 * footer. First visit: data-reveal-step orders the intro (src/motion/first-load.ts).
 */
export default async function HomePage({ params }: Props) {
  setRequestLocale((await params).locale)
  const { home } = await getContent()
  return (
    <>
      <PageTransition>
        <div className="home spread-grid" data-identity="ink" data-home="">
          <FirstLoadSequence>
            <Reveal as="p" kind="block" step="label" className="home-label t-label">
              {home.label}
            </Reveal>
            <PageTitle className="home-title t-display">{home.title}</PageTitle>
            <div className="home-intro">
              <Reveal as="p" kind="lines" step="copy" className="home-role t-label">
                {home.role}
              </Reveal>
              <Reveal as="p" kind="lines" step="copy" className="home-lede t-lead">
                {home.intro}
              </Reveal>
            </div>
            <section className="home-bring" aria-labelledby="home-bring-title">
              <Reveal as="hr" kind="rule" step="divider" className="home-bring-rule" />
              <Reveal as="h2" kind="block" step="items" id="home-bring-title" className="home-bring-label t-label">
                {home.bring.label}
              </Reveal>
              <Reveal as="ul" kind="list" step="items" className="home-bring-list">
                {home.bring.items.map((item, i) => (
                  <li key={i}>
                    <span className="home-bring-number t-label">{pad2(i + 1)}</span>
                    <span className="home-bring-item">{item}</span>
                  </li>
                ))}
              </Reveal>
            </section>
            <Reveal as="p" kind="block" step="hint" className="home-hint t-label">
              {home.hint}
            </Reveal>
          </FirstLoadSequence>
        </div>
      </PageTransition>
      <IdleHint note={home.idleNote} />
    </>
  )
}
