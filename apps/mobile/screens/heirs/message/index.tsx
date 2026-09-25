/**
 * ٥.٤ — a personal message to one heir.
 *
 * Sealed on this device under a fresh message key (`@workspace/crypto/message`);
 * the key is stored wrapped by MK so the owner's devices can re-read it, and
 * sealed to the escrow key for this heir at release. The plaintext never leaves
 * the device.
 */
import { useEffect, useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import { generateDek } from "@workspace/crypto/keys"
import { openMessage, sealMessage } from "@workspace/crypto/message"
import { unwrap, wrap } from "@workspace/crypto/wrap"
import { Text } from "@workspace/ui-native/components/ui/text"
import { PrimaryCta } from "@workspace/ui-native/components/wassiya/primary-cta"
import { router, useLocalSearchParams } from "expo-router"
import { Pressable, TextInput, View } from "react-native"

import { BackButton } from "@/components/back-button"
import { Screen } from "@/components/screen"
import { useStrings } from "@/i18n/use-strings"
import { downloadCiphertext, uploadCiphertext } from "@/lib/asset-upload"
import { ensureWebCrypto } from "@/lib/crypto-polyfill"
import { sealForRelease } from "@/lib/escrow-key"
import { useVault } from "@/stores/vault"

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.slice().buffer
}

export function HeirMessageScreen() {
  const { t } = useStrings("heirs/message")
  const { t: common } = useStrings("common")
  const { id } = useLocalSearchParams<{ id: string }>()
  const heirId = id as Id<"heirs">
  const mk = useVault((state) => state.mk)

  const me = useQuery(api.users.me)
  const heirs = useQuery(api.heirs.list)
  const heir = heirs?.find((row) => row.id === heirId)
  const saved = useQuery(api.heirs.message, { heirId })
  const generateUploadUrl = useMutation(api.assets.generateUploadUrl)
  const setMessage = useMutation(api.heirs.setMessage)
  const clearMessage = useMutation(api.heirs.clearMessage)

  const [text, setText] = useState("")
  const [opened, setOpened] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Nothing saved means there is nothing to open first.
  const nothingSaved = saved === null || saved?.url === null
  const loaded = opened || nothingSaved

  // Open the saved message once, so editing starts from what is stored.
  useEffect(() => {
    if (opened || saved == null || saved.url === null || mk === null) return
    const url = saved.url
    void (async () => {
      let key: Uint8Array | undefined
      try {
        key = unwrap(new Uint8Array(saved.messageKeyWrappedByMk), mk)
        setText(openMessage(await downloadCiphertext(url), key))
      } catch {
        setError(t.loadFailed!)
      } finally {
        key?.fill(0)
        setOpened(true)
      }
    })()
  }, [saved, mk, opened, t])

  async function save() {
    if (mk === null || me == null) return
    setBusy(true)
    setError(null)
    // Before the key: Hermes has no Web Crypto global and `generateDek`
    // refuses to run without one.
    ensureWebCrypto()
    const key = generateDek()
    try {
      const sealed = sealMessage(text.trim(), key)
      const storageId = await uploadCiphertext(sealed, await generateUploadUrl())
      const messageKeyWrappedByMk = toArrayBuffer(wrap(key, mk))
      const escrow = sealForRelease(messageKeyWrappedByMk, {
        ownerId: me.id,
        messageForHeirId: heirId,
      })
      await setMessage({
        heirId,
        kind: "text",
        storageId: storageId as Id<"_storage">,
        messageKeyWrappedByMk,
        messageKeyEscrowed: escrow.sealed,
        escrowKeyId: escrow.escrowKeyId,
      })
      router.back()
    } catch {
      setError(t.failed!)
    } finally {
      key.fill(0)
      setBusy(false)
    }
  }

  async function remove() {
    setBusy(true)
    try {
      await clearMessage({ heirId })
      router.back()
    } catch {
      setError(t.failed!)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Screen keyboard contentClassName="gap-header">
      <BackButton label={common.back} />
      <View className="gap-3">
        <Text variant="screenTitle">
          {t.title!.replace("{name}", heir?.name ?? "")}
        </Text>
        <Text variant="prose" className="text-muted-foreground">
          {t.lede}
        </Text>
      </View>

      {mk === null ? (
        <Text variant="metaSm" className="text-terracotta-700">
          {t.locked}
        </Text>
      ) : (
        <TextInput
          value={text}
          onChangeText={setText}
          editable={loaded && !busy}
          placeholder={t.placeholder}
          placeholderTextColor="#82796a"
          multiline
          textAlignVertical="top"
          className="bg-card border-border rounded-card text-foreground min-h-60 border p-4 text-[15.5px] leading-[1.9]"
        />
      )}

      {error !== null ? (
        <Text variant="meta" className="text-terracotta-800">
          {error}
        </Text>
      ) : null}

      <View className="mb-auto" />

      <PrimaryCta
        label={t.save!}
        onPress={() => void save()}
        disabled={mk === null || !loaded || text.trim().length === 0}
        busy={busy}
      />
      {saved !== null && saved !== undefined ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => void remove()}
          disabled={busy}
          className="bg-card h-[50px] items-center justify-center rounded-full active:opacity-80"
        >
          <Text className="text-[15.5px] opacity-55">{t.remove}</Text>
        </Pressable>
      ) : null}
    </Screen>
  )
}
