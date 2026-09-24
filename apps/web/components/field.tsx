"use client"

import { TextInput } from "@/components/text-input"

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
 * A label, an input, and the line under it.
 *
 * The input itself is `TextInput` — this component owns only the three-part
 * arrangement around it. It used to own the input too, which is how the claim
 * form's fields and the four code inputs on the box screens ended
 * up as five different controls; a reader meets several of them minutes apart.
 *
 * `dir="ltr"` maps to the input's `mono` treatment, because those two always
 * travel together here: every LTR field in this app is a machine string, and a
 * Latin run left to inherit RTL reorders under the bidi algorithm until it
 * cannot be read back or copied accurately.
 *
 * The message slot shows the error when there is one and the hint otherwise —
 * never both. Two lines under a field is where a reader stops reading.
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
      <span className="text-[14px] font-semibold">{label}</span>

      <TextInput
        type={type}
        mono={dir === "ltr"}
        value={value}
        placeholder={placeholder}
        invalid={error !== undefined}
        onChange={(event) => onChange(event.target.value)}
      />

      {message !== undefined && (
        <span
          className={`text-[13px] leading-[1.6] ${
            error === undefined ? "text-muted-foreground" : "text-tone-attention"
          }`}
        >
          {message}
        </span>
      )}
    </label>
  )
}
