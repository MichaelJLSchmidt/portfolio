/* Home (/). Server-only page text. */
import type { Home } from '../../schema'

export const home: Home = {
  label: 'Bern, Switzerland',
  title: 'Michael Flück',
  role: 'Head of UX at DV Bern',
  intro:
    'Curiosity and initiative have taken me from Java backend developer to UX generalist, frontend developer and head of the UX department. Over more than 12 years in IT, I have held each of these roles myself, and I am passionate about bringing their perspectives to every project. After all, the best solutions emerge where different viewpoints come together.',
  hint: 'Pick a card',
  bring: {
    label: 'What I bring to the table',
    items: ['UX Unicorn since 2014', 'Team Lead since 2024', 'Hyper Island alumnus since 2024'],
  },
  idleNote: '(a selection of my projects)',
}
