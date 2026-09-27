import { api } from "@workspace/backend/api"
import { Text } from "@workspace/ui-native/components/ui/text"
import { PrimaryCta } from "@workspace/ui-native/components/wassiya/primary-cta"
import { RecoveryCodeDisplay } from "@workspace/ui-native/components/wassiya/recovery-code-display"
import { useQuery } from "convex/react"
import { router } from "expo-router"

import { LoadingScreen } from "@/components/loading-screen"
import { Screen } from "@/components/screen"
import { ScreenHeader } from "@/components/screen-header"
import { useStrings } from "@/i18n/use-strings"

/**
 * ٩.٥ — where the recovery document stands, and how to replace it.
 *
 * ## ⚠️ There is no "view" or "download" here, and there cannot be
 *
 * `S_paper` is never persisted — not on the device, not on the deployment. That
 * is the whole of "we keep no copy", and it is what makes the printed sheet
 * worth keeping in a safe. So the code on somebody's current sheet cannot be
 * shown again by this screen, by support, or by anyone.
 *
 * What this screen can honestly offer is the sheet with its code masked, the
 * **status** that is stored (`paperVersion`, `paperPrintedAt`, `paperUsedAt`),
 * and a route to minting a replacement.
 *
 * ## Reissuing is a rotation, and it is stated as one
 *
 * `/setup/recovery-kit` mints fresh randomness on arrival — `use-recovery-material`
 * says so outright — so reaching it retires the sheet in the owner's drawer the
 * moment the new wrapper is saved. That consequence is printed here, before the
 * button, rather than discovered afterwards: somebody tapping through from
 * settings expecting a preview would otherwise silently destroy a document
 * filed with their will.
 */
/** Groups after the prefix in a paper code — `encodePaperCode` emits 14. */
const CODE_GROUPS = 14

export function RecoverySheetScreen() {
  const { t, locale } = useStrings("settings")
  const keyring = useQuery(api.keyring.get)
  const me = useQuery(api.users.me)

  if (keyring === undefined) return <LoadingScreen back />

  const used = keyring?.paperUsedAt != null

  return (
    <Screen
      footer={
        <PrimaryCta
          label={t.sheetReissueAction!}
          onPress={() => router.push("/setup/recovery-kit")}
        />
      }
    >
      <ScreenHeader back title={t.sheetTitle!} />

      {keyring === null ? null : (
        <RecoveryCodeDisplay
          preview
          groups={[
            `WSY${keyring.paperVersion}`,
            ...Array.from({ length: CODE_GROUPS }, () => "••••"),
          ]}
          ownerName={me?.identityVerifiedName ?? me?.name ?? ""}
          issuedAt={new Date(keyring.paperPrintedAt ?? keyring.rotatedAt)}
          locale={locale}
        />
      )}

      {used ? (
        <Text variant="rowTitle" className="text-terracotta-800 mt-4">
          {t.sheetUsed}
        </Text>
      ) : keyring !== null && keyring.paperPrintedAt === null ? (
        <Text variant="rowTitle" className="text-terracotta-800 mt-4">
          {t.sheetNeverPrinted}
        </Text>
      ) : null}

      <Text variant="proseSm" className="mt-header">
        {t.sheetCannotShow}
      </Text>

      <Text variant="sectionLabel" className="mt-6 mb-2">
        {t.sheetReissueTitle}
      </Text>
      <Text variant="proseSm">{t.sheetReissueBody}</Text>
    </Screen>
  )
}
