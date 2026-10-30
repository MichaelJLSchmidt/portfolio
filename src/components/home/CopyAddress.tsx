"use client";

import { useEffect, useRef, useState } from "react";
import { Glint } from "@/components/motion/Glint";
import { playGlint } from "@/components/motion/glint";
import { MotionButton } from "@/components/motion/MotionButton";
import { copyAddress as t } from "@/content/contact";
import { haptic } from "@/lib/haptics";
import { duration } from "@/styles/tokens";
import styles from "./Home.module.css";

type Note = { text: string; ok: boolean } | null;

/**
 * "Copy address" beside Email: copies the address, settles its label to "Copied" and raises a
 * toast ("Email address copied.") with one glint and the success haptic. The toast
 * is a status message (role="status", in place before it speaks), stays --dur-toast (4 s) and
 * pauses while it is hovered or holds focus; its dismiss button closes it. If the clipboard is
 * unavailable it says so and shows the address instead.
 */
export function CopyAddress({ address, className }: { address: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const [note, setNote] = useState<Note>(null);
  const [held, setHeld] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  // The toast's clock: it runs while nobody is reading it.
  useEffect(() => {
    if (!note || held) return;
    const timer = window.setTimeout(() => {
      setNote(null);
      setCopied(false);
    }, duration.toast);
    return () => window.clearTimeout(timer);
  }, [note, held]);

  // One glint as a success arrives (full motion; glints never overlap).
  useEffect(() => {
    if (note?.ok) playGlint(textRef.current);
  }, [note]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setNote({ text: t.toast, ok: true });
      haptic("success");
    } catch {
      setNote({ text: t.failed(address), ok: false });
    }
  };

  return (
    <>
      <MotionButton label={copied ? t.done : t.label} labels={[t.label, t.done]} pressHaptic={false} onClick={copy} className={className} />
      <div
        className={styles.toast}
        data-open={note ? "" : undefined}
        data-ok={note?.ok ? "" : undefined}
        onPointerEnter={() => setHeld(true)}
        onPointerLeave={() => setHeld(false)}
        onFocus={() => setHeld(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHeld(false);
        }}
      >
        {/* The live region is always there, so the message is announced as it arrives. */}
        <p ref={textRef} className={`${styles.toastText} hud-label`} role="status">
          {note?.text}
          {note?.ok && <Glint text={note.text} />}
        </p>
        {note && (
          <button
            type="button"
            className={styles.toastClose}
            aria-label={t.dismiss}
            onClick={() => {
              haptic("press");
              setNote(null);
              setCopied(false);
            }}
          >
            <span aria-hidden="true">×</span>
          </button>
        )}
      </div>
    </>
  );
}
