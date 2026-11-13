/*
 * The English content set (server side): one `Content`, typed by
 * content/schema.ts. Pages read it through src/lib/content.ts on /en/ routes;
 * the build-time count checks run on it there.
 *
 *   site.ts           site chrome            (slim: passed to the client, D7)
 *   hand.ts           the hand + Coffee card (slim: passed to the client, D7)
 *   cases/*.ts        the three case studies (server only)
 *   pages/*.ts        every other page's text (server only)
 *   illustrations.ts  the words inside the drawings (server only)
 * Image alt text is the registry's own (content/images.ts is written in English).
 */
import { images } from '../images'
import type { Content, ImageId } from '../schema'
import { frontDoor } from './cases/front-door'
import { sharedFoundations } from './cases/shared-foundations'
import { teamOfTeams } from './cases/team-of-teams'
import { coffeeEgg, hand } from './hand'
import { illustrations } from './illustrations'
import { about } from './pages/about'
import { home } from './pages/home'
import { management } from './pages/management'
import { notFound } from './pages/not-found'
import { workshopMethods } from './pages/workshop-methods'
import { site } from './site'
import { thesis } from './thesis'

const imageAlt = Object.fromEntries(Object.entries(images).map(([id, image]) => [id, image.alt])) as Record<
  ImageId,
  string
>

export const content = {
  site,
  hand,
  home,
  caseStudies: [teamOfTeams, sharedFoundations, frontDoor],
  management,
  about,
  thesis,
  notFound,
  coffeeEgg,
  workshopMethods,
  illustrations,
  imageAlt,
} satisfies Content
