import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import type { Locale } from "@workspace/ui-native/lib/labels"
import { cn } from "@workspace/ui-native/lib/utils"
import { Check, ChevronDown } from "lucide-react-native"
import { useState } from "react"
import { Modal, Pressable, ScrollView, View } from "react-native"

import { COUNTRIES, findCountry } from "@/lib/countries"

export type CountryPickerProps = {
  label: string
  value: string
  onChange: (code: string) => void
  hint?: string
  locale?: Locale
  closeLabel: string
  className?: string
}

/**
 * The country parameter, as a field.
 *
 * Not a dial-code picker: this account is email-based, so the country is here
 * because it decides which identity documents 2.1 lists and, later, the IBAN
 * format and currency. Saudi Arabia leads the list as the launch market.
 *
 * A plain `Modal` rather than the shared `Select` primitive — that one
 * teleports through `PortalHost`, and this needs to work inside the sign-up
 * form on a screen the setup gate may replace underneath it.
 */
export function CountryPicker({
  label,
  value,
  onChange,
  hint,
  locale = "ar",
  closeLabel,
  className,
}: CountryPickerProps) {
  const [open, setOpen] = useState(false)
  const selected = findCountry(value)

  return (
    <View className={cn("gap-2", className)}>
      <Text variant="meta" className="text-muted-foreground">
        {label}
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={() => setOpen(true)}
        className="rounded-box h-12.5 flex-row items-center justify-between border border-border bg-card px-4"
      >
        <Text className="text-body">
          {selected === null ? "—" : selected.name[locale]}
        </Text>
        <Icon as={ChevronDown} className="size-4 text-muted-foreground" />
      </Pressable>

      {hint !== undefined ? (
        <Text variant="metaSm" className="text-muted-foreground">
          {hint}
        </Text>
      ) : null}

      <Modal
        visible={open}
        animationType="slide"
        transparent
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          className="flex-1 justify-end bg-black/50"
          accessibilityLabel={closeLabel}
          onPress={() => setOpen(false)}
        >
          <Pressable
            className="rounded-t-sheet px-gutter max-h-[70%] bg-background pt-5 pb-10"
            onPress={(event) => event.stopPropagation()}
          >
            <View className="bg-sand-300 mb-4 h-1.25 w-11 self-center rounded-full" />
            <Text variant="dialogTitle" className="mb-3">
              {label}
            </Text>
            <ScrollView>
              {COUNTRIES.map((country) => (
                <Pressable
                  key={country.code}
                  accessibilityRole="button"
                  onPress={() => {
                    onChange(country.code)
                    setOpen(false)
                  }}
                  className="rounded-row flex-row items-center gap-3 px-3 py-3.5 active:bg-card"
                >
                  <Text className="text-row flex-1">
                    {country.name[locale]}
                  </Text>
                  {country.code === value ? (
                    <Icon as={Check} className="size-4.5 text-olive-700" />
                  ) : null}
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  )
}
