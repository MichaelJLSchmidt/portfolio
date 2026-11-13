'use client'

import { useId } from 'react'

/*
 * Small form controls for the lab: native radios and checkboxes (keyboard and
 * screen-reader behaviour for free), styled as segmented buttons in lab.css.
 */
type Option = { value: string; label: string; title?: string }

export function Segmented({
  label,
  value,
  options,
  onChange,
  hideLabel,
}: {
  label: string
  value: string
  options: Option[]
  onChange: (v: string) => void
  hideLabel?: boolean
}) {
  const name = useId()
  return (
    <fieldset className="lab-seg">
      <legend className={hideLabel ? 'sr-only' : 't-label'}>{label}</legend>
      <div className="lab-seg-options">
        {options.map((o) => (
          <label key={o.value} className="lab-seg-option" title={o.title}>
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={o.value === value}
              onChange={() => onChange(o.value)}
            />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="lab-toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  )
}

export function Button({
  children,
  onClick,
  pressed,
  title,
}: {
  children: React.ReactNode
  onClick: () => void
  pressed?: boolean
  title?: string
}) {
  return (
    <button type="button" className="lab-button" onClick={onClick} aria-pressed={pressed} title={title}>
      {children}
    </button>
  )
}
