# The project brief — delivery

Submit on the "Start a project" form posts the brief to `/api/brief`
(`functions/api/brief.js`, a Pages Function). It is delivered two ways, in parallel:

1. **Email** to `hello@ffdev.studio` from `brief@ffdev.studio` through Resend (free plan:
   3,000/month, 100/day). Cloudflare Email Sending was the first choice but needs the paid
   Workers plan. Reply-To is the visitor, so replying answers them.
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
| `RESEND_API_KEY` | secret | Resend API key, **Sending access**, domain `ffdev.studio` |
| `BRIEF_TO` | optional | default `hello@ffdev.studio` |
| `BRIEF_FROM` | optional | default `brief@ffdev.studio` |
| `FFOPS_LEAD_URL` | optional | `https://ops.ffdev.studio/api/public/leads/lf_…` (FF Ops → Leads → Forms) |

One-time: `ffdev.studio` is added in Resend (account rikaidrawings) and verified by DNS records
in Cloudflare: DKIM `resend._domainkey` TXT, and MX + SPF TXT on `send.ffdev.studio` (the bounce
subdomain). Google Workspace's apex MX and SPF are untouched.

With nothing configured every Submit falls back to the email/WhatsApp buttons — the same
behaviour as before this function existed.

## Testing locally

```
npm run build
printf 'FFOPS_LEAD_URL=http://127.0.0.1:3250/api/public/leads/lf_demo_ffdevstudio_site\n' > .dev.vars
npx wrangler pages dev dist --port 8788
```

`.dev.vars` is git-ignored. Add `RESEND_API_KEY` there to send a real email.
