"use client"

/**
 * The last resort: a throw in the root layout itself.
 *
 * `(dashboard)/error.tsx` catches everything inside the shell, but it lives
 * *under* the root layout — so it cannot catch that layout failing, and neither
 * can anything else. This replaces the whole document, `<html>` and `<body>`
 * included, which is why it declares them.
 *
 * Deliberately dependency-free and inline-styled. The root layout is what
 * imports `globals.css`, sets `dir`, and loads the Arabic faces; if it threw,
 * none of that is available and a Tailwind class here would render unstyled.
 * For the same reason the locale is unknowable — `LocaleProvider` is inside the
 * layout that failed — so both languages are shown rather than guessing at one.
 *
 * If this screen is ever seen in production it is a build or provider fault,
 * not a data one, and reloading is genuinely all the reader can do.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="ar" dir="rtl">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
          background: "#fff",
          color: "#171717",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ maxWidth: "28rem", display: "grid", gap: "0.75rem" }}>
          <h1 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 600 }}>
            تعذّر تحميل اللوحة
          </h1>
          <p style={{ margin: 0, fontSize: "0.875rem", lineHeight: 1.6 }}>
            حدث خطأ قبل أن تبدأ الواجهة بالعمل. أعد تحميل الصفحة.
          </p>
          <p
            dir="ltr"
            style={{
              margin: 0,
              fontSize: "0.875rem",
              lineHeight: 1.6,
              textAlign: "left",
            }}
          >
            The console failed before the interface started. Reload the page.
          </p>
          {error.digest !== undefined && (
            <p
              dir="ltr"
              style={{
                margin: 0,
                fontFamily: "ui-monospace, monospace",
                fontSize: "0.75rem",
                textAlign: "left",
                opacity: 0.7,
              }}
            >
              {error.digest}
            </p>
          )}
          <button
            type="button"
            onClick={reset}
            style={{
              justifySelf: "start",
              padding: "0.5rem 0.875rem",
              borderRadius: "0.5rem",
              border: "1px solid currentColor",
              background: "transparent",
              font: "inherit",
              fontSize: "0.875rem",
              cursor: "pointer",
            }}
          >
            أعد المحاولة · Try again
          </button>
        </div>
      </body>
    </html>
  )
}
