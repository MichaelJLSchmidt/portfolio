/*
 * Contact details shared across content/, the same in every language: one value each, so
 * replacing one is one edit.
 *   contactEmail   About's contact chapter (content/<locale>/pages/about.ts)
 *   linkedinUrl    About's contact chapter and the password gate (content/gate.ts)
 */
export const contactEmail = 'moritz@mjls.example'

export const linkedinUrl = 'https://www.linkedin.com/in/michaeljlschmidt/'
/** The profile as About shows it: the address without its scheme, "www." or trailing slash. */
export const linkedinLabel = linkedinUrl.replace(/^https:\/\/(www\.)?/, '').replace(/\/$/, '')
