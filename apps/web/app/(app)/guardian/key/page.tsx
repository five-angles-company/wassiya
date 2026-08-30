import { GuardianKey } from "@/features/guardian/components/guardian-key"

/**
 * The guardian's key sheet.
 *
 * No header: the feature opens with the sentence the page exists for — that the
 * key never reached us and cannot be reissued — and a generic title above it
 * would be the first thing read instead.
 */
export default function GuardianKeyPage() {
  return <GuardianKey />
}
