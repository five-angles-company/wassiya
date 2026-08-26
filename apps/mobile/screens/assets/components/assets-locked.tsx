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
 * ## One card, the shape Home already uses
 *
 * This used to be a bare composition — a status dot pinned to the top by
 * `mb-auto`, then roughly six hundred pixels of nothing, then an 80px numeral
 * sitting low in the frame. It was the only screen in the product with no
 * header block and no card, which made the one screen you meet on a cold start
 * look like a different app.
 *
 * It is now `check-in-hero`'s shape — `rounded-summary px-5 pb-5 pt-6`, centred,
 * with the action inside the card — under ٤.١'s own header. The count keeps its
 * weight because it is still the screen's one idea; it just sits in something.
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
  /** "خزنتك" — the same name the open list carries. */
  title: string
  /** "مغلقة" — plus the last-opened stamp when there is one. */
  status: string
  /** The vault's size, in the locale's numerals. */
  count: string
  /** "أصلاً محفوظاً ومشفّراً على هذا الجهاز". */
  countUnit: string
  /** "يستلمها ٣ ورثة". Omitted when no heirs exist yet. */
  heirsLine?: string
  /** Up to three, for the faces beside `heirsLine`. */
  heirNames?: string[]
  /** "التسليم يعمل حتى وهي مغلقة". */
  deliveryLine: string
  /** "افتح ببصمتك", or the in-flight wording. */
  actionLabel: string
  /** "بصمتك هي المفتاح — لا نملك نسخة منه". */
  footnote: string
  onUnlock: () => void
  busy?: boolean
}

export function AssetsLocked({
  title,
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
      {/* ٤.١'s header block, so the locked vault and the open one are the same
          screen in two states rather than two screens. */}
      <View className="min-w-0">
        <Text variant="metaSm">{status}</Text>
        <Text variant="pageTitle">{title}</Text>
      </View>

      {/* `my-auto`, not `mb-auto`: this is the whole screen, so it sits in the
          middle of the frame rather than clinging to the header with the void
          moved underneath it. */}
      <View className="bg-card rounded-summary my-auto items-center px-5 pb-5 pt-6">
        <Text className="font-heading-black text-foreground text-[64px] leading-[0.9]">
          {count}
        </Text>
        {/* `w-full`: the card is `items-center`, which sizes a child to its own
            content — without a width this line ran past the padding and lost
            its last word rather than wrapping. */}
        <Text className="mt-1.5 w-full text-center text-[15.5px] leading-[1.55] opacity-75">
          {countUnit}
        </Text>

        <View className="bg-border my-5 h-px w-full" />

        <View className="w-full gap-[11px]">
          {heirsLine !== undefined ? (
            <View className="flex-row items-center gap-3">
              <Text className="flex-1 text-[13.5px] opacity-70">
                {heirsLine}
              </Text>
              {/* `ring="surface"`: the faces are cut out of the card now, not
                  the page, and the wrong ground leaves a hairline on each. */}
              <View className="opacity-85">
                <AvatarStack names={heirNames} size={26} ring="surface" />
              </View>
            </View>
          ) : null}
          <View className="flex-row items-center gap-3">
            <Text className="flex-1 text-[13.5px] opacity-70">
              {deliveryLine}
            </Text>
            <Icon
              as={Check}
              size={17}
              strokeWidth={2.75}
              className="text-olive-700 shrink-0"
            />
          </View>
        </View>

        {/* Inside the card, as on Home: the action belongs to the thing it
            acts on, not to the bottom of the screen. */}
        <PrimaryCta
          label={actionLabel}
          icon={Fingerprint}
          iconSize={21}
          onPress={onUnlock}
          busy={busy}
          className="mt-5 w-full"
        />

        <Text className="mt-3 text-center text-[11.5px] leading-[1.6] opacity-50">
          {footnote}
        </Text>
      </View>
    </>
  )
}
