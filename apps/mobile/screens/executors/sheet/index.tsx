/**
 * ٥.٣ — printing an executor's sheet.
 *
 * Screen capture is blocked for the screen's lifetime, and the code never
 * reaches the clipboard, a log or analytics. It is saved only after a print or
 * save intent succeeds; a sheet that printed but did not save opens nothing,
 * so that failure keeps the code on screen with the one action that fixes it.
 */
import { useCallback, useMemo, useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import { Text } from "@workspace/ui-native/components/ui/text"
import { AlertBanner } from "@workspace/ui-native/components/wassiya/alert-banner"
import { PrimaryCta } from "@workspace/ui-native/components/wassiya/primary-cta"
import { RecoveryCodeDisplay } from "@workspace/ui-native/components/wassiya/recovery-code-display"
import * as Print from "expo-print"
import { router, useLocalSearchParams } from "expo-router"
import {
  usePreventScreenCapture,
  useScreenshotListener,
} from "expo-screen-capture"
import * as Sharing from "expo-sharing"

import { LoadingScreen } from "@/components/loading-screen"
import { Screen } from "@/components/screen"
import { ScreenHeader } from "@/components/screen-header"
import { useVaultGate } from "@/hooks/use-vault-gate"
import { useStrings } from "@/i18n/use-strings"
import { buildRecoverySheetHtml } from "@/lib/recovery-sheet-html"
import { useExecutorSheet } from "@/screens/executors/sheet/use-executor-sheet"
import { KitActions } from "@/screens/setup/recovery-kit/components/kit-actions"

export function ExecutorSheetScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { t, locale } = useStrings("executors/sheet")
  usePreventScreenCapture()

  const { unlocked, unlock, status } = useVaultGate()
  const me = useQuery(api.users.me)
  const executors = useQuery(api.executors.list)
  const executor = useMemo(
    () => executors?.find((row) => row.id === (id as Id<"executors">)) ?? null,
    [executors, id]
  )
  // Latched on first sight: the list updates the moment the sheet saves, and
  // the version minted must stay the one this screen started from.
  const [minted] = useState(() => ({ at: new Date() }))
  const [sheetFor, setSheetFor] = useState<{
    id: Id<"executors">
    sheetVersion: number | null
  } | null>(null)
  if (sheetFor === null && executor !== null) {
    setSheetFor({ id: executor.id, sheetVersion: executor.sheetVersion })
  }
  const { state, activate } = useExecutorSheet(sheetFor, unlocked)

  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [unsaved, setUnsaved] = useState(false)

  useScreenshotListener(() => setNotice(t.screenshotBlocked))

  const ownerName = me?.identityVerifiedName ?? me?.name ?? null

  const buildHtml = useCallback(async () => {
    if (state.status !== "ready" || executor === null) return null
    if (ownerName === null || me?.email == null) return null
    return await buildRecoverySheetHtml({
      prefix: "WSE",
      holder: { label: t.executor!, name: executor.name },
      codeGroups: state.material.groups,
      qrDataUri: null,
      ownerName,
      accountEmail: me.email,
      issuedAt: minted.at,
      paperVersion: state.material.version,
      locale,
      labels: {
        brandName: t.brandName!,
        documentTitle: t.documentTitle!,
        documentSubtitle: t.documentSubtitle!,
        codeLabel: t.codeLabel!,
        owner: t.owner!,
        account: t.account!,
        issued: t.issued!,
        version: t.version!,
        shownOnce: t.shownOnce!,
        handling: t.handling!,
        keepWithWill: t.keepWithWill!,
        howTitle: t.howTitle!,
        howWhen: t.howWhen!,
        howStep1: t.howStep1!,
        howStep2: t.howStep2!,
        howStep3: t.howStep3!,
        qrCaption: t.qrCaption!,
        sheetFooter: t.sheetFooter!,
      },
    })
  }, [executor, locale, me, minted.at, ownerName, state, t])

  async function finish() {
    setBusy(true)
    const saved = await activate()
    setBusy(false)
    if (!saved) {
      setUnsaved(true)
      setNotice(t.activateFailed)
      return
    }
    router.back()
  }

  async function run(action: "print" | "save" | "share") {
    setBusy(true)
    setNotice(null)
    let delivered = false
    try {
      const html = await buildHtml()
      if (html === null) {
        setNotice(t.failed)
      } else if (action === "print") {
        await Print.printAsync({ html })
        delivered = true
      } else {
        // `printToFileAsync` writes into the app's cache, which no file manager
        // lists: the share sheet is the only way the PDF reaches the reader.
        const { uri } = await Print.printToFileAsync({ html })
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: "application/pdf",
            UTI: "com.adobe.pdf",
          })
          delivered = true
        } else {
          setNotice(t.failed)
        }
      }
    } catch {
      // A dismissed printer picker lands here too; the code is still on screen.
      setNotice(t.cancelled)
    } finally {
      setBusy(false)
    }
    if (delivered) await finish()
  }

  const title = t.title!.replace("{name}", executor?.name ?? "")

  if (!unlocked) {
    return (
      <Screen
        footer={
          <PrimaryCta
            label={t.unlock!}
            onPress={unlock}
            busy={status === "unlocking"}
          />
        }
      >
        <ScreenHeader back title={title} description={t.locked} />
      </Screen>
    )
  }

  if (state.status === "failed") {
    return (
      <Screen>
        <ScreenHeader back title={title} />
        <Text variant="meta" className="text-terracotta-800">
          {t.failed}
        </Text>
      </Screen>
    )
  }

  if (state.status !== "ready" || executor === null) {
    return <LoadingScreen back label={t.preparing} />
  }

  return (
    <Screen
      inset="flow"
      footer={
        unsaved ? (
          <PrimaryCta
            label={t.activate!}
            onPress={() => void finish()}
            busy={busy}
          />
        ) : (
          <KitActions
            printLabel={t.print!}
            savePdfLabel={t.savePdf!}
            shareLabel={t.share!}
            disabled={busy}
            onPrint={() => void run("print")}
            onSavePdf={() => void run("save")}
            onShare={() => void run("share")}
          />
        )
      }
    >
      <ScreenHeader
        back
        title={title}
        description={t.body!.replace("{name}", executor.name)}
      />

      {sheetFor?.sheetVersion != null ? (
        <AlertBanner
          className="mb-4"
          variant="info"
          description={t.reprintNotice!}
        />
      ) : null}

      <RecoveryCodeDisplay
        groups={state.material.groups}
        perLine={3}
        ownerName={executor.name}
        issuedAt={minted.at}
        handlingNote={t.handling}
        locale={locale}
        labels={{
          documentTitle: t.documentTitle,
          documentSubtitle: t.documentSubtitle,
          codeLabel: t.codeLabel,
          shownOnce: t.shownOnce,
          owner: t.executor,
        }}
      />

      {notice !== null ? (
        <AlertBanner className="mt-4" variant="notice" description={notice} />
      ) : null}
    </Screen>
  )
}
