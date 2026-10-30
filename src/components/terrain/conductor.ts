import { duration, easing, type DurationToken, type EasingToken } from "@/styles/tokens";
import { BERN } from "./route-terrain";

/**
 * The route conductor: what the field does when a route commits, and when. The field runs it
 * alongside the View Transition and never holds navigation for it; readable content never waits
 * either (quiet zones are held over the text meanwhile, see ContourField).
 *
 * Every route change morphs uMorph 0 → 1 over the terrain token (700 ms, summit easing) from the
 * terrain on screen to the route's terrain. On top of that, by mode:
 * - full: the destination's isolines draw on from the valleys upward (uReveal, draw token,
 *   900 ms), and a card's terrain keeps the zoom push;
 * - calm: the morph only (no draw-on, no zoom push);
 * - still: no field at all; the backdrop cross-fades its posters (200 ms).
 *
 * Recentre on Bern (every navigation to /about/) replaces the draw-on: over 0–700 ms the terrain
 * morphs and the interval eases in log space to Bern's (10 m), with no zoom push; over 200–900 ms
 * the Aare draws in ice; at 300 ms a crosshair pin pings once at the zero point. Leaving reverses
 * it: the interval returns with the morph, the river and the pin fade out in 240 ms. In calm the
 * river and the pin appear without drawing or pinging.
 *
 * Channels are plain numbers the field writes into uniforms each frame. A step starts its tween
 * from the channel's value at the moment it begins, so a route that interrupts another picks up
 * where the field is.
 */
export type Channel = "morph" | "reveal" | "floor" | "riverDraw" | "riverOpacity" | "pin" | "ping" | "hold";

export type Step = {
  channel: Channel;
  to: number;
  /** Start value; by default the channel's value when the step begins. */
  from?: number;
  delay: number;
  duration: number;
  easing: EasingToken | "linear";
};

/** Rest values: no morph, everything drawn, no river or pin, no hold. */
export const REST: Record<Channel, number> = { morph: 0, reveal: 1, floor: 1, riverDraw: 0, riverOpacity: 0, pin: 0, ping: 0, hold: 0 };

const ms = (t: DurationToken) => duration[t];

export type RouteMode = "full" | "calm";

/**
 * Steps for a route change to `to`, besides the morph itself (the field picks its direction from
 * the terrain slots). `values` are the channels now: a river on screen means Bern is being left.
 * `revealFloor` is how strong lines above the draw-on front stay (the map never blanks).
 */
export function planRoute(
  to: string | null,
  mode: RouteMode,
  values: Pick<Record<Channel, number>, "riverOpacity" | "riverDraw" | "pin">,
  { changes, revealFloor }: { changes: boolean; revealFloor: number },
): Step[] {
  const steps: Step[] = [];
  if (to === BERN) {
    // Already there (a route back to Bern before it was left): keep what is drawn.
    const drawn = values.riverDraw >= 1 && values.riverOpacity > 0;
    if (mode === "full") {
      if (!drawn) {
        steps.push({ channel: "riverOpacity", to: 1, delay: 200, duration: 0, easing: "linear" });
        steps.push({ channel: "riverDraw", from: 0, to: 1, delay: 200, duration: ms("draw") - 200, easing: "summit" });
        steps.push({ channel: "ping", from: 0, to: 1, delay: 300, duration: ms("long"), easing: "trail" });
      } else {
        steps.push({ channel: "riverOpacity", to: 1, delay: 0, duration: ms("still"), easing: "trail" });
      }
      steps.push({ channel: "pin", to: 1, delay: drawn ? 0 : 300, duration: ms("micro"), easing: "trail" });
    } else {
      steps.push({ channel: "riverDraw", to: 1, delay: 0, duration: 0, easing: "linear" });
      steps.push({ channel: "riverOpacity", to: 1, delay: 200, duration: ms("still"), easing: "trail" });
      steps.push({ channel: "pin", to: 1, delay: 300, duration: ms("still"), easing: "trail" });
    }
    return steps;
  }
  const leavingBern = values.riverOpacity > 0 || values.pin > 0;
  if (leavingBern) {
    steps.push({ channel: "riverOpacity", to: 0, delay: 0, duration: ms("breathOut"), easing: "scree" });
    steps.push({ channel: "pin", to: 0, delay: 0, duration: ms("breathOut"), easing: "scree" });
    steps.push({ channel: "ping", to: 0, delay: 0, duration: 0, easing: "linear" });
  } else if (mode === "full" && changes) {
    // Lines above the front drop to the floor at once (80 ms), then return as it passes them.
    steps.push({ channel: "floor", to: revealFloor, delay: 0, duration: ms("instant"), easing: "trail" });
    steps.push({ channel: "reveal", from: 0, to: 1, delay: 0, duration: ms("draw"), easing: "summit" });
    steps.push({ channel: "floor", from: 1, to: 1, delay: ms("draw"), duration: 0, easing: "linear" });
  }
  return steps;
}

