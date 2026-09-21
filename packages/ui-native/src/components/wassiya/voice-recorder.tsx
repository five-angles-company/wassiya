import { Icon } from '@workspace/ui-native/components/ui/icon';
import { Text } from '@workspace/ui-native/components/ui/text';
import { fmtDuration } from '@workspace/ui-native/lib/format';
import { resolveLabels, type LabelledProps, type LabelSet } from '@workspace/ui-native/lib/labels';
import { cn } from '@workspace/ui-native/lib/utils';
import { Mic, Pause, Play, Square } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

/**
 * ٤.٨'s other composer: a note spoken instead of written.
 *
 * The panel is the one card on the screen, which is what the vault's grammar
 * allows around a secret — here the recording *is* the note.
 *
 * There is no scrubber and no position readout. This is a take being reviewed
 * before it is sealed, not a media file being consumed: the only questions are
 * "did it record" and "is this the one I want", and a timeline invites neither.
 */
export type VoiceRecorderState = 'idle' | 'recording' | 'recorded';

type LabelKey = 'idleHint' | 'record' | 'stop' | 'play' | 'pause' | 'rerecord' | 'recording';

const LABELS: LabelSet<LabelKey> = {
  idleHint: { ar: 'اضغط لتبدأ التسجيل', en: 'Tap to start recording' },
  record: { ar: 'ابدأ التسجيل', en: 'Start recording' },
  stop: { ar: 'أوقف التسجيل', en: 'Stop recording' },
  play: { ar: 'استمع', en: 'Play' },
  pause: { ar: 'إيقاف مؤقت', en: 'Pause' },
  rerecord: { ar: 'سجّل من جديد', en: 'Record again' },
  recording: { ar: 'جارٍ التسجيل', en: 'Recording' },
};

export type VoiceRecorderProps = LabelledProps<LabelKey> & {
  state: VoiceRecorderState;
  /** Elapsed while recording; the take's length once stopped. */
  durationMs: number;
  /** 0–1 per bar. A live window while recording, the whole take once stopped. */
  levels: number[];
  playing?: boolean;
  onRecord: () => void;
  onStop: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  /** Shown as "record again" once there is a take; omit to forbid replacing it. */
  onRerecord?: () => void;
  /** A sentence under the idle button — the length ceiling, usually. */
  hint?: string;
  className?: string;
};

const BARS = 21;
const BAR_MIN = 4;
const BAR_MAX = 30;

export function VoiceRecorder({
  state,
  durationMs,
  levels,
  playing = false,
  onRecord,
  onStop,
  onPlay,
  onPause,
  onRerecord,
  hint,
  locale = 'ar',
  labels,
  className,
}: VoiceRecorderProps) {
  const t = resolveLabels(LABELS, labels, locale);
  const seconds = Math.round(durationMs / 1000);

  if (state === 'idle') {
    return (
      <View className={cn('rounded-card bg-card items-center gap-3.5 px-5 py-7', className)}>
        <RoundButton icon={Mic} label={t.record} onPress={onRecord} size="lg" />
        <Text className="text-footnote text-center opacity-55">{hint ?? t.idleHint}</Text>
      </View>
    );
  }

  if (state === 'recording') {
    return (
      <View className={cn('rounded-card bg-card items-center gap-4 px-5 py-6', className)}>
        <View className="flex-row items-center gap-2">
          <View className="bg-primary size-2 rounded-full" />
          <Text className="text-metasm text-muted-foreground">{t.recording}</Text>
        </View>
        <Text className="font-heading-extrabold text-foreground text-[26px]">
          {fmtDuration(seconds, locale)}
        </Text>
        <Meter levels={levels} live />
        <RoundButton icon={Square} label={t.stop} onPress={onStop} size="lg" />
      </View>
    );
  }

  return (
    <View className={cn('rounded-card bg-card gap-4 px-5 py-5', className)}>
      <View className="flex-row items-center gap-3.5">
        <RoundButton
          icon={playing ? Pause : Play}
          label={playing ? t.pause : t.play}
          onPress={() => (playing ? onPause?.() : onPlay?.())}
        />
        <Meter levels={levels} className="flex-1" />
        <Text className="font-body-semibold text-foreground shrink-0 text-[13.5px]">
          {fmtDuration(seconds, locale)}
        </Text>
      </View>

      {onRerecord !== undefined ? (
        <>
          <View className="bg-border h-px" />
          <Pressable
            accessibilityRole="button"
            onPress={onRerecord}
            className="flex-row items-center justify-center gap-2 active:opacity-70">
            <Icon as={Mic} size={15} className="text-muted-foreground" />
            <Text className="font-body-semibold text-muted-foreground text-action">
              {t.rerecord}
            </Text>
          </Pressable>
        </>
      ) : null}
    </View>
  );
}

/**
 * Bar heights are computed, so they are the one thing here set inline —
 * Tailwind resolves class names at build time and cannot see a level.
 */
function Meter({
  levels,
  live = false,
  className,
}: {
  levels: number[];
  live?: boolean;
  className?: string;
}) {
  // Padded from the start so a fresh take grows into the row instead of
  // jumping across it.
  const padded = [...Array<number>(Math.max(0, BARS - levels.length)).fill(0), ...levels].slice(
    -BARS
  );
  return (
    <View className={cn('h-[30px] flex-row items-center justify-center gap-1', className)}>
      {padded.map((level, index) => (
        <View
          key={index}
          style={{ height: BAR_MIN + level * (BAR_MAX - BAR_MIN) }}
          className={cn('w-[3px] rounded-full', live ? 'bg-terracotta-400' : 'bg-sand-400')}
        />
      ))}
    </View>
  );
}

function RoundButton({
  icon,
  label,
  onPress,
  size = 'md',
}: {
  icon: typeof Mic;
  label: string;
  onPress: () => void;
  size?: 'md' | 'lg';
}) {
  const large = size === 'lg';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className={cn(
        'bg-primary active:bg-terracotta-600 shrink-0 items-center justify-center rounded-full',
        large ? 'size-[68px]' : 'size-11'
      )}>
      <Icon as={icon} size={large ? 26 : 17} className="text-background" />
    </Pressable>
  );
}
