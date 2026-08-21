import { Cairo_700Bold, Cairo_800ExtraBold, Cairo_900Black } from "@expo-google-fonts/cairo"
import { Figtree_400Regular, Figtree_500Medium, Figtree_600SemiBold } from "@expo-google-fonts/figtree"
import {
  IBMPlexSansArabic_400Regular,
  IBMPlexSansArabic_500Medium,
  IBMPlexSansArabic_600SemiBold,
  IBMPlexSansArabic_700Bold,
} from "@expo-google-fonts/ibm-plex-sans-arabic"
import { useFonts } from "expo-font"

// Every weight is registered as its own family: React Native's `fontWeight`
// does NOT select a bold file, so the theme's `--font-*` tokens name these
// exact strings (see apps/mobile/global.css). Loading a weight here and
// forgetting its token — or vice versa — silently falls back to the system
// face, so the two lists must stay in step.
const FONTS = {
  // Cairo — headings, in Arabic and English alike.
  Cairo_700Bold,
  Cairo_800ExtraBold,
  Cairo_900Black,
  // IBM Plex Sans Arabic — body copy and UI text.
  IBMPlexSansArabic_400Regular,
  IBMPlexSansArabic_500Medium,
  IBMPlexSansArabic_600SemiBold,
  IBMPlexSansArabic_700Bold,
  // Figtree — Latin-only chrome.
  Figtree_400Regular,
  Figtree_500Medium,
  Figtree_600SemiBold,
}

/**
 * Loads the Wassiya type stack.
 *
 * Returns `true` once the app may render — that is, when the fonts are ready
 * *or* loading failed. A font error must not wedge the splash screen forever:
 * falling back to the system face is worse-looking but still usable.
 */
export function useAppFonts(): boolean {
  const [loaded, error] = useFonts(FONTS)
  return loaded || error !== null
}