/** The morph: terrain token, summit easing. */
export const morphStep = (to: number): Step => ({ channel: "morph", to, delay: 0, duration: ms("terrain"), easing: "summit" });

/** Pre-warm (tier A, full): lean towards a hovered or focused destination, and back on leave. */
export const prewarmStep = (to: number, durationMs: number): Step => ({ channel: "morph", to, delay: 0, duration: durationMs, easing: "trail" });

/** Cubic-bezier easing (x → y) solved with a few Newton steps; fine for UI tweens. */
export function bezier(p: readonly number[]): (x: number) => number {
  const [x1, y1, x2, y2] = p;
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  return (x: number) => {
    let t = x;
    for (let i = 0; i < 6; i++) {
      const fx = ((ax * t + bx) * t + cx) * t - x;
      const d = (3 * ax * t + 2 * bx) * t + cx;
      if (Math.abs(d) < 1e-6) break;
      t -= fx / d;
    }
    t = Math.min(Math.max(t, 0), 1);
    return ((ay * t + by) * t + cy) * t;
  };
}

const curves = new Map<string, (x: number) => number>();
const curve = (name: EasingToken | "linear") => {
  if (name === "linear") return (x: number) => x;
  let c = curves.get(name);
  if (!c) curves.set(name, (c = bezier(easing[name])));
  return c;
};

export type TimelineEvent = {
  channel: Channel;
  from: number;
  to: number;
  start: number;
  /** When an update first saw the tween done, and the update before (it lies in between). */
  end: number | null;
  prev: number | null;
  duration: number;
};

type Running = { from: number; to: number; start: number; duration: number; ease: (x: number) => number; event: TimelineEvent };
type Pending = Step & { at: number };

/**
 * Runs steps per channel on the field's frame clock (performance.now() on Motion's frame loop;
 * no timers of its own). A new step for a channel replaces the one queued or running.
 */
export class Timeline {
  values: Record<Channel, number> = { ...REST };
  private running = new Map<Channel, Running>();
  private pending: Pending[] = [];
  /** Started and finished tweens, for the preview-only debug hook. */
  onEvent: ((e: TimelineEvent) => void) | null = null;
  private lastUpdate = 0;

  play(steps: Step[], now: number) {
    // Queued steps of an older plan give way; a running tween hands over when the new step starts.
    const channels = new Set(steps.map((s) => s.channel));
    this.pending = this.pending.filter((p) => !channels.has(p.channel));
    for (const step of steps) this.pending.push({ ...step, at: now + step.delay });
    this.update(now);
  }

  /** Jumps a channel to a value, cancelling its tweens. */
  set(channel: Channel, value: number) {
    this.running.delete(channel);
    this.pending = this.pending.filter((p) => p.channel !== channel);
    this.values[channel] = value;
  }

  /** Advances to `now`; true while anything is queued or moving. */
  update(now: number): boolean {
    if (this.pending.length) {
      const due = this.pending.filter((p) => p.at <= now).sort((a, b) => a.at - b.at);
      if (due.length) {
        this.pending = this.pending.filter((p) => p.at > now);
        for (const step of due) {
          const from = step.from ?? this.values[step.channel];
          const event: TimelineEvent = { channel: step.channel, from, to: step.to, start: step.at, end: null, prev: null, duration: step.duration };
          this.running.set(step.channel, { from, to: step.to, start: step.at, duration: step.duration, ease: curve(step.easing), event });
          this.onEvent?.(event);
        }
      }
    }
    for (const [channel, t] of this.running) {
      const p = t.duration <= 0 ? 1 : Math.min(Math.max((now - t.start) / t.duration, 0), 1);
      // Land exactly on the target: eased end points can be off by a rounding error.
      this.values[channel] = p >= 1 ? t.to : t.from + (t.to - t.from) * t.ease(p);
      if (p >= 1) {
        this.running.delete(channel);
        t.event.end = now;
        t.event.prev = Math.max(this.lastUpdate, t.start);
        this.onEvent?.(t.event);
      }
    }
    this.lastUpdate = now;
    return this.running.size > 0 || this.pending.length > 0;
  }

  /** Any channel is heading somewhere (running or queued). */
  get active(): boolean {
    return this.running.size > 0 || this.pending.length > 0;
  }

  /** The channel is heading somewhere (running or queued). */
  busy(channel: Channel): boolean {
    return this.running.has(channel) || this.pending.some((p) => p.channel === channel);
  }

  /** Where a channel is heading: the last queued or running target, else its value. */
  target(channel: Channel): number {
    const queued = this.pending.filter((p) => p.channel === channel).sort((a, b) => b.at - a.at)[0];
    return queued?.to ?? this.running.get(channel)?.to ?? this.values[channel];
  }
}
