LOVABLE TASK — Improve Flywheel Section + Proof-of-Genesis Flow Diagram

Goal

Make two targeted improvements to /investor/why-this-round:

1. Tighten and sharpen the Flywheel section (07).

2. Upgrade the Proof-of-Genesis flow diagram in the Technical Foundation section (03) to feel more premium, connected, and visually cohesive.

Scope

Only edit src/pages/InvestorWhyThisRound.tsx.

Part 1: Improve the Flywheel Section (Section 07)

Current issues:

- The 6-point numbered list below the diagram is repetitive and longer than necessary.

Changes:

- Keep the existing circular FlywheelDiagram.

- Replace the current 6-point list with a tighter, sharper 4-point version using the following points (refine wording slightly if needed for flow):

01. 100% of every monthly subscription goes directly into the Liquidity Pool.

02. More users = more capital flowing into the LP every month.

03. Stronger liquidity + real utility = better token price support and perception.

04. Better token economics + growing data revenue creates a self-reinforcing loop that can eventually cover operations.

Make the language concise and confident. Keep the same card + arrow styling as the current list.

Part 2: Upgrade the Proof-of-Genesis Flow Diagram

Current state: The four steps feel like separate cards rather than a connected process. The visual hierarchy and connections are weak.

Improvements needed:

- Make the 4 steps feel like a clear, connected journey rather than four isolated boxes.

- Improve visual hierarchy: Use a more prominent step number (e.g. larger circle or badge with border) and clear separation between the step number, title, and description.

- Strengthen the connecting elements between steps. On desktop, use clean horizontal connectors (subtle dashed line or thin gradient line). On mobile (where it stacks), add a faint vertical connector line between steps.

- Increase breathing room and spacing between the 4 steps, especially on mobile (390×844), so it doesn’t feel cramped.

- Keep the existing supporting sentence below the diagram:

  “This design removes traditional crypto onboarding friction entirely — users never need seed phrases, external wallets, or gas fees to mint.”

- Use only existing design tokens (border-border/60, bg-card/40, text-secondary, text-foreground, etc.). No new colors.

Constraints

- Only edit src/pages/InvestorWhyThisRound.tsx.

- Do not change the circular Flywheel diagram, the Use of Funds chart, the Two-Round timeline, or any other section text.

- No new dependencies.

Verification

- Preview /investor/why-this-round at desktop and 390×844.

- Confirm the Flywheel section is now tighter (4 clear points) with less repetition.

- Confirm the Proof-of-Genesis flow diagram feels more premium, connected, and well-spaced — especially on mobile.

- Confirm no layout breakage or visual issues were introduced elsewhere on the page.

After you finish, reply exactly with:

“Flywheel section tightened + Proof-of-Genesis flow diagram upgraded — /investor/why-this-round improvements complete.”