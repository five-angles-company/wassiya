"use client"

import { useState } from "react"
import { api } from "@workspace/backend/api"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { useMutation, useQuery } from "convex/react"
import { MailIcon } from "lucide-react"
import { toast } from "sonner"

import { useLocale } from "@/components/locale-provider"
import { usePermissions } from "@/hooks/use-permissions"
import { TableCard } from "@/components/table-card"
import {
  SettingRow,
  SettingRows,
} from "@/features/settings/components/setting-row"
import { SETTINGS } from "@/features/settings/strings/settings"
import { fmtDate } from "@/lib/format"
import { t } from "@/lib/i18n/locale"

type Draft = {
  emailFrom: string
  emailTestMode: boolean
  outreachProvider: "off" | "twilio"
  twilioFrom: string
  appUrl: string
  consoleUrl: string
}

/** The credential rows, in the order they matter to an operator. */
const CREDENTIALS = [
  ["resendApiKey", "credResendApiKey"],
  ["twilioAccountSid", "credTwilioAccountSid"],
  ["twilioAuthToken", "credTwilioAuthToken"],
  ["diditApiKey", "credDiditApiKey"],
  ["diditWebhookSecret", "credDiditWebhookSecret"],
  ["clerkWebhookSecret", "credClerkWebhookSecret"],
  ["identityHashSecret", "credIdentityHashSecret"],
] as const

/**
 * Integrations — what this deployment talks to, and how.
 *
 * Two halves, and the split is a security argument rather than a layout choice.
 * The editable half is safe to read off a database export: addresses, a toggle,
 * a channel. The other half is every credential, which stays in the deployment
 * environment and is listed here as present or absent, never as a value — an
 * operator still has to be able to tell "no mail is going out" from "the sender
 * address is wrong". The escrow private key is not listed at all; see
 * `credentialStatus` for why.
 */
