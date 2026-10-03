# The project brief — delivery

Submit on the "Start a project" form posts the brief to `/api/brief`
(`functions/api/brief.js`, a Pages Function). It is delivered two ways, in parallel:

1. **Email** to `hello@ffdev.studio` from `brief@ffdev.studio` through Cloudflare Email Sending
   (REST API; Pages Functions have no `send_email` binding). Reply-To is the visitor, so replying
   answers them.
2. **FF Ops lead** (source WEBSITE) through FF Ops' public lead-form endpoint, when
   `FFOPS_LEAD_URL` is set.

Either landing counts as delivered: the visitor sees "Nice one! Your brief is in." If neither
lands (or the request fails or times out after 15 s), they see "One more tap." with the old
Send by email / Send on WhatsApp buttons, so a brief is never lost silently.

Guards: same-origin only (403 otherwise), server-side validation mirrors the form (422 with
field messages), hidden `_gotcha` honeypot, field length caps. The function never logs what the
visitor wrote — only which channel failed and the HTTP status.

## Settings (Pages project `ffdevstudio` → Settings → Variables and Secrets)

| Name | Kind | Value |
|---|---|---|
| `CF_ACCOUNT_ID` | variable | FF's Cloudflare account id |
| `CF_EMAIL_TOKEN` | secret | API token, permission **Email Sending: Edit** (account) |
| `BRIEF_TO` | optional | default `hello@ffdev.studio` |
| `BRIEF_FROM` | optional | default `brief@ffdev.studio` |
| `FFOPS_LEAD_URL` | optional | `https://ops.ffdev.studio/api/public/leads/lf_…` (FF Ops → Leads → Forms) |

One-time: onboard `ffdev.studio` in Cloudflare → Email Service → Email Sending (adds the
sending SPF/DKIM records; Google Workspace MX and SPF stay as they are).

With nothing configured every Submit falls back to the email/WhatsApp buttons — the same
behaviour as before this function existed.

## Testing locally

```
npm run build
printf 'FFOPS_LEAD_URL=http://127.0.0.1:3250/api/public/leads/lf_demo_ffdevstudio_site\n' > .dev.vars
npx wrangler pages dev dist --port 8788
```

`.dev.vars` is git-ignored. Add `CF_ACCOUNT_ID` / `CF_EMAIL_TOKEN` there to send a real email.
