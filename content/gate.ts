/*
 * The password gate's identity (src/hosting, scripts/hosting): the name, email and LinkedIn
 * profile on the gate page, the same in every language. Unlike the rest of content/, which is
 * still fictional test content, these are real: taken from the old under-construction page.
 * The gate's words per language are in content/<locale>/gate.ts.
 */
import type { GateIdentity } from '@/hosting/page'

export const identity: GateIdentity = {
  name: 'Michael JL Schmidt',
  email: 'michael.jl.schmidt@bluewin.ch',
  linkedin: 'https://www.linkedin.com/in/michaeljlschmidt/',
}
