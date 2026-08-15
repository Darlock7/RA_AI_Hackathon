# TechConnect Context Copilot

**[Open the credential-free live demo](https://darlock7.github.io/RA_AI_Hackathon/)**

Customer-focused support-call concept for Rockwell Automation TechConnect. The interface combines natural-language intake, installed-asset context, grounded troubleshooting, human review, and organizational learning.

## Three-minute engineering review

```sh
npm install
npm run demo
```

Open the printed local URL, select **Demo lab**, choose a scenario, and select **Run guided demo**. This credential-free path exercises context extraction, next-best-question selection, safety gating, diagnostic hypotheses, and the prepared engineer handoff. Twilio is optional.

Available repeatable scenarios cover a power event, firmware update, project download, and an unconfirmed safety state. You can also type customer responses to inspect how the workflow adapts.

## Real phone demo

The demo can place a real outbound call to a verified phone through Twilio. The voice flow listens to the caller, follows a repeatable four-answer support scenario, and streams the resulting transcript into the Live Assist screen.

1. Create a Twilio trial account and verify the phone that will receive the demo call.
2. Copy `.env.example` to `.env` and add the Twilio values and verified destination number.
3. Start a public HTTPS tunnel to port `8787` and set `PUBLIC_BASE_URL` to that tunnel URL.
4. Run the voice server with `npm run dev:voice`.
5. In another terminal, run the interface with `npm run dev`.
6. Open the interface and select **Call my phone**.

The receiving phone and Twilio credentials remain in `.env`, which is excluded from Git. A Twilio trial only calls verified destination numbers. The in-memory transcript resets whenever the voice server restarts.

## Prebuilt conversation

The editable one-minute call script is in `server/demo-script.mjs`. It covers:

- A customer-centered opening and downtime description
- Installed-asset confirmation and controller fault capture
- Identification of a power, firmware, or download trigger
- A mandatory machine-safety confirmation
- Priority-one routing with a prepared transcript for the support engineer

The demo intentionally does not tell a caller to reset equipment or change controller modes. Those actions remain behind engineer review.

## Development

```sh
npm install
npm run dev
```

Validate the production client build with `npm run build`.

An AI-enabled support-call orchestration concept for the Rockwell Automation SHPE AI Hackathon simulation round.

The MVP demonstrates how Rockwell could connect natural-language call intake, entitlement and installed-base context, evidence-grounded troubleshooting, human approval, structured case creation, and organization-wide support intelligence.

## Run locally

```bash
npm install
npm run dev
```

Then open the local URL printed by Vite.

## Build

```bash
npm run build
```

## Demo scope

- Synthetic customer and asset data only
- Simulated live call and transcription
- Natural-language product and urgency detection
- Evidence-backed recommendations with confidence and citations
- Human approval before customer guidance
- Structured case preparation
- Organizational support insights

This is a simulation-ready UX prototype, not a production support or control system. It does not connect to Rockwell Automation systems or operate industrial equipment.
