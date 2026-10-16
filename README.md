# Folio v1.6 — Manual Encrypted GitHub Sync

See [README-V1.6.md](README-V1.6.md) for private-repository setup, token permissions, the encryption password, conflict rules, and phone/laptop Push & Pull. Manual GitHub sync is **optional** and free; all existing local features remain available offline.

---

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

---

# Folio v1.4 — Category limits while creating a budget

Create **or edit** a budget and split its fixed total among category spending limits **in the same dialog**. You no longer need to save the budget and then create individual limits separately.

## New budget workflow
1. Open **Budgets → New budget**.
2. Enter a **name**, **total spending budget**, and period.
3. Under **Divide the budget**, select **Add category** for each allocation.
4. For each category, choose **Fixed amount** (e.g. $65) or **% of budget** (e.g. 20%).
5. Watch the live **Total budget / Allocated / Unallocated** summary. Folio will stop you from saving a set of caps that exceeds your budget.
6. Save once: the budget and all category limits are created together.

**Example:** a total of $430 can include Pets $80, Transit $130, Laser $70, with $150 still unallocated. Category caps are subdivisions; they do not increase the $430 total. A category cap also does not reserve a bank balance; spending is recorded when a transaction is paid.

Editing an existing budget now shows all its category limits in this same form. You can change or remove any allocation, modify total or period, and save them together. Imported Cashew percentage limits remain percentages. The separate category-limit editor also enforces the fixed total. Parent-category and subcategory limits cannot overlap, to avoid counting the same expense twice.

### Update safely (no subscriptions or hosting)
1. In the OLD Folio, go to **Settings → Download full backup (JSON)** before updating.
2. Extract this ZIP into a **new folder**; do not delete your backup.
3. Close the old local server, then double-click **start-windows.bat** in the new folder.
4. Open **http://127.0.0.1:5173/#budgets** in the **same browser** you previously used. You should see **FOLIO 1.4** at the bottom left on desktop.
5. Your saved data should appear automatically because the app keeps the same browser storage key and local address. If not, use **Settings → Restore a backup**, then select your exported Folio JSON.

Your Cashew CSV and SQLite files, and your private imported finance data, are NOT included in this ZIP. This remains a 100% free, offline-first app requiring no subscriptions, API keys, cloud account or payment details.

---

# Folio v1.3 — Budget planner rebuilt using Cashew as a reference

**Original implementation** based on reviewing Cashew's public source (`budgetsListPage.dart`, `budgetPage.dart`, `addBudgetPage.dart`, `editBudgetLimitsPage.dart`, `pastBudgetsPage.dart`, `functions.dart`, `database/tables.dart`). Cashew is GPL-3.0: this app uses its design ideas and budgeting concepts, but does not copy Flutter source. See GitHub: https://github.com/jameskokoska/Cashew

### What's new
- A real **main budget detail** page, with period switching, a big remaining balance, paid vs upcoming distinction, and progress visualizations.
- Category limits now live **inside** their parent budget instead of appearing as 6 independent budget cards. Edit/add/delete a category limit, in **fixed dollar** or **percentage of main budget** terms.
- Allocation math correctly reserves category amounts out of the main total without double-counting. Unallocated money and spent-without-limit are shown distinctly.
- Compare past periods (up to six) and inspect transactions for the selected budget or category.
- Main budgets support monthly, weekly, daily, yearly, and one-time/custom date periods.
- This upgrade automatically fixes the **verified October 14, 2026 Cashew import**: `is_absolute_spending_limit=0` means category caps of 3, 38, 19, 19 and 8 were **percentages, not USD amounts**. The previous app misinterpreted them. With a $430 budget, 38% means $163.40, not $38. Existing imported data is corrected on load without needing another import. Other legacy Cashew backups are left unchanged unless they specify a limit mode.
- Future imports created by the included offline converter preserve the original cap mode (`percent` or `amount`) and recurrence period.

### Updating safely
1. **Before updating**, open the old Folio and choose Settings → Download full backup.
2. Extract Folio v1.3 and run `start-windows.bat` (Python 3).
3. Open the same local URL in the same browser. Folio uses the unchanged `folio-finance-v1` storage key. The original Cashew percentages are interpreted correctly.
4. Inspect the **Budgets** tab; confirm the main $430 limit and per-category percentages. If needed, use Settings → Restore a backup to restore your backup.

