"use client";

import { useEffect, useState } from "react";
import { SurveyButton } from "@/components/ui/SurveyButton";
import { copyAddress as t } from "@/content/contact";
import { haptic } from "@/lib/haptics";
import { duration } from "@/styles/tokens";
import styles from "../SiteFooter.module.css";

type Note = { text: string; ok: boolean } | null;

/**
 * "Copy address" beside Email: copies the address, turns its label to "Copied" and raises a
 * toast ("Email address copied."). The toast
 * is a status message (role="status", in place before it speaks), stays --dur-toast (4 s) and
 * pauses while it is hovered or holds focus; its dismiss button closes it. If the clipboard is
 * unavailable it says so and shows the address instead.
 */
export function CopyAddress({ address, className }: { address: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const [note, setNote] = useState<Note>(null);
  const [held, setHeld] = useState(false);

  // The toast's clock: it runs while nobody is reading it.
  useEffect(() => {
    if (!note || held) return;
    const timer = window.setTimeout(() => {
      setNote(null);
      setCopied(false);
    }, duration.toast);
    return () => window.clearTimeout(timer);
  }, [note, held]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setNote({ text: t.toast, ok: true });
      haptic("press");
    } catch {
      setNote({ text: t.failed(address), ok: false });
    }
  };

  return (
    <>
      <SurveyButton onClick={copy} className={className} arrow={null}>
        <span className={styles.copyLabel} data-copied={copied || undefined}>
          <span aria-hidden={copied || undefined}>{t.label}</span>
          <span aria-hidden={!copied || undefined}>{t.done}</span>
        </span>
      </SurveyButton>
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
        <p className={`${styles.toastText} mono`} role="status">
          {note?.text}
        </p>
        {note && (
          <button
            type="button"
            className={styles.toastClose}
            aria-label={t.dismiss}
            onClick={() => {
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
