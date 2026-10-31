# Color Contrast Audit

Generated programmatically with the WCAG relative-luminance formula.

Thresholds:

- Normal text: 4.5:1
- Large text: 3:1
- Icons, controls, borders, and focus indicators: 3:1

| Usage | Foreground | Background | Ratio | Minimum | Result |
|---|---:|---:|---:|---:|---|
| Primary text (--li-ink) on the ground | `#F4F2EE` | `#030304` | 18.44:1 | 4.5:1 | Pass |
| Body text (the older --text) on the ground | `#D6D3CE` | `#030304` | 13.81:1 | 4.5:1 | Pass |
| Secondary text (--li-ink-2) on the ground | `#B1AFAB` | `#030304` | 9.41:1 | 4.5:1 | Pass |
| Secondary text (--li-ink-2) on raised glass (--li-bg-3) | `#B1AFAB` | `#131318` | 8.46:1 | 4.5:1 | Pass |
| Quiet captions (--li-ink-3) on the ground | `#8C8A87` | `#030304` | 5.99:1 | 4.5:1 | Pass |
| Quiet captions (--li-ink-3) on raised glass (--li-bg-3) | `#8C8A87` | `#131318` | 5.38:1 | 4.5:1 | Pass |
| Primary text on raised glass (--li-bg-3) | `#F4F2EE` | `#131318` | 16.56:1 | 4.5:1 | Pass |
| Body text on a raised card (--li-bg-2) | `#D6D3CE` | `#0C0C11` | 13.07:1 | 4.5:1 | Pass |
| Dark text (--li-on-light) on the off-white primary button | `#050507` | `#F4F2EE` | 18.21:1 | 4.5:1 | Pass |
| Dark text (--li-on-light) on the hovered primary button | `#050507` | `#FFFFFF` | 20.36:1 | 4.5:1 | Pass |
| Glacier tint labels and links on the ground | `#9FE3FF` | `#030304` | 14.63:1 | 4.5:1 | Pass |
| Glacier tint labels on raised glass | `#9FE3FF` | `#131318` | 13.14:1 | 4.5:1 | Pass |
| Dark text on glacier tint controls | `#050507` | `#9FE3FF` | 14.45:1 | 4.5:1 | Pass |
| Apricot tint gate phrase and asks text on the ground | `#FFD3A8` | `#030304` | 14.86:1 | 4.5:1 | Pass |
| Dark text on the apricot tint Approve button | `#050507` | `#FFD3A8` | 14.68:1 | 4.5:1 | Pass |
| Iris tint data labels on the ground | `#C9BEFF` | `#030304` | 12.07:1 | 4.5:1 | Pass |
| Iris tint data labels on raised glass | `#C9BEFF` | `#131318` | 10.84:1 | 4.5:1 | Pass |
| Rose tint labels on the ground | `#FFB3C8` | `#030304` | 12.30:1 | 4.5:1 | Pass |
| Apricot warnings on the ground | `#FFB46A` | `#030304` | 11.77:1 | 4.5:1 | Pass |
| AI section: the orb's state word (--li-ink-2) on its 80% ground pill, worst case over white light | `#B1AFAB` | `#353535` | 5.60:1 | 4.5:1 | Pass |
| AI section: console warnings (apricot tint) on the raised console glass | `#FFD3A8` | `#0A0A0D` | 14.25:1 | 4.5:1 | Pass |
| AI section: aurora principle numerals at their darkest stop (iris) on the ground | `#8F6BFF` | `#030304` | 5.61:1 | 4.5:1 | Pass |
| Aurora display text (the lead achievement, the band's accent words) at its darkest stop (iris) on the ground | `#8F6BFF` | `#030304` | 5.61:1 | 3.0:1 | Pass |
| Aurora display text at its darkest stop (iris) on the lead achievement's raised glass (--li-bg-3) | `#8F6BFF` | `#131318` | 5.04:1 | 3.0:1 | Pass |
| Focus ring (--li-focus) on the ground | `#9CC9FF` | `#030304` | 11.99:1 | 3.0:1 | Pass |
| Focus ring (--li-focus) on raised glass | `#9CC9FF` | `#131318` | 10.77:1 | 3.0:1 | Pass |
| Checkpoint lamp: asks (apricot) on the ground | `#FFB46A` | `#030304` | 11.77:1 | 3.0:1 | Pass |
| Checkpoint lamp: verifies (glacier) on the ground | `#47C8F5` | `#030304` | 10.65:1 | 3.0:1 | Pass |
| Checkpoint lamp: holds (rose) on the ground | `#FF5C8D` | `#030304` | 7.04:1 | 3.0:1 | Pass |
| Checkpoint line: bound (ink 85%) on the ground | `#D0CECA` | `#030304` | 13.12:1 | 3.0:1 | Pass |
| Iris accents on the ground | `#8F6BFF` | `#030304` | 5.61:1 | 3.0:1 | Pass |
| Showcase: the bottom of the numeral gradient (#a3a19d) on the ground | `#A3A19D` | `#030304` | 7.99:1 | 3.0:1 | Pass |
| Showcase: rose tint (rejected stamp, wrong day) on a rejected page (rose 10% over a raised card) | `#FFB3C8` | `#241419` | 10.54:1 | 4.5:1 | Pass |
| Showcase: secondary text on a rejected page | `#B1AFAB` | `#241419` | 8.06:1 | 4.5:1 | Pass |
| Showcase: apricot tint on the seeded-fault tag (apricot 7% over a raised card) | `#FFD3A8` | `#1D1814` | 12.69:1 | 4.5:1 | Pass |
| Showcase: frost tile number (WAREVA) on the ground | `#E8F6FF` | `#030304` | 18.71:1 | 4.5:1 | Pass |
| Showcase: glacier label for a verifying stop on the case sheet | `#47C8F5` | `#121217` | 9.65:1 | 4.5:1 | Pass |
| Showcase: rose label for a holding stop on the case sheet | `#FF5C8D` | `#121217` | 6.37:1 | 4.5:1 | Pass |
| Showcase: apricot label for an asking stop on the case sheet | `#FFB46A` | `#121217` | 10.66:1 | 4.5:1 | Pass |
| Showcase: quiet captions (--li-ink-3) on a figure cell (#0b0b0e) | `#8C8A87` | `#0B0B0E` | 5.71:1 | 4.5:1 | Pass |
| Showcase: dark text on the off-white PDF chip and primary links | `#050507` | `#F4F2EE` | 18.21:1 | 4.5:1 | Pass |

## Deliberately excluded combinations

- **Off-white text on a glacier fill:** `#F4F2EE` on `#47C8F5` is 1.73:1. Insufficient contrast. Fills in the living light carry dark text (--li-on-light), never off-white.
- **Off-white text on an apricot fill:** `#F4F2EE` on `#FFB46A` is 1.57:1. Insufficient contrast. The asks colour is a lamp or a fill behind dark text.
- **Decorative ink (--li-ink-4) as text:** `#4C4B49` on `#030304` is 2.37:1. Insufficient contrast. --li-ink-4 is for hairlines and inactive dots only, never text.

## State and link treatment

- Links use text plus an icon, movement, or underline/current-state marker; color is not the only signal.
- Keyboard focus uses a three-pixel outline with separate light-surface and dark-surface tokens.
- Hover and active states preserve the same text colors and add structural changes.
- There are no disabled interactive controls in the initial portfolio.
- Colour lives in light: accents are lamps, glows and tinted labels; fills in the living light carry dark text.

Audit result: **PASS** (41/41 approved pairs pass).
