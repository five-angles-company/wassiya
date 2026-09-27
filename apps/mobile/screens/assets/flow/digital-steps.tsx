/**
 * ٤.٧ — a digital account, as steps: the account and its login, any second
 * factor, and what the executor should do with it.
 *
 * - **The disposition is the point.** Most executors do not want the account,
 *   they want it closed; the choice is made at capture time rather than
 *   guessed at release. Nothing is preselected: "delete" chosen by accident
 *   cannot be undone.
 * - **The second-factor note is free text and unmasked.** A rotating code is
 *   worthless to an executor; *where* the second factor lives is everything.
 */
import { fmtNum } from "@workspace/ui-native/lib/format"
import type { Locale } from "@workspace/ui-native/lib/labels"
import { Archive, Flower2, Trash2 } from "lucide-react-native"
import { View } from "react-native"

import { Field } from "@/components/field"
import { SecretField } from "@/components/secret-field"
import { useStrings } from "@/i18n/use-strings"
import { SECRET_INPUT_PROPS } from "@/lib/secret-input-props"
import {
  dispositionLabel,
  recoveryCount,
  type Disposition,
  type DigitalForm,
} from "@/screens/assets/detail/forms/digital"
import { ChoiceCards } from "@/screens/assets/flow/choice-cards"
import type { AssetSection, FlowStep } from "@/screens/assets/flow/types"

export function useDigitalSteps(
  form: DigitalForm,
  patch: (fields: Partial<DigitalForm>) => void,
  onReveal?: () => void
): FlowStep[] {
  const { t } = useStrings("assets/new/account")
  const { t: detail } = useStrings("assets/detail")

  return [
    {
      key: "login",
      question: t.qAccountLogin!,
      hint: t.hService,
      blocked:
        form.service.trim().length === 0
          ? t.needsService!
          : form.username.trim().length > 0 && form.password.length > 0
            ? null
            : t.needsLogin!,
      content: (
        <View className="gap-4">
          <Field
            label={t.serviceLabel!}
            placeholder={t.servicePlaceholder}
            value={form.service}
            onChangeText={(service) => patch({ service })}
          />
          <Field
            label={t.usernameLabel!}
            placeholder={t.usernamePlaceholder}
            value={form.username}
            onChangeText={(username) => patch({ username })}
            autoCapitalize="none"
            keyboardType="email-address"
            className="text-left"
          />
          <SecretField
            label={t.passwordLabel!}
            value={form.password}
            onChangeText={(password) => patch({ password })}
            revealLabel={detail.revealShort!}
            onReveal={onReveal}
          />
        </View>
      ),
    },
    {
      key: "extra",
      question: t.qExtra!,
      hint: t.hExtra,
      optional: true,
      blocked: null,
      content: (
        <View className="gap-4">
          <Field
            {...SECRET_INPUT_PROPS}
            label={t.twoFactorLabel!}
            placeholder={t.twoFactorPlaceholder}
            value={form.twoFactor}
            onChangeText={(twoFactor) => patch({ twoFactor })}
            multiline
            textAlignVertical="top"
            className="h-auto min-h-20 py-3"
          />
          <SecretField
            label={t.recoveryLabel!}
            placeholder={t.recoveryPlaceholder}
            value={form.recovery}
            onChangeText={(recovery) => patch({ recovery })}
            multiline
            revealLabel={detail.revealShort!}
            onReveal={onReveal}
          />
        </View>
      ),
    },
    {
      key: "disposition",
      question: t.dispositionLabel!,
      hint: t.dispositionNote,
      blocked: form.disposition === null ? t.chooseToContinue! : null,
      content: (
        <ChoiceCards<Disposition>
          options={[
            {
              value: "handOver",
              title: t.dispositionHandOver!,
              detail: t.dispositionHandOverNote,
              icon: Archive,
            },
            {
              value: "delete",
              title: t.dispositionDelete!,
              detail: t.dispositionDeleteNote,
              icon: Trash2,
            },
            {
              value: "memorialise",
              title: t.dispositionMemorialise!,
              detail: t.dispositionMemorialiseNote,
              icon: Flower2,
            },
          ]}
          value={form.disposition}
          onChange={(disposition) => patch({ disposition })}
        />
      ),
    },
  ]
}

export function digitalSections(
  form: DigitalForm,
  t: Record<string, string>,
  locale: Locale
): AssetSection[] {
  const codes = recoveryCount(form.recovery)
  const extra = [
    form.twoFactor.trim().length > 0 ? t.twoFactorSummary! : "",
    codes > 0 ? t.recoverySummary!.replace("{n}", fmtNum(codes, locale)) : "",
  ].filter((part) => part.length > 0)

  return [
    {
      step: "login",
      label: t.sectionLogin!,
      value: t.loginSummary!.replace("{username}", form.username.trim()),
      secret: true,
    },
    {
      step: "extra",
      label: t.sectionExtra!,
      value: extra.length > 0 ? extra.join(" · ") : t.extraNone!,
      secret: extra.length > 0,
      empty: extra.length === 0,
    },
    {
      step: "disposition",
      label: t.sectionDisposition!,
      value: dispositionLabel(form.disposition, t),
    },
  ]
}
