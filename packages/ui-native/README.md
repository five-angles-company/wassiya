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
| `@lodev09/react-native-true-sheet` (native module — see below) | **the app** (peer here) |
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

`scripts/check-classes.mjs` catches both. Run it after any styling change:

```bash
cd apps/mobile
npx expo export -p android --no-bytecode --no-minify --output-dir /tmp/wassiya-export
node ../../packages/ui-native/scripts/check-classes.mjs /tmp/wassiya-export
```

It diffs the classes written in source against the bundle's compiled utility
table, reporting **purged** classes (absent) and **inert** ones (present but
resolving to `colorMix("unset", …)`). Exit 0 on a clean tree; the seven inert
`/alpha` classes in verbatim upstream files are baselined in the script.

## The one native dependency

`sheet` and `sheet-select` are built on
[`@lodev09/react-native-true-sheet`](https://github.com/lodev09/react-native-true-sheet),
which is a **native module**, not a JS one. Consequences:

- It is a `peerDependency` here and a real dependency of the consuming app —
  the same shape as `react-native-gesture-handler` and `reanimated`. Native
  autolinking runs from the app, so declaring it only in this package would
  bundle the JS and then fail at runtime with a missing native module.
- **Adding it requires `expo prebuild` and a dev-client rebuild.** A JS-only
  reload will not pick it up; the sheet throws instead, and the error reads like
  a code bug rather than a stale binary.
- v3 requires the New Architecture. v4 exists but its manifest pins
  `expo-router >= 57`, so it belongs to the next SDK, not this one.

## Consuming it

```ts
import { Text } from "@workspace/ui-native/components/ui/text"
import { PrimaryCta } from "@workspace/ui-native/components/wassiya/primary-cta"
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
import { ConfirmSheet } from "@workspace/ui-native/components/wassiya/confirm-sheet"
import { SettingsRow } from "@workspace/ui-native/components/wassiya/settings-row"
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
catalogue instead. Content that is inherently per-record — an executor's name, an
asset title, a formatted date — is a plain `string` prop, never a label.

### The components

The screen-level pieces that sit on top of these — `Screen`, `ScreenHeader`,
`LoadingScreen`, `BackButton`, `IconButton`, `AddFab`, `Field`,
`SecretField`, `EmptyTab`, `LoadMore`, `NoResults`, `NumberedRow` — live in
`apps/mobile/components/` because they know the router or the app's strings.
The rules for putting them together are in the root `AGENTS.md`
("Design rules (mobile)").

| Component | Key props | States | Consumed by |
| --- | --- | --- | --- |
| `primary-cta` | `label`, `disabledLabel`, `icon`, `tone`, `disabled`, `busy` | `primary` (terracotta) · `quiet` (surface) · `danger` (terracotta outline); a disabled primary is **surface-toned, never faded** | every full-width action in the app, 56px |
| `confirm-sheet` | `open`, `onClose`, `title`, `body[]`, `confirmLabel`, `cancelLabel`, `tone`, `onConfirm(dismiss)`, `busy`, `error` | danger (outlined confirm, filled keep) · primary | **every** confirmation — delete, sign out, revoke, leave a form. Never `Alert.alert` |
| `sheet` | `title`, `description`, `detents`, `scrollable`, `maxContentHeight`, `onDismiss`; `present()` / `dismiss()` via `ref` | native sheet, drag-to-dismiss | the type picker, the paywall, and every other sheet |
| `screen-top` | `backLabel`, `back` (`chevron`/`close`), `onBack`, `action`, `trailing` | back · dismiss · trailing | step flows and the asset page — drawn exactly like the app's `BackButton` |
| `surface` | `as` (row/card/summary), `tone`, `gap`, `padded`, `clip`, `row` | card (surface fill, **no border**) · olive · terracotta · sand | any filled block that is not a list row |
| `settings-row` | `label`, `detail`, `icon`, `value`, `valueTone`, `accessory`, `quiet`, `chevron`, `divider` | pressable · static (a read-only readout) · `valueTone` default / action / done / attention | every grouped list: settings, devices, plan usage, profile identity |
| `audit-row` | `icon`, `event`, `meta`, `tone`, `divider` | not pressable, by design | the audit log and notification history, inside a card |
| `empty-state` | `icon`, `title`, `subtitle`, `action` | a card in the list's own place | an empty list under a header — audit, devices, notifications |
| `alert-banner` | `variant`, `title`, `description`, `icon`, `actions[{label,onPress}]` | `security` · `notice` · `info` · `success`; actions are **text links**, never buttons | notices on setup, settings, Home, notifications |
| `chip-row` | `options[{value,label}]`, `value`, `onChange`, `label` | selected (solid terracotta) · unselected (surface pill) | **the only chip** — kinds, cadences, handed over or private |
| `field-link` | `label`, `value`, `placeholder`, `hint`, `chevron`, `onPress` | `down` opens a sheet · `forward` leaves for a screen | the boxed-field look for anything that does not take typing |
| `sheet-select` | `label`, `value`, `options`, `onChange`, `hint`, `trigger`, `note` | boxed field by default, or any `trigger` | country, language |
| `vault-row` | `icon`, `title`, `detail`, `isPrivate`, `onPress` | handed over · private (a quiet lock) | ٤.١ the vault list |
| `executor-card` | `name`, `detail`, `sheetSummary`, `onPress` | sheet printed · "no sheet" warning | ٥.١ executors |
| `stat-tile` | `icon`, `label`, `value`, `emphasis`, `tone`, `onPress` | tone tints disc and value together | ٣.١ Home's 2-up grid |
| `asset-type-grid` / `asset-type-tile` | `options[]` | rows of two; a lone last tile spans its row with the same layout | the add sheet and the empty vault |
| `key-card` | `icon`, `title`, `description`, `pending` | live · pending | 2.2 the key explainer |
| `check-in-hero` | `state`, `detail`, `onConfirm`, `onEnable`, `onOpenSettings`, `failed` | per check-in state; its pill is **the only** place a check-in is confirmed | ٣.١ Home |
| `protection-score` / `protection-score-list` | `earned`, `total` / `items[]` | done · needed · later | 2.6 setup complete |
| `status-pill` | `status`, `children` | confirmed · action · waiting | devices (a revoked device) |
| `storage-meter` | `quotaBytes`, `segments[]`, `formatSize`, `empty` | segments are shares of the **quota** | ٩.٤ plan |
| `otp-input` / `otp-box` | `value`, `length`, `state`, `resendInSeconds`, `onComplete` | empty · partial · verifying · wrong · expired · lockedOut | 1.4 OTP, the email change |
| `recovery-code-display` / `document-sheet` | `groups`, `perLine`, `ownerName`, `issuedAt`, `qrSlot`, `preview` | shown-once band; `preview` masks the code | the recovery kit, executor sheets, the masked sheet in settings |
| `seed-grid` | `words`, `formatIndex` | — | ٤.٣ the seed phrase |
| `voice-recorder` | `state`, `durationMs`, `levels`, `playing`, callbacks | idle · recording · recorded | ٤.٨ spoken notes |
| `chat-bubble` / `chat-composer` | see source | own · theirs; composer blocked · busy · warning | ٩.٦ support |
| `avatar-stack`, `initial-disc`, `meter-bar`, `pulsing-heart` | shared internals | — | used by the above |

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
| `button.tsx` | pills, Cairo 800 labels, `protect` variant, ramp-step pressed states, outlined `destructive` | the button spec; `/alpha` states do not render (see above) |
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

`Text` variants: `display`, `screenTitle` (28px — **every** screen's title),
`pageTitle`, `title`, `dialogTitle`, `sectionLabel`, `noticeTitle`,
`rowTitle`, `prose`, `proseSm`, `footnote`, `meta`, `metaSm`, `action`,
`kicker` — `prose`, `proseSm`, `footnote`, `meta` and `metaSm` are already
muted, so never add `text-muted-foreground` to them, and never dim text with
`opacity-*`. Plus the upstream shadcn names (`h1`–`h4`, `p`, `lead`, `large`, `small`,
`muted`, `code`, `blockquote`), retuned to the same stack so existing markup
keeps working.

### Deviations from the brief, and why

- **Radii are role-based**, from the screen grammar — `rounded-row`
  24, `rounded-card` 26, `rounded-summary` 28, `rounded-sheet` 34,
  `rounded-box` 20 — rather than the brief's "cards 24, inputs 16". Inputs and
  buttons are **pills**, not 16px.
- **The type scale is larger than the brief's seven variants**, because the
  row/section/notice/meta sizes appear in almost every primitive;
  without named tokens each component would carry inline pixel values.
- **Caprasimo is ignored** (as instructed): it has no Arabic glyphs. Cairo
  800/900 is the heading voice in both languages.
- **The 9.4 lapse banner uses `notice`, not `info`.** The 9.4 spec asks for the
  info variant at terracotta-100/terracotta-900, but the palette already uses two
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
