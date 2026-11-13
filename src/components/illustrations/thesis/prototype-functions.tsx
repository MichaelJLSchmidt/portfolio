import type { ThesisDrawing } from '@/lib/content'
import { type DrawGroup, Drawing, Label } from '../frame'
import { poly, roundRect, space, type Space } from '../geometry'
import type { IllustrationProps } from '../types'
import { Arrow, Person } from './parts'

type Key =
  'knowledge' | 'sources' | 'handover' | 'checkIn' | 'monthly' | 'mbi' | 'exhaustion' | 'cynicism' | 'inefficacy'
export type PrototypeFunctionsProps = IllustrationProps & { copy: ThesisDrawing<Key> }

const H = space(960, 420)
const V = space(360, 900)
const dims = ['exhaustion', 'cynicism', 'inefficacy'] as const

/** A chat bubble with three text lines and, under it, a tinted source tag. */
function Bubble({ x, y, w }: { x: number; y: number; w: number }) {
  const lines = [0.8, 0.62, 0.7]
  return (
    <>
      <path d={roundRect(x, y, w, 76, 14)} pathLength={1} data-draw="" />
      {lines.map((k, i) => (
        <path
          key={i}
          d={poly([
            [x + 18, y + 20 + i * 18],
            [x + 18 + (w - 36) * k, y + 20 + i * 18],
          ])}
          className="il-faint"
          pathLength={1}
          data-draw=""
        />
      ))}
      <path d={roundRect(x + 18, y + 92, 52, 20, 10)} stroke="none" fill="currentColor" data-draw-fill="" />
      <path d={roundRect(x + 18, y + 92, 52, 20, 10)} pathLength={1} data-draw="" />
    </>
  )
}

/** A month: a calendar sheet with one day marked. */
function Month({ x, y, w }: { x: number; y: number; w: number }) {
  const h = w * 0.8
  const cw = w / 4
  const ch = (h - 22) / 3
  return (
    <>
      <path d={roundRect(x, y, w, h, 10)} pathLength={1} data-draw="" />
      <path
        d={poly([
          [x, y + 22],
          [x + w, y + 22],
        ])}
        className="il-faint"
        pathLength={1}
        data-draw=""
      />
      {[1, 2, 3].map((i) => (
        <path
          key={`v${i}`}
          d={poly([
            [x + i * cw, y + 22],
            [x + i * cw, y + h],
          ])}
          className="il-faint"
          pathLength={1}
          data-draw=""
        />
      ))}
      {[1, 2].map((i) => (
        <path
          key={`h${i}`}
          d={poly([
            [x, y + 22 + i * ch],
            [x + w, y + 22 + i * ch],
          ])}
          className="il-faint"
          pathLength={1}
          data-draw=""
        />
      ))}
      <path d={roundRect(x + 6, y + 28, cw - 12, ch - 12, 6)} stroke="none" fill="currentColor" data-draw-fill="" />
    </>
  )
}

/** The MBI's three dimensions as bars of different lengths. */
function Bars({ x, y, w, s, l }: { x: number; y: number; w: number; s: Space; l: Record<Key, string> }) {
  const lengths = [0.72, 0.46, 0.58]
  return (
    <>
      {dims.map((key, i) => (
        <path
          key={key}
          d={poly([
            [x, y + i * 40],
            [x + w * lengths[i], y + i * 40],
          ])}
          pathLength={1}
          data-draw=""
        />
      ))}
      {dims.map((key, i) => (
        <Label key={key} s={s} at={[x, y + i * 40]} dy={-8} tone="muted" text={(l as Record<string, string>)[key]} />
      ))}
    </>
  )
}

function horizontal(s: Space, l: Record<Key, string>): DrawGroup[] {
  return [
    {
      plate: (
        <>
          <path d={roundRect(32, 32, 432, 356, 18)} className="il-faint" pathLength={1} data-draw="" />
          <Bubble x={64} y={104} w={220} />
        </>
      ),
      pins: (
        <>
          <Label s={s} at={[64, 72]} valign="middle" cat text={l.knowledge} />
          <Label s={s} at={[134, 206]} dx={8} valign="middle" tone="muted" text={l.sources} />
        </>
      ),
    },
    {
      plate: (
        <>
          <Arrow a={[200, 252]} b={[200, 312]} />
          <Person x={200} y={334} r={14} tint />
        </>
      ),
      pins: <Label s={s} at={[220, 334]} dx={8} valign="middle" text={l.handover} />,
    },
    {
      plate: (
        <>
          <path d={roundRect(496, 32, 432, 356, 18)} className="il-faint" pathLength={1} data-draw="" />
          <Month x={528} y={104} w={120} />
        </>
      ),
      pins: (
        <>
          <Label s={s} at={[528, 72]} valign="middle" cat text={l.checkIn} />
          <Label s={s} at={[528, 214]} valign="top" tone="muted" text={l.monthly} />
        </>
      ),
    },
    {
      plate: (
        <>
          <Arrow a={[664, 152]} b={[716, 152]} />
          <Bars x={736} y={164} w={168} s={s} l={l} />
        </>
      ),
      pins: <Label s={s} at={[736, 104]} valign="middle" text={l.mbi} />,
    },
  ]
}

function vertical(s: Space, l: Record<Key, string>): DrawGroup[] {
  return [
    {
      plate: (
        <>
          <path d={roundRect(16, 16, 328, 400, 18)} className="il-faint" pathLength={1} data-draw="" />
          <Bubble x={40} y={84} w={220} />
        </>
      ),
      pins: (
        <>
          <Label s={s} at={[40, 52]} valign="middle" cat text={l.knowledge} />
          <Label s={s} at={[110, 186]} dx={8} valign="middle" tone="muted" text={l.sources} />
        </>
      ),
    },
    {
      plate: (
        <>
          <Arrow a={[150, 232]} b={[150, 312]} />
          <Person x={150} y={344} r={16} tint />
        </>
      ),
      pins: <Label s={s} at={[172, 344]} dx={8} valign="middle" text={l.handover} />,
    },
    {
      plate: (
        <>
          <path d={roundRect(16, 448, 328, 436, 18)} className="il-faint" pathLength={1} data-draw="" />
          <Month x={40} y={516} w={120} />
        </>
      ),
      pins: (
        <>
          <Label s={s} at={[40, 484]} valign="middle" cat text={l.checkIn} />
          <Label s={s} at={[176, 552]} valign="middle" tone="muted" wrap={14} text={l.monthly} />
        </>
      ),
    },
    {
      plate: (
        <>
          <Arrow a={[100, 640]} b={[100, 690]} />
          <Bars x={40} y={748} w={280} s={s} l={l} />
        </>
      ),
      pins: <Label s={s} at={[120, 664]} valign="middle" text={l.mbi} />,
    },
  ]
}

/**
 * (d) The prototype's two functions: a knowledge base that answers with sources and hands over to
 * HR, and a monthly five-minute check-in mapped to the Maslach Burnout Inventory's three dimensions.
 */
export function PrototypeFunctions({ copy, className, titleId, variant }: PrototypeFunctionsProps) {
  return (
    <Drawing
      slug="prototype-functions"
      title={copy.title}
      desc={copy.description}
      className={className}
      titleId={titleId}
      variant={variant}
      h={[H, (s) => horizontal(s, copy.labels)]}
      v={[V, (s) => vertical(s, copy.labels)]}
    />
  )
}
