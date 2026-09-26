import { api } from "@workspace/backend/api"
import { Button } from "@workspace/ui-native/components/ui/button"
import { Text } from "@workspace/ui-native/components/ui/text"
import { RecoveryCodeDisplay } from "@workspace/ui-native/components/wassiya/recovery-code-display"
import { useQuery } from "convex/react"
import { router } from "expo-router"
import { ActivityIndicator, View } from "react-native"

import { BackButton } from "@/components/back-button"
import { Screen } from "@/components/screen"
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
  const { t: common } = useStrings("common")
  const keyring = useQuery(api.keyring.get)
  const me = useQuery(api.users.me)

  if (keyring === undefined) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    )
  }

  const used = keyring?.paperUsedAt != null

  return (
    <Screen>
      <BackButton label={common.back} />

      <Text variant="screenTitle" className="mt-4">
        {t.sheetTitle}
      </Text>

      {keyring === null ? null : (
        <RecoveryCodeDisplay
          className="mt-header"
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
        <Text className="text-terracotta-800 mt-4 text-[14.5px] font-body-bold">
          {t.sheetUsed}
        </Text>
      ) : keyring !== null && keyring.paperPrintedAt === null ? (
        <Text className="text-terracotta-800 mt-4 text-[14.5px] font-body-bold">
          {t.sheetNeverPrinted}
        </Text>
      ) : null}

      <Text className="mt-header text-[14.5px] leading-[1.75] text-muted-foreground">
        {t.sheetCannotShow}
      </Text>

      <View className="grow" />

      <Text variant="sectionLabel" className="mb-2">
        {t.sheetReissueTitle}
      </Text>
      <Text className="mb-4 text-[14px] leading-[1.7] text-muted-foreground">
        {t.sheetReissueBody}
      </Text>
      <Button onPress={() => router.push("/setup/recovery-kit")}>
        <Text>{t.sheetReissueAction}</Text>
      </Button>
    </Screen>
  )
}
