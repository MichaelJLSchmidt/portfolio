# Handoffs

Each session writes one file here so the Integration session can merge the parallel work without
guessing. Wave 1 sessions: `layout.md` (Layout & Pages), `motion.md` (Motion),
`illustrations.md` (Illustrations), `content.md` (Content & Images). `foundation.md` is the
Foundation session's; `integration.md` reports the merge, the integration decisions (I1–I27 in
`docs/contracts.md`) and the deploy. Later single-session rounds report in their own file:
`feedback-1.md` (feedback round 1), `i18n.md` (German and English, L1–L11), `feedback-2.md`
and `feedback-3.md` (rounds 2 and 3).

Create `docs/handoff/<agent>.md` at the start of your session (with the plan) and finish it
before your last push. Edit only your own file. Use these sections:

1. **Branch**: the branch you pushed (only your own branch; never `main`).
2. **Plan**: what you set out to do, written before editing.
3. **What shipped**: files and behaviour, by contract area (link the sections of
   `docs/contracts.md` you implemented). Note anything left as a stub.
4. **Contract change requests**: every name, prop, type, token, attribute or path in
   `docs/contracts.md` you need changed or added, with the reason and the smallest change. Do not
   make the change yourself in a file you do not own; work around it on your branch and describe
   the workaround.
5. **Known issues**: what is broken, unfinished or untested, and how you checked what you shipped
   (build, smoke, screenshots), with failures quoted.

Keep it short and factual. No personal names.
