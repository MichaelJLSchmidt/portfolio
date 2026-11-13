import { type ImageId, images } from '@content/images'
import type { ImageEntry, ImageFormat } from '@content/schema'
import { getContent } from '@/lib/content'
import { withBase } from '@/lib/site'

/*
 * <Picture id sizes priority?>: one image from content/images.ts.
 *   local   <picture> with an AVIF and a WebP <source> (when listed) and a
 *           JPEG <img>; srcset at every listed width (640 / 1280 / 2048 w),
 *           files at public/images/<id>-<width>.<avif|webp|jpg>, every URL
 *           through withBase() so it works under BASE_PATH
 *   remote  a hotlinked srcset (the source URL's {w} replaced per width)
 * The <img> always carries width/height from the entry (the box is reserved
 * before the image loads, no layout shift), sizes, decoding="async" and the
 * entry's placeholder colour as its background. loading="lazy", or with
 * priority (the one hero image above the fold) loading="eager" +
 * fetchpriority="high". Reads the registry directly; the alt text comes from
 * the route's locale (content/<locale>: imageAlt). A server component, so no
 * page text reaches a bundle.
 * Owned by the Content & Images session. Contract: docs/contracts.md#picture.
 */
type Props = {
  id: ImageId
  /** The sizes attribute, e.g. "100vw" or "(min-width: 1024px) 66vw, 100vw". */
  sizes: string
  priority?: boolean
  className?: string
  /** Overrides the locale's alt (rarely: the same image in two roles). */
  alt?: string
}

const ext: Record<ImageFormat, string> = { avif: 'avif', webp: 'webp', jpeg: 'jpg' }
const mime: Record<ImageFormat, string> = { avif: 'image/avif', webp: 'image/webp', jpeg: 'image/jpeg' }
/** <source> order: the browser takes the first type it supports. */
const sourceFormats = ['avif', 'webp'] as const

export function getImage(id: ImageId): ImageEntry {
  const entry: ImageEntry | undefined = images[id]
  if (!entry) throw new Error(`content/images.ts has no image "${id}".`)
  return entry
}

/** The fallback `src` for browsers without srcset: 1280 px when listed, else the largest. */
const fallbackWidth = (widths: number[]) =>
  [...widths].sort((a, b) => a - b).find((w) => w >= 1280) ?? Math.max(...widths)

/**
 * The URLs a <Picture> of `id` offers at `sizes`: its <source>s (type and srcset), the <img>'s
 * srcset and fallback src. Also used to warm a hero image before its page opens (the play), so
 * the browser picks the very file the page will ask for.
 */
export function pictureSet(id: ImageId, sizes: string) {
  const image = getImage(id)
  if (image.local) {
    const { widths, formats } = image.local
    const url = (w: number, format: ImageFormat) => withBase(`/images/${id}-${w}.${ext[format]}`)
    const srcSet = (format: ImageFormat) => widths.map((w) => `${url(w, format)} ${w}w`).join(', ')
    return {
      sources: sourceFormats.filter((f) => formats.includes(f)).map((f) => ({ type: mime[f], srcSet: srcSet(f) })),
      src: url(fallbackWidth(widths), 'jpeg'),
      srcSet: srcSet('jpeg'),
      sizes,
    }
  }
  if (image.remote) {
    const { src, widths } = image.remote
    const at = (w: number) => src.replace('{w}', String(w))
    return {
      sources: [],
      src: at(fallbackWidth(widths)),
      srcSet: widths.map((w) => `${at(w)} ${w}w`).join(', '),
      sizes,
    }
  }
  throw new Error(`content/images.ts: "${id}" needs local or remote sources.`)
}

export async function Picture({ id, sizes, priority = false, className, alt }: Props) {
  const image = getImage(id)
  const { imageAlt } = await getContent()
  const imgProps = {
    alt: alt ?? imageAlt[id] ?? image.alt,
    width: image.width,
    height: image.height,
    sizes,
    loading: priority ? ('eager' as const) : ('lazy' as const),
    fetchPriority: priority ? ('high' as const) : undefined,
    decoding: 'async' as const,
    style: image.placeholder ? { backgroundColor: image.placeholder } : undefined,
  }

  const set = pictureSet(id, sizes)
  return (
    <picture className={className} data-image={id}>
      {set.sources.map((s) => (
        <source key={s.type} type={s.type} srcSet={s.srcSet} sizes={sizes} />
      ))}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={set.src} srcSet={set.srcSet} {...imgProps} />
    </picture>
  )
}
