# Demo tools design QA

- Source visual truth: user-attached desktop screenshot in the current request, showing the gear trigger and open demo-tools panel.
- Implementation screenshots:
  - `audit/demo-controls/desktop-open.png`
  - `audit/demo-controls/mobile-open.png`
- Desktop viewport: 1440 × 900 CSS px, DPR 1.
- Mobile viewport: 402 × 874 CSS px, DPR 1.
- State: demo build login screen after splash, demo-tools panel open, `demo-judge-02` selected.

## Full-view comparison evidence

The desktop implementation reproduces the reference composition: a circular settings trigger fixed at the upper-right, a wide white panel below it, a title and yellow current-account badge, a full-width account input row, gray pill controls, and separate login, seed, and time/batch groups. The Mildang screen remains visible behind the non-modal panel. The mobile capture confirms that the same controls fit within the app viewport and remain scrollable without hiding the persistent login action.

## Focused comparison evidence

- Fonts and typography: existing Pretendard variable font is used throughout; headings, muted labels, and bold pill labels follow the reference hierarchy.
- Spacing and layout rhythm: desktop panel uses 12 px outer clearance, 24 px inner padding, 24 px section spacing, and 10 px pill gaps. Mobile reduces outer and inner spacing while preserving group separation.
- Colors and visual tokens: white panel, `#f3f3f3` neutral controls, `#ffd900` active account state, and `#212121` primary text match the existing Mildang palette and the reference.
- Image quality and asset fidelity: the trigger uses the official vector Material Design settings icon, not a text glyph or CSS approximation.
- Copy and content: account login, all five §14.5 judge accounts, seven §14.6 seed scenarios, and the time/batch recovery actions are explicitly labeled.

## Interaction evidence

- Gear opens and closes the panel; Escape also closes it.
- Custom account `demo-user-1` completed mock authentication and navigated to the period selection screen.
- `심사위원2 · 4일차` completed authentication, called `DAY4_ACTIVE`, and navigated to the day-4 dashboard.
- The selected account is persisted in the URL as `?demoAccount=...`.
- Seed and time/batch controls stay disabled before authentication and enable afterward.
- Keyboard focus styles are present for the trigger, form controls, and action buttons.
- Browser console and page errors: none.
- `npm.cmd run lint`: passed.
- `npm.cmd run build:demo`: passed.

## Findings

- P0: none.
- P1: none.
- P2: none.
- P3: the implementation exposes all five specification-defined judge accounts, while the visual reference showed only three shortcuts. This is an intentional completeness improvement.

## Comparison history

- Initial implementation passed without P0/P1/P2 fixes. The panel width was aligned to the reference before the final capture by expanding it from a capped desktop width to the viewport width with 12 px clearance.

final result: passed
