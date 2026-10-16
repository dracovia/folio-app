# Folio v1.6 — Manual encrypted GitHub Push & Pull

Folio v1.6 adds an optional, **manual** way to move your personal finance data from the phone/PWA to the laptop/web app using a **private** GitHub repository. It keeps all of v1.5's botanical theme, transaction logic, recurring payments, and budget allocations.

There are **no subscriptions**, no separate database, no backend, and no GitHub OAuth application. Folio works offline as before. GitHub is only contacted if you click Test connection, Push, or Pull.

## First-time GitHub setup

1. At https://github.com/new create a **Private** repository named `folio-private-data`. Tick **Add a README file**, so GitHub initializes the default branch (`main`). Do not upload any ordinary, unencrypted Folio backup.
2. In GitHub, go to **Settings → Developer settings → Personal access tokens → Fine-grained tokens**. Create a token with access to **only** `folio-private-data` and grant **Contents → Read and write**. Metadata read is implicit. Set an expiry you can manage. Copy the token and store it securely. Do not place it in source code or share screenshots containing it.
3. Install/open Folio v1.6 on the phone and laptop. Both must use **HTTPS** (e.g., a correctly hosted PWA) or **http://127.0.0.1** / **localhost** for the browser encryption API. The existing app still works offline.
4. Open **Settings → GitHub Push & Pull** and enter:
   - GitHub username (the repository owner)
   - Private repository name (`folio-private-data`)
   - Branch (`main`, or your actual branch)
   - Fine-grained access token (on each device)
   - A **strong encryption password, at least 12 characters**, identical on phone and laptop
5. Click **Test connection** then **Push to GitHub** on the device that has the canonical latest data (typically your phone).
6. On the other device enter the same connection and encryption password, then **Pull from GitHub**. Confirm replacing that device's local data. Folio triggers a download of the pre-pull local backup as a precaution.

**Everyday use**: Phone: make changes → Push. Laptop: Pull. If you change anything on the laptop that you want on the phone, Laptop: Push → Phone: Pull.

## Security and limitations

- The remote file is **`folio-data.encrypted.json`**, encrypted client-side using **AES-256-GCM**. Its key is derived from the encryption password using **PBKDF2-SHA256** with 600,000 iterations and a random salt. A fresh random nonce is used each time you push.
- The GitHub token **never enters Folio's exported financial JSON**. By default it exists only in the app's in-memory session. The optional **Remember token on this device** checkbox writes it to this device's browser storage, which is less safe on shared computers. Unchecking removes the stored token.
- The encryption password is **never written to browser storage or GitHub**; you need to enter it again when starting a new session. If forgotten, data already on devices remains accessible, but encrypted remote backups can't be decrypted.
- The repository **must be private**; Folio refuses to push/pull to a public repository.
- Folio remembers the last GitHub file SHA on each device. It blocks pushes if another device has updated the remote file since your device last synced. **There is no automatic merging**. To resolve, download a local JSON backup, pull the latest remote copy, then manually re-enter or re-import any divergent changes.
- Pull asks before replacing all locally stored transactions, budgets, wallets and schedules. It triggers a safety-backup download first; still keep independent manual JSON backups because browser downloads can be blocked or lost.
- Data stays stored locally for normal use. Push and Pull require internet; this is not live sync or a background service.
- GitHub Contents API is for relatively small files. This implementation limits encrypted data to **900 KB**; you can continue using Folio's JSON export if your history grows beyond that.
- A GitHub repository retains encrypted backup *history*. Keep repository/token access restricted, and don't reuse a weak encryption password.
- GitHub Pages can host the app source but should **never** contain the financial JSON or token. App source and private backup belong in **different repositories**.

## Updating from v1.5

1. Before installing v1.6, use **Settings → Download full backup** in the old app.
2. Extract the v1.6 ZIP into a new folder. The updated code has a new `js/github-sync.js` file.
3. Run `start-windows.bat` or use your existing static HTTPS hosting approach on mobile.
4. Stay on the same browser and local origin to keep the local `folio-finance-v1` data. If you changed origins, import your older JSON backup once.
5. Configure GitHub separately on both devices; the app intentionally does **not** bake your token or personal data into any downloadable ZIP.

## Developer notes

The data schema and local storage key `folio-finance-v1` are unchanged. GitHub connection metadata and optional remembered token are stored under separate keys: `folio-github-sync-v1` and `folio-github-token-v1`. The optional integration has **no external JavaScript dependencies**. A failing or unavailable GitHub connection does not prevent normal offline finance use.

GitHub Contents REST documentation: https://docs.github.com/en/rest/repos/contents
