"use client"

export type FieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  hint?: string
  error?: string
  type?: "text" | "email" | "tel" | "date"
  /** `ltr` for machine strings — an email, a phone, a reference. */
  dir?: "rtl" | "ltr"
  placeholder?: string
}

/**
 * A labelled field.
 *
 * ## Why it stopped being a pill
 *
 * It was a 62px full-width capsule on the card tone with a 16%-ink hairline —
 * the funnel's grammar, where one question owned a screen. Stacked three deep
 * in a form it read as three empty beige sausages: nothing about the shape said
 * "type here", and the border was too faint on that ground to draw an edge at
 * all.
 *
 * Three changes and each is doing one job. **The ground is `sand-50`**, lighter
 * than every surface around it, because a field being the brightest thing in a
 * form is the oldest and most reliable signal that it is where the text goes.
 * **The border is `sand-300`**, which actually resolves against both the page
 * and a card. And **the radius is 16px, not a pill** — a fully rounded input in
 * a stacked form reads as a search box, and there is nothing to search here.
 *
 * ## Focus is a ring, not a colour swap
 *
 * A border that merely changes hue is invisible to anyone who was not watching
 * that edge. The 4px terracotta halo is visible in peripheral vision, which is
 * what a keyboard user needs when tab moves them somewhere they were not
 * looking.
 *
 * ## `dir` is not cosmetic
 *
 * An email address and a phone number are Latin machine strings sitting in an
 * Arabic form. Left to inherit RTL, the caret jumps, the `@` lands in the wrong
 * place visually, and people mistype their own address.
 */
export function Field({
  label,
  value,
  onChange,
  hint,
  error,
  type = "text",
  dir = "rtl",
  placeholder,
}: FieldProps) {
  const message = error ?? hint

  return (
    <label className="flex flex-col gap-2">
      <span className="text-[13.5px] font-semibold">{label}</span>

      <input
        type={type}
        dir={dir}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error !== undefined}
        className={`bg-sand-50 placeholder:text-sand-500 h-[52px] rounded-2xl border-[1.5px] px-4 text-[15.5px] outline-none transition-[border-color,box-shadow] focus-visible:border-[color:var(--primary)] focus-visible:ring-4 focus-visible:ring-[color:var(--color-terracotta-200)] ${
          error === undefined ? "border-sand-300" : "border-terracotta-700"
        } ${dir === "ltr" ? "font-mono text-[14.5px] font-medium" : ""}`}
      />

      {message !== undefined && (
        <span
          className={`text-[12.5px] leading-[1.6] ${
            error === undefined ? "text-muted-foreground" : "text-terracotta-800"
          }`}
        >
          {message}
        </span>
      )}
    </label>
  )
}
