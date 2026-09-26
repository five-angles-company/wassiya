import { Button } from "@workspace/ui-native/components/ui/button"
import { Text } from "@workspace/ui-native/components/ui/text"
import { router } from "expo-router"

import { useRef, useState } from "react"
import {
  Pressable,
  ScrollView,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native"
import { I18nManager } from "react-native"

import { Screen } from "@/components/screen"
import { useStrings } from "@/i18n/use-strings"
import { SlideDots } from "@/screens/welcome/components/slide-dots"
import { WelcomeSlide } from "@/screens/welcome/components/welcome-slide"
import { usePreferences } from "@/stores/preferences"

const SLIDE_COUNT = 4

/**
 * 1.2a–d — the four-slide introduction.
 *
 * One route, not four: the slides are a single horizontal pager, so a swipe
 * never touches the navigation stack and "skip" is one action rather than
 * three pops.
 *
 * Slide ٣ is the load-bearing one. It answers the fear the product itself
 * creates — if executors can be given access, what stops them taking it early? —
 * by naming the four gates in the order they actually happen, with the owner's
 * veto last so it is the note the user leaves on. It is also where the word
 * "صامت" is introduced, before section ٥ asks the user to choose it.
 */
export function WelcomeScreen() {
  const { t } = useStrings("welcome")
  const { width } = useWindowDimensions()
  const scrollRef = useRef<ScrollView>(null)
  const [index, setIndex] = useState(0)
  const setHasSeenWelcome = usePreferences((state) => state.setHasSeenWelcome)

  const isLast = index === SLIDE_COUNT - 1

  function goTo(next: number) {
    const clamped = Math.max(0, Math.min(SLIDE_COUNT - 1, next))
    // Under RTL the pager's content is laid out right-to-left, so page N sits
    // at a mirrored offset. `I18nManager.isRTL` is the only thing that knows
    // which, and getting it wrong makes the dots jump to the wrong slide.
    const page = I18nManager.isRTL ? SLIDE_COUNT - 1 - clamped : clamped
    scrollRef.current?.scrollTo({ x: page * width, animated: true })
    setIndex(clamped)
  }

  function onMomentumEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const page = Math.round(event.nativeEvent.contentOffset.x / width)
    setIndex(I18nManager.isRTL ? SLIDE_COUNT - 1 - page : page)
  }

  function leave(href: "/auth/signup" | "/auth/signin") {
    setHasSeenWelcome(true)
    router.replace(href)
  }

  return (
    /* `bleed`, because the pager runs edge to edge and each slide applies its
       own gutter; `flow`, because this is onboarding step zero and shares its
       metrics with every step after it. */
    <Screen scroll={false} bleed inset="flow">
      <View className="px-gutter h-9.5 flex-row justify-end">
        {isLast ? null : (
          <Pressable
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => leave("/auth/signup")}
          >
            <Text className="text-section px-1 py-2 text-muted-foreground">
              {t.skip}
            </Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumEnd}
        className="flex-1"
      >
        <WelcomeSlide
          width={width}
          title={t.vaultTitle}
          body={t.vaultBody}
        />
        <WelcomeSlide
          width={width}
          title={t.zeroKnowledgeTitle}
          body={t.zeroKnowledgeBody}
        />
        <WelcomeSlide
          width={width}
          title={t.releaseTitle}
          body={t.releaseBody}
        >
          {[t.gateIdentity, t.gateCertificate, t.gateReview, t.gateVeto].map(
            (gate) => (
              <View key={gate} className="flex-row gap-2.25">
                <Text className="font-body-bold text-olive-700">·</Text>
                <Text
                  variant="meta"
                  className="text-section flex-1 text-muted-foreground"
                >
                  {gate}
                </Text>
              </View>
            )
          )}
        </WelcomeSlide>
        <WelcomeSlide
          width={width}
          title={t.nothingToMemoriseTitle}
          body={t.nothingToMemoriseBody}
        />
      </ScrollView>

      <View className="px-gutter gap-2.25">
        <SlideDots
          className="mb-5"
          count={SLIDE_COUNT}
          index={index}
          onSelect={goTo}
          label={(i) => `${i + 1}`}
        />

        {isLast ? (
          <>
            <Button onPress={() => leave("/auth/signup")}>
              <Text>{t.getStarted}</Text>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onPress={() => leave("/auth/signin")}
            >
              <Text>{t.signIn}</Text>
            </Button>
          </>
        ) : (
          <Button onPress={() => goTo(index + 1)}>
            <Text>{t.next}</Text>
          </Button>
        )}
      </View>
    </Screen>
  )
}
