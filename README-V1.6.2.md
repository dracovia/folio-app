# Folio v1.6.2 — GitHub Sync Base64 Fix

This update fixes a decoding bug when GitHub Contents API returns Base64 with line breaks after padding. Earlier versions rejected some valid responses with `Invalid base64 data.`

- `js/github-sync.js`: Normalize Base64 whitespace before validation and decoding.
- `service-worker.js`: Bump offline cache to `folio-offline-v9` so installed PWAs update.
- `index.html`: Update displayed version to 1.6.2.

No data model, transaction, budget, scheduling or encryption-format changes. Existing encrypted backups work without re-uploading. Your GitHub credentials and finance records are never bundled in the source.

To deploy from your Windows clone (`C:\Users\fassa\Projects\folio-app`), copy `js/github-sync.js`, `service-worker.js`, and `index.html` from this archive into the matching locations. Then run `git add js/github-sync.js service-worker.js index.html`, `git commit -m "Fix GitHub sync base64 decoding"`, and `git push`.

Wait for GitHub Pages deployment, then fully close/reopen the app (or refresh twice), and retry Pull. Never Push from an empty phone before a successful Pull.
