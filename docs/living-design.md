# Living Intelligence: the design system

The site sits on a deep black ground with off-white type. Colour lives only in light: the living orb,
approvals and checkpoint lamps. Surfaces are quiet glass. Everything below is defined in
`app/living.css` (loaded last, after every older stylesheet), `lib/living-orb.ts` and
`components/living-orb.tsx`.

Use the `--li-*` tokens and `li-*` classes for new work. The older names (`--ink`, `--paper`, `--white`,
`--mint`, `--lime`, `--signal`) still work in the older sections; see "The older tokens" at the end.

## Tokens

### Ground and ink

| Token | Value | Use |
|---|---|---|
| `--li-bg` | `#030304` | The page. |
| `--li-bg-1` | `#07070a` | A quiet band, the console's deepest layer. |
| `--li-bg-2` | `#0c0c11` | An opaque raised card. |
| `--li-bg-3` | `#131318` | Raised further: menus, toasts, close buttons. |
| `--li-ink` | `#f4f2ee` | Headlines and primary text. 18.4:1 on the ground. |
| `--li-ink-2` | `#b1afab` | Secondary text. 9.4:1 (8.5:1 on `--li-bg-3`). |
| `--li-ink-3` | `#8c8a87` | Quiet captions, labels. 6.0:1 (5.4:1 on `--li-bg-3`). |
| `--li-ink-4` | ink at 30% | Hairlines and inactive dots only. Never text. |
| `--li-on-light` | `#050507` | Text on any light or tinted fill (primary button, Approve). |
| `--li-line`, `--li-line-2`, `--li-line-3` | ink at 8%, 15%, 26% | Hairlines, from quiet to firm. |

Channels for alpha: `--li-bg-rgb`, `--li-ink-rgb`, `--li-apricot-rgb`, `--li-rose-rgb`, `--li-iris-rgb`,
`--li-glacier-rgb`, used as `rgb(var(--li-iris-rgb) / 14%)`.

### The living light

The orb's aurora palette. Saturated values are for light (glows, lamps, the orb); tints are for small text.

| Hue | Light | Tint (text) |
|---|---|---|
| apricot | `--li-apricot` `#ffb46a` | `--li-tint-apricot` `#ffd3a8` |
| rose | `--li-rose` `#ff5c8d` | `--li-tint-rose` `#ffb3c8` |
| iris | `--li-iris` `#8f6bff` | `--li-tint-iris` `#c9beff` |
| glacier | `--li-glacier` `#47c8f5` | `--li-tint-glacier` `#9fe3ff` |

Also `--li-violet` `#a684ff`, `--li-frost` `#e8f6ff`, `--li-aurora` (a 90deg gradient through the four),
`--li-aurora-ring` (a conic version that turns with `--li-angle`), and `--li-focus` `#9cc9ff`.

Rule: a fill in the living light always carries `--li-on-light` text, never off-white.

### Checkpoints: where an agent stops for a person

Match `CheckpointKind` in `data/portfolio.ts`.

| Token | Colour | Meaning |
|---|---|---|
| `--li-k-asks` | apricot | Waits for your yes. |
| `--li-k-verifies` | glacier | Checks the result before it counts. |
| `--li-k-holds` | rose | Stops on its own when something fails. |
| `--li-k-bound` | ink at 85% | A line it never crosses (projects without a checkpoint). |

Classes `.li-k-asks`, `.li-k-verifies`, `.li-k-holds` and `.li-k-bound` set `--li-k` on an element, for
`.li-lamp` and `.li-glass.is-lit` inside it.

### Glass, shape, motion

| Token | Use |
|---|---|
| `--li-glass`, `--li-glass-2` | Flat glass fill, 3.5% and 6.5% white (inner parts, hover). |
| `--li-glass-fill` | The panel gradient: 4.5% white at the top fading to 0.8%. |
| `--li-glass-raised` | The run card and the console: dense, lifted. |
| `--li-glass-solid` | Nearly opaque, for glass over moving light on phones. |
| `--li-highlight` | The one-pixel inner highlight: `inset 0 1px 0 rgb(255 255 255 / 8%)`. |
| `--li-shadow`, `--li-shadow-soft` | Deep drop shadows for raised glass. |
| `--li-blur` | 18px. The sticky nav only; blur is costly on phones. |
| `--li-r`, `--li-r-s`, `--li-r-pill` | 16px for surfaces, 10px for inner parts, 999px for pills. No other radii. |
| `--li-ease` | `cubic-bezier(.2,.8,.2,1)`, the default. |
| `--li-ease-spring` | `cubic-bezier(.16,1,.3,1)`, for arrivals (the orb emerging, cards rising). |

