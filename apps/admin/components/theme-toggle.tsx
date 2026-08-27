"use client"

import { useTheme } from "next-themes"
import { Button } from "@workspace/ui/components/button"
import { MoonIcon, SunIcon } from "lucide-react"

import { useLocale } from "@/components/locale-provider"
import { t } from "@/lib/i18n/locale"
import { COMMON } from "@/lib/i18n/strings/common"

/**
 * Light/dark switch for the sidebar footer.
 *
 * The `d` hotkey from `ThemeProvider` still works and is the faster path; this
 * exists because a hotkey nobody has been told about is not an affordance.
 *
 * Both icons are rendered and one is hidden by the `dark:` variant, rather than
 * picking one from `resolvedTheme`. That value is `undefined` until after
 * hydration, so choosing in JS means either a hydration mismatch or a
 * mounted-flag effect — and the effect is a cascading render for something CSS
 * already knows, since `next-themes` puts the `.dark` class on `<html>` before
 * first paint.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const labels = t(COMMON, useLocale())

  return (
    <Button
      type="button"
      size="icon-sm"
      variant="ghost"
      aria-label={labels.theme}
      title={labels.theme}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <SunIcon className="hidden dark:block" />
      <MoonIcon className="block dark:hidden" />
    </Button>
  )
}
