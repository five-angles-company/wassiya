"use client"

/**
 * The last resort: a throw in the root layout itself, which `app/error.tsx`
 * cannot catch because it lives under that layout. This replaces the whole
 * document.
 *
 * ⚠️ Deliberately dependency-free and inline-styled. If the root layout threw,
 * `globals.css`, the fonts and the locale are all unavailable — a Tailwind class
 * here would render unstyled. The locale is unknowable too, so both languages
 * are shown. The colours are the palette's, written out.
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
          background: "#f5ead8",
          color: "#201e1d",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: "30rem",
            display: "grid",
            gap: "0.85rem",
            padding: "2rem",
            borderRadius: "28px",
            background: "#fdfaf4",
            border: "1px solid rgb(32 30 29 / 0.16)",
            boxShadow: "0 8px 24px -8px rgb(32 30 29 / 0.18)",
          }}
        >
          <h1 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 800 }}>لم تُحمَّل الصفحة</h1>
          <p style={{ margin: 0, fontSize: "0.95rem", lineHeight: 1.8 }}>
            حدث خطأ قبل أن تعمل الصفحة. أعد تحميلها.
          </p>
          <p dir="ltr" style={{ margin: 0, fontSize: "0.95rem", lineHeight: 1.7, textAlign: "left" }}>
            Something went wrong before the page could start. Please reload it.
          </p>
          {error.digest !== undefined && (
            <p
              dir="ltr"
              style={{
                margin: 0,
                fontFamily: "ui-monospace, monospace",
                fontSize: "0.75rem",
                textAlign: "left",
                color: "#82796a",
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
              marginTop: "0.25rem",
              padding: "0.75rem 1.5rem",
              borderRadius: "999px",
              border: 0,
              background: "#ea5b48",
              color: "#f5ead8",
              font: "inherit",
              fontWeight: 700,
              fontSize: "0.95rem",
              cursor: "pointer",
            }}
          >
            حاول مرة أخرى · Try again
          </button>
        </div>
      </body>
    </html>
  )
}