### One rhythm for the page

| Token | Use |
|---|---|
| `--li-display` | The work and AI headlines: the hero headline's size on desktop (76.5px at 1440x900), 44px on phones. |
| `--li-h2` | Every other section's headline (57.6px at 1440). Weight 600, in `--li-ink`. |
| `--li-space-feature` | Padding above and below the work and AI sections. |
| `--li-seam` | The hairline where one section meets the next: it fades out at both ends. Use as `border-image: var(--li-seam) 1` on a 1px top border. |

## Classes

| Class | What it is |
|---|---|
| `.li-glass` | A quiet glass panel: fill, hairline, inner highlight, 16px radius. Sets `position: relative; isolation: isolate`. |
| `.li-glass--raised` | Denser and lifted: the hero run card, the assistant console. |
| `.li-glass--solid` | Add on phones over the orb instead of blur. |
| `.li-glass--flat` | A top hairline only, for quiet rows. |
| `.li-glass--inset` | An inner part: 10px radius, flat glass, no shadow. |
| `.li-glass--light` | A pointer-following light on desktop (fine pointer only; off with motion off). `components/interaction-layer.tsx` writes `--gx`/`--gy`. |
| `.li-glass.is-lit` | Edge lit in `--li-k` (glacier by default). Add when a demo reaches its stop. |
| `.li-ring` + `.is-asking` | A spinning aurora edge while a card waits on the visitor. Turns 4 times, then rests. |
| `.li-btn` + `.li-btn--primary` / `.li-btn--ghost` | 46px pill buttons. `.li-btn--sm` is 44px (still a full tap target). |
| `.li-pill` | A small glass tag. |
| `.li-lamp` | A 7px dot in `--li-k` with its glow. |
| `.li-eyebrow` | A small grey line label with a leading rule. |
| `.li-eyebrow--live` | The section eyebrow: its rule is a short line of aurora (work and AI sections). |
| `.li-num` | Tabular numerals that never wrap ("15 من 15" stays on one line). |
| `.li-aurora-text` | Text filled with the aurora gradient. Large type only. |

## The living orb

### Component

```tsx
import { LivingOrb, BrandOrb, bloomBrandOrb, type LivingOrbControls } from "@/components/living-orb";

<LivingOrb state="thinking" size="min(520px, 80vw)" />
<LivingOrb state={state} size={250} amplitude={() => streamRate} ref={orbRef} label="..." />
```

| Prop | Type | Default | Notes |
|---|---|---|---|
| `state` | `"idle" \| "listening" \| "thinking" \| "speaking" \| "approved" \| "paused"` | `"idle"` | `approved` blooms once (a ring leaves the orb); `paused` dims it. Changes ease over ~600 ms. |
| `size` | `number \| string` | 240px | A number is px; a string is any CSS length. Sets `--li-orb-size` on the wrapper. |
| `palette` | `"aurora" \| "ember" \| "glacier" \| "pearl" \| string[]` | `"aurora"` | 2 to 4 hex colours for a custom light. |
| `interactive` | `boolean` | `false` | The pointer tilts the light; hover leans in. |
| `halo` | `0..1` | 1 (marks: 0.2) | Room left for the glow inside the square. |
| `amplitude` | `number \| (() => number) \| null` | built-in voice | Drives `speaking`. A function is polled every frame (use the stream rate). |
| `fps` | `number` | every frame | A cap. Big orbs leave it unset. |
| `poster` | `string` | none | An image under the canvas until the first frame. Without it a soft CSS glow stands in. |
| `label` | `string` | none | Makes the orb `role="img"` with that name. Without it the orb is `aria-hidden`. |
| `className`, `style` | | | On the wrapper `<span class="li-orb">`. |
| `ref` | `Ref<LivingOrbControls>` | | `setState(s)`, `bloom()`, `setAmplitude(v \| null)`, `renderer`. No-ops until mounted. |

What it does for you:

