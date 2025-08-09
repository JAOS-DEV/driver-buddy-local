Premium rollout plan (Stripe + Firebase Extension)

Context
- Current: Feature gating in app implemented (cloud writes, tax/NI, multiple rates, CSV, pay history limit 30). Admin panel live, roles update in real-time. One-time cloud recovery for downgraded users.
- Goal: Add paid Premium with Stripe; keep costs down until testing is done.

1) Prerequisites (no code changes)
- Create a Stripe account (test mode).
- In Stripe: create a Product "Driver Buddy Premium" and a Price (recurring monthly or annual). Note the priceId.
- Ensure Firebase project billing tier supports the extension (Blaze required for live; can test in emulator/test mode first).

2) Install Firebase Extension: Run payments with Stripe (firestore-stripe-payments)
- In Firebase Console → Extensions → Install "Run payments with Stripe".
- Connect Stripe; enable Checkout Sessions and Billing Portal.
- Firestore locations (defaults):
  - stripe_customers/{uid}/checkout_sessions/{auto}
  - stripe_customers/{uid}/subscriptions/{auto}
- (Optional) Enable Custom Claims: set a claim (e.g., { premium: true }) on active subscription.
- Set allowed redirect URLs (local dev and production site) for Checkout/Portal.

3) App wiring (client)
- Add `services/stripe.ts` with two functions:
  - startCheckout(priceId: string): calls ext callable to create checkout session and redirects `window.location` to session URL.
  - openBillingPortal(): calls ext callable to get portal URL and redirects.
- UpgradeModal: replace "Contact admin" CTA with a button that triggers `startCheckout(PRICE_ID)`.
- Settings → Account (if premium): show a "Manage subscription" button that calls `openBillingPortal()`.
- Keep `PRICE_ID` in a config/env: `VITE_STRIPE_PRICE_ID` (fallback to window.__CONFIG__ for GH Pages if needed).

4) Role sync options (pick one)
A) Use extension’s Custom Claims only
- Rules check `request.auth.token.premium == true` (and `admin` for admins).
- UI reads claims (via `onIdTokenChanged` + `getIdTokenResult`) and maps to `userProfile.role` in memory only.

B) Mirror to Firestore profile (recommended for current UI)
- Create a minimal Cloud Function (http or onCreate/Update subscription) to:
  - Set `users/{uid}/profile/user.role = "premium"` when subscription is active.
  - Optionally set `premiumUntil` based on Stripe period_end.
  - Remove premium when cancelled/expired.
- Optionally also set custom claims for rules.

5) Security rules tightening (later)
- Switch admin/premium checks to Custom Claims for stronger enforcement (still keep profile for UI).
- Keep admin read/write allowances; maintain read-only for free users beyond their own docs.

6) UX polish
- Add Upgrade entry points where gating happens (already using modal).
- Show remaining free quota badge (e.g., Pay history: `used/30`).
- Add a single "Upgrade" section in Settings → Account with plan summary and CTA.

7) QA test plan
- Free user: gating visible; one-time cloud recovery enabled if applicable; CSV disabled; rates capped; Save Pay blocks >30 and opens modal.
- Premium user: all features unlocked; cloud sync ON works; CSV, tax/NI, multiple rates work.
- Downgrade: premium → free auto-normalizes (tax/NI off, rates trimmed to 1, cloud local) and one-time recovery remains available if cloud data exists.
- Admin: admin tab visible; can update roles.
- Mobile Safari (iPhone): confirm profile role live-updates and nav works.

8) Cost controls / safety
- Keep Stripe in test mode until ready.
- Use emulators where possible.
- Delay Blaze until Stripe extension is verified.
- Add simple alerts/guards if extension callables fail (network/offline).

9) Backlog / Nice-to-haves
- Proper Admin icon later (if we ever use icons again).
- Analytics on Upgrade CTA opens and conversions.
- Email notifications on role changes (admin log).
- Grace period handling using `premiumUntil` and scheduled function to clean up.

Config to collect when ready
- VITE_STRIPE_PRICE_ID=price_XXXXXXXXXXXXXXXX
- Allowed redirect URLs for Stripe (dev + prod)

Owner notes
- No code changes are required now; this file is the execution checklist.
