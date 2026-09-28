import { useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import { Text } from "@workspace/ui-native/components/ui/text"
import { PrimaryCta } from "@workspace/ui-native/components/wassiya/primary-cta"
import { RecoveryCodeDisplay } from "@workspace/ui-native/components/wassiya/recovery-code-display"
import * as Print from "expo-print"
import { Redirect, router } from "expo-router"
import {
  usePreventScreenCapture,
  useScreenshotListener,
} from "expo-screen-capture"
import * as Sharing from "expo-sharing"
import { Fingerprint } from "lucide-react-native"
import { useCallback, useMemo, useState } from "react"
import { View } from "react-native"

import { CenteredNote } from "@/components/centered-note"
import { LoadingScreen } from "@/components/loading-screen"
import { Screen } from "@/components/screen"
import { ScreenHeader } from "@/components/screen-header"
import { SetupStepMeter } from "@/components/setup-step-meter"
import { useStrings } from "@/i18n/use-strings"
import { buildRecoverySheetHtml } from "@/lib/recovery-sheet-html"
import { SETUP_STEP_INDEX } from "@/lib/setup-flow"
import { KitActions } from "@/screens/setup/recovery-kit/components/kit-actions"
import { KitQr } from "@/screens/setup/recovery-kit/components/kit-qr"
import { useRecoveryMaterial } from "@/screens/setup/recovery-kit/use-recovery-material"

/**
 * 2.4 — the printed recovery sheet, and ٩.٥'s reissue of it.
 *
 * `setup` is the onboarding step and ends on 2.6; `reissue` is reached from
 * the app (settings, a used sheet, a recovery alert) and returns there.
 *
 * Screen capture is blocked for the screen's lifetime, and the code never
 * reaches the clipboard, a log or analytics. `S_paper` exists only in this
 * render; once the owner confirms the sheet it is gone for good.
 */
export function RecoveryKitScreen({ mode }: { mode: "setup" | "reissue" }) {
  const { t, locale } = useStrings("setup/recovery-kit")
  const { t: common } = useStrings("common")

  usePreventScreenCapture()

  const me = useQuery(api.users.me)
  const keyring = useQuery(api.keyring.get)

  // Nothing may start until both queries have answered: the owner's id and the
  // current paper version are bound into the wrapper's AAD, and a wrapper built
  // from a stale version fails to open in a way indistinguishable from a wrong
  // sheet. `undefined` is "still loading"; `null` is "no keyring yet", which is
  // a real answer and starts the first issue.
  const recoveryContext = useMemo(
    () =>
      me == null || keyring === undefined
        ? null
        : { userId: me.id, currentPaperVersion: keyring?.paperVersion ?? null },
    [me, keyring]
  )
  const { state, commit, wipe, retry } = useRecoveryMaterial(
    recoveryContext,
    t.keyPrompt
  )

  const [qrDataUri, setQrDataUri] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [delivered, setDelivered] = useState(false)

  useScreenshotListener(() => setNotice(t.screenshotBlocked))

  const buildHtml = useCallback(async () => {
    if (state.status !== "ready" || me === undefined || me === null) return null

    // Refuse to print rather than print a blank identity line. This sheet is
    // filed with a will for decades, and a document missing the owner looks
    // complete and is not. (Both fields come from webhook-synced columns, so a
    // null here means a sync has not landed, not that the user has no name.)
    const ownerName = me.identityVerifiedName ?? me.name
    if (ownerName === null || me.email === null) return null

    return await buildRecoverySheetHtml({
      prefix: "WSY",
      codeGroups: state.material.groups,
      qrDataUri,
      // The verified name, not the typed one: this is the string a death
      // certificate is matched against.
      ownerName,
      accountEmail: me.email,
      issuedAt: new Date(),
      paperVersion: state.material.paperVersion,
      locale,
      labels: {
        brandName: t.brandName,
        documentTitle: t.documentTitle,
        documentSubtitle: t.documentSubtitle,
        codeLabel: t.codeLabel,
        owner: t.owner,
        account: t.account,
        issued: t.issued,
        version: t.version,
        shownOnce: t.shownOnce,
        handling: t.handling,
        keepWithWill: t.keepWithWill,
        howTitle: t.howTitle,
        howWhen: t.howWhen,
        howStep1: t.howStep1,
        howStep2: t.howStep2,
        howStep3: t.howStep3,
        qrCaption: t.qrCaption,
        sheetFooter: t.sheetFooter,
      },
    })
  }, [locale, me, qrDataUri, state, t])

  async function run(action: "print" | "share") {
    setBusy(true)
    setNotice(null)
    try {
      const html = await buildHtml()
      if (html === null) {
        setNotice(t.failed)
        return
      }

      if (action === "print") {
        await Print.printAsync({ html })
      } else {
        // `printToFileAsync` writes into the app's cache, which no file manager
        // lists: the share sheet is the only way the PDF reaches the reader.
        const { uri } = await Print.printToFileAsync({ html })
        if (!(await Sharing.isAvailableAsync())) {
          setNotice(t.failed)
          return
        }
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          UTI: "com.adobe.pdf",
        })
      }
      setDelivered(true)
    } catch {
      // A dismissed printer picker and a missing printer arrive the same way;
      // the sheet is still on screen either way.
      setNotice(t.cancelled)
    } finally {
      setBusy(false)
    }
  }

  /**
   * Save, wipe, then leave. The save is what retires the previous sheet, so it
   * must land while the code is still on screen: a failure keeps it there with
   * the button that retries.
   */
  async function confirm() {
    setBusy(true)
    setNotice(null)
    if (!(await commit())) {
      setBusy(false)
      setNotice(t.saveFailed)
      return
    }
    wipe()
    if (mode === "setup") router.replace("/setup/complete")
    else if (router.canGoBack()) router.back()
    else router.replace("/home")
  }

  if (state.status === "error") {
    if (state.reason === "keyLost") return <Redirect href="/recovery" />
    if (mode === "setup") return <Redirect href="/" />
    return (
      <Screen footer={<PrimaryCta label={t.retry!} onPress={retry} />}>
        <ScreenHeader back title={t.reissueTitle!} />
        <CenteredNote icon={Fingerprint} body={t.failed!} />
      </Screen>
    )
  }

  if (state.status !== "ready" || me === undefined) {
    return (
      <LoadingScreen back={mode === "reissue" ? true : undefined} label={t.preparing} />
    )
  }

  return (
    <Screen
      inset="flow"
      footer={
        <View className="gap-3">
          {notice !== null ? (
            <Text variant="meta" className="text-terracotta-800">
              {notice}
            </Text>
          ) : null}
          <KitActions
            printLabel={t.print!}
            saveLabel={t.saveOrShare!}
            disabled={busy}
            onPrint={() => void run("print")}
            onSave={() => void run("share")}
            confirm={
              delivered
                ? {
                    hint: t.confirmHint!,
                    label: t.confirmHave!,
                    againLabel: t.printAgain!,
                    busy,
                    onConfirm: () => void confirm(),
                    onAgain: () => setDelivered(false),
                  }
                : undefined
            }
          />
        </View>
      }
    >
      {mode === "setup" ? (
        <>
          <SetupStepMeter
            step={SETUP_STEP_INDEX.recoveryKit}
            locale={locale}
            separator={common.stepSeparator}
            className="mb-6"
          />
          {/* The first sheet follows the key being made on this phone — the one
              moment the vault has a key and no way back if the phone is lost. */}
          <ScreenHeader
            eyebrow={state.material.paperVersion === 1 ? t.keyReady : undefined}
            title={t.title!}
            description={t.body}
          />
        </>
      ) : (
        <>
          <ScreenHeader back title={t.reissueTitle!} description={t.body} />
          <Text variant="meta" className="mb-4 text-terracotta-800">
            {t.reissueNotice}
          </Text>
        </>
      )}

      <RecoveryCodeDisplay
        groups={state.material.groups}
        perLine={3}
        ownerName={me?.identityVerifiedName ?? me?.name ?? ""}
        issuedAt={new Date()}
        locale={locale}
        qrSlot={
          <KitQr
            value={state.material.qrPayload}
            size={56}
            onCaptured={setQrDataUri}
          />
        }
      />
    </Screen>
  )
}
