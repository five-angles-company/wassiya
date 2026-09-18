import { Text } from "@workspace/ui-native/components/ui/text"
import type * as React from "react"
import { View } from "react-native"

export type WelcomeSlideProps = {
  title: string
  body: string
  /** The four release gates on slide ٣. */
  children?: React.ReactNode
  width: number
}

/**
 * One carousel panel: a heading, a body, and whatever the slide adds.
 *
 * ## There is no illustration
 *
 * There was: a 250px tinted circle holding an 86px Lucide glyph, standing in
 * for commissioned art that space is reserved for. The owner asked for
 * it gone — onboarding was the only place in the product with art of a kind
 * nothing else uses, and the glyph was a placeholder doing a real screen's job.
 *
 * **If commissioned illustration ever lands, this is the decision to revisit**;
 * the design still calls for 250×250 here. Until then the title carries the
 * slide, which is the same thing every other screen does.
 *
 * `width` is passed rather than measured because the parent is a paged
 * `ScrollView`: each page has to be exactly the viewport wide or the paging
 * stops aligning, and a percentage cannot express that inside a horizontal
 * scroll container.
 *
 * ## Centred on both axes
 *
 * `justify-center` and nothing else: the page is already full height, because
 * a horizontal `ScrollView` stretches its children on the cross axis. **Do not
 * reach for `flex-1` here** — on a row it grows the *main* axis, which is the
 * width this slide has to hold exactly, and paging stops aligning the moment a
 * page is not precisely one viewport wide.
 *
 * Vertically only. The text stays start-aligned, like every other screen in the
 * product — centred Arabic gives the eye no edge to return to at the start of
 * each line, and slide ٣'s bulleted list would scatter.
 */
export function WelcomeSlide({
  title,
  body,
  children,
  width,
}: WelcomeSlideProps) {
  return (
    <View style={{ width }} className="px-gutter justify-center">
      <Text variant="screenTitle" className="mb-3 text-[29px] leading-tight">
        {title}
      </Text>
      <Text className="text-[15.5px] leading-[1.7] text-muted-foreground">
        {body}
      </Text>

      {children !== undefined ? (
        <View className="mt-3.5 gap-2">{children}</View>
      ) : null}
    </View>
  )
}
