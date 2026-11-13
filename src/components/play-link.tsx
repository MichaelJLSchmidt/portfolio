'use client'

import Link from 'next/link'
import { type ComponentProps, useRef } from 'react'
import { play, prefetchCard } from '@/motion/play'

/**
 * A link that plays a hand card from the page (the Next project card): the card leaves from its
 * face here (`.next-card-face`), flies to the table and becomes its page. Prefetches on intent.
 */
export function PlayLink({ id, href, ...props }: ComponentProps<typeof Link> & { id: string; href: string }) {
  const ref = useRef<HTMLAnchorElement>(null)
  const warm = () => prefetchCard(href)
  return (
    <Link
      ref={ref}
      href={href}
      data-play-link={id}
      onPointerEnter={warm}
      onPointerDown={warm}
      onFocus={warm}
      {...props}
      onNavigate={(e) => {
        const face = ref.current?.querySelector<HTMLElement>('.next-card-face') ?? ref.current
        if (play(id, href, face)) e.preventDefault()
      }}
    />
  )
}
