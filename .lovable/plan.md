

# Add Multiple-Choice (Yes/No) Questions to YC Application Page

## What Changes

Add visual Yes/No radio-button style indicators to the YC application page for 5 questions, matching the actual YC application format shown in the screenshots.

## Questions and Selected Answers

| Question | Answer | Current Status |
|----------|--------|---------------|
| Are people using your product? | **Yes** | Missing entirely - needs to be added to the `progress` section in DB |
| Do you have revenue? | **No** | Exists as text in `progress` section but no radio indicator |
| Have you formed ANY legal entity yet? | **No** | Exists as text in `equity` section but no radio indicator |
| Have you taken any investment yet? | **No** | Exists as text in `equity` section but no radio indicator |
| Are you currently fundraising? | **No** | Exists as text in `equity` section but no radio indicator |

## Implementation

### 1. Database Update
- Add a new question `people_using_product` to the `progress` section with answer "Yes" and a `choice` field set to `"yes"`
- Add a `choice` field (`"yes"` or `"no"`) to the existing questions: `revenue`, `legal_entity`, `investment`, `fundraising` in their respective sections so the UI knows which radio to highlight

### 2. New UI Component: `YCChoiceQuestion`
- Create a small component that renders a question with Yes/No radio buttons (read-only display, matching the YC screenshot style)
- Shows the selected choice visually with filled/unfilled radio indicators
- Displays the existing text answer below the radio selection as supporting detail
- Admin users can toggle the choice by clicking

### 3. Update `AdminYCApplication.tsx`
- In `GenericSection`, detect questions that have a `choice` field and render them using the new `YCChoiceQuestion` component instead of the standard `EditableYCCard`
- The radio buttons are primarily visual indicators (not interactive for public view), showing which option was selected

## Visual Design
- Each choice question renders with the question text in bold
- Two radio circles: filled for selected, empty for unselected, labeled "Yes" and "No"
- The existing detailed text answer appears below in the standard card format
- Matches the clean, minimal style from the YC screenshots

## Technical Details

### Database Changes (content JSONB updates only, no schema changes)

**Progress section** - Add new entry:
```json
"people_using_product": {
  "question": "Are people using your product?",
  "answer": "Yes. 19 active beta users on testnet connecting real devices.",
  "status": "ready",
  "choice": "yes"
}
```

**Progress section** - Update `revenue` to add choice field:
```json
"choice": "no"
```

**Equity section** - Update `legal_entity`, `investment`, `fundraising` to add choice field:
```json
"choice": "no"
```

### New Component: `src/components/admin/YCChoiceQuestion.tsx`
- Renders the Yes/No radio button display
- Props: question, answer, choice ("yes"|"no"), isEditable, onChoiceChange, onSave
- Uses existing RadioGroup from radix UI for consistent styling

### Modified File: `src/pages/AdminYCApplication.tsx`
- Import `YCChoiceQuestion`
- In `GenericSection`, check if a question entry has a `choice` property
- If so, render `YCChoiceQuestion` instead of `EditableYCCard`

