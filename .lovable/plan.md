## Remove "Download Deck + One-Pager (PDF)" button from /investor

### Why
The button on `/investor` (between the live counter and the "Why now" section) downloads the seed-ask PDFs without requiring NDA signature — anyone past the PIN gate can grab them. Removing the button closes that pre-NDA path.

### Change
**`src/pages/Investor.tsx`**
- Delete the button block (the `<div className="mx-auto max-w-3xl px-5 mb-10">…</div>` wrapping the `Download Deck + One-Pager (PDF)` Button, lines ~282–292).
- Delete the now-unused `downloadDeckCombo` handler (lines ~110–126).
- Remove the `Download` lucide import if no other usage remains in the file.

Nothing else on the page changes. NDA-gated download flows elsewhere (post-signature) are untouched.

### Caveat worth flagging (not in this change)
The PDFs themselves still live at public static URLs (`/founder-docs/seed-ask-lyndon-v8.1final.pdf` and `v8final.pdf`) and remain directly fetchable by anyone who knows the URL. Removing the button hides the entry point, but doesn't truly gate the files. A real fix requires moving them to a private bucket + signed-URL edge function after NDA signature. Let me know if you want that as a follow-up plan.

### Verify
- Load `/investor` after PIN unlock → the green-outlined "Download Deck + One-Pager (PDF)" button is gone; layout flows from the live counter straight into "Why now".
- No TypeScript errors from the removed handler/import.