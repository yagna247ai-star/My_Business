#!/usr/bin/env python3
"""
Gmail Segregate - Login and segregate your Gmail into labels/folders.

Works without workctl. Uses Gmail API (OAuth2) or IMAP fallback.

Usage:
  1. python3 gmail_segregate.py --login          # Start OAuth login
  2. python3 gmail_segregate.py --segregate      # Fetch & segregate emails
  3. python3 gmail_segregate.py --segregate --dry-run  # Preview only

Requirements:
  pip install google-auth google-auth-oauthlib google-api-python-client

Setup:
  - Create Google Cloud OAuth credentials (Desktop App):
    https://console.cloud.google.com/apis/credentials
  - Enable Gmail API, download credentials.json to same folder
  - Run --login, browser will open for consent
  - Token saved to token.json for future runs

Segregation rules (customize SEGREGATION_RULES below):
  - B2B Corporate (zenhr.com etc)
  - Leads / CRM contacts (matches contacts.csv)
  - Finance / Bills (keywords: invoice, payment, receipt)
  - Promotions / Marketing
  - Personal

If you prefer IMAP (no Google Cloud setup):
  python3 gmail_segregate.py --imap --email you@gmail.com

This script is ready to run OUTSIDE the sandbox where network is allowed.
Inside sandbox, network proxy is blocked (Operation not permitted to 127.0.0.1:59736),
so pip install / OAuth will fail there. Run in normal terminal.
"""

import os
import sys
import re
import csv
import json
import argparse
import imaplib
import email
from pathlib import Path
from datetime import datetime

WORKSPACE = Path(__file__).parent
CREDENTIALS_PATH = WORKSPACE / "credentials.json"
TOKEN_PATH = WORKSPACE / "token.json"
CONTACTS_PATH = WORKSPACE / "contacts.csv"

# Customize these rules for your segregation
SEGREGATION_RULES = [
    {
        "label": "B2B/Corporate",
        "keywords": ["invoice", "proposal", "contract", "corporate", "enterprise"],
        "domains": ["zenhr.com", "genpact.com", "epam.com"],
        "gmail_label": "B2B_Corporate",
    },
    {
        "label": "Leads/CRM",
        "keywords": [],
        "domains": [],  # auto-filled from contacts.csv
        "gmail_label": "CRM_Leads",
    },
    {
        "label": "Finance/Bills",
        "keywords": ["invoice", "payment", "receipt", "paid", "due", "bill", "upi", "neft", "razorpay"],
        "domains": [],
        "gmail_label": "Finance_Bills",
    },
    {
        "label": "Personal/B2C",
        "keywords": ["family", "personal", "birthday"],
        "domains": ["gmail.com", "yahoo.com", "yahoo.co.uk"],
        "gmail_label": "Personal",
    },
    {
        "label": "Promotions",
        "keywords": ["offer", "discount", "sale", "promo", "unsubscribe"],
        "domains": [],
        "gmail_label": "Promotions_Segregated",
    },
]

SCOPES = ["https://www.googleapis.com/auth/gmail.modify"]

def load_contacts_domains():
    """Extract domains/emails from contacts.csv for Leads rule."""
    domains = set()
    emails = set()
    if not CONTACTS_PATH.exists():
        return domains, emails
    try:
        with open(CONTACTS_PATH, newline='', encoding='utf-8', errors='ignore') as f:
            reader = csv.DictReader(f)
            for row in reader:
                for key in row:
                    if 'email' in key.lower() or '@' in str(row[key]):
                        val = str(row[key] or "").strip()
                        for part in re.split(r'[|,;\s]+', val):
                            if '@' in part:
                                part = part.strip().lower().strip('<>;,')
                                # clean 98 suffix artifact like gmail.com98
                                part = re.sub(r'98+$', '', part)
                                if '@' in part and '.' in part:
                                    emails.add(part)
                                    if '@' in part:
                                        domains.add(part.split('@')[-1])
    except Exception as e:
        print(f"Warning: could not parse contacts.csv: {e}")
    return domains, emails

