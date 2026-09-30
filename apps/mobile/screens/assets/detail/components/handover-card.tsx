import { useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { router } from "expo-router"
import { Pressable, View } from "react-native"

import { useStrings } from "@/i18n/use-strings"
import { useSetHandover } from "@/lib/release-key"
import { ChipRow } from "@workspace/ui-native/components/wassiya/chip-row"

/**
 * The one enclosed thing on the asset screen, because it is the one instruction
 * that outlives the owner: handed over to the executors, or private.
 *
 * Handed over with no executor named reaches nobody — no delivery is ever
 * created — so that case says so, in the one colour kept for something still
 * to fix.
 */
export function HandoverCard({
  assetId,
  className,
}: {
  assetId: Id<"assets">
  className?: string
}) {
  const { t } = useStrings("assets/handover")
  const asset = useQuery(api.assets.get, { assetId })
  const executors = useQuery(api.executors.list)
  const setHandover = useSetHandover()
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  if (asset == null) return null

  const noExecutor = executors !== undefined && executors.length === 0

  async function choose(value: string) {
    const handedOver = value === "handedOver"
    if (busy || asset == null || handedOver === asset.handedOver) return
    setBusy(true)
    setFailed(false)
    try {
      await setHandover(
        { assetId, dekWrappedByMk: asset.dekWrappedByMk },
        handedOver
      )
    } catch {
      setFailed(true)
    } finally {
      setBusy(false)
    }
  }

  // The chip already says "handed over"; only the two states with a
  // consequence the owner may not expect get a line.
  const body = !asset.handedOver ? t.privateBody : noExecutor ? t.noExecutor : null

  return (
    <View
      className={cn(
        "rounded-card gap-3 p-4",
        asset.handedOver && noExecutor ? "bg-terracotta-100" : "bg-card",
        className
      )}
    >
      <ChipRow
        label={t.label}
        options={[
          { value: "handedOver", label: t.handedOver! },
          { value: "private", label: t.private! },
        ]}
        value={asset.handedOver ? "handedOver" : "private"}
        onChange={(value) => void choose(value)}
      />
      {body !== null ? (
        <Text
          variant="metaSm"
          className={asset.handedOver && noExecutor ? "text-terracotta-800" : undefined}
        >
          {body}
        </Text>
      ) : null}
      {asset.handedOver && noExecutor ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/executors/new")}
          hitSlop={8}
          className="self-start"
        >
          <Text variant="action">{t.addExecutor}</Text>
        </Pressable>
      ) : null}
      {failed ? (
        <Text variant="meta" className="text-terracotta-800">
          {t.changeFailed}
        </Text>
      ) : null}
    </View>
  )
}
