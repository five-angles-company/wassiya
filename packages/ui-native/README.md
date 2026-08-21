# @workspace/ui-native

[React Native Reusables](https://reactnativereusables.com) (shadcn/ui for React
Native) as a shared, source-only workspace package — the mobile counterpart to
`@workspace/ui`. Components use `className` (Tailwind) and are styled by
**[Uniwind](https://uniwind.dev)** (Tailwind v4 for React Native).

You **own** these components: edit them freely. Like shadcn, they are copied in,
not imported from a black-box dependency.

## Architecture: where things live

This package ships **only component source + their deps**. The **styling engine
configuration lives in each consuming app** (the Metro bundler runs there):

| Concern | Location |
| --- | --- |
| Component `.tsx` source, `@rn-primitives/*`, `cva`, `lucide-react-native` | **this package** |
| `uniwind/metro` plugin, `global.css`, theme tokens, `@source`, generated types, reanimated babel plugin | **the app** (see `apps/mobile`) |

A new app that wants these components repeats only the app-side wiring (copy it
from `apps/mobile`): `metro.config.js` (`withUniwindConfig`), `src/global.css`
(must include `@source '<rel>/packages/ui-native/src'` or classes used only here
get purged), import the CSS in the root layout, add the reanimated worklets babel
plugin, and render `<PortalHost />` (from `@rn-primitives/portal`) at the root.

## ⚠️ Two Uniwind traps that fail silently

Both were verified against a real bundle (`expo export -p android --no-bytecode`,
then grep the compiled utility table for `"<class>": [{`). Neither produces a
warning, a type error, or a build failure — the style just never applies.

1. **Never use an `/alpha` modifier on a theme colour** — `bg-primary/90`,
   `dark:bg-input/30`, `text-foreground/60` compile to
   `colorMix("unset", "90%", …)` and render nothing, because Uniwind declares
   theme-variant colours as `unset` at build time and resolves them per theme at
   runtime. Use an explicit ramp step instead (`active:bg-terracotta-600`).
   Static Tailwind colours (`bg-black/50`) are unaffected.
2. **Every source directory must be named in `@source`** — Tailwind auto-detects
   only from the CSS file's own directory, so `apps/mobile/src/global.css` does
   NOT scan `apps/mobile/app/`. A class used only in an expo-router route file
   is silently purged. `global.css` therefore lists `@source '../app'` as well as
   `@source '../../../packages/ui-native/src'`.

## Consuming it

```ts
import { Button } from "@workspace/ui-native/components/ui/button"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
```

Add to the app's `tsconfig.json` paths:
`"@workspace/ui-native/*": ["../../packages/ui-native/src/*"]`.

## Adding more components

The full RNR catalog is at https://reactnativereusables.com. Add a component
from the **uniwind** registry, then rewrite its import alias to this package:

```bash
# Fetch the registry item (self-contained, with inline source):
curl -sSL https://reactnativereusables.com/r/uniwind/<name>.json
# Write files into src/components/ui/, replacing the import prefix:
#   @/registry/uniwind/  ->  @workspace/ui-native/
```

Then add any new npm deps the item lists (`dependencies`) to this package's
`package.json` (e.g. another `@rn-primitives/*`), and `pnpm install`.

> Tip: components reference `React.*` types without importing React — that's
> intentional (the global `React` UMD namespace from `@types/react`). Keep files
> verbatim from upstream where possible so future updates stay easy to diff.

## Wassiya primitives

`src/components/wassiya/` holds the product's own layer: components that encode
a Wassiya *rule*, not just a shape. Import them the same way as anything else —
the `./components/*` wildcard already covers the subfolder:

```ts
import { AssetRow } from "@workspace/ui-native/components/wassiya/asset-row"
import { StatusPill } from "@workspace/ui-native/components/wassiya/status-pill"
```

They are UI only. Nothing here calls Convex, Clerk, biometrics, or the
keychain; where a gate is needed, the component takes an **async callback** and
lets the screen decide (`onRequestReveal`, `onConfirm`).

### Copy and locale

Arabic is the default. Every primitive that renders text takes:

| Prop | Type | Meaning |
| --- | --- | --- |
| `locale` | `"ar" \| "en"` | Defaults to `"ar"`. |
| `labels` | `Partial<Record<Key, {ar,en} \| string>>` | Overrides any built-in string. |

Built-in strings live next to the component as a `LabelSet`, and
`resolveLabels()` (in `lib/labels.ts`) merges the overrides. There is no i18n
library yet; when one lands, keep passing `labels` and source them from the
catalogue instead. Content that is inherently per-record — an heir's name, an
asset title, a formatted date — is a plain `string` prop, never a label.

### The components

| Component | Key props | States | Consumed by |
| --- | --- | --- | --- |
| `section-kicker` | `kicker`, `title`, `step`, `description` | — | every numbered stage header (`٢ · تهيئة الخزنة`) |
| `otp-input` | `value`, `onChangeText`, `length` (4–8), `state`, `resendInSeconds`, `onComplete` | `empty` · `partial` · `verifying` (pulse) · `wrong` (shake) · `expired` · `lockedOut` | 1.4 OTP, and later any step-up challenge |
| `otp-box` | internal to `otp-input` | mirrors the parent state | — |
| `guarded-secret-field` | `title`, `wordCount`, `words`, `onRequestReveal`, `revealSeconds`, `onPaste`, `onScanQr`, `safetyChips`, `checksum` | masked · revealed (10s countdown) · paste · scan · checksum valid/invalid | 4.3 crypto wallet, 4.7 digital account, 4.9 asset detail |
| `secret-word-pills` | `count`, `words`, `revealed` | masked · revealed | inside `guarded-secret-field` |
| `safety-chips` | `items` | — | inside `guarded-secret-field` |
| `secret-checksum-line` | `checksum`, `validMessage`, `invalidMessage` | `valid` · `invalid` · `unknown` (renders nothing) | inside `guarded-secret-field` |
| `recovery-code-display` | `groups`, `perLine`, `ownerName`, `issuedAt`, `qrSlot`, `handlingNote` | shown-once band always present | 2.4 recovery kit |
| `recovery-code-input` | `value: string[]`, `onChange`, `groupLength`, `invalidGroups`, `checksumFailed` | per-group error · checksum error · paste-spread | recovery on a new device, 3.2 "use my recovery sheet" |
| `protection-score` | `earned`, `total`, `size` | complete (olive ring) · incomplete (sand ring) | 2.6 setup complete, 3.1 home, Protection Centre |
| `protection-score-list` | `items[{label,done,priority,pillLabel}]` | per item: done · needed (amber) · later (neutral) | 2.6, Protection Centre |
| `status-pill` | `status`; `children` overrides the built-in wording | `confirmed` (olive, `مفعّل`) · `action` (terracotta, `مطلوب`) · `waiting` (sand, `قيد المراجعة`) | everywhere a state is named |
| `key-card` | `icon`, `title`, `description`, `pending` | live · pending | 2.2 the three-keys explainer |
| `asset-row` | `icon`, `title`, `meta`, `recipientStatus`, `recipientLabel`, `onPress` | routed · unrouted (amber) · pressable | 4.1 assets list, 5.3 routing |
| `asset-row-skeleton` | `count` | loading | 4.1 while rows decrypt |
| `asset-type-grid` / `asset-type-tile` | `options[]`; tile takes `icon`, `title`, `description`, `tone` | — | 4.2 category picker |
| `heir-card` | `name`, `relation`, `inviteState`, `receivesSummary`, `tone` | `silent` · `accepted` · `pending` · `declined`; plus the "receives nothing" warning | 5.1 heirs list |
| `recipient-picker-row` | `kind`, `name`, `detail`, `selected`, `onToggle`, `showWholeAssetNote`, `footnote` | selected · unselected; `heir` · `executor` · `allHeirs` | 5.3 routing, 5.3b per-asset recipients |
| `timeline-steps` / `timeline-step` | `steps[{state,title,meta,daysRemaining}]` | `done` · `current` · `future`; countdown node | 7.4 claim waiting period, check-in escalation |
| `checklist-card` | `title`, `items[{label,done}]` | counter derived from items; "last step" at 1 remaining | the persistent onboarding widget |
| `alert-banner` | `variant`, `title`, `description`, `icon`, `actions` | `security` (terracotta + warning) · `notice` (terracotta + info) · `info` (sand) · `success` (olive); paired inline actions | 3.3 notifications, 5.3 default-rule notice, 9.4 lapse notice |
| `document-sheet` | `title`, `subtitle`, `trailing`, `footer` | — | recovery sheet, will preview |
| `empty-state` | `icon`/`illustration`, `title`, `subtitle`, `action`, `secondaryAction` | — | 4.1b and every other empty list |
| `audit-row` | `icon`, `event`, `meta`, `tone`, `divider` | not pressable, by design | the audit log; every secret reveal writes one |
| `check-in-prompt` | `state`, `cadence`, `lastConfirmedAt`, `snoozedUntil`, `onConfirm`, `onSnooze` | `due` · `overdue` · `confirmed` · `snoozed` · `biometricFailed` | **6.4** — full-screen, the route wraps it |
| `check-in-row` | `state`, `detail`, `onPress` | `off` · `due`; navigates only, never confirms | 3.1 home status row |
| `heart-badge` | `confirmed` | heart · check | inside `check-in-prompt` |
| `storage-meter` | `quotaBytes`, `segments[{label,bytes,color?}]`, `formatSize`, `empty` | active · empty; segments are shares of the **quota** | **9.4** subscription |
| `settings-row` | `label`, `detail`, `icon`, `value`, `valueTone`, `accessory`, `quiet`, `chevron`, `divider` | pressable · quiet · with accessory | all of section ٩ |
| `initial-disc`, `meter-bar` | shared internals | `meter-bar` takes a per-segment `color` override | used by the above |

### Rules these components follow

- **No physical directions.** Logical utilities only (`ps-*`/`pe-*`,
  `ms-*`/`me-*`, `start-*`/`end-*`). The one thing they cannot mirror is icon
  artwork, so directional glyphs take `<Icon flip />`.
- **RTL is set natively, not in JS.** `app.json` configures
  `expo-localization` with `{ supportsRTL: true, forcesRTL: true }`, so React
  Native is mirrored before the first view exists — on a fresh install's very
  first launch. `I18nManager.forceRTL()` from JS cannot do that (it applies
  only after a full reload), so `apps/mobile/src/lib/direction.ts` keeps it
  purely as a backstop for Expo Go / a stale dev client, and logs when it fires.
  **Changing this requires `expo prebuild` and a dev-client rebuild.**
- **Latin runs are isolated.** OTP digits, IBANs, recovery codes, phone numbers
  and claim references render in Latin inside a `⁦…⁩` isolate in both
  languages — see `lib/format.ts` and `lib/rtl.ts`.
- **No hardcoded colour.** Every value comes from `apps/mobile/src/global.css`.
  Semantics go through `lib/tone.ts`: olive = done, terracotta = action, sand =
  pending.
- **No `/alpha` on a theme colour.** Verified against a real bundle:
  `bg-primary/90` compiles to `colorMix("unset", 90%, …)` and renders nothing,
  because Uniwind declares theme colours as `unset` at build time and resolves
  them per theme at runtime. Use an explicit ramp step
  (`active:bg-terracotta-600`). Static Tailwind colours (`bg-black/50`) are
  unaffected. Some upstream `ui/` files still carry `/alpha` pressed states
  from the registry; they are inert rather than wrong, and left verbatim so
  they stay diffable.
- **No red.** `destructive` is an outlined confirm in deep terracotta.

### Upstream `ui/` files that were changed

Everything else in `src/components/ui/` is verbatim from the registry, so it
stays diffable. These four carry deliberate brand changes:

| File | Change | Why |
| --- | --- | --- |
| `text.tsx` | cva variants retuned; Wassiya scale added | the type system lives here, not in a parallel component |
| `button.tsx` | pills, Cairo 800 labels, `protect` variant, ramp-step pressed states, outlined `destructive` | the board's button spec; `/alpha` states do not render (see above) |
| `icon.tsx` | `flip` prop; `strokeWidth` defaults to 2.75 | RTL glyph mirroring, and the design system's icon weight |
| `skeleton.tsx` | `bg-secondary` → `bg-sand-300` | `secondary` is olive here, which means "done" — a placeholder must not read as confirmed |
| `card.tsx` | `tint` prop (`terracotta`/`olive`/`sand`) + `CARD_TINT_DIVIDER` | the 9.4 plan card is a ramp-filled panel, not a surface card; the divider it needs is a declared alpha token, since `/alpha` is dead here |

`textarea.tsx` also drops upstream's `placeholderClassName` prop, which does
not exist in Uniwind's typings; it uses the same `placeholder:` utility
`input.tsx` already does.

### Type and font tokens

React Native registers **every weight as a separate family**, so `font-bold`
synthesises a fake bold instead of selecting Cairo 800. Text styling therefore
names a family utility directly — `font-heading-extrabold`, `font-body-medium`
— and `Text`'s cva variants do this for you. The families are loaded in
`apps/mobile/src/hooks/use-app-fonts.ts`; that list and the `--font-*` tokens
in `global.css` must stay in step.

`Text` variants: `display`, `screenTitle`, `pageTitle`, `title`, `dialogTitle`,
`sectionLabel`, `noticeTitle`, `rowTitle`, `meta`, `metaSm`, `action`, `kicker`
— plus the upstream shadcn names (`h1`–`h4`, `p`, `lead`, `large`, `small`,
`muted`, `code`, `blockquote`), retuned to the same stack so existing markup
keeps working.

### Deviations from the brief, and why

- **Radii are role-based**, from the board's own screen grammar — `rounded-row`
  24, `rounded-card` 26, `rounded-summary` 28, `rounded-sheet` 34,
  `rounded-box` 20 — rather than the brief's "cards 24, inputs 16". Inputs and
  buttons are **pills** on the board, not 16px.
- **The type scale is larger than the brief's seven variants**, because the
  board's row/section/notice/meta sizes appear in almost every primitive;
  without named tokens each component would carry inline pixel values.
- **Caprasimo is ignored** (as instructed): it has no Arabic glyphs. Cairo
  800/900 is the heading voice in both languages.
- **The 9.4 lapse banner uses `notice`, not `info`.** The 9.4 spec asks for the
  info variant at terracotta-100/terracotta-900, but the board already uses two
  different notice tints: 3.3's "needs you" band is terracotta, while 4.4's
  OTP explainer is neutral-200. Repointing `info` at terracotta would collapse
  those into one name, so `notice` carries the terracotta values and `info`
  stays sand. Same pixels, one more name.
- **The 9.4 lapse copy renders at `text-meta` (12.5/1.5), not 12/1.6.** A
  half-pixel and 0.1 of leading did not justify another type token.

## ⚠️ Divergence from the `expo-tailwind-setup` skill

The repo's `expo-tailwind-setup` skill documents **NativeWind v5 +
`react-native-css`** with `globalClassNamePolyfill: false` and manual
`useCssElement` wrappers. This package instead uses **Uniwind**, which enables
`className` on React Native core components automatically (no wrappers) — the
model React Native Reusables requires. The two approaches are mutually
exclusive; for the mobile UI layer, this package supersedes that skill.
