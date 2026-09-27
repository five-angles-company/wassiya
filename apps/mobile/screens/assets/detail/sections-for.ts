import type { Locale } from "@workspace/ui-native/lib/labels"

import type { AssetType } from "@/lib/asset-types"
import { parseBank } from "@/screens/assets/detail/forms/bank"
import { parseCrypto } from "@/screens/assets/detail/forms/crypto"
import { parseDigital } from "@/screens/assets/detail/forms/digital"
import { parseDocument } from "@/screens/assets/detail/forms/document"
import { parseInsurance } from "@/screens/assets/detail/forms/insurance"
import { parseInvestment } from "@/screens/assets/detail/forms/investment"
import { parseNote } from "@/screens/assets/detail/forms/note"
import { parsePhotos } from "@/screens/assets/detail/forms/photos"
import type { EditSource } from "@/screens/assets/detail/forms/source"
import { bankSections } from "@/screens/assets/flow/bank-steps"
import { cryptoSections } from "@/screens/assets/flow/crypto-steps"
import { digitalSections } from "@/screens/assets/flow/digital-steps"
import { documentSections } from "@/screens/assets/flow/document-steps"
import { insuranceSections } from "@/screens/assets/flow/insurance-steps"
import { investmentSections } from "@/screens/assets/flow/investment-steps"
import { noteSections } from "@/screens/assets/flow/note-steps"
import { photosSections } from "@/screens/assets/flow/photos-steps"
import type { AssetSection } from "@/screens/assets/flow/types"

/** Each type's own string table, keyed by type. */
export type TypeLabels = Record<AssetType, Record<string, string>>

/**
 * The asset page's cards for one opened asset, or `null` when its payload
 * does not parse — the page must say so rather than show empty cards over a
 * secret it could not read.
 */
export function sectionsFor(
  type: AssetType,
  source: EditSource,
  labels: TypeLabels,
  locale: Locale,
  formatSize: (bytes: number) => string,
  notRecorded: string
): AssetSection[] | null {
  switch (type) {
    case "crypto": {
      const form = parseCrypto(source)
      return form === null ? null : cryptoSections(form, labels.crypto, locale)
    }
    case "bank": {
      const form = parseBank(source)
      return form === null ? null : bankSections(form, labels.bank, locale)
    }
    case "digital": {
      const form = parseDigital(source)
      return form === null ? null : digitalSections(form, labels.digital, locale)
    }
    case "document":
      return documentSections(parseDocument(source), labels.document, formatSize)
    case "photos": {
      const form = parsePhotos(source)
      return form === null ? null : photosSections(form.album, form.kept.length, labels.photos, locale)
    }
    case "note": {
      const form = parseNote(source)
      return form === null ? null : noteSections(form, labels.note, locale)
    }
    case "investment": {
      const form = parseInvestment(source)
      return form === null ? null : investmentSections(form, labels.investment, notRecorded)
    }
    case "insurance": {
      const form = parseInsurance(source)
      return form === null ? null : insuranceSections(form, labels.insurance, notRecorded)
    }
  }
}
