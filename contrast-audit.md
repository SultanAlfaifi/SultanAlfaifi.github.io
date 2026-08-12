# Color Contrast Audit

Generated programmatically with the WCAG relative-luminance formula.

Thresholds:

- Normal text: 4.5:1
- Large text: 3:1
- Icons, controls, borders, and focus indicators: 3:1

| Usage | Foreground | Background | Ratio | Minimum | Result |
|---|---:|---:|---:|---:|---|
| Primary text on blush paper | `#131515` | `#FFFAFB` | 17.73:1 | 4.5:1 | Pass |
| Secondary text on blush paper | `#2B2C28` | `#FFFAFB` | 13.60:1 | 4.5:1 | Pass |
| Blush text on ink | `#FFFAFB` | `#131515` | 17.73:1 | 4.5:1 | Pass |
| Blush text on charcoal | `#FFFAFB` | `#2B2C28` | 13.60:1 | 4.5:1 | Pass |
| Ink text on mint controls | `#131515` | `#7DE2D1` | 11.93:1 | 4.5:1 | Pass |
| Mint labels on ink | `#7DE2D1` | `#131515` | 11.93:1 | 4.5:1 | Pass |
| Ink text on teal surfaces | `#131515` | `#339989` | 5.29:1 | 4.5:1 | Pass |
| Teal focus ring on blush paper | `#339989` | `#FFFAFB` | 3.35:1 | 3.0:1 | Pass |
| Mint focus ring on ink | `#7DE2D1` | `#131515` | 11.93:1 | 3.0:1 | Pass |
| Charcoal structural controls on mint | `#2B2C28` | `#7DE2D1` | 9.15:1 | 3.0:1 | Pass |

## Deliberately excluded combinations

- **Mint as small text on blush paper:** `#7DE2D1` on `#FFFAFB` is 1.49:1. Insufficient contrast. Mint is reserved for dark surfaces, large decorative type, or backgrounds with ink text.

## State and link treatment

- Links use text plus an icon, movement, or underline/current-state marker; color is not the only signal.
- Keyboard focus uses a three-pixel outline with separate light-surface and dark-surface tokens.
- Hover and active states preserve the same text colors and add structural changes.
- There are no disabled interactive controls in the initial portfolio.
- Organization logos use warm-white monochrome artwork on Ink by default and reveal color on hover or keyboard focus.

Audit result: **PASS** (10/10 approved pairs pass).
