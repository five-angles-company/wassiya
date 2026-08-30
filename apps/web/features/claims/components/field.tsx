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
 * A labelled field at the board's proportions: a 62px pill on the card tone.
 *
 * Pill-shaped inputs are unusual and deliberate — every control in this product
 * is a pill, and a rectangular input in among them reads as borrowed from
 * somewhere else. 62px is also comfortably past the 44px floor for a thumb.
 *
 * The `dir` escape hatch exists because an email address and a phone number are
 * Latin machine strings sitting in an Arabic form: leave them to inherit RTL
 * and the caret jumps, the `@` lands in the wrong place visually, and people
 * mistype their own address.
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
    <label className="flex flex-col">
      <span className="mb-2.5 text-[14px] font-semibold">{label}</span>
      <input
        type={type}
        dir={dir}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={`bg-card h-[62px] rounded-full border-[1.5px] px-6 text-[16px] outline-none focus-visible:border-[color:var(--primary)] ${
          error === undefined
            ? "border-[color:var(--border)]"
            : "border-terracotta-700"
        } ${dir === "ltr" ? "font-mono text-[15px] font-medium" : ""}`}
      />
      {message !== undefined && (
        <span
          className={`mt-2 text-[13px] leading-[1.6] ${
            error === undefined ? "opacity-60" : "text-terracotta-800"
          }`}
        >
          {message}
        </span>
      )}
    </label>
  )
}
