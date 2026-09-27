import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { AvatarStack } from "@workspace/ui-native/components/wassiya/avatar-stack"
import { PrimaryCta } from "@workspace/ui-native/components/wassiya/primary-cta"
import { Check, Fingerprint } from "lucide-react-native"
import { View } from "react-native"

/**
 * ٤.١ before the vault is open.
 *
 * A locked vault should feel intact, not withheld — so no padlock and no blurred
 * list behind a scrim. The screen states what is in there and that it still
 * works: the count, the executors, and the fact that delivery is unaffected. Someone
 * who opens the app to reassure themselves gets that without unlocking anything.
 *
 * **Nothing here decrypts.** The count and the executors' initials come from
 * unencrypted metadata the deployment already holds, which is why this paints
 * instantly on a cold start. The figure is the same one the list's own header
 * carries, so the two screens agree.
 *
 * No password fallback: a failed fingerprint falls through to the device
 * credential and that is the end of the ladder. MK is bound to the keystore, so
 * a Wassiya password would promise an unlock the keystore cannot perform.
 */
export type AssetsLockedProps = {
  /** The vault's size, in the locale's numerals. */
  count: string
  /** "أصلاً محفوظاً ومشفّراً على هذا الجهاز". */
  countUnit: string
  /** "الأوصياء: ٣". Omitted when no executor exists yet. */
  executorsLine?: string
  /** Up to three, for the faces beside `executorsLine`. */
  executorNames?: string[]
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
  count,
  countUnit,
  executorsLine,
  executorNames = [],
  deliveryLine,
  actionLabel,
  footnote,
  onUnlock,
  busy,
}: AssetsLockedProps) {
  return (
    <>
      {/* `my-auto`, not `mb-auto`: this is the whole screen, so it sits in the
          middle of the frame rather than clinging to the header with the void
          moved underneath it. */}
      <View className="rounded-summary my-auto items-center bg-card px-5 pt-6 pb-5">
        <Text className="font-heading-black text-[64px] leading-[0.9] text-foreground">
          {count}
        </Text>
        {/* `w-full`: the card is `items-center`, which sizes a child to its own
            content — without a width this line ran past the padding and lost
            its last word rather than wrapping. */}
        <Text variant="prose" className="mt-1.5 w-full text-center">
          {countUnit}
        </Text>

        <View className="my-5 h-px w-full bg-border" />

        <View className="w-full gap-[11px]">
          {executorsLine !== undefined ? (
            <View className="flex-row items-center gap-3">
              <Text variant="proseSm" className="flex-1">
                {executorsLine}
              </Text>
              {/* `ring="surface"`: the faces are cut out of the card now, not
                  the page, and the wrong ground leaves a hairline on each. */}
              <View className="opacity-85">
                <AvatarStack names={executorNames} size={26} ring="surface" />
              </View>
            </View>
          ) : null}
          <View className="flex-row items-center gap-3">
            <Text variant="proseSm" className="flex-1">
              {deliveryLine}
            </Text>
            <Icon
              as={Check}
              size={17}
              strokeWidth={2.75}
              className="shrink-0 text-olive-700"
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

        <Text variant="footnote" className="mt-3 text-center">
          {footnote}
        </Text>
      </View>
    </>
  )
}