- Mounts its engine only when it comes within 240px of the viewport, on a fresh canvas.
- Pauses off screen (80px margin) and in hidden tabs; destroys its WebGL context on unmount.
- With motion off (`prefers-reduced-motion` or the site's Motion switch, `html[data-motion="off"]`) it paints
  one composed still frame and runs nothing. It follows the switch live.
- WebGL is capped at `MAX_LIVE_WEBGL = 3` live orbs (hero, AI section, brand). A fourth draws with Canvas 2D.
- The wrapper gets `data-ready` after the first frame and `data-renderer="webgl" | "2d" | "none"`.
- A big orb on screen reports itself, so the brand mark drops from 30 to 8 fps.

The wrapper is `display: inline-block` with `pointer-events: none` (unless `interactive`). Position it
yourself: for the hero, size the wrapper larger than the visible sphere (the halo needs room; at
`halo={1}` the sphere is about 56% of the square).

### Brand

- `<BrandOrb />` is the navigation mark (already in `components/navbar.tsx`): 34px, about 30 fps, 8 fps
  while a big orb is visible.
- `bloomBrandOrb()` makes it bloom once. Call it when the visitor presses موافق / Approve in the hero.
- Static places use `public/brand/sultan-alfaifi-mark.svg` (same file as `app/icon.svg`): the manifest, the
  welcome screen, and the assistant's face (`.agent-orb` in `app/agent.css`, which adds a turning aurora rim
  and turns faster while `data-busy` is set).

### Engine (outside React)

```ts
import { mountLivingOrb, LIVING_PALETTES, LIVING_ORB_STATES, MAX_LIVE_WEBGL } from "@/lib/living-orb";
const orb = mountLivingOrb(canvas, { state: "idle", fps: 30, still: false });
orb.setState("speaking"); orb.setAmplitude(0.6); orb.bloom(); orb.setFps(8); orb.setStill(true); orb.destroy();
```

The engine does not read the motion preference itself; pass `still` and call `setStill`.

### The AI section's orb follows the real console

`components/assistant-stage.tsx` (styles in `app/ai.css`) is the big orb beside the assistant console in
`#runtime`. It reads `components/assistant-presence.ts`, a tiny store the console reports plain facts to:

| The console reports | Orb state |
|---|---|
| `markApproved()`: the visitor pressed send on a draft the agent wrote | `approved` (blooms, and the logo blooms) |
| `setActivity("agent", "thinking")`: from the question to the first words, and on plan / prep / tool / result steps | `thinking` |
| `setActivity("agent" or "script", "speaking")` with `pulseVoice(characters)` per piece | `speaking`, its voice from the stream rate (`voiceLevel()`) |
| `setAttention(true)`: the input has focus (keystrokes pulse the voice too) | `listening` |
| nothing | `idle` |

The stage mirrors the state on the section as `data-presence`, so the console's edge answers it (an aurora
ring while thinking). It plays the section's entrance (elements first, then the headline word by word) and a
short hello (listening, speaking, idle) the first time the section is seen, both only with motion on. Press and
hold the orb, then let go: that is the "gravity" secret.

## One product

The hero, the showcase and the AI section were rebuilt on this system. The older sections share their
language through the "One product" block at the end of `app/living.css`:

- Sections meet on plain black with a `--li-seam` hairline, never a hard full-width edge; no section adds grain
  or a lighter ground. The work section's light fades back into the ground before the section ends.
- Headlines: `--li-display` for the work and AI sections, `--li-h2` for the rest, all in ink at weight 600.
  Word-by-word headings (`.split-heading`) and `Reveal variant="title"` arrive blur to sharp with a slight rise,
  like the hero and the AI section, and are finished at rest.
- One primary button everywhere, the assistant included: off-white with `--li-on-light` text. Ghosts are glass
  with a hairline. Help cards are glass; contact links are glass pills.
- Colour is living light: big signals are ink; the lead achievement and the band's accent words carry the aurora;
  the journey's progress line is aurora like the scroll bar.

## The older tokens

The older stylesheets were written for light "paper" sections with a few dark "ink" bands. On the black
ground their names are inverted at `:root` (`app/globals.css`): `--paper` is the ground, `--ink` and
`--text` are off-white, `--white` is a raised surface. Inside the sections that were dark bands (listed
under "Dark bands" in `app/living.css`: nav, hero, work, runtime, contact, footer, the assistant...) the
first meanings come back: `--ink` is the ground and `--paper` is the type. `--mint` now points at
`--li-tint-glacier`, `--lime` at `--li-tint-apricot`, `--blue-bright` at `--li-tint-iris`.

When you rebuild a section, write it with `--li-*` tokens and drop the older names from it.

## Checks

- `scripts/contrast-audit.mjs` lists every approved text pair; add a pair when you add a new text colour.
- Text inside demos is at least 12.5px; tap targets on phones are at least 44px.
- With motion off, everything is visible and finished at rest.
