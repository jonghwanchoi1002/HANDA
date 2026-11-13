# Gmail authentication email

Use `handa.community@gmail.com` for temporary, low-volume authentication email until a sending domain is available. Verification, password reset, and email-change messages all use the same mail provider. Google OAuth sign-in is separate and its credentials remain unchanged.

## Gmail setup

1. Sign in to the HANDA Gmail account and enable two-step verification at https://myaccount.google.com/security.
2. Open https://myaccount.google.com/apppasswords and create an app password named `HANDA Production`.
3. Keep the generated password private. Do not use the regular Google account password, paste it into chat, or commit it. Google may not offer app passwords for some managed accounts, security configurations, or Advanced Protection accounts.

## Vercel Production setup

In the existing HANDA project, open **Settings → Environment Variables** and add/update these values for **Production**:

```dotenv
MAIL_PROVIDER=gmail
GMAIL_USER=handa.community@gmail.com
GMAIL_APP_PASSWORD=the_generated_16_character_app_password
```

Paste the real app password only into Vercel's secret value field. Display spaces in the generated password are removed automatically. The sender is always `HANDA <handa.community@gmail.com>`; `MAIL_FROM` and `RESEND_API_KEY` are ignored while `MAIL_PROVIDER=gmail`. There is no automatic fallback to Resend after Gmail errors.

Deploy the code that supports Gmail, or redeploy after changing environment variables if that code is already deployed. No database migration or seed is required. Existing users and verification status remain unchanged. Existing email/password accounts stay enabled when the Gmail settings are complete.

## Check delivery

Use **이메일 확인 메일 다시 받기** with the unverified account already created. Do not create duplicate accounts. Check the recipient's inbox and spam folder, then open the verification link and confirm sign-in works. Separately test password reset for an email/password account. Actual receipt and link completion must be verified after configuration; unit tests do not establish real delivery.

Gmail deliveries appear in Gmail, not Resend's dashboard. If sending fails, inspect the Vercel authentication request logs. Errors include the selected provider and a limited diagnostic code:

- `gmail: EAUTH`: check two-step verification, the app password, and the Gmail account. Password changes or revocation can invalidate app passwords.
- `gmail: ECONNECTION`, `ETIMEDOUT`, `ESOCKET`, or `ETLS`: check SMTP connectivity and TLS.
- `gmail: EENVELOPE` or `RECIPIENT_REJECTED`: the SMTP server rejected a recipient.

Do not share raw SMTP logs, passwords, or verification/reset links. Provider debug logging is disabled. A successful API request is not proof that the recipient received the email. Gmail applies sending limits and may block automated sending; use a verified domain and a transactional provider as usage grows.

## Local verification commands

In the local HANDA checkout:

```bash
npm ci
npm run test:mail
npm run test:auth
npm run build
```

Local development can use its own Gmail account/app password in `.env.local`; do not copy production credentials into Preview or Development. The automated tests mock email delivery and send no real mail.

## Switch to Resend later

Verify a domain in Resend, then set `MAIL_PROVIDER=resend`, `RESEND_API_KEY`, and `MAIL_FROM=HANDA <noreply@your-domain>` in Vercel Production and redeploy. Omitting `MAIL_PROVIDER` preserves the existing Resend configuration. Unknown providers and incomplete settings disable email authentication rather than using another provider silently.
