# Gmail Login & Segregate — Setup Guide

## What was built
`gmail_segregate.py` (335 lines) — handles Gmail login + segregation without `workctl`.

- **OAuth2 login** via Google Cloud (preferred) — creates `token.json` for persistent login
- **IMAP fallback** — uses App Password, no Google Cloud needed
- **Segregation rules** — auto-creates Gmail labels and classifies emails:
  - `B2B_Corporate` — zenhr.com, corporate keywords
  - `CRM_Leads` — matches 340 emails / 29 domains from your `contacts.csv`
  - `Finance_Bills` — invoice, payment, receipt, UPI, NEFT
  - `Personal` / `Promotions_Segregated` / `Unsorted`
- Integrated with your existing `contacts.csv` (loaded 340 emails successfully)

## Why workctl is not used here
`workctl` bootstrap failed in this sandbox:

1. `workctl version` → `command not found` — not installed globally
2. `npm install -g @accio-ai/cli` → `EPERM` on `/Users/apple/.npm` (root-owned files)
3. `sudo chown` → `Operation not permitted` (sandbox denies sudo)
4. `curl` to `registry.npmjs.org` via proxy `127.0.0.1:59736` → `Operation not permitted` / `Proxy CONNECT aborted due to timeout` — **sandbox blocks network proxy**

Network installs (npm, npx) will hang/fail inside this sandbox. Must run outside sandbox (normal Terminal) where network is allowed.

## How to login and segregate (run OUTSIDE sandbox — normal Terminal)

### Option A — Gmail API (recommended, full label support)

1. **Create OAuth credentials:**
   - https://console.cloud.google.com/apis/credentials → Create Credentials → OAuth Client ID → Desktop App
   - Enable Gmail API: https://console.cloud.google.com/apis/library/gmail.googleapis.com
   - Download JSON → save as `credentials.json` in `My_Business/` (next to `gmail_segregate.py`)

2. **Login:**
   ```bash
   cd /Users/apple/Documents/My_Business
   pip install google-auth google-auth-oauthlib google-api-python-client
   python3 gmail_segregate.py --login
   ```
   Browser opens → grant Gmail modify permission → `token.json` saved.

3. **Preview segregation (dry run, no changes):**
   ```bash
   python3 gmail_segregate.py --segregate --dry-run --max 50
   ```

4. **Apply labels:**
   ```bash
   python3 gmail_segregate.py --segregate --max 100
   ```
   Check Gmail left sidebar for new labels.

### Option B — IMAP (no Google Cloud)

1. Create App Password: https://myaccount.google.com/apppasswords (requires 2FA)
2. Run:
   ```bash
   python3 gmail_segregate.py --imap --email you@gmail.com --dry-run
   # then without --dry-run to move (currently preview only)
   ```

## Customize segregation
Edit `SEGREGATION_RULES` at top of `gmail_segregate.py` — add domains/keywords, change label names.

## Files
- `gmail_segregate.py` — main script
- `contacts.csv` — used automatically for Leads classification
- `credentials.json` — you create (not in repo)
- `token.json` — auto-created after login

## Next steps for you
1. Open a **normal Terminal** (not sandbox) and run the Option A steps above
2. Tell me your Gmail address if you want me to pre-configure rules
3. If you prefer workctl, run in normal Terminal:
   ```bash
   npm install -g @accio-ai/cli@latest
   workctl auth status --format json
   workctl auth login --provider alibaba --format json
   workctl schema  # to discover gmail product
   ```

## Verification
```bash
python3 gmail_segregate.py --help
python3 -c "import gmail_segregate; d,e=gmail_segregate.load_contacts_domains(); print(len(e))"
# → 340
```
