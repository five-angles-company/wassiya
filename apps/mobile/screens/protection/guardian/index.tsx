/**
 * ٦.٢ — the guardian, owner side. The only guardian screen in this app, because
 * it is the only one an owner performs.
 *
 * A guardian is not for recovery — `K_rec = S_paper`, so the sheet rebuilds the
 * vault alone. They are for *delivery*: they hold half of every heir's `K_h`
 * and they file the death claim. A vault with heirs and no guardian releases a
 * box nobody can open.
 *
 * Two states, and the second is a wait the owner cannot end: accepting happens
 * in the web app, where the invited person mints their own key. The screen says
 * so plainly, and `use-protection-score` marks the item blocked so it never
 * becomes Home's one amber row.
 *
 * The invite token travels **out of band** — the server issues it once and
 * never sees the channel — which is what stops the deployment from enrolling a
 * guardian of its own choosing.
 */
import { useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import { Button } from "@workspace/ui-native/components/ui/button"
import { Text } from "@workspace/ui-native/components/ui/text"
import { AlertBanner } from "@workspace/ui-native/components/wassiya/alert-banner"
import { StatusPill } from "@workspace/ui-native/components/wassiya/status-pill"
import { isolateLtr } from "@workspace/ui-native/lib/rtl"
import * as Sharing from "expo-sharing"
import { Alert, Share, View } from "react-native"

import { BackButton } from "@/components/back-button"
import { Field } from "@/components/field"
import { Screen } from "@/components/screen"
import { useStrings } from "@/i18n/use-strings"

export function GuardianScreen() {
  const { t } = useStrings("protection/guardian")
  const { t: common } = useStrings("common")
  const guardians = useQuery(api.guardians.list)
  const invite = useMutation(api.guardians.invite)
  const revoke = useMutation(api.guardians.revoke)

  const [name, setName] = useState("")
  const [relation, setRelation] = useState("")
  const [inviting, setInviting] = useState(false)
  const [token, setToken] = useState<string | null>(null)

  // The one that matters is the live one; revoked rows stay for the audit
  // trail and must not be mistaken for protection.
  const active = guardians?.find((g) => g.status !== "revoked") ?? null

  async function createInvite() {
    setInviting(true)
    try {
      const result = await invite({ name: name.trim(), relation: relation.trim() })
      setToken(result.inviteToken)
    } catch {
      // The list is the source of truth; a failed invite leaves it unchanged.
    } finally {
      setInviting(false)
    }
  }

  async function shareInvite(inviteToken: string, guardianName: string) {
    const message = t.inviteMessage
      .replace("{token}", inviteToken)
      .replace("{name}", guardianName)
    // `Share` rather than `Sharing`: this is text, and the OS sheet is what
    // lets the owner pick a channel they actually trust.
    if (await Sharing.isAvailableAsync().catch(() => false)) {
      await Share.share({ message })
    } else {
      await Share.share({ message })
    }
  }

  function confirmRevoke(guardianId: Id<"guardians">) {
    Alert.alert(t.revokeTitle, t.revokeBody, [
      { text: t.cancel, style: "cancel" },
      {
        text: t.revokeConfirm,
        style: "destructive",
        onPress: () => void revoke({ guardianId }),
      },
    ])
  }

  return (
    <Screen>
      <BackButton label={common.back} />
      <Text variant="screenTitle" className="mt-4">
        {t.title}
      </Text>
      <Text className="mt-3 text-[14.5px] leading-[1.7] text-muted-foreground">
        {t.intro}
      </Text>

      {/* The model in one sentence. Without it a guardian reads as a second
          password holder rather than half of a two-part key. */}
      <View className="rounded-card bg-olive-100 mt-4 p-4">
        <Text variant="metaSm" className="text-olive-700 leading-[1.75]">
          {t.howItWorks}
        </Text>
      </View>

      {active === null ? (
        <View className="mt-header gap-4">
          <Field
            label={t.nameLabel}
            placeholder={t.namePlaceholder}
            value={name}
            onChangeText={setName}
          />
          <Field
            label={t.relationLabel}
            placeholder={t.relationPlaceholder}
            value={relation}
            onChangeText={setRelation}
          />
          <Button
            onPress={() => void createInvite()}
            disabled={inviting || name.trim().length === 0}
          >
            <Text>{inviting ? t.inviting : t.invite}</Text>
          </Button>
        </View>
      ) : (
        <View className="mt-header gap-4">
          <View className="rounded-card bg-card gap-2 p-4">
            <View className="flex-row items-center justify-between">
              <Text variant="rowTitle">{active.name}</Text>
              {/* Accepted *and* holding a published key is the only state that
                  can receive an heir's share. Accepted without one cannot, so
                  it reads as waiting rather than done. */}
              <StatusPill
                status={
                  active.status === "accepted" && active.hasPublicKey
                    ? "confirmed"
                    : "waiting"
                }
              >
                {active.status === "accepted" && active.hasPublicKey
                  ? t.statusAccepted
                  : t.statusInvited}
              </StatusPill>
            </View>
            <Text variant="metaSm" className="text-muted-foreground">
              {active.relation}
            </Text>
          </View>

          {/* The wait, named. It is not a step the owner has left undone —
              accepting happens on the web, and there is nothing to tap here. */}
          {active.status === "accepted" && active.hasPublicKey ? (
            <AlertBanner variant="success" description={t.acceptedBody} />
          ) : (
            <AlertBanner variant="info" description={t.awaitingAcceptance} />
          )}

          <Button variant="destructive" onPress={() => confirmRevoke(active.id)}>
            <Text>{t.revoke}</Text>
          </Button>
        </View>
      )}

      {/* The token, once. It is shown rather than auto-sent because the owner
          picking the channel is the security property. */}
      {token !== null ? (
        <View className="rounded-card bg-card mt-4 gap-3 p-4">
          <Text variant="rowTitle">{t.inviteReady}</Text>
          <Text variant="footnote">
            {t.inviteBody.replace("{name}", name.trim())}
          </Text>
          <Text className="font-latin-medium text-[15px] tracking-[1px]">
            {isolateLtr(token)}
          </Text>
          <Button size="sm" onPress={() => void shareInvite(token, name.trim())}>
            <Text>{t.share}</Text>
          </Button>
        </View>
      ) : null}
    </Screen>
  )
}
