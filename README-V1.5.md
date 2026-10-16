# Folio v1.5 — The Botanical Ledger

This release is a **visual redesign only** of Folio v1.4, using the supplied vintage green and burgundy color reference. It does not alter the financial data schema, the browser storage key, import/export behavior, budget logic, scheduled-payment logic, or transaction calculations.

## The new look

- **Forest green sidebar** with warm cream typography, antique-gold trim, and an easy-to-spot active page.
- **Vintage parchment workspace** with airy cream cards, dark-olive text, and green accents.
- **Burgundy primary buttons** and selected tags, sage secondary buttons, gold highlights.
- **A distinct forest-green main budget panel** with antique-gold progress and a clearer hierarchy between the total and its category envelopes.
- **Redesigned allocation form** with neutral inputs, easy-to-read labels, and sage availability indicators.
- Updated charts, summary cards, transactions, schedules, settings, dialogs, navigation, focus states, and PWA icons.
- The same responsive desktop/mobile layouts and free offline/local functionality.

### Palette

Forest Green `#304D3B` · Moss Green `#577A55` · Sage Green `#91AB87` · Pale Sage `#CBD5B3` · Deep Burgundy `#632D3B` · Dusty Burgundy `#94505C` · Vintage Cream `#E9D7C3` · Dark Olive `#202B24` · Antique Gold `#C4A16C`.

The additional parchment/card shades are lighter tints for readable finance interfaces.

## Safely update from an earlier version

1. In your existing Folio, choose **Settings → Download full backup** to save a JSON copy of your data.
2. Extract the Folio v1.5 ZIP into a **new folder**.
3. Stop the old server and run `start-windows.bat` in the new `folio-finance` folder.
4. Open `http://127.0.0.1:5173/` in the **same browser**. Folio reads the same `folio-finance-v1` storage key on the same origin, so your saved data should appear automatically.
5. If data is missing, use **Settings → Restore a backup** and select your saved JSON file.
6. Refresh once if you see an older theme; the service worker cache was also versioned for this update.

The project has no subscriptions, paid fonts, third-party CSS/CDN calls, server account, or new development dependencies. The `theme.css` file is intentionally separate from the original stylesheet, so you can customize the palette later without changing app logic.

Your private imported Cashew data is **not bundled** in the ZIP.
