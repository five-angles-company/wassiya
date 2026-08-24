# Brand sources

The originals every shipped icon is cut from. Nothing here is bundled into the
app — Metro only sees `../images/`. These files exist so the derived assets can
be regenerated, which is otherwise impossible: they arrived as a hand-off, not
from a repository.

| File | What it is |
| --- | --- |
| `logo-mark.png` | The ribbon "w" mark, transparent, 1536×1024 (trims to 1067×534) |
| `logo-wordmark.png` | The "wassiya" lettering, transparent, 2172×724 |
| `icon-composition.png` | The mark laid out on the cream ground at icon scale, 1024×1024 |

## What derives from what

| Shipped asset | Source | How |
| --- | --- | --- |
| `../images/icon.png` | `icon-composition.png` | Flattened onto `#f5ead8`. **The alpha channel must go** — Apple rejects an icon that carries one, and the original has corners at alpha 223. |
| `../images/adaptive-icon.png` | `logo-mark.png` | Trimmed, scaled to 564 px wide, centred on a transparent 1024² canvas. That width is the largest whose ink still fits Android's 66 dp safe circle (radius 313 px); the mark is 2:1, so width binds before height. |
| `../images/adaptive-icon-monochrome.png` | `logo-mark.png` | Same geometry, alpha channel filled solid black. Android tints this layer, so colour in the source is wrong by definition. |
| `../images/brand-mark.png` | `logo-mark.png` | Trimmed to the ink, scaled to 1024×512. Feeds both the native splash (`expo-splash-screen` resizes it at prebuild) and `screens/splash`. |

The Android foreground and monochrome files in the original hand-off had the
adaptive-icon **template guide grid baked into their pixels** — dashed safe-zone
square, circles, diagonals, in white strokes that would have shipped on the home
screen. They are not kept here. Regenerate from `logo-mark.png` instead.
