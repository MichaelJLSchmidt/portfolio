import { type ImageEntry, getContent, images } from '@/lib/content'
import styles from './site-footer.module.css'

/** Photos to credit (ImageEntry kind "photo"), straight from the image registry. */
const photos = Object.entries(images as Record<string, ImageEntry>).filter(
  (e): e is [string, Extract<ImageEntry, { kind: 'photo' }>] => e[1].kind === 'photo',
)

/**
 * About's small print, in the footer: every photo credited and linked (by its
 * alt text in the route's locale), and the terrain's attribution (swisstopo).
 * Rendered by the root layout and shown by the footer on About only (FooterShell).
 */
export async function AboutSmallPrint() {
  const { about, imageAlt } = await getContent()
  return (
    <section className={styles.smallPrint} aria-labelledby="credits-title">
      <h2 id="credits-title" className={styles.smallTitle}>
        {about.creditsTitle}
      </h2>
      <ul className={styles.credits}>
        {photos.map(([id, p]) => (
          <li key={id}>
            <a className="link" href={p.pageUrl}>
              {imageAlt[id as keyof typeof imageAlt] || p.alt || id}
            </a>{' '}
            ·{' '}
            <a className="link" href={p.photographerUrl}>
              {p.photographer}
            </a>
          </li>
        ))}
      </ul>
      <p className={styles.attribution}>
        {about.topo.label}.{' '}
        <a className="link" href={about.topo.href}>
          {about.topo.attribution}
        </a>
      </p>
    </section>
  )
}
