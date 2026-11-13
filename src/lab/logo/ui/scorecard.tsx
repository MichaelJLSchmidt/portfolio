'use client'

import type { Concept } from '../model'
import { go, hrefFor } from './logo-lab'
import { CRITERIA, GATES, type Score, flagged, total, useScore, useScores } from './store'

const rated = (s: Score) => s.ratings.filter((r) => r > 0).length

/** One concept's scorecard: ten criteria rated 1–5 and notes, kept in this browser. */
export function Scorecard({ concept }: { concept: Concept }) {
  const [score, setScore] = useScore(concept.scoreKey)
  const setRating = (i: number, r: number) =>
    setScore({ ...score, ratings: score.ratings.map((v, j) => (j === i ? r : v)) })
  const flags = flagged(score)
  return (
    <section className="lab-section" aria-labelledby="score-title">
      <div className="lab-section-head">
        <h2 id="score-title" className="lab-h2 t-h3">
          Scorecard
        </h2>
        <p className="t-label" aria-live="polite">
          {total(score)} / {CRITERIA.length * 5} · {rated(score)} of {CRITERIA.length} rated
          {flags.length > 0 && <span className="lab-flag"> · below 3 on {flags.map((i) => i + 1).join(', ')}</span>}
        </p>
      </div>
      <p className="lab-hint">
        Stored in this browser only (localStorage). Criteria 1, 2 and 10 below 3 flag the concept.
      </p>
      <ol className="lab-criteria">
        {CRITERIA.map((label, i) => (
          <li key={label} className="lab-criterion">
            <fieldset>
              <legend>
                <span className="lab-num">{i + 1}</span> {label}
                {GATES.includes(i) && <span className="lab-gate t-label"> gate</span>}
              </legend>
              <div className="lab-rating">
                {[1, 2, 3, 4, 5].map((r) => (
                  <label key={r} className="lab-seg-option">
                    <input
                      type="radio"
                      name={`c${concept.id}-k${i}`}
                      value={r}
                      checked={score.ratings[i] === r}
                      onChange={() => setRating(i, r)}
                    />
                    <span>{r}</span>
                  </label>
                ))}
                <button
                  type="button"
                  className="lab-clear"
                  onClick={() => setRating(i, 0)}
                  disabled={score.ratings[i] === 0}
                  aria-label={`Clear rating for criterion ${i + 1}`}
                >
                  Clear
                </button>
              </div>
            </fieldset>
          </li>
        ))}
      </ol>
      <label className="lab-notes">
        <span className="t-label">Notes</span>
        <textarea rows={4} value={score.notes} onChange={(e) => setScore({ ...score, notes: e.target.value })} />
      </label>
    </section>
  )
}

/** All concepts, sorted by total; flags any concept under 3 on criteria 1, 2 or 10. */
export function ScoreSummary({ concepts }: { concepts: Concept[] }) {
  const scores = useScores(concepts.map((c) => c.scoreKey))
  const rows = concepts
    .map((c, i) => ({ c, s: scores[i] }))
    .sort((a, b) => total(b.s) - total(a.s) || concepts.indexOf(a.c) - concepts.indexOf(b.c))
  return (
    <section className="lab-section" aria-labelledby="summary-title">
      <h2 id="summary-title" className="lab-h2 t-h3">
        Scores
      </h2>
      <p className="lab-hint">Sorted by total. Rate each concept in its detail view; unrated criteria count 0.</p>
      <div className="lab-scroll">
        <table className="lab-summary">
          <thead>
            <tr>
              <th scope="col" className="t-label">
                Concept
              </th>
              <th scope="col" className="t-label">
                Total
              </th>
              {CRITERIA.map((label, i) => (
                <th key={label} scope="col" className="t-label" title={label}>
                  <abbr title={label}>{i + 1}</abbr>
                </th>
              ))}
              <th scope="col" className="t-label">
                Flag
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ c, s }) => {
              const flags = flagged(s)
              return (
                <tr key={c.id} data-flagged={flags.length > 0 || undefined}>
                  <th scope="row">
                    <a className="link" href={hrefFor(c.id)} onClick={(e) => (e.preventDefault(), go(c.id))}>
                      {c.label} · {c.name}
                    </a>
                  </th>
                  <td className="lab-total">{total(s)}</td>
                  {s.ratings.map((r, i) => (
                    <td key={i} data-low={(GATES.includes(i) && r > 0 && r < 3) || undefined}>
                      {r || '–'}
                    </td>
                  ))}
                  <td>{flags.length ? `Below 3 on ${flags.map((i) => i + 1).join(', ')}` : rated(s) ? 'OK' : '–'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
