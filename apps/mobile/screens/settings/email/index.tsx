/**
 * ٩.١c — changing the email, which is the sign-in identity for the vault
 * (`signIn.emailCode.sendCode`), not a contact detail on a profile.
 *
 * Five calls, not a save: `createEmailAddress` → `prepareVerification` →
 * `attemptVerification` → `update({ primaryEmailAddressId })` → old `destroy()`.
 * The old address is destroyed because a verified address stays a usable
 * sign-in identifier, so leaving it would mean two ways into the vault where the
 * owner believes there is one. Convex follows on its own via `upsertFromClerk`.
 *
 * `createEmailAddress` writes to the account immediately, so an abandoned run
 * leaves an unverified address behind and the next attempt at it fails as a
 * duplicate. Both the cancel path and unmount destroy it.
 *
 * Deliberately not behind a fingerprint: the code goes to the *new* address, so
 * it proves control of that inbox, not ownership — a gate here would defend
 * nothing an unlocked phone does not already give away. The owner chose this;
 * do not add one without asking.
 */
import { useEffect, useRef, useState } from "react"
import { isClerkAPIResponseError, useUser } from "@clerk/expo"
import { Text } from "@workspace/ui-native/components/ui/text"
import { AlertBanner } from "@workspace/ui-native/components/wassiya/alert-banner"
import { OtpInput } from "@workspace/ui-native/components/wassiya/otp-input"
import { PrimaryCta } from "@workspace/ui-native/components/wassiya/primary-cta"
import { router } from "expo-router"
import { Pressable, View } from "react-native"

import { BackButton } from "@/components/back-button"
import { Field } from "@/components/field"
import { Screen } from "@/components/screen"
import { useStrings } from "@/i18n/use-strings"

const CODE_LENGTH = 6

/**
 * `@clerk/expo` re-exports the hooks but not the resource types, and
 * `@clerk/types` is not a dependency of this app. Derived from the method that
 * produces it, so it cannot drift from the version actually installed.
 */
type ClerkUser = NonNullable<ReturnType<typeof useUser>["user"]>
type EmailAddressResource = Awaited<
  ReturnType<ClerkUser["createEmailAddress"]>
>

export function EmailChangeScreen() {
  const { t, locale } = useStrings("settings/email")
  const { t: common } = useStrings("common")
  const { user } = useUser()

  const current = user?.primaryEmailAddress?.emailAddress ?? ""

  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [pending, setPending] = useState<EmailAddressResource | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [wrong, setWrong] = useState(false)

  /**
   * The unverified address must not outlive this screen.
   *
   * Held in a ref as well as state because the cleanup runs on unmount, where
   * the closed-over state value is the one from the render that registered the
   * effect — the ref is the only thing that reads *current* at teardown.
   */
  const pendingRef = useRef<EmailAddressResource | null>(null)
  const committed = useRef(false)
  useEffect(
    () => () => {
      if (!committed.current) void pendingRef.current?.destroy()
    },
    []
  )

  const setPendingAddress = (address: EmailAddressResource | null) => {
    pendingRef.current = address
    setPending(address)
  }

  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  const same = email.trim().toLowerCase() === current.toLowerCase()

  async function send() {
    if (!valid || same || user == null) return
    setBusy(true)
    setError(null)
    try {
      const address = await user.createEmailAddress({ email: email.trim() })
      await address.prepareVerification({ strategy: "email_code" })
      setPendingAddress(address)
    } catch (cause) {
      // Resource methods reject; only the sign-in/sign-up flows return `{ error }`.
      setError(
        isClerkAPIResponseError(cause) &&
          cause.errors[0]?.code === "form_identifier_exists"
          ? t.taken!
          : t.failed!
      )
    } finally {
      setBusy(false)
    }
  }

  async function confirm(value: string) {
    if (pending === null || user == null || busy) return
    setBusy(true)
    setWrong(false)
    setError(null)
    try {
      await pending.attemptVerification({ code: value })
      await user.update({ primaryEmailAddressId: pending.id })

      // Only now is the flow past the point where cleanup would undo it.
      committed.current = true

      // The old address stays a usable sign-in identifier until it is gone, so
      // this is not tidying — it is the half of the change that closes the
      // other door into the vault.
      const old = user.emailAddresses.find(
        (address) => address.id !== pending.id
      )
      await old?.destroy()

      router.back()
    } catch (cause) {
      if (isClerkAPIResponseError(cause)) setWrong(true)
      else setError(t.failed!)
      setBusy(false)
    }
  }

  async function cancel() {
    await pendingRef.current?.destroy()
    setPendingAddress(null)
    setCode("")
    setWrong(false)
  }

  return (
    <Screen keyboard contentClassName="gap-header">
      <BackButton label={common.back} />
      <Text variant="screenTitle">
        {pending === null ? t.title : t.codeTitle}
      </Text>

      {pending === null ? (
        <View className="gap-4">
          <Text variant="metaSm" className="text-muted-foreground">
            {t.currentLabel} · {current}
          </Text>

          {/* Before the field, not after it: the consequence should be read
              while deciding, not once the address is already typed. */}
          <AlertBanner variant="security" description={t.notice!} />

          <Field
            label={t.newLabel}
            placeholder={t.newPlaceholder}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            className="text-left"
            error={
              same
                ? t.same
                : email.length > 0 && !valid
                  ? t.invalid
                  : (error ?? undefined)
            }
          />

          <PrimaryCta
            label={busy ? t.sending! : t.sendCode!}
            onPress={() => void send()}
            disabled={!valid || same}
            busy={busy}
          />
        </View>
      ) : (
        <View className="gap-4">
          <Text variant="prose" className="text-muted-foreground">
            {t.codeSubtitle!.replace("{email}", email.trim())}
          </Text>

          <OtpInput
            value={code}
            onChangeText={(next) => {
              setCode(next)
              if (wrong) setWrong(false)
            }}
            length={CODE_LENGTH}
            state={
              wrong ? "wrong" : code.length === 0 ? "empty" : "partial"
            }
            onComplete={(value) => void confirm(value)}
            autoFocus
            locale={locale}
          />

          {wrong ? (
            <Text variant="meta" className="text-terracotta-800">
              {t.wrongCode}
            </Text>
          ) : null}
          {error !== null ? (
            <Text variant="meta" className="text-terracotta-800">
              {error}
            </Text>
          ) : null}

          {/* Cancelling is what removes the half-made address from the account,
              so it is a real action here rather than just "go back". */}
          <Pressable
            accessibilityRole="button"
            onPress={() => void cancel()}
            disabled={busy}
            className="bg-card mb-auto h-[50px] items-center justify-center rounded-full active:opacity-80"
          >
            <Text className="text-[15.5px] opacity-55">{t.cancel}</Text>
          </Pressable>
        </View>
      )}
    </Screen>
  )
}