export function IntegrationsForm() {
  const locale = useLocale()
  const labels = t(SETTINGS, locale)

  const settings = useQuery(api.settings.current)
  const save = useMutation(api.settings.adminSave)
  const sendTest = useMutation(api.settings.adminSendTestEmail)
  const { has } = usePermissions()

  // Edits only, overlaid on what the server holds — not a copy seeded in an
  // effect. A seeded copy has to decide when to re-seed and every answer is
  // wrong: re-seed on each update and it overwrites whatever is being typed,
  // re-seed once and it goes stale against a change made elsewhere.
  const [edits, setEdits] = useState<Partial<Draft>>({})
  const [busy, setBusy] = useState(false)
  const [testing, setTesting] = useState(false)

  if (settings === undefined) {
    return <Skeleton className="h-96 w-full rounded-xl" />
  }

  const draft: Draft = {
    emailFrom: settings.stored.emailFrom ?? "",
    // The switches show what is *in force*, including a value the environment
    // supplies, because toggling one changes behaviour rather than fills a gap.
    emailTestMode: settings.effective.emailTestMode,
    outreachProvider: settings.effective.outreachProvider,
    twilioFrom: settings.stored.twilioFrom ?? "",
    appUrl: settings.stored.appUrl ?? "",
    consoleUrl: settings.stored.consoleUrl ?? "",
    ...edits,
  }

  const edit = (patch: Partial<Draft>) =>
    setEdits((prev) => ({ ...prev, ...patch }))

  const sourceOf = (stored: string | null, effective: string | null) =>
    effective === null ? null : stored === null ? "env" : "row"

  async function onSave() {
    setBusy(true)
    try {
      await save(draft)
      // Cleared so the form falls back to what the server now holds, which is
      // the authority on what was actually saved.
      setEdits({})
      toast.success(labels.saved)
    } catch (error) {
      // The mutation refuses malformed senders and URLs by name, and those
      // messages are the whole point of validating server-side.
      toast.error(
        labels.saveFailed,
        error instanceof Error ? { description: error.message } : undefined
      )
    } finally {
      setBusy(false)
    }
  }

  async function onTest() {
    setTesting(true)
    try {
      const result = await sendTest({})
      toast.success(labels.testSent.replace("{to}", result.to))
    } catch (error) {
      toast.error(
        labels.saveFailed,
        error instanceof Error ? { description: error.message } : undefined
      )
    } finally {
      setTesting(false)
    }
  }

  // Read-only for someone who may see the settings but not change them
  // (Support, by default). A disabled fieldset is one change rather than a
  // `disabled` on every input, and it is also what a screen reader announces.
  const canManage = has("settings.manage")

  return (
    <fieldset disabled={!canManage} className="contents">
      <div className="flex flex-col gap-6">
        <TableCard
          title={labels.sectionEmail}
          action={
            <Button disabled={busy} size="sm" onClick={() => void onSave()}>
              {busy ? labels.saving : labels.save}
            </Button>
          }
          footnote={
            settings.updatedAt === null
              ? labels.neverSaved
              : labels.updatedAt.replace(
                  "{date}",
                  fmtDate(settings.updatedAt, locale)
                )
          }
        >
          <SettingRows>
            <SettingRow
              label={labels.emailFrom}
              hint={labels.emailFromHint}
              labels={labels}
              effective={settings.effective.emailFrom}
              source={sourceOf(
                settings.stored.emailFrom,
                settings.effective.emailFrom
              )}
            >
              <Input
                value={draft.emailFrom}
                placeholder={labels.placeholderEnv}
                onChange={(event) => edit({ emailFrom: event.target.value })}
              />
            </SettingRow>

            <SettingRow
              label={labels.emailTestMode}
              hint={labels.emailTestModeHint}
              labels={labels}
            >
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={draft.emailTestMode}
                  onCheckedChange={(checked) =>
                    edit({ emailTestMode: checked === true })
                  }
                />
                {draft.emailTestMode ? labels.testModeOn : labels.testModeOff}
              </label>
            </SettingRow>

            <SettingRow
              label={labels.sendTest}
              hint={labels.sendTestHint}
              labels={labels}
            >
              <Button
                variant="outline"
                disabled={testing}
                onClick={() => void onTest()}
              >
                <MailIcon className="size-3.5" aria-hidden />
                {labels.sendTest}
              </Button>
            </SettingRow>
          </SettingRows>
        </TableCard>

        <TableCard title={labels.sectionOutreach}>
          <SettingRows>
            <SettingRow
              label={labels.outreachProvider}
              hint={labels.outreachHint}
              labels={labels}
            >
              <Select
                value={draft.outreachProvider}
                onValueChange={(value) =>
                  edit({
                    outreachProvider: value === "twilio" ? "twilio" : "off",
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="off">{labels.outreachOff}</SelectItem>
                  <SelectItem value="twilio">
                    {labels.outreachTwilio}
                  </SelectItem>
                </SelectContent>
              </Select>
            </SettingRow>

            <SettingRow
              label={labels.twilioFrom}
              hint={labels.twilioFromHint}
              labels={labels}
              effective={settings.effective.twilioFrom}
              source={sourceOf(
                settings.stored.twilioFrom,
                settings.effective.twilioFrom
              )}
            >
              <Input
                dir="ltr"
                value={draft.twilioFrom}
                placeholder={labels.placeholderEnv}
                onChange={(event) => edit({ twilioFrom: event.target.value })}
              />
            </SettingRow>
          </SettingRows>
        </TableCard>

        <TableCard title={labels.sectionLinks}>
          <SettingRows>
            <SettingRow
              label={labels.appUrl}
              hint={labels.appUrlHint}
              labels={labels}
              effective={settings.effective.appUrl}
              source={sourceOf(
                settings.stored.appUrl,
                settings.effective.appUrl
              )}
            >
              <Input
                dir="ltr"
                value={draft.appUrl}
                placeholder={labels.placeholderEnv}
                onChange={(event) => edit({ appUrl: event.target.value })}
              />
            </SettingRow>

            {/* Separate from the app URL, not a path under it: the console is
                its own origin, and a staff invitation that landed on the
                owner app would sign the new operator into the wrong product. */}
            <SettingRow
              label={labels.consoleUrl}
              hint={labels.consoleUrlHint}
              labels={labels}
              effective={settings.effective.consoleUrl}
              source={sourceOf(
                settings.stored.consoleUrl,
                settings.effective.consoleUrl
              )}
            >
              <Input
                dir="ltr"
                value={draft.consoleUrl}
                placeholder={labels.placeholderEnv}
                onChange={(event) => edit({ consoleUrl: event.target.value })}
              />
            </SettingRow>
          </SettingRows>
        </TableCard>

        <TableCard
          title={labels.sectionCredentials}
          footnote={labels.credentialsHint}
        >
          <div className="divide-y">
            {CREDENTIALS.map(([key, labelKey]) => (
              <div
                key={key}
                className="flex items-center justify-between gap-4 px-4 py-3"
              >
                <span className="text-sm">{labels[labelKey]}</span>
                <Badge
                  variant={
                    settings.credentials[key] ? "secondary" : "destructive"
                  }
                >
                  {settings.credentials[key]
                    ? labels.credSet
                    : labels.credMissing}
                </Badge>
              </div>
            ))}
          </div>
        </TableCard>
      </div>
    </fieldset>
  )
}
