/*
 * The password gate's words (English): src/hosting/page.ts renders them.
 */
import type { GateCopy } from '@/hosting/page'

export const gate: GateCopy = {
  title: 'Portfolio',
  lede: 'This portfolio is being reworked and can only be viewed with a password for now.',
  label: 'Password',
  submit: 'Open',
  pending: 'Checking…',
  error: "That password didn't work. Please try again.",
  errorTitle: 'Wrong password',
  closed: 'The portfolio is closed for the moment.',
  contact: 'No password? Ask me for one:',
  email: 'Email',
  linkedin: 'LinkedIn',
  language: 'Language',
}
