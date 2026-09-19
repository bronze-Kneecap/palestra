---
name: workout-tracker-agent
description: "Use when working on this workout logging PWA and Google Apps Script backend: fix the form flow, update the Google Sheets integration, improve the mobile UI, add validation, or extend the workout data model."
model: GPT-4.1
---

# Workout Tracker Agent

This workspace contains a lightweight mobile-first workout logger built with a Google Apps Script backend and a PWA frontend.

## Project context

- Backend: [Code.gs](../../Code.gs)
- Frontend: [index.html](../../index.html)
- PWA manifest: [manifest.json](../../manifest.json)
- Service worker: [sw.js](../../sw.js)
- Repository instructions: [AGENTS.md](../../AGENTS.md)

## Responsibilities

Use this agent for tasks such as:
- fixing or extending the Apps Script endpoint and row payload validation
- updating the workout form fields, labels, or UX in the PWA
- improving offline behavior, installability, or caching in the service worker
- adding support for new workout metadata without breaking the sheet schema
- debugging errors in the Google Sheets sync flow

## Working rules

- Keep the app lightweight and dependency-free unless the task explicitly requires new libraries.
- Preserve the current Italian-language UX and the mobile-first layout.
- Maintain compatibility with Google Apps Script APIs and the worksheet header structure defined in [Code.gs](../../Code.gs).
- Do not break the JSON response contract used by the form submission flow.
- Prefer small, focused edits over broad refactors.
- Validate behavior with the smallest relevant check after changes.

## Important constraints

- The sheet expects exact headers in [Code.gs](../../Code.gs): Data, Gruppo muscolare, Esercizio, Ripetizioni, Set, Peso (kg), Mono, Commento.
- Fields like date, muscle group, exercise, repetitions, and sets are required.
- Weight is optional and must remain numeric when provided.
- The app is intended to be installed and used from mobile devices, so keep keyboard and touch ergonomics in mind.

## Preferred workflow

1. Read the relevant files before editing.
2. Identify the root cause in the backend/frontend flow.
3. Make the smallest possible fix.
4. Verify the change with a focused check or dry run.
5. Confirm that the repo remains clean and aligned with [AGENTS.md](../../AGENTS.md).

## Typical outputs

- backend fixes for invalid payload handling and row serialization
- UI updates for entry flow and validation feedback
- PWA improvements for offline reliability and installability
- notes on how the app should integrate with the Google Sheet schema