The app and converter remain entirely offline/local and cost $0 per month. Your private CSV, SQLite and JSON files are not included in this ZIP.

---

# Previously introduced in Folio 1.2 — Activity + Pay workflow

This update keeps your existing browser data (same localStorage key and compatible JSON imports). No subscriptions, accounts or paid hosting.

### New in 1.2
- **Transactions** combines completed and scheduled occurrences, with All / Paid / Scheduled tabs and a **Tag** filter.
- **Pay**, **Receive** or **Complete** records one occurrence as a normal transaction, using today's payment date, while retaining its due date for duplicate prevention. Scheduled items immediately disappear from the pending list, and the activity list switches to the month of payment. Scheduled rules remain in **Manage schedules** for future occurrences.
- **Skip** suppresses just that occurrence, without posting or charging the wallet.
- Transactions and schedules have a closed set of multi-select tag buttons (no free-text typing). Existing custom tags from older backups remain selectable.
- New schedules default to **manual confirmation**, not auto-posting. Existing auto-post settings are preserved.
- Responsive transaction rows, filters, tabs, forms and action buttons on desktop/mobile.

**Important:** planned payments do not change wallet balances, budget spending or charts until paid. Payments recorded before their due date are dated today (the day you paid). A repeating schedule is not deleted when one occurrence is paid. Browser storage is per-browser; export JSON backups from Settings.

# Folio — free personal finance tracker

Folio is a **local-first, subscription-free** personal finance web app. It is a working personal-finance version inspired by Cashew, built entirely with HTML, CSS, and JavaScript. Normal local use needs no account, backend, API key, package manager, or paid dependency. Optional GitHub sync uses a private repository and a personal access token supplied on each device.

## Included features

- Expenses, income, and wallet-to-wallet transfers; dates, categories, tags, notes, merchant names, editing and deletion.
- Filter and search transactions by type, category, wallet, and current month.
- Wallets, opening balances, and automatically calculated balances.
- Custom expense and income categories, parent categories/subcategories, emojis, and colors.
- Daily, weekly, monthly, yearly and custom one-time budgets with category limits inside a main budget; parent categories include subcategory spending and allocated caps never increase the main budget.
- Recurring or one-off scheduled payments: daily/weekly/monthly/annual, start and optional end dates, auto-posting on app open, manual posting, pause/resume, and editing.
- Dashboard showing income, expenses, net flow, budgets, six-month bar charts, expense category donut, recent transactions, and upcoming schedules.
- Insights with category comparisons, monthly spending trends, and average transaction size.
- JSON full backup/restore, CSV transaction export, add-only Cashew CSV import (paid transactions), and a reset option.
- Mobile-friendly UI, optional installable PWA, and offline caching when hosted securely or on localhost.

Folio starts **empty**: no demo transactions and no invented income. To save setup time, it includes example category labels relevant to everyday spending; edit/delete them as needed.

## Import your Cashew data — free, offline

To restore a **full Cashew export** (transactions, categories/subcategories, budgets, category limits, upcoming payments), you need BOTH original Cashew exports: the `.csv` transaction export and the `.sql` data export. Cashew's `.sql` is a **SQLite binary database**, not a text SQL script. You cannot upload `.sql` directly in the Folio browser interface.

For the files from October 14, 2026, a compatible `Folio-Cashew-Import-2026-10-14.json` file is supplied **separately from the app ZIP** (it contains personal finance data).

1. Start Folio using the Windows launcher (or the Python command below).
2. Open **Settings → Restore a backup → Import**.
3. Choose the converted `Folio-Cashew-Import-2026-10-14.json` file; confirm replacement.
4. Check **Transactions**, **Budgets**, **Scheduled**, and **Settings → Wallets**.
5. **Important:** Cashew did not supply a wallet opening balance. Folio sets it to `0` as a placeholder, so adjust it manually before relying on the displayed balance.

For later FULL Cashew exports, run the included offline converter with Python (no packages to install):

```powershell
py tools/cashew_to_folio.py "C:\path\to\cashew.csv" "C:\path\to\cashew.sql" "C:\path\to\folio-import.json"
```

