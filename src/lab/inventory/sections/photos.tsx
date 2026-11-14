import { type ImageId, images } from '@content/images'
import { Picture } from '@/components/picture'
import { contentFor } from '@/lib/content'
import { lineIn, usages } from '../../source'
import { contentRefs } from '../content-refs'
import { type ItemData, type SectionData, Swatch, code } from '../ui'

const REGISTRY = 'content/images.ts'

export function photosSection(): SectionData {
  const alt = contentFor('en').imageAlt
  const items: ItemData[] = (Object.keys(images) as ImageId[]).map((id) => {
    const img = images[id]
    const refs = contentRefs(id)
    const files = img.local
      ? img.local.widths.flatMap((w) => img.local!.formats.map((f) => `${w}.${f === 'jpeg' ? 'jpg' : f}`))
      : []
    return {
      id: `photo.${id}`,
      render: (
        <span className="inv-photo">
          <Picture id={id} sizes="(min-width: 1024px) 360px, 90vw" />
        </span>
      ),
      values: [
        ['size', `${img.width} × ${img.height} (${(img.width / img.height).toFixed(2)}:1)`],
        [
          'placeholder',
          <>
            <Swatch colour={img.placeholder} style={{ width: '1em', height: '1em' }} /> {code(img.placeholder)}
          </>,
        ],
        ['files', code(`public/images/${id}-{${files.join(', ')}}`)],
        ['alt (en)', alt[id] ?? img.alt],
        [
          'credit',
          img.photographer ? (
            <a className="link" href={img.pageUrl ?? img.photographerUrl} rel="noreferrer">
              {img.photographer}
            </a>
          ) : (
            '—'
          ),
        ],
      ],
      source: { file: REGISTRY, line: lineIn(REGISTRY, `'${id}': {`), name: `images['${id}']` },
      usedFor: refs.length ? refs.map((r) => r.path).join(' · ') : undefined,
      usage: usages({ strings: [id], except: [REGISTRY, 'content/de/images.ts', 'scripts/images/manifest.mjs'] }),
    }
  })
  return {
    id: 'photos',
    title: 'Photos',
    intro: (
      <>
        Every image in <code>content/images.ts</code> (generated from <code>scripts/images/manifest.mjs</code>),
        rendered with the site&rsquo;s <code>Picture</code>.
      </>
    ),
    groups: [{ title: 'Image registry', items, layout: 'tile' }],
  }
}
