/**
 * ٤.٩ — one asset: its sections as cards, each opening the step that edits it.
 *
 * The cards say what is stored without showing a secret: a phrase is "١٢
 * كلمة", a password is "محفوظة". Showing one means opening its step, where
 * each secret keeps its own guard — the phrase behind a fingerprint, a password
 * behind its eye, and every reveal written to the audit log.
 */
import { useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { PrimaryCta } from "@workspace/ui-native/components/wassiya/primary-cta"
import { ScreenTop } from "@workspace/ui-native/components/wassiya/screen-top"
import { fmtDate } from "@workspace/ui-native/lib/format"
import { cn } from "@workspace/ui-native/lib/utils"
import {
  ChevronRight,
  Lock,
  MoreVertical,
  type LucideIcon,
} from "lucide-react-native"
import { router } from "expo-router"
import { Pressable, View } from "react-native"

import { LoadingScreen } from "@/components/loading-screen"
import { Screen } from "@/components/screen"
import { ScreenHeader } from "@/components/screen-header"
import { useVaultGate } from "@/hooks/use-vault-gate"
import { useStrings } from "@/i18n/use-strings"
import { DeleteAssetSheet } from "@/screens/assets/detail/components/delete-asset-sheet"
import { HandoverCard } from "@/screens/assets/detail/components/handover-card"
import type { EditorLoad } from "@/screens/assets/detail/use-asset-editor"
import type { AssetSection } from "@/screens/assets/flow/types"

export type AssetOverviewFrameProps = {
  assetId: Id<"assets">
  load: EditorLoad
  icon: LucideIcon
  /** The type's name, under the title. */
  kindLine: string
  /** `null` when the payload could not be read. */
  sections: AssetSection[] | null
  handedOver: boolean
}

export function AssetOverviewFrame({
  assetId,
  load,
  icon,
  kindLine,
  sections,
  handedOver,
}: AssetOverviewFrameProps) {
  const { t, locale } = useStrings("assets/detail")
  const { t: vault } = useStrings("assets")
  const { t: common } = useStrings("common")
  const { unlock, status } = useVaultGate()
  const lastRevealed = useQuery(api.assets.lastRevealedAt, { assetId })
  const [confirming, setConfirming] = useState(false)

  const top = (
    <ScreenTop
      backLabel={common.back}
      onBack={() =>
        router.canGoBack() ? router.back() : router.replace("/assets")
      }
      action={{
        icon: MoreVertical,
        label: t.more!,
        onPress: () => setConfirming(true),
      }}
      className="mb-4"
    />
  )

  if (load.status === "loading") return <LoadingScreen back="/assets" />

  if (load.status === "locked") {
    return (
      <Screen
        footer={
          <PrimaryCta
            label={vault.unlockCta!}
            onPress={unlock}
            busy={status === "unlocking"}
          />
        }
      >
        {top}
        <Text variant="prose">{vault.lockedBody}</Text>
      </Screen>
    )
  }

  const title = load.title.length > 0 ? load.title : t.revealFailed!

  return (
    <Screen>
      {top}

      <ScreenHeader
        eyebrow={kindLine}
        title={title}
        trailing={
          <View className="size-13 shrink-0 items-center justify-center rounded-full bg-card">
            <Icon
              as={icon}
              size={23}
              strokeWidth={2.75}
              className="text-foreground"
            />
          </View>
        }
      />

      {sections === null ? (
        <Text variant="meta" className="mb-6 text-terracotta-800">
          {t.revealFailed}
        </Text>
      ) : (
        <View className="gap-row mb-3">
          {sections.map((section) => (
            <Pressable
              key={section.step}
              accessibilityRole="button"
              accessibilityLabel={section.label}
              onPress={() =>
                router.push({
                  pathname: "/assets/[id]/edit",
                  params: { id: assetId, step: section.step },
                })
              }
              className="flex-row items-center gap-3 rounded-card bg-card px-4 py-3.5 active:opacity-85"
            >
              <View className="min-w-0 flex-1 gap-1">
                <Text variant="metaSm">{section.label}</Text>
                <Text
                  variant="rowTitle"
                  numberOfLines={2}
                  className={cn(
                    section.empty === true && "font-body text-muted-foreground"
                  )}
                >
                  {section.value}
                </Text>
              </View>
              {section.secret === true ? (
                <Icon
                  as={Lock}
                  className="size-4 shrink-0 text-muted-foreground"
                />
              ) : null}
              <Icon
                as={ChevronRight}
                flip
                className="size-4 shrink-0 text-muted-foreground"
              />
            </Pressable>
          ))}
        </View>
      )}

      <HandoverCard assetId={assetId} className="mb-3" />

      <Text variant="footnote" className="mb-auto">
        {lastRevealed == null
          ? t.neverRevealed
          : t.lastRevealedLine!.replace(
              "{date}",
              fmtDate(new Date(lastRevealed), locale)
            )}
      </Text>

      {/* Quiet — deleting is available, never suggested. */}
      <PrimaryCta
        tone="quiet"
        className="mt-5"
        label={t.deleteLabel!}
        onPress={() => setConfirming(true)}
      />

      <DeleteAssetSheet
        assetId={assetId}
        name={load.title}
        open={confirming}
        onClose={() => setConfirming(false)}
        handedOver={handedOver}
      />
    </Screen>
  )
}