Then restore the generated JSON using Settings as above. **Restore replaces all current Folio data**, so export a full Folio backup before restoring. Cashew subcategory relations, one original monthly budget, and linked category budget limits are included. The converter is conservative: it does not treat the `extra` column's `repeat every 1 month` text as reliable for paid purchases, because Cashew writes that on non-recurring items as well. Imported unpaid payments are MANUAL; two marked "repetitive" are treated as monthly and an upcoming-only entry as one-off. Check the intended recurrence before switching auto-post on.

If you only need to append **paid transactions**, Settings → Cashew migration → Import Cashew CSV does so without modifying your Folio budgets or existing schedules. Unpaid/upcoming items are intentionally skipped in CSV-only mode. Duplicate detection is based on date, title, amount, note, wallet and category.

**Budget interpretation note:** Folio reads the Cashew recurrence and category-cap unit (`is_absolute_spending_limit`). October 2026 category limits were percentages; see the verified correction above. The date ranges may still differ in unusual Cashew configurations because Folio supports calendar-aligned repeating periods rather than all Cashew anchor/length rules. Folio does not implement every Cashew budget transaction filter.

**Privacy:** Cashew export and Folio JSON include private transactions and notes. Keep them off public GitHub repositories. The converter stays fully local; optional GitHub Push sends only encrypted Folio data to a private repository when you press the button.

## Start on Windows — free and no subscriptions

1. Extract the ZIP into a permanent folder, e.g. `Documents\folio-finance`.
2. Open **PowerShell** in the extracted folder.
3. If you have Python 3 installed, run:

   ```powershell
   py -m http.server 5173 --bind 127.0.0.1
   ```

   If `py` is not recognized, try:

   ```powershell
   python -m http.server 5173 --bind 127.0.0.1
   ```

4. Open **http://127.0.0.1:5173** in Chrome, Edge, or Firefox.

You can also double-click `start-windows.bat` if Python is installed. If you don't have Python, we can set it up; **Python is free**. Opening `index.html` directly sometimes works, but using the local server is recommended for reliable browser storage and installation.

### macOS/Linux

From the extracted folder:

```bash
python3 -m http.server 5173 --bind 127.0.0.1
```

Then open http://127.0.0.1:5173.

## Install like an app

When opened at localhost in a compatible browser, use the browser's **Install app** or **Add to desktop** action. On phones, an HTTPS host is recommended for PWA installation (e.g. GitHub Pages, which has a no-cost option for public static sites). Only deploy app source files, **not** your personal JSON backup or browser data. The data remains on your device, not on GitHub Pages.

### Important device limitation

**Manual encrypted GitHub Push & Pull is now available in Settings** (v1.6). Local storage remains independent on each device. Follow README-V1.6.md. You can still transfer a JSON backup manually if you prefer.

## How recurring transactions work

Auto-posting happens **when the app is opened or brought back into focus**. No background processing happens when the app is closed. For manual schedules, click the due posting button. If you delete a manually recorded scheduled transaction, the pending occurrence reappears so you can pay it again. Deleting an automatically posted occurrence skips it to prevent immediate re-posting. Use **Skip** in Transactions to deliberately dismiss a planned occurrence without paying.

## Backups and privacy

- Financial data is saved locally via `localStorage` under `folio-finance-v1` and can be cleared by browser settings or reset. Local browser storage is **not encrypted**. Only optional GitHub backups are encrypted before upload.
- Keep a copy by exporting a full JSON backup regularly, especially before changing browsers or computers.
- Do not edit your JSON backup unless you understand the format.
- Cashew CSV import supports paid transactions only. For budgets, subcategories and unpaid scheduled payments, use the two-export converter described below.
- The display currency setting changes the **symbol only**. No foreign-exchange conversion occurs.

## Things deliberately not included in version 1

No bank integration, live/automatic cross-device sync, live exchange rates, push reminders while closed, PDF reports, or Cashew's entire feature set. Those are potential later enhancements; the current app works without them and costs nothing to run locally.

## Project layout

```
folio-finance/
├── index.html
├── styles.css
├── js/app.js
├── assets/icon.svg
├── assets/icon-192.png
├── assets/icon-512.png
├── manifest.webmanifest
├── service-worker.js
├── start-windows.bat
├── tools/cashew_to_folio.py
└── README.md
```

## Running costs

| Item | Cost |
| --- | --- |
| App source code | $0 |
| Programming libraries | $0 (none) |
| Python local server | $0 |
| Database server | $0 (none) |
| Local-only use | **$0/month** |

Optional third-party hosting might have terms or limits, but it is not required for this app.
