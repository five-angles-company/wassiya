import { useMutation, useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import { Text } from "@workspace/ui-native/components/ui/text"
import { AlertBanner } from "@workspace/ui-native/components/wassiya/alert-banner"
import { RecoveryCodeDisplay } from "@workspace/ui-native/components/wassiya/recovery-code-display"
import * as Print from "expo-print"
import { Redirect, router } from "expo-router"
import {
  usePreventScreenCapture,
  useScreenshotListener,
} from "expo-screen-capture"
import * as Sharing from "expo-sharing"
import { useCallback, useMemo, useState } from "react"
import { ActivityIndicator, View } from "react-native"

import { Screen } from "@/components/screen"
import { SetupStepMeter } from "@/components/setup-step-meter"
import { useStrings } from "@/i18n/use-strings"
import { buildRecoverySheetHtml } from "@/lib/recovery-sheet-html"
import { SETUP_STEP_INDEX } from "@/lib/setup-flow"
import { KitActions } from "@/screens/setup/recovery-kit/components/kit-actions"
import { KitQr } from "@/screens/setup/recovery-kit/components/kit-qr"
import { useRecoveryMaterial } from "@/screens/setup/recovery-kit/use-recovery-material"

/**
 * 2.4 — the printed recovery sheet.
 *
 * There is no confirmation screen after this one. A successful print or save
 * intent **is** the milestone, recorded from the intent's result; if the user
 * never completes one, Home re-prompts rather than the app trapping them here.
 *
 * Screen capture is blocked for the screen's lifetime, and the code never
 * reaches the clipboard, a log or analytics. The shown-once promise is real:
 * `S_paper` exists only in this render, and once the sheet is out it is gone
 * for good — a later reprint issues a new version instead.
 */
export function RecoveryKitScreen() {
  const { t, locale } = useStrings("setup/recovery-kit")
  const { t: common } = useStrings("common")

  usePreventScreenCapture()

  const me = useQuery(api.users.me)
  const keyring = useQuery(api.keyring.get)
  const markPaperPrinted = useMutation(api.keyring.markPaperPrinted)

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
  const { state, wipe } = useRecoveryMaterial(recoveryContext, t.keyPrompt)

  const [qrDataUri, setQrDataUri] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  useScreenshotListener(() => setNotice(t.screenshotBlocked))

  const buildHtml = useCallback(async () => {
    if (state.status !== "ready" || me === undefined || me === null) return null

    // Refuse to print rather than print a blank identity line. This sheet is
    // filed with a will for decades, and the email is how the heir-claim funnel
    // finds the deceased — a document missing it looks complete and is not.
    // (Both fields come from webhook-synced columns, so a null here means a
    // sync has not landed, not that the user has no name or address.)
    const ownerName = me.identityVerifiedName ?? me.name
    if (ownerName === null || me.email === null) return null

    return await buildRecoverySheetHtml({
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

  /**
   * Wipe, navigate, *then* record.
   *
   * The order is not stylistic. `markPaperPrinted` flips the evidence the
   * setup gate reads, and the gate re-renders the moment the Convex query
   * updates — which can land before a navigation issued after it. Awaiting the
   * mutation first would therefore race the gate into bouncing this run
   * straight to the tabs, skipping 2.6 entirely.
   *
   * A failed mutation is a designed degradation, not an error to surface: the
   * sheet is out, and an unrecorded milestone simply means Home re-prompts.
   */
  async function complete() {
    // Drop the code from memory before the next frame renders.
    wipe()
    router.replace("/setup/complete")
    try {
      await markPaperPrinted()
    } catch {
      // Home re-prompts from the unchanged `paperPrintedAt`.
    }
  }

  async function run(action: "print" | "save" | "share") {
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
        const { uri } = await Print.printToFileAsync({ html })

        // ⚠️ `printToFileAsync` writes into the app's **cache**, which no file
        // manager lists and the OS is free to clear. Handing the file to the
        // system sheet is the only way it reaches the reader on either
        // platform — "Save to Files" and "Save to Drive" both live there — so
        // "save" and "share" are the same act and take the same path.
        //
        // This used to run the share step for `"share"` only, so `"save"`
        // generated a PDF into the cache, dropped the uri on the floor, and
        // fell through to `complete()` — which wipes the code from memory and
        // records the sheet as printed. The code is shown **once**. Anyone who
        // tapped save walked away believing they had their recovery document
        // and had nothing, and would have found out on the one day it is
        // needed.
        if (!(await Sharing.isAvailableAsync())) {
          setNotice(t.failed)
          // Emphatically no `complete()`: nothing was delivered, so the code
          // must stay on screen rather than be wiped behind a false success.
          return
        }
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          UTI: "com.adobe.pdf",
        })
      }
      await complete()
    } catch {
      // A dismissed printer picker and a missing printer arrive the same way;
      // the sheet is still on screen either way, so this is a notice, not a
      // failure state.
      setNotice(t.cancelled)
    } finally {
      setBusy(false)
    }
  }

  if (state.status === "error") {
    return <Redirect href={state.reason === "keyLost" ? "/recovery" : "/"} />
  }

  if (state.status !== "ready" || me === undefined) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-background">
        <ActivityIndicator />
        <Text variant="meta" className="text-muted-foreground">
          {t.preparing}
        </Text>
      </View>
    )
  }

  return (
    <Screen inset="flow">
      <SetupStepMeter
        step={SETUP_STEP_INDEX.recoveryKit}
        locale={locale}
        separator={common.stepSeparator}
        className="mb-header"
      />

      <Text variant="screenTitle" className="mb-2 text-[27px]">
        {t.title}
      </Text>
      <Text className="text-notice mb-4.5 leading-[1.65] text-muted-foreground">
        {t.body}
      </Text>

      <RecoveryCodeDisplay
        groups={state.material.groups}
        perLine={3}
        ownerName={me?.identityVerifiedName ?? me?.name ?? ""}
        issuedAt={new Date()}
        handlingNote={t.handling}
        locale={locale}
        qrSlot={
          <KitQr
            value={state.material.qrPayload}
            size={56}
            onCaptured={setQrDataUri}
          />
        }
      />

      {notice !== null ? (
        <AlertBanner className="mt-4" variant="notice" description={notice} />
      ) : null}

      <View className="grow" />

      <View className="mt-5">
        <KitActions
          printLabel={t.print}
          savePdfLabel={t.savePdf}
          shareLabel={t.share}
          disabled={busy}
          onPrint={() => void run("print")}
          onSavePdf={() => void run("save")}
          onShare={() => void run("share")}
        />
      </View>
    </Screen>
  )
}
