/** A short vibration inside a gesture handler, where supported (iOS has none: nothing happens there). */
export function buzz(ms: number) {
  if ('vibrate' in navigator) navigator.vibrate(ms)
}
