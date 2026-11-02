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
| Glacier tint labels and links on the ground | `#CFFBF2` | `#030304` | 18.39:1 | 4.5:1 | Pass |
| Glacier tint labels on raised glass | `#CFFBF2` | `#131318` | 16.52:1 | 4.5:1 | Pass |
| Dark text on glacier tint controls | `#050507` | `#CFFBF2` | 18.17:1 | 4.5:1 | Pass |
| Apricot tint gate phrase and asks text on the ground | `#DDF9A6` | `#030304` | 17.84:1 | 4.5:1 | Pass |
| Dark text on the apricot tint Approve button | `#050507` | `#DDF9A6` | 17.62:1 | 4.5:1 | Pass |
| Iris tint data labels on the ground | `#8EEBDD` | `#030304` | 14.80:1 | 4.5:1 | Pass |
| Iris tint data labels on raised glass | `#8EEBDD` | `#131318` | 13.30:1 | 4.5:1 | Pass |
| Rose tint labels on the ground | `#B4C9FF` | `#030304` | 12.51:1 | 4.5:1 | Pass |
| Apricot warnings on the ground | `#B6F23C` | `#030304` | 15.47:1 | 4.5:1 | Pass |
| AI section: the orb's state word (--li-ink-2) on its 80% ground pill, worst case over white light | `#B1AFAB` | `#353535` | 5.60:1 | 4.5:1 | Pass |
| AI section: console warnings (apricot tint) on the raised console glass | `#DDF9A6` | `#0A0A0D` | 17.11:1 | 4.5:1 | Pass |
| AI section: aurora principle numerals at their darkest stop (iris) on the ground | `#00D1B2` | `#030304` | 10.57:1 | 4.5:1 | Pass |
| Aurora display text (the lead achievement, the band's accent words) at its darkest stop (iris) on the ground | `#00D1B2` | `#030304` | 10.57:1 | 3.0:1 | Pass |
| Aurora display text at its darkest stop (iris) on the lead achievement's raised glass (--li-bg-3) | `#00D1B2` | `#131318` | 9.49:1 | 3.0:1 | Pass |
| Focus ring (--li-focus) on the ground | `#7FE9D8` | `#030304` | 14.28:1 | 3.0:1 | Pass |
| Focus ring (--li-focus) on raised glass | `#7FE9D8` | `#131318` | 12.83:1 | 3.0:1 | Pass |
| Checkpoint lamp: asks (apricot) on the ground | `#B6F23C` | `#030304` | 15.47:1 | 3.0:1 | Pass |
| Checkpoint lamp: verifies (glacier) on the ground | `#9DF5E4` | `#030304` | 16.31:1 | 3.0:1 | Pass |
| Checkpoint lamp: holds (rose) on the ground | `#4A7DFF` | `#030304` | 5.56:1 | 3.0:1 | Pass |
| Checkpoint line: bound (ink 85%) on the ground | `#D0CECA` | `#030304` | 13.12:1 | 3.0:1 | Pass |
| Iris accents on the ground | `#00D1B2` | `#030304` | 10.57:1 | 3.0:1 | Pass |
| Showcase: the bottom of the numeral gradient (#a3a19d) on the ground | `#A3A19D` | `#030304` | 7.99:1 | 3.0:1 | Pass |
| Showcase: rose tint (rejected stamp, wrong day) on a rejected page (rose 10% over a raised card) | `#B4C9FF` | `#241419` | 10.71:1 | 4.5:1 | Pass |
| Showcase: secondary text on a rejected page | `#B1AFAB` | `#241419` | 8.06:1 | 4.5:1 | Pass |
| Showcase: apricot tint on the seeded-fault tag (apricot 7% over a raised card) | `#DDF9A6` | `#1D1814` | 15.24:1 | 4.5:1 | Pass |
| Showcase: frost tile number (WAREVA) on the ground | `#E8F6FF` | `#030304` | 18.71:1 | 4.5:1 | Pass |
| Showcase: glacier label for a verifying stop on the case sheet | `#9DF5E4` | `#121217` | 14.77:1 | 4.5:1 | Pass |
| Showcase: rose label for a holding stop on the case sheet | `#4A7DFF` | `#121217` | 5.04:1 | 4.5:1 | Pass |
| Showcase: apricot label for an asking stop on the case sheet | `#B6F23C` | `#121217` | 14.01:1 | 4.5:1 | Pass |
| Showcase: quiet captions (--li-ink-3) on a figure cell (#0b0b0e) | `#8C8A87` | `#0B0B0E` | 5.71:1 | 4.5:1 | Pass |
| Showcase: dark text on the off-white PDF chip and primary links | `#050507` | `#F4F2EE` | 18.21:1 | 4.5:1 | Pass |
| Showcase: secondary text (--li-ink-2) on a tile’s tinted glass, the worst case measured from pixels (the tile’s accent light and the section’s colour behind the glass, about #2D302E) | `#B1AFAB` | `#2D302E` | 6.09:1 | 4.5:1 | Pass |

## Deliberately excluded combinations

- **Quiet captions (--li-ink-3) on a tile’s tinted glass (about #2D302E):** `#8C8A87` on `#2D302E` is 3.88:1. Insufficient contrast. Text on the showcase tiles (category lines, demo briefs, page numbers, the held end of a flow) uses --li-ink-2.
- **Off-white text on a glacier fill:** `#F4F2EE` on `#9DF5E4` is 1.13:1. Insufficient contrast. Fills in the living light carry dark text (--li-on-light), never off-white.
- **Off-white text on an apricot fill:** `#F4F2EE` on `#B6F23C` is 1.19:1. Insufficient contrast. The asks colour is a lamp or a fill behind dark text.
- **Decorative ink (--li-ink-4) as text:** `#4C4B49` on `#030304` is 2.37:1. Insufficient contrast. --li-ink-4 is for hairlines and inactive dots only, never text.

## State and link treatment

- Links use text plus an icon, movement, or underline/current-state marker; color is not the only signal.
- Keyboard focus uses a three-pixel outline with separate light-surface and dark-surface tokens.
- Hover and active states preserve the same text colors and add structural changes.
- There are no disabled interactive controls in the initial portfolio.
- Colour lives in light: accents are lamps, glows and tinted labels; fills in the living light carry dark text.

Audit result: **PASS** (42/42 approved pairs pass).
