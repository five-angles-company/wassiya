"use client"

import { cn } from "@workspace/ui/lib/utils"

import { CopyButton } from "@/components/copy-button"
import { useLocale } from "@/components/locale-provider"
import { t, type Resolved } from "@/lib/i18n/locale"
import type { SecretField } from "@/features/handover/lib/open-handover"
import { ASSET_LABELS } from "@/features/handover/strings/asset-labels"

type Labels = Resolved<typeof ASSET_LABELS>

const FIELD_LABEL: Record<string, keyof typeof ASSET_LABELS> = {
  phrase: "fieldPhrase",
  network: "fieldNetwork",
  kind: "fieldKind",
  devicePassword: "fieldDevicePassword",
  deviceLocation: "fieldDeviceLocation",
  account: "fieldAccount",
  password: "fieldPassword",
  twoFactor: "fieldTwoFactor",
  bank: "fieldBank",
  iban: "fieldIban",
  country: "fieldCountry",
  accountType: "fieldAccountType",
  currency: "fieldCurrency",
  branch: "fieldBranch",
  instructions: "fieldInstructions",
  service: "fieldService",
  username: "fieldUsername",
  recoveryCodes: "fieldRecoveryCodes",
  disposition: "fieldDisposition",
  body: "fieldBody",
  provider: "fieldProvider",
  accountNumber: "fieldAccountNumber",
  company: "fieldCompany",
  policyNumber: "fieldPolicyNumber",
  beneficiary: "fieldBeneficiary",
}

/**
 * The stored value is a key; the executor reads the word the owner chose. One
 * map serves every field in `ENUM_FIELDS`, so a value must mean the same thing
 * in every field that can hold it.
 */
const VALUE_LABEL: Record<string, keyof typeof ASSET_LABELS> = {
  hardware: "valueHardware",
  software: "valueSoftware",
  exchange: "valueExchange",
  current: "valueCurrent",
  savings: "valueSavings",
  deed: "valueDeed",
  marriage: "valueMarriage",
  certificate: "valueCertificate",
  other: "valueOther",
  instructions: "valueInstructions",
  whereabouts: "valueWhereabouts",
  wish: "valueWish",
  handOver: "valueHandOver",
  delete: "valueDelete",
  memorialise: "valueMemorialise",
  stocks: "valueStocks",
  fund: "valueFund",
  life: "valueLife",
  health: "valueHealth",
  property: "valueProperty",
}

const ENUM_FIELDS = new Set(["kind", "accountType", "disposition"])

/** Values copied character by character: left-to-right, monospaced. */
const EXACT_FIELDS = new Set([
  "phrase",
  "devicePassword",
  "password",
  "twoFactor",
  "iban",
  "username",
  "recoveryCodes",
  "account",
  "accountNumber",
  "policyNumber",
])

/**
 * Exact values that get a copy button. ⚠️ Not the seed phrase: it belongs on
 * paper or typed into a wallet, and a clipboard is shared with every app on the
 * machine and, on Windows and iOS, synced to the reader's other devices.
 */
const COPYABLE_FIELDS = new Set([...EXACT_FIELDS].filter((key) => key !== "phrase"))

/** The word counts BIP-39 allows. Anything else is shown as the owner typed it. */
const PHRASE_LENGTHS = new Set([12, 15, 18, 21, 24])

/** One secret field of a handed-over item, as a term and its value. */
export function AssetField({ field }: { field: SecretField }) {
  const locale = useLocale()
  const labels = t(ASSET_LABELS, locale)
  const exact = EXACT_FIELDS.has(field.key)
  const words = field.key === "phrase" ? field.value.split(/\s+/).filter((word) => word.length > 0) : []

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <dt className="text-muted-foreground text-[12.5px]">{fieldLabel(field.key, labels)}</dt>
        {COPYABLE_FIELDS.has(field.key) && (
          <CopyButton
            value={field.value}
            className="text-muted-foreground hover:text-foreground hover:bg-foreground/[0.05] inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[12.5px] font-semibold transition-colors"
          />
        )}
      </div>
      <dd
        dir={exact ? "ltr" : undefined}
        className={cn(
          "mt-0.5 text-[15px] leading-[1.7] font-semibold break-words whitespace-pre-wrap",
          exact && "font-mono text-[14px]"
        )}
      >
        {PHRASE_LENGTHS.has(words.length) ? (
          // Numbered, because it is copied into a wallet word by word and a
          // skipped or swapped word is the mistake that costs everything.
          <ol className="mt-1.5 grid grid-cols-2 gap-x-6 gap-y-1.5 sm:grid-cols-3">
            {words.map((word, index) => (
              <li key={index} className="flex items-baseline gap-2">
                <span className="text-muted-foreground w-6 shrink-0 text-end text-[12px] tabular-nums">
                  {index + 1}
                </span>
                <span>{word}</span>
              </li>
            ))}
          </ol>
        ) : (
          displayValue(field, labels)
        )}
      </dd>
    </div>
  )
}

function fieldLabel(key: string, labels: Labels): string {
  const labelKey = FIELD_LABEL[key]
  return labelKey === undefined ? key : labels[labelKey]
}

function displayValue(field: SecretField, labels: Labels): string {
  if (!ENUM_FIELDS.has(field.key)) return field.value
  const valueKey = VALUE_LABEL[field.value]
  return valueKey === undefined ? field.value : labels[valueKey]
}
