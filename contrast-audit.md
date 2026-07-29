# Color Contrast Audit

Generated programmatically with the WCAG relative-luminance formula.

Thresholds:

- Normal text: 4.5:1
- Large text: 3:1
- Icons, controls, borders, and focus indicators: 3:1

| Usage | Foreground | Background | Ratio | Minimum | Result |
|---|---:|---:|---:|---:|---|
| Primary text on paper | `#252C29` | `#F4F3EC` | 12.83:1 | 4.5:1 | Pass |
| Muted metadata on paper | `#5C6762` | `#F4F3EC` | 5.29:1 | 4.5:1 | Pass |
| Protocol links and labels on paper | `#2F55B7` | `#F4F3EC` | 6.08:1 | 4.5:1 | Pass |
| Protocol links and labels on white | `#2F55B7` | `#FBFBF8` | 6.53:1 | 4.5:1 | Pass |
| Protocol labels on graph background | `#2F55B7` | `#E8ECE7` | 5.66:1 | 4.5:1 | Pass |
| Bright protocol links on ink | `#9BB0FF` | `#111816` | 8.62:1 | 4.5:1 | Pass |
| Bright protocol links on community ink | `#9BB0FF` | `#17201D` | 7.97:1 | 4.5:1 | Pass |
| Warm-white navigation text on ink | `#C5CDC9` | `#111816` | 11.11:1 | 4.5:1 | Pass |
| Project body text on project ink | `#C0C9C4` | `#151E1B` | 10.05:1 | 4.5:1 | Pass |
| Project secondary text on project ink | `#AEB9B3` | `#151E1B` | 8.42:1 | 4.5:1 | Pass |
| Community metadata on community ink | `#9CA8A2` | `#17201D` | 6.77:1 | 4.5:1 | Pass |
| Footer metadata on footer ink | `#AAB4AF` | `#0B100F` | 9.00:1 | 4.5:1 | Pass |
| Chartreuse active state on ink | `#C8FF3D` | `#111816` | 15.29:1 | 3.0:1 | Pass |
| Ink text on chartreuse buttons and contact section | `#111816` | `#C8FF3D` | 15.29:1 | 4.5:1 | Pass |
| Recommendation quote on white | `#252C29` | `#FBFBF8` | 13.77:1 | 4.5:1 | Pass |
| Light structural border on paper | `#7D8882` | `#F4F3EC` | 3.30:1 | 3.0:1 | Pass |
| Dark structural border on ink | `#676B67` | `#111816` | 3.32:1 | 3.0:1 | Pass |
| Light-surface keyboard focus | `#754500` | `#F4F3EC` | 7.24:1 | 3.0:1 | Pass |
| Dark-surface keyboard focus | `#FFBF3F` | `#111816` | 10.96:1 | 3.0:1 | Pass |
| Monochrome rail logos on ink | `#F4F3EC` | `#18211E` | 14.80:1 | 3.0:1 | Pass |

## Deliberately excluded combinations

- **Chartreuse as text or control on paper:** `#C8FF3D` on `#F4F3EC` is 1.06:1. Insufficient contrast. Chartreuse is prohibited here and reserved for ink backgrounds or as a background with ink text.

## State and link treatment

- Links use text plus an icon, movement, or underline/current-state marker; color is not the only signal.
- Keyboard focus uses a three-pixel outline with separate light-surface and dark-surface tokens.
- Hover and active states preserve the same text colors and add structural changes.
- There are no disabled interactive controls in the initial portfolio.
- Organization logos use warm-white monochrome artwork on Ink by default and reveal color on hover or keyboard focus.

Audit result: **PASS** (20/20 approved pairs pass).
