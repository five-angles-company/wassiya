import { Icon } from "@workspace/ui-native/components/ui/icon"
import { cn } from "@workspace/ui-native/lib/utils"
import { Bold, Italic, List, Mic, Sparkles, Square } from "lucide-react-native"
import { Pressable, View } from "react-native"

export type NoteSelection = { start: number; end: number }

export type NoteToolbarProps = {
  value: string
  selection: NoteSelection
  onChange: (next: string, caret: number) => void
  /** Null hides the dictation button — the device cannot do it. */
  onDictate: (() => void) | null
  dictating: boolean
  labels: Record<string, string>
}

/**
 * ٤.٨'s toolbar: bold, italic, list, the sage wish block, and dictation.
 *
 * **Markdown markers in plain text, not a rich-text editor.** A WebView editor
 * would bring its own document model — a large dependency, a second text
 * pipeline, and a stored format nothing else in this app can read. The buttons
 * wrap the selection in `**bold**`, `_italic_`, `- item`, `> wish` and the note
 * stays a UTF-8 string, so it encrypts, round-trips and renders in an heir's
 * browser with no editor at either end. An heir reading the raw text with no
 * renderer at all still reads a legible letter, where a serialised editor
 * document would be unreadable without the tool that wrote it.
 *
 * With no selection, a marker pair is inserted and the caret placed between
 * them, so tapping **B** and typing does what it looks like it should.
 */
export function NoteToolbar({
  value,
  selection,
  onChange,
  onDictate,
  dictating,
  labels,
}: NoteToolbarProps) {
  function wrap(marker: string) {
    const { start, end } = selection
    const selected = value.slice(start, end)
    const next =
      value.slice(0, start) + marker + selected + marker + value.slice(end)
    // Caret lands after the selection's new closing marker, or between an
    // empty pair so the next keystroke is inside it.
    onChange(next, start + marker.length + selected.length)
  }

  /** Line-level markers apply to the line the caret is on, not a selection. */
  function prefixLine(marker: string) {
    const { start } = selection
    const lineStart = value.lastIndexOf("\n", Math.max(0, start - 1)) + 1
    // Toggling off matters: a list button that only ever adds is a button that
    // cannot be undone without hunting for the characters it inserted.
    const already = value.startsWith(marker, lineStart)
    const next = already
      ? value.slice(0, lineStart) + value.slice(lineStart + marker.length)
      : value.slice(0, lineStart) + marker + value.slice(lineStart)
    onChange(next, start + (already ? -marker.length : marker.length))
  }

  return (
    <View className="flex-row items-center gap-1.5">
      <ToolButton icon={Bold} label={labels.bold} onPress={() => wrap("**")} />
      <ToolButton icon={Italic} label={labels.italic} onPress={() => wrap("_")} />
      <ToolButton
        icon={List}
        label={labels.list}
        onPress={() => prefixLine("- ")}
      />
      {/* Promoted to a first-class button — a wish is a
          different kind of sentence from an instruction, and marking it is how
          an heir knows which one they are reading. */}
      <ToolButton
        icon={Sparkles}
        label={labels.wishBlock}
        tone="olive"
        onPress={() => prefixLine("> ")}
      />
      <View className="grow" />
      {onDictate !== null ? (
        <ToolButton
          icon={dictating ? Square : Mic}
          label={dictating ? labels.dictateStop : labels.dictate}
          tone={dictating ? "terracotta" : undefined}
          onPress={onDictate}
        />
      ) : null}
    </View>
  )
}

function ToolButton({
  icon,
  label,
  onPress,
  tone,
}: {
  icon: typeof Bold
  label: string
  onPress: () => void
  tone?: "olive" | "terracotta"
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className={cn(
        "size-9 items-center justify-center rounded-full",
        tone === "olive"
          ? "bg-olive-200 active:bg-olive-300"
          : tone === "terracotta"
            ? "bg-terracotta-200 active:bg-terracotta-300"
            : "bg-sand-200 active:bg-sand-300"
      )}
    >
      <Icon
        as={icon}
        className={cn(
          "size-4",
          tone === "olive"
            ? "text-olive-700"
            : tone === "terracotta"
              ? "text-terracotta-700"
              : "text-foreground"
        )}
      />
    </Pressable>
  )
}
