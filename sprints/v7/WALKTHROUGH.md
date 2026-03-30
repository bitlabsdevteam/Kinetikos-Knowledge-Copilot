# Sprint v7 Walkthrough

## Goal
Validate Japanese localization baseline and language steering from UI to Dify.

## Steps
1. Run app: `npm run dev`
2. Open: `/app?dev_auth_bypass=1`
3. Input Japanese text (`日本語で答えてください`) and send with Ctrl/Cmd+Enter.
4. Confirm request payload includes `desiredLanguage: "ja"`.
5. Confirm backend forwards `preferred_language` to Dify.
6. Confirm JA-oriented UI copy appears where localized.

## Validation Commands
```bash
npm run build
npx playwright test tests/e2e/v7-language-localization.spec.ts
```

## Notes
- Fallback behavior: if `desiredLanguage` missing, backend auto-detects from message text.
- Admin-only controls remain hidden for normal users.
