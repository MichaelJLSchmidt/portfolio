/*
 * The password gate's words (German): src/hosting/page.ts renders them, the build
 * (scripts/hosting/gate-page.mjs) checks the German copy rules on them.
 */
import type { GateCopy } from '@/hosting/page'

export const gate: GateCopy = {
  title: 'Portfolio',
  lede: 'Dieses Portfolio wird gerade überarbeitet und ist vorerst nur mit Passwort zugänglich.',
  label: 'Passwort',
  submit: 'Öffnen',
  pending: 'Wird geprüft…',
  error: 'Das Passwort stimmt nicht. Versuch es noch einmal.',
  errorTitle: 'Falsches Passwort',
  contact: 'Du kannst dich gerne bei mir melden:',
  email: 'E-Mail',
  linkedin: 'LinkedIn',
  language: 'Sprache',
}
