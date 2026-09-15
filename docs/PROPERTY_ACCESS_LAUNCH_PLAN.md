# Property Access Launch Plan

## Product decision

For the next build cycle, position AVIO as **property access for apartments and condos**. Digital business-card features can remain available, but they should not be the primary sales or investor story until the property pilot proves demand.

## Ordered execution plan

1. **Production payments:** connect one real merchant provider, retain all credentials in Firebase Secret Manager, and verify checkout, webhooks, refunds, invoices, and failed-payment recovery.
2. **Apple and Google Wallet:** set up the Apple PassKit signing certificate and Google Wallet issuer account; issue, update, and revoke passes only from the backend.
3. **One controller integration:** choose one door-controller vendor and implement/test NFC and QR validation through `propertyAccessApi`. Do not support multiple vendors until the first one is reliable.
4. **Deploy and verify:** deploy Firestore rules/indexes and Functions, then execute security, role, API, and lost-card recovery tests against the live project.
5. **Paid pilot:** onboard 2–5 properties with named decision-makers and written pilot terms. Start with a limited number of doors and residents.
6. **Investor evidence:** track active properties, active residents, MRR, credential activation, access success, lost-card blocking time, support tickets, and 30/60/90-day retention.

## Launch gate

Do not market this as production-ready property access until all of the first four steps pass and one pilot door has been used successfully in real conditions for at least 30 days.

## Investor gate

Do not lead a fundraising process solely on features. Lead only after paid pilot usage establishes a repeatable customer problem, a buyer, pricing, retention, and an expansion path from one property to many properties.
