/* The 404 page. Server-only page text. */
import type { NotFound } from '../../schema'

export const notFound: NotFound = {
  title: "This card isn't in the deck.",
  body: "The page you're looking for was discarded — or never dealt.",
  back: 'Back to the table',
}
