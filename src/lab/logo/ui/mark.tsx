'use client'

import { type ReactElement, type Ref, createElement, memo, useId, useMemo } from 'react'
import type { Concept, SvgNode, VariantKey } from '../model'
import { type Container, buildMark, heightFor, variantOf } from '../tree'

/*
 * The inline mark: the concept's tree rendered as React SVG. Neutral parts use
 * currentColor, accent parts var(--accent, currentColor), the container
 * var(--lab-container); ids get a per-instance prefix.
 */
const CAMEL: Record<string, string> = {
  'clip-path': 'clipPath',
  'stroke-width': 'strokeWidth',
  'stroke-linecap': 'strokeLinecap',
  'stroke-linejoin': 'strokeLinejoin',
  'stroke-miterlimit': 'strokeMiterlimit',
  'stroke-dasharray': 'strokeDasharray',
  'fill-rule': 'fillRule',
  'clip-rule': 'clipRule',
}

function resolve(value: string, prefix: string) {
  return value
    .replace(/@neutral/g, 'currentColor')
    .replace(/@accent/g, 'var(--accent, currentColor)')
    .replace(/@container/g, 'var(--lab-container, transparent)')
    .replace(/@id:/g, `${prefix}-`)
}

function toReact(
  node: SvgNode,
  prefix: string,
  key: number | string,
  overrides: Record<string, unknown>,
): ReactElement {
  const props: Record<string, unknown> = { key }
  for (const [k, v] of Object.entries(node.attrs ?? {})) {
    if (v === undefined) continue
    props[CAMEL[k] ?? k] = resolve(String(v), prefix)
  }
  if (node.tag === 'svg') Object.assign(props, overrides)
  return createElement(node.tag, props, ...(node.children ?? []).map((c, i) => toReact(c, prefix, i, overrides)))
}

type Props = {
  concept: Concept
  variant?: VariantKey
  container?: Container
  size?: number | string
  className?: string
  /** Hide from assistive tech when visible text already names the mark. */
  decorative?: boolean
  style?: React.CSSProperties
  ref?: Ref<SVGSVGElement>
}

export const Mark = memo(function Mark({
  concept,
  variant = 'master',
  container = 'none',
  size,
  className,
  decorative,
  style,
  ref,
}: Props) {
  const prefix = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const tree = useMemo(() => buildMark(concept, variant, container), [concept, variant, container])
  const overrides: Record<string, unknown> = {}
  if (className) overrides.className = className
  if (style) overrides.style = style
  if (size !== undefined) {
    overrides.width = String(size)
    overrides.height = String(heightFor(Number(size), container, variantOf(concept, variant)))
  }
  if (decorative) overrides['aria-hidden'] = 'true'
  return toReact(tree, `m${prefix}`, 'root', { ...overrides, ref })
})
