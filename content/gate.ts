/*
 * The password gate's identity (src/hosting, scripts/hosting): the name, email and LinkedIn
 * profile on the gate page, the same in every language. Real, like the rest of content/. The
 * gate's words per language are in content/<locale>/gate.ts.
 */
import type { GateIdentity } from '@/hosting/page'

export const identity: GateIdentity = {
  name: 'Michael Flück',
  email: 'michael.jl.schmidt@bluewin.ch',
  linkedin: 'https://www.linkedin.com/in/michaeljlschmidt/',
}
