import type { CSSProperties } from 'react'
import { contourStyle, contourSvg } from '@/components/background/contours'
import { fieldInitialCss } from '@/components/background/field-css'
import { terrain } from '@/components/background/terrain'
import { identities, palette } from '@/design/palette'
import { withBase } from '@/lib/site'
import { duration, field } from '@/motion/tokens'
import { lineIn, usages } from '../../source'
import { declarations } from '../css'
import { type ItemData, type SectionData, code, ms } from '../ui'

const CONTOURS = 'src/components/background/contours.ts'
const FIELD_CSS = 'src/styles/field.css'

export function backgroundsSection(): SectionData {
  const initial = fieldInitialCss()
  const fieldUse = usages({ classes: ['field-layer'], except: [FIELD_CSS] })
  const fields: ItemData[] = identities.map((id) => {
    const i = declarations(initial, id === 'ink' ? ':root' : `:root[data-field="${id}"]`).get('--fi-i') ?? ''
    const vars = {
      '--fi-field': `var(--${id}-field)`,
      '--fi-mid': `var(--${id}-mid)`,
      '--fi-glow': `var(--${id}-glow)`,
      '--fi-i': i,
    } as CSSProperties
    return {
      id: `background.field.${id}`,
      render: (
        <span className="inv-field" style={vars}>
          <span className="field-css">
            <span className="field-layer" data-layer="a" />
          </span>
        </span>
      ),
      values: [
        ['pools', `${palette[id].field} ground, ${palette[id].mid} and ${palette[id].glow} pools`],
        ['strength', code(i)],
        ['breath', `${duration.breath} s, scale ${1 + field.breathScale} (full tier; still here)`],
        ['grain', `${field.grain * 100}% (WebGL only)`],
      ],
      note: 'Rendered with the field’s CSS twin (the fallback renderer, the same pools without noise and grain): the WebGL field is one canvas for the whole page (this page’s background is it, in ink).',
      source: [
        { file: FIELD_CSS, line: lineIn(FIELD_CSS, '.field-layer {'), name: '.field-css .field-layer' },
        { file: 'src/components/background/field-css.ts', name: 'fieldInitialCss()' },
      ],
      usage: fieldUse,
    }
  })
  const [vw, vh] = contourStyle.viewBox
  const contours: ItemData[] = (Object.keys(contourSvg) as (keyof typeof contourSvg)[]).map((key) => ({
    id: `background.contours.${key}`,
    title: key === 'full' ? 'About: 100 m contours (large screens)' : 'About: 200 m contours',
    render: (
      <span className="inv-contours">
        {/* eslint-disable-next-line @next/next/no-img-element -- the SVG file as About shows it */}
        <img className="contour-bg__img" src={withBase(contourSvg[key])} alt="" width={vw} height={vh} loading="lazy" />
        <span className="contour-vignette" />
      </span>
    ),
    values: [
      ['file', code(`public${contourSvg[key]}`)],
      ['levels', `${contourStyle.levels[key][0]} m, index every ${contourStyle.levels[key][1]} m`],
      [
        'lines',
        `${contourStyle.line} at ${contourStyle.lineAlpha} (${contourStyle.lineWidth} px), index ${contourStyle.indexAlpha} (${contourStyle.indexWidth} px)`,
      ],
      ['lakes', `${contourStyle.lake} at ${contourStyle.lakeAlpha}`],
      ['layer', `opacity ${contourStyle.layerOpacity} over ${contourStyle.ground}, scale ${field.contourDrift.scale}`],
      [
        'drift',
        `±${field.contourDrift.x} / ±${field.contourDrift.y} px over ${field.contourDrift.period} s (full tier)`,
      ],
    ],
    source: [
      { file: CONTOURS, line: lineIn(CONTOURS, 'export const contourSvg'), name: `contourSvg.${key}` },
      { file: FIELD_CSS, line: lineIn(FIELD_CSS, '.contour-bg__img {'), name: '.contour-bg__img, .contour-vignette' },
    ],
    usage: usages({ exports: [{ module: 'src/components/background/contours', name: 'contourSvg', member: [key] }] }),
  }))
  const heightmap: ItemData = {
    id: 'background.terrain',
    title: 'About: the region heightmap',
    render: (
      // eslint-disable-next-line @next/next/no-img-element -- the shader's input, as a picture
      <img
        className="inv-heightmap"
        src={withBase(terrain.src)}
        alt=""
        width={terrain.width}
        height={terrain.height}
        loading="lazy"
      />
    ),
    values: [
      ['file', code(`public${terrain.src}`)],
      ['size', `${terrain.width} × ${terrain.height}`],
      ['channels', 'R, G height; B lake coverage'],
      ['heights', `${terrain.range[0]}–${terrain.range[1]} m`],
      ['morph', `${duration.topo} s, the SVG over it for the last ${ms(duration.contourHandoff)}`],
    ],
    note: 'Data for the shader’s contour morph, not shown on the site as an image.',
    source: {
      file: 'src/components/background/terrain.ts',
      line: lineIn('src/components/background/terrain.ts', 'export const terrain'),
      name: 'terrain',
    },
    usage: usages({ exports: [{ module: 'src/components/background/terrain', name: 'terrain' }] }),
  }
  return {
    id: 'backgrounds',
    title: 'Backgrounds',
    intro: 'The background field per identity, About’s contour layers and the heightmap behind its morph.',
    groups: [
      { title: 'The field, per identity', items: fields, layout: 'tile' },
      { title: 'About’s contours', items: [...contours, heightmap], layout: 'tile' },
    ],
    unrendered: [
      {
        what: 'The WebGL field itself (noise, grain, breath, drift, the play ring, About’s morph)',
        why: 'is one canvas for the whole page, driven by the table store: one per identity cannot run side by side. The page behind this one is it.',
        source: { file: 'src/components/background/shader.ts', name: 'fragmentSource' },
      },
    ],
  }
}
