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
 * A labelled field at the funnel's proportions.
 *
 * The `dir` escape hatch exists because an email address and a phone number are
 * Latin machine strings sitting in an Arabic form: left them to inherit RTL and
 * the caret jumps, the `@` lands in the wrong place visually, and people
 * mistype their own address. Same reasoning as the app's LTR isolates.
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
    <label className="flex flex-col gap-1.5">
      <span className="text-sand-700 text-[13px]">{label}</span>
      <input
        type={type}
        dir={dir}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={`bg-card h-12 rounded-full border px-4 text-[15px] outline-none focus-visible:border-[color:var(--primary)] ${
          error === undefined ? "border-border" : "border-terracotta-700"
        }`}
      />
      {message !== undefined ? (
        <span
          className={`text-[12.5px] leading-[1.6] ${
            error === undefined ? "text-sand-600" : "text-terracotta-800"
          }`}
        >
          {message}
        </span>
      ) : null}
    </label>
  )
}
