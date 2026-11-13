/*
 * The German content set (server side): one `Content`, typed by
 * content/schema.ts. Pages read it through src/lib/content.ts on /de/ routes;
 * the build-time count checks run on it there. Swiss Standard German ("ss",
 * never "ß"), informal "du", no em-dashes or semicolons.
 *
 *   site.ts           site chrome            (slim: passed to the client, D7)
 *   hand.ts           the hand + Coffee card (slim: passed to the client, D7)
 *   cases/*.ts        the three case studies (server only)
 *   pages/*.ts        every other page's text (server only)
 *   illustrations.ts  the words inside the drawings (server only)
 *   images.ts         alt text for every image (the registry's own is English)
 */
import type { Content } from '../schema'
import { frontDoor } from './cases/front-door'
import { sharedFoundations } from './cases/shared-foundations'
import { teamOfTeams } from './cases/team-of-teams'
import { coffeeEgg, hand } from './hand'
import { imageAlt } from './images'
import { illustrations } from './illustrations'
import { about } from './pages/about'
import { home } from './pages/home'
import { management } from './pages/management'
import { notFound } from './pages/not-found'
import { workshopMethods } from './pages/workshop-methods'
import { site } from './site'
import { thesis } from './thesis'

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
