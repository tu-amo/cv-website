# ADR-009: WhatsApp and Google Calendar as OS-Handled Deep Links

## Status
Accepted

## Date
2026-04-03

## Context

The Living Cookbook includes two social/utility sharing features:

1. **WhatsApp market list share** — allows a user to send their shopping list to a WhatsApp contact or group
2. **Google Calendar meal plan event** — allows a user to create a calendar event for a planned meal

Both features involve third-party platforms. The question this ADR addresses is: **does the Living Cookbook server contact these platforms, or does it delegate entirely to the user's device?**

This distinction has significant implications for:
- **Security** — does personal data leave the Living Cookbook server to a third party?
- **Privacy / GDPR** — does the server act as a data processor for WhatsApp or Google?
- **Architectural complexity** — does the feature require API credentials, OAuth tokens, or webhook infrastructure?
- **Reliability** — does the feature depend on a third-party API's availability?

**Options considered for WhatsApp:**

| Option | Server involvement | Data shared from server |
|---|---|---|
| A — WhatsApp Business API (via Twilio or Meta directly) | High — server sends the message | Shopping list content sent to Meta/Twilio servers |
| B — `wa.me` deep link — OS opens WhatsApp with pre-filled text | None — server only formats a URL | No data leaves the server; WhatsApp sees only what the user sends |

**Options considered for Google Calendar:**

| Option | Server involvement | Data shared from server |
|---|---|---|
| A — Google Calendar API with OAuth 2.0 | High — server creates the event | Meal data + user's calendar credentials handled server-side |
| B — `www.google.com/calendar/render` URL with query params | None — browser opens Google Calendar with pre-filled form | No data leaves the server; Google sees only what the user submits |

## Decision

Both features are implemented exclusively as **client-side deep links**. The Living Cookbook server generates a formatted URL; the user's operating system or browser opens the target application with pre-populated content.

**WhatsApp share** (`src/app/shopping/page.js`):
```js
// Formats the shopping list as plain text, encodes it into a wa.me URL
const url = `https://wa.me/?text=${encodeURIComponent(header + items + footer)}`;
window.open(url, '_blank');
// The server never contacts WhatsApp. The user's device opens WhatsApp.
```

**Google Calendar** (`src/app/recipe/[id]/page.js`, `src/app/public/recipe/[id]/PublicRecipeClient.js`):
```js
// Formats the meal event into a Google Calendar event URL
const gcalUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&dates=${dates}`;
window.open(gcalUrl, '_blank');
// The server never contacts Google Calendar. The browser opens the Google Calendar UI.
```

In both cases:
- The URL is constructed **client-side** (in the browser), not server-side
- No API keys, OAuth tokens, or server-to-server calls are involved
- The third-party platform (WhatsApp, Google) receives data only after the **user explicitly acts** — opening the app and sending/saving

## Rationale

1. **No server-side data sharing** — personal data (shopping list contents, meal plans) never leaves the Living Cookbook server boundary to a third-party platform through an automated channel. The user is always the agent who initiates the transfer.
2. **GDPR simplification** — the Living Cookbook server is not a data processor for WhatsApp or Google in this model. The user directly submits their own data to those platforms. No data processing agreement with Meta or Google is required for this pattern.
3. **No credential management** — WhatsApp Business API and Google Calendar API both require OAuth flows, API keys, and ongoing token refresh. Deep links require none of this.
4. **Zero availability dependency** — the feature works regardless of whether WhatsApp's or Google's API is up; it merely opens a URL in the user's browser.
5. **No delivery confirmation needed** — the sharing use case only requires that the user be given a convenient starting point; confirmation that the message was sent or the event was created is the user's responsibility.

## Trade-offs Accepted

- **No server-side analytics on shares** — the server cannot know whether a user successfully shared their list or created an event; only that they clicked the button
- **Device dependency** — `wa.me` links work on mobile and desktop with WhatsApp installed; users without WhatsApp installed see an error. The feature gracefully degrades (the link simply doesn't open an app).
- **Pre-fill is not guaranteed** — Google Calendar's event pre-fill via the `www.google.com/calendar/render` URL is not a documented stable API; Google could change the parameter names without notice. The feature will degrade silently (calendar opens without pre-filled data) rather than error.
- **No programmatic message delivery** — the server cannot proactively send a WhatsApp message to a user (e.g. "Your grocery delivery reminder"). If that use case arises in the Pro Kitchen tier, WhatsApp Business API integration would need to be introduced as a separate decision.

## Consequences

- **Positive**: Zero credentials to manage, zero server-to-server data sharing, GDPR-clean, no availability dependency on third-party APIs, no usage costs.
- **Negative**: No analytics on share behaviour; no guaranteed pre-fill on Google Calendar; no proactive/push messaging capability.
- **Mitigation**:
  - Add a client-side event log (e.g. `analytics.track('shopping_list_shared', { method: 'whatsapp' })`) for share behaviour tracking without server involvement
  - Smoke-test the Google Calendar URL parameters periodically — open a recipe, click the calendar button, and confirm the event pre-fills correctly

## Security Property — Explicit Statement

> **The Living Cookbook server never contacts WhatsApp, Google Calendar, or any social/messaging platform on behalf of the user.** Data flows from the server to the user's browser, and from the user's device to the third-party platform, only by explicit user action.

This property must be preserved as new sharing features are added. Any feature that requires the **server** to contact a messaging or social platform on the user's behalf represents a meaningful privacy boundary crossing and must be documented in a new ADR, including a GDPR assessment.

## Revisit Trigger

Reconsider when:
- The Pro Kitchen tier requires proactive staff notifications via WhatsApp — this would require WhatsApp Business API and a separate privacy/GDPR assessment
- A "remind me to cook this" push notification feature is requested — this would require a notification service (RE-01 Context Model: Email / Notification Service 🔲 Future)
- Google deprecates the `www.google.com/calendar/render` URL scheme — at that point evaluate whether to drop the feature or implement OAuth-based calendar integration

## Related Decisions

- [RE-01 Context Model](RE-01_Context_Model.md) — Documents WhatsApp and Google Calendar as explicitly outside the system boundary
- [ADR-001](ADR-001-shared-database.md) — Monolith-first strategy; adding third-party API integrations would expand the system boundary and require revisiting this decision
