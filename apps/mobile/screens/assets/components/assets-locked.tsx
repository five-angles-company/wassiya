import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { AvatarStack } from "@workspace/ui-native/components/wassiya/avatar-stack"
import { PrimaryCta } from "@workspace/ui-native/components/wassiya/primary-cta"
import { Check, Fingerprint } from "lucide-react-native"
import { View } from "react-native"

/**
 * ٤.١ before the vault is open.
 *
 * ## A locked vault should feel intact, not withheld
 *
 * So there is no padlock and no blurred list behind a scrim. Instead the screen
 * states what is in there and that it still works: the count, the heirs, and
 * the fact that delivery is unaffected. Someone who opens the app to reassure
 * themselves gets the reassurance without unlocking anything.
 *
 * ## Nothing here decrypts
 *
 * The count and the heirs' initials come from unencrypted metadata the
 * deployment already holds, which is why this paints instantly on a cold start
 * — the one screen in the vault that never waits on a key. The figure is the
 * same one the list's own header carries, so the two screens agree.
 *
 * ## No password fallback
 *
 * A failed fingerprint falls through to the device credential, and that is the
 * end of the ladder. There is no Wassiya password to offer, because MK is bound
 * to the keystore: a password would promise an unlock the keystore cannot
 * perform.
 */
export type AssetsLockedProps = {
  /** "مغلقة" — plus the last-opened stamp when there is one. */
  status: string
  /** The vault's size, in the locale's numerals. */
  count: string
  /** "أصلاً محفوظاً ومشفّراً على هذا الجهاز". */
  countUnit: string
  /** "يستلمها ٣ ورثة". Omitted when no heirs exist yet. */
  heirsLine?: string
  /** Initials for the faces beside it. */
  heirNames?: string[]
  /** "التسليم يعمل حتى وهي مغلقة". */
  deliveryLine: string
  actionLabel: string
  footnote: string
  onUnlock: () => void
  /** True while the OS prompt is up — the button must not stack a second one. */
  busy: boolean
}

export function AssetsLocked({
  status,
  count,
  countUnit,
  heirsLine,
  heirNames = [],
  deliveryLine,
  actionLabel,
  footnote,
  onUnlock,
  busy,
}: AssetsLockedProps) {
  return (
    <>
      {/* Olive dot: the vault is well, merely shut. */}
      <View className="mb-auto flex-row items-center gap-2.5">
        <View className="bg-secondary size-2 shrink-0 rounded-full" />
        <Text className="text-[12.5px] opacity-55">{status}</Text>
      </View>

      <View className="gap-1.5 pb-2">
        <Text className="font-heading-black text-foreground text-[80px] leading-[0.88]">
          {count}
        </Text>
        <Text className="max-w-[290px] text-[17px] leading-[1.5] opacity-80">
          {countUnit}
        </Text>
      </View>

      <View className="bg-border mb-[22px] mt-[26px] h-px" />

      <View className="mb-[26px] gap-[11px]">
        {heirsLine !== undefined ? (
          <View className="flex-row items-center gap-3">
            <Text className="flex-1 text-[13.5px] opacity-70">{heirsLine}</Text>
            <View className="opacity-85">
              <AvatarStack names={heirNames} size={26} ring="bg" />
            </View>
          </View>
        ) : null}
        <View className="flex-row items-center gap-3">
          <Text className="flex-1 text-[13.5px] opacity-70">{deliveryLine}</Text>
          <Icon
            as={Check}
            size={17}
            strokeWidth={2.75}
            className="text-olive-700 shrink-0"
          />
        </View>
      </View>

      <PrimaryCta
        label={actionLabel}
        icon={Fingerprint}
        iconSize={21}
        onPress={onUnlock}
        busy={busy}
      />

      <Text className="mt-3.5 text-center text-[11.5px] leading-[1.6] opacity-50">
        {footnote}
      </Text>
    </>
  )
}
