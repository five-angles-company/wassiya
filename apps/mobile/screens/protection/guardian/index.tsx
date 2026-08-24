/**
 * ٦.٢ — the guardian, owner side.
 *
 * This screen closes the product's largest hole. Until a guardian holds
 * S_guardian, K_rec = S_paper ⊕ S_guardian can only be rebuilt on the phone
 * that generated it — so losing the phone loses the vault, and the recovery
 * sheet printed in section ٢ promises something the system cannot do.
 *
 * Three states, in order: no guardian, invited-and-waiting, accepted-but-not-
 * yet-sealed. The last one is the one that matters and is easy to miss —
 * accepting only publishes the guardian's *public* key. The share is sealed by
 * the owner, on the owner's device, behind the owner's biometric, and until
 * that happens recovery is still broken. So it is a prompt, not a status line.
 *
 * The invite token deliberately travels **out of band**: the server issues it
 * once and never sees the channel it is sent over, which is what stops the
 * deployment from being able to enrol a guardian of its own choosing.
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
import { Alert, ScrollView, Share, View } from "react-native"

import { BackButton } from "@/components/back-button"
import { Field } from "@/components/field"
import { useStrings } from "@/i18n/use-strings"
import { useGuardianSeal } from "@/screens/protection/guardian/use-guardian-seal"

export function GuardianScreen() {
  const { t } = useStrings("protection/guardian")
  const { t: common } = useStrings("common")
  const guardians = useQuery(api.guardians.list)
  const invite = useMutation(api.guardians.invite)
  const revoke = useMutation(api.guardians.revoke)
  const { state: sealState, seal } = useGuardianSeal(t.sealTitle)

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
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="px-gutter grow pb-10 pt-4"
    >
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
              <StatusPill
                status={
                  active.status === "accepted" ? "confirmed" : "waiting"
                }
              >
                {active.status === "accepted"
                  ? active.hasPublicKey
                    ? t.statusAccepted
                    : t.statusAccepted
                  : t.statusInvited}
              </StatusPill>
            </View>
            <Text variant="metaSm" className="text-muted-foreground">
              {active.relation}
            </Text>
          </View>

          {/* Accepted but unsealed — recovery is still broken here, and this
              is the prompt that finishes it. */}
          {active.status === "accepted" && active.hasPublicKey ? (
            sealState === "done" ? (
              <AlertBanner variant="success" description={t.sealDone} />
            ) : (
              <View className="rounded-card bg-terracotta-100 gap-3 p-4">
                <Text variant="rowTitle" className="text-terracotta-800">
                  {t.sealTitle}
                </Text>
                <Text
                  variant="metaSm"
                  className="text-terracotta-800 leading-[1.7]"
                >
                  {t.sealBody.replace("{name}", active.name)}
                </Text>
                <Button
                  size="sm"
                  onPress={() =>
                    void seal(active.id, active.publicKey ?? new ArrayBuffer(0))
                  }
                  disabled={sealState === "sealing"}
                >
                  <Text>{sealState === "sealing" ? t.sealing : t.seal}</Text>
                </Button>
                {sealState === "failed" || sealState === "keyLost" ? (
                  <Text variant="metaSm" className="text-terracotta-800">
                    {sealState === "keyLost" ? t.sealKeyLost : t.sealFailed}
                  </Text>
                ) : null}
              </View>
            )
          ) : null}

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
          <Text variant="metaSm" className="text-muted-foreground leading-[1.7]">
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
    </ScrollView>
  )
}
