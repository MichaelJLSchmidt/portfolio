import { type DurationStep, type MotionTier, duration, durFor, motionScale, reducedCrossfade } from './tokens'

/*
 * The reveal choreography's tier helpers. Every value they scale is a token
 * (src/motion/tokens.ts); nothing motion-related is defined here.
 *
 * Tier rules, applied here once so every caller gets them:
 *   full     as given
 *   reduced  durations become one reducedCrossfade (160 ms); offsets and
 *            staggers × motionScale.reduced (0), so everything crossfades at once
 */

/** A scale step for a tier, in ms (full; reduced 160). */
export const msFor = (tier: MotionTier, step: DurationStep) => durFor(tier, step) * 1000

/** Any other duration (s) for a tier, in ms: full as given, reduced 160. */
export const spanFor = (tier: MotionTier, seconds: number) => (tier === 'reduced' ? reducedCrossfade : seconds) * 1000

/** An offset or stagger (s) for a tier, in ms: full as given, reduced 0. */
export const gapFor = (tier: MotionTier, seconds: number) => seconds * motionScale[tier] * 1000

/** SVG stroke duration for a tier, in ms. */
export const drawFor = (tier: MotionTier) => (tier === 'reduced' ? reducedCrossfade : duration.svgDraw) * 1000

export const bezier = (b: readonly number[]) => `cubic-bezier(${b.join(',')})`
