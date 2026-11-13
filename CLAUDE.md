# CLAUDE.md

Portfolio site: a Next.js static export (`dist/`), deployed on Netlify from `main`. Every deploy is
behind a password gate until launch. The README covers structure, commands, languages and hosting.

- npm only. Installing needs `MOTION_TOKEN` in the environment. Never write it, or `SITE_PASSWORD`,
  into a file.
- Before finishing: `npm run typecheck`, `npm run build`, `npm test`.
- Pull requests target `main` (production).
- Visible text lives in `content/`. German copy: Swiss Standard German, informal "du", no "ß",
  em-dashes or semicolons.
- No hard-coded leading `/` for assets or links: `next/link`, or `withBase()` for raw URLs.
- The gate (`src/hosting/`) fails closed; change it only together with its tests.
- No personal names in code, comments, docs or commits.
- Shared contracts: docs/contracts.md.