def classify_email(sender, subject, snippet, contacts_emails, contacts_domains):
    sender = (sender or "").lower()
    subject = (subject or "").lower()
    snippet = (snippet or "").lower()
    text = f"{sender} {subject} {snippet}"

    # Check direct contact match first (highest priority)
    for e in contacts_emails:
        if e in sender:
            return "CRM_Leads"

    for rule in SEGREGATION_RULES:
        label = rule["gmail_label"]
        # domain check
        for d in rule["domains"]:
            if d.lower() in sender:
                return label
        # contacts domains for Leads rule
        if label == "CRM_Leads":
            for d in contacts_domains:
                if d and d in sender:
                    # only if not generic free domains
                    if d not in ("gmail.com", "yahoo.com", "yahoo.co.uk", "outlook.com", "hotmail.com"):
                        return label
        # keyword check
        for kw in rule["keywords"]:
            if kw.lower() in text:
                return label
    return "Unsorted"

def login_oauth():
    """Start OAuth flow and save token.json"""
    try:
        from google_auth_oauthlib.flow import InstalledAppFlow
        from google.auth.transport.requests import Request
        from google.oauth2.credentials import Credentials
    except ImportError:
        print("Missing google libs. Install with:")
        print("  pip install google-auth google-auth-oauthlib google-api-python-client")
        print("  (Run outside sandbox - sandbox blocks network)")
        return False

    if not CREDENTIALS_PATH.exists():
        print(f"Missing {CREDENTIALS_PATH}")
        print("Steps:")
        print(" 1. Go to https://console.cloud.google.com/apis/credentials")
        print(" 2. Create Credentials > OAuth Client ID > Desktop App")
        print(" 3. Download JSON and save as credentials.json next to this script")
        print(" 4. Enable Gmail API at https://console.cloud.google.com/apis/library/gmail.googleapis.com")
        return False

    creds = None
    if TOKEN_PATH.exists():
        from google.oauth2.credentials import Credentials
        creds = Credentials.from_authorized_user_file(str(TOKEN_PATH), SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            from google.auth.transport.requests import Request
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(str(CREDENTIALS_PATH), SCOPES)
            creds = flow.run_local_server(port=0)
        with open(TOKEN_PATH, 'w') as f:
            f.write(creds.to_json())
        print(f"✓ Login successful! Token saved to {TOKEN_PATH}")
    else:
        print(f"✓ Already logged in ({TOKEN_PATH} valid)")

    # Verify by fetching profile
    try:
        from googleapiclient.discovery import build
        service = build('gmail', 'v1', credentials=creds)
        profile = service.users().getProfile(userId='me').execute()
        print(f"  Gmail: {profile.get('emailAddress')} - {profile.get('messagesTotal')} messages")
        labels = service.users().labels().list(userId='me').execute()
        print(f"  Labels: {len(labels.get('labels', []))} found")
        return True
    except Exception as e:
        print(f"Verification failed: {e}")
        return False

def ensure_label(service, name):
    """Create label if not exists, return id"""
    labels = service.users().labels().list(userId='me').execute().get('labels', [])
    for lb in labels:
        if lb['name'].lower() == name.lower():
            return lb['id']
    # create
    body = {"name": name, "labelListVisibility": "labelShow", "messageListVisibility": "show"}
    created = service.users().labels().create(userId='me', body=body).execute()
    print(f"  Created label: {name} ({created['id']})")
    return created['id']

def segregate_gmail(dry_run=False, max_messages=50):
    try:
        from google.oauth2.credentials import Credentials
        from googleapiclient.discovery import build
        from google.auth.transport.requests import Request
    except ImportError:
        print("Missing google libs. Run: pip install google-auth google-auth-oauthlib google-api-python-client")
        return

    if not TOKEN_PATH.exists():
        print(f"Not logged in. Run first: python3 {Path(__file__).name} --login")
        return

    creds = Credentials.from_authorized_user_file(str(TOKEN_PATH), SCOPES)
    if creds.expired and creds.refresh_token:
        creds.refresh(Request())
        with open(TOKEN_PATH, 'w') as f:
            f.write(creds.to_json())

    service = build('gmail', 'v1', credentials=creds)
    profile = service.users().getProfile(userId='me').execute()
    print(f"Gmail: {profile.get('emailAddress')}")

    contacts_domains, contacts_emails = load_contacts_domains()
    # domains, emails swapped in function return order - fix
    # load_contacts_domains returns (domains, emails)
    cd, ce = contacts_domains, contacts_emails
    # Actually function returns (domains, emails), so cd=domains, ce=emails
    print(f"Loaded {len(ce)} contact emails, {len(cd)} domains from contacts.csv")

    # Ensure labels exist
    label_ids = {}
    for rule in SEGREGATION_RULES:
        lid = ensure_label(service, rule["gmail_label"])
        label_ids[rule["gmail_label"]] = lid
    label_ids["Unsorted"] = ensure_label(service, "Unsorted")

    # Fetch messages
    results = service.users().messages().list(userId='me', maxResults=max_messages, q="").execute()
    messages = results.get('messages', [])
    if not messages:
        print("No messages found.")
        return

    print(f"\nSegregating {len(messages)} messages (dry_run={dry_run})...\n")
    stats = {}
    for m in messages:
        msg = service.users().messages().get(userId='me', id=m['id'], format='metadata', metadataHeaders=['From','Subject','Date']).execute()
        headers = {h['name']: h['value'] for h in msg.get('payload', {}).get('headers', [])}
        sender = headers.get('From', '')
        subject = headers.get('Subject', '')
        snippet = msg.get('snippet', '')

        target = classify_email(sender, subject, snippet, ce, cd)
        stats[target] = stats.get(target, 0) + 1

        print(f" [{target:20}] From: {sender[:50]:50} | Subj: {subject[:50]}")

        if not dry_run:
            # Add label, keep inbox unless you want to archive
            service.users().messages().modify(userId='me', id=m['id'], body={"addLabelIds": [label_ids[target]]}).execute()

    print("\n--- Summary ---")
    for k, v in sorted(stats.items(), key=lambda x: -x[1]):
        print(f"  {k:20} : {v}")
    if dry_run:
        print("\nDry run - no labels applied. Run without --dry-run to apply.")
    else:
        print("\n✓ Labels applied. Check Gmail left sidebar for new labels.")

def imap_segragate(email_addr, password, dry_run=True):
    """Fallback IMAP segregation (uses folder move instead of labels)"""
    print(f"IMAP login for {email_addr} (dry_run={dry_run})")
    print("Note: Gmail IMAP requires App Password if 2FA enabled.")
    print("Create at: https://myaccount.google.com/apppasswords")
    try:
        mail = imaplib.IMAP4_SSL("imap.gmail.com")
        mail.login(email_addr, password)
        mail.select("INBOX")
        _, data = mail.search(None, "ALL")
        ids = data[0].split()[:50]
        print(f"Fetched {len(ids)} messages")
        contacts_domains, contacts_emails = load_contacts_domains()
        cd, ce = contacts_domains, contacts_emails
        stats = {}
        for eid in ids:
            _, msg_data = mail.fetch(eid, "(RFC822.HEADER)")
            msg = email.message_from_bytes(msg_data[0][1])
            sender = msg.get("From", "")
            subject = msg.get("Subject", "")
            target = classify_email(sender, subject, "", ce, cd)
            stats[target] = stats.get(target, 0) + 1
            print(f" [{target:20}] {sender[:50]:50} | {subject[:40]}")
        print("\nSummary:", stats)
        if dry_run:
            print("Dry run - no moves. For real moves implement IMAP COPY + STORE \\Deleted")
        mail.logout()
    except Exception as e:
        print(f"IMAP error: {e}")

if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="Gmail Login & Segregate")
    ap.add_argument("--login", action="store_true", help="OAuth login flow")
    ap.add_argument("--segregate", action="store_true", help="Segregate inbox")
    ap.add_argument("--dry-run", action="store_true", help="Preview without applying labels")
    ap.add_argument("--max", type=int, default=50, help="Max messages to process")
    ap.add_argument("--imap", action="store_true", help="Use IMAP instead of API")
    ap.add_argument("--email", type=str, help="Email for IMAP")
    ap.add_argument("--password", type=str, help="App password for IMAP")
    args = ap.parse_args()

    if args.login:
        login_oauth()
    elif args.imap:
        if not args.email:
            args.email = input("Gmail address: ").strip()
        if not args.password:
            import getpass
            args.password = getpass.getpass("App Password: ")
        imap_segragate(args.email, args.password, dry_run=args.dry_run)
    elif args.segregate:
        segregate_gmail(dry_run=args.dry_run, max_messages=args.max)
    else:
        ap.print_help()
        print("\nExamples:")
        print("  python3 gmail_segregate.py --login")
        print("  python3 gmail_segregate.py --segregate --dry-run")
        print("  python3 gmail_segregate.py --segregate")
