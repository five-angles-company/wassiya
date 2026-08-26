/**
 * ٤.٩ — one asset. The page every type fills in.
 *
 * ## The asset screen *is* the edit screen
 *
 * There is no view mode, no pencil, no edit route. Tap a value and you are
 * editing it. Save appears only once something has changed, and Cancel takes
 * the overflow menu's place in the header — so the two ways out are always in
 * the same two positions and neither has to be hunted for.
 *
 * ## No cards around fields
 *
 * Labels and values on hairlines, so the screen reads as a page rather than a
 * stack of panels. The **recipient card is the one enclosed thing**, because it
 * is the one thing on the screen that leaves this device: the fields are the
 * owner's own record, and that card is the instruction that outlives them.
 *
 * ## Three levels of protection, three sizes of control
 *
 * The seed phrase gets a filled Reveal button behind a fingerprint, a password
 * gets a plain eye, a storage location gets nothing at all. No copy explains
 * the difference because the controls already do — which is why each type's
 * fields decide their own, and this frame only holds them.
 */
import { useState, type ReactNode } from "react"
import { useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import { Text } from "@workspace/ui-native/components/ui/text"
import { PrimaryCta } from "@workspace/ui-native/components/wassiya/primary-cta"
import { RecipientCard } from "@workspace/ui-native/components/wassiya/recipient-card"
import { ScreenTop } from "@workspace/ui-native/components/wassiya/screen-top"
import { ScreenTopAction } from "@workspace/ui-native/components/wassiya/screen-top-action"
import { fmtDate } from "@workspace/ui-native/lib/format"
import { cn } from "@workspace/ui-native/lib/utils"
import { MoreVertical } from "lucide-react-native"
import { router } from "expo-router"
import { Alert, Pressable, View } from "react-native"

import { Screen } from "@/components/screen"
import { useSecureScreen } from "@/hooks/use-secure-screen"
import { useStrings } from "@/i18n/use-strings"
import { DeleteAssetSheet } from "@/screens/assets/detail/components/delete-asset-sheet"
import { useAssetRecipients } from "@/screens/assets/detail/use-asset-recipients"
import type { EditorLoad, SaveError } from "@/screens/assets/detail/use-asset-editor"

export type AssetEditFrameProps = {
  assetId: Id<"assets">
  load: EditorLoad
  saving: boolean
  error: SaveError | null
  /** Unsaved edits are in hand: Save appears, Cancel replaces the menu. */
  dirty: boolean
  /** Blocks Save while a value is invalid — an IBAN that fails mod-97. */
  canSave: boolean
  onSave: () => void
  /** Drop the edits and re-read from storage. */
  onCancel: () => void
  /** The type's rows, or `null` when its parser refused the payload. */
  children: ReactNode | null
  /** "محفظة رقمية · Bitcoin" — the type line under the name. */
  kindLine: string
}

export function AssetEditFrame({
  assetId,
  load,
  saving,
  error,
  dirty,
  canSave,
  onSave,
  onCancel,
  children,
  kindLine,
}: AssetEditFrameProps) {
  const { t, locale } = useStrings("assets/detail")
  const { t: common } = useStrings("common")
  // The screen can put a password on display, so the guard covers all of it
  // rather than only the moment an eye is tapped.
  useSecureScreen("assets/detail")

  const lastRevealed = useQuery(api.assets.lastRevealedAt, { assetId })
  const { names, allHeirs } = useAssetRecipients(assetId)
  const [confirming, setConfirming] = useState(false)

  function leave() {
    if (router.canGoBack()) return router.back()
    router.replace("/assets")
  }

  function back() {
    if (!dirty) return leave()
    Alert.alert(t.discardTitle, t.discardBody, [
      { text: t.keepEditing, style: "cancel" },
      { text: t.discardConfirm, style: "destructive", onPress: leave },
    ])
  }

  const top = (
    <ScreenTop
      backLabel={common.back}
      onBack={back}
      trailing={
        dirty ? (
          <ScreenTopAction label={t.cancel!} onPress={onCancel} />
        ) : undefined
      }
      action={
        dirty
          ? undefined
          : { icon: MoreVertical, label: t.more!, onPress: () => setConfirming(true) }
      }
      className={dirty ? "mb-[22px]" : "mb-6"}
    />
  )

  if (load.status === "loading" || load.status === "locked") {
    return (
      <Screen scroll={false} bleed contentClassName="px-[22px] pt-5">
        {top}
        <Text variant="meta">
          {load.status === "locked" ? t.saveLocked : common.loading}
        </Text>
      </Screen>
    )
  }

  const unreadable = load.status === "unreadable" || children === null

  return (
    <Screen keyboard bleed contentClassName="px-[22px] pt-5">
      {top}

      {/* The title shrinks by 2px while editing, which is what buys the row
          the keyboard takes. Nothing else in the header moves. */}
      <Text
        numberOfLines={3}
        className={cn(
          "font-heading-extrabold text-foreground leading-[1.25]",
          dirty ? "mb-1 text-[26px]" : "mb-[5px] text-[28px]"
        )}
      >
        {load.title.length > 0 ? load.title : t.revealFailed}
      </Text>
      <Text className={cn("text-[13px] opacity-50", dirty ? "mb-[22px]" : "mb-[26px]")}>
        {kindLine}
      </Text>

      {unreadable ? (
        <Text variant="meta" className="text-terracotta-800">
          {t.revealFailed}
        </Text>
      ) : (
        <View className={dirty ? "mb-4" : "mb-[22px]"}>{children}</View>
      )}

      {dirty ? (
        <PrimaryCta
          label={t.save!}
          onPress={onSave}
          disabled={!canSave}
          busy={saving}
          className="mb-4"
        />
      ) : null}

      <RecipientCard
        label={t.receivedBy!}
        value={names.length > 0 ? names.join(locale === "ar" ? " و" : " and ") : t.nobodyYet!}
        faces={names}
        allHeirsLabel={allHeirs ? t.allHeirsShort : undefined}
        unrouted={names.length === 0 && !allHeirs}
        onPress={() =>
          router.push({ pathname: "/assets/[id]/recipients", params: { id: assetId } })
        }
        className="mb-3"
      />

      <Text className="mb-auto text-[11.5px] leading-[1.6] opacity-45">
        {lastRevealed == null
          ? t.neverRevealed
          : t.lastRevealedLine!.replace(
              "{date}",
              fmtDate(new Date(lastRevealed), locale)
            )}
      </Text>

      {error !== null ? (
        <Text variant="meta" className="text-terracotta-800 mt-4">
          {error === "locked" ? t.saveLocked : t.saveFailed}
        </Text>
      ) : null}

      {/* Quiet, surface-toned, and the same height as a row — deleting is
          available, never suggested. */}
      <Pressable
        accessibilityRole="button"
        onPress={() => setConfirming(true)}
        className="bg-card mt-5 h-[50px] items-center justify-center rounded-full active:opacity-80"
      >
        <Text className="text-[15.5px] opacity-55">{t.deleteLabel}</Text>
      </Pressable>

      <DeleteAssetSheet
        assetId={assetId}
        name={load.title}
        open={confirming}
        onClose={() => setConfirming(false)}
        recipients={names}
      />
    </Screen>
  )
}
