"use client";

import { useSyncExternalStore } from "react";

/**
 * Gyroscope tilt for touch devices. Off until the visitor taps "Enable tilt"; on iOS the
 * permission prompt must be requested inside that click handler. The choice is remembered.
 */
export type GyroStatus = "unavailable" | "off" | "resume" | "on";

const STORAGE_KEY = "summit:tilt";
const MAX_DEG = 8;

type PermissionedDOE = typeof DeviceOrientationEvent & { requestPermission?: () => Promise<"granted" | "denied"> };

let status: GyroStatus = "unavailable";
let initialised = false;
const statusListeners = new Set<() => void>();
const tiltListeners = new Set<(rx: number, ry: number) => void>();
let baseline: [number, number] | null = null;

const setStatus = (next: GyroStatus) => {
  status = next;
  statusListeners.forEach((l) => l());
};

const remember = (value: "on" | "off") => {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Storage blocked: the choice simply isn't remembered.
  }
};

function onOrientation(e: DeviceOrientationEvent) {
  if (e.beta == null || e.gamma == null) return;
  // Landscape swaps the axes.
  const angle = screen.orientation?.angle ?? 0;
  let [x, y] = [e.beta, e.gamma];
  if (angle === 90) [x, y] = [-e.gamma, e.beta];
  else if (angle === 270 || angle === -90) [x, y] = [e.gamma, -e.beta];
  if (!baseline) baseline = [x, y];
  // Drift the neutral pose slowly so a new grip settles back to flat.
  baseline = [baseline[0] + (x - baseline[0]) * 0.01, baseline[1] + (y - baseline[1]) * 0.01];
  const clamp = (v: number) => Math.max(-MAX_DEG, Math.min(MAX_DEG, v));
  const rx = clamp(-(x - baseline[0]) * 0.45);
  const ry = clamp((y - baseline[1]) * 0.45);
  tiltListeners.forEach((l) => l(rx, ry));
}

function start() {
  baseline = null;
  window.addEventListener("deviceorientation", onOrientation, { passive: true });
  setStatus("on");
}

export function initGyro() {
  if (initialised || typeof window === "undefined") return;
  initialised = true;
  const capable = "DeviceOrientationEvent" in window && window.matchMedia("(any-pointer: coarse)").matches;
  if (!capable) return setStatus("unavailable");
  let stored: string | null = null;
  try {
    stored = localStorage.getItem(STORAGE_KEY);
  } catch {
    stored = null;
  }
  const needsPermission = typeof (DeviceOrientationEvent as PermissionedDOE).requestPermission === "function";
  if (stored === "on") {
    if (needsPermission) setStatus("resume");
    else start();
  } else {
    setStatus("off");
  }
}

/** Must be called directly from a click/tap handler (iOS permission rule). */
export function enableGyro() {
  const doe = DeviceOrientationEvent as PermissionedDOE;
  if (typeof doe.requestPermission === "function") {
    doe
      .requestPermission()
      .then((result) => {
        if (result === "granted") {
          remember("on");
          start();
        } else {
          remember("off");
          setStatus("off");
        }
      })
      .catch(() => setStatus("off"));
    return;
  }
  remember("on");
  start();
}

export function disableGyro() {
  window.removeEventListener("deviceorientation", onOrientation);
  remember("off");
  setStatus("off");
  tiltListeners.forEach((l) => l(0, 0));
}

export function onGyroTilt(listener: (rx: number, ry: number) => void) {
  tiltListeners.add(listener);
  return () => {
    tiltListeners.delete(listener);
  };
}

const subscribe = (l: () => void) => {
  initGyro();
  statusListeners.add(l);
  return () => {
    statusListeners.delete(l);
  };
};

export function useGyroStatus(): GyroStatus {
  return useSyncExternalStore(
    subscribe,
    () => status,
    () => "unavailable",
  );
}
