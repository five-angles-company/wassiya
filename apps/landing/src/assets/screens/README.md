# App screenshots

The hero's phone shows the app's Home screen. Until a capture exists it draws
that screen in HTML (`src/components/mock/HomeScreen.astro`), from the app's
own components and strings; a real capture, dropped here, replaces it:

```
ar/home.png
en/home.png
```

- Portrait, iPhone 6.7" (1290 × 2796), the same file as the store listing.
  `.png`, `.jpg` or `.webp`.
- **Demo data only.** No real names, numbers, balances or phone numbers.
- A missing English capture falls back to the Arabic one; with neither, the
  drawn screen stays. The build never fails for want of a file.

The other pictures on the page (vault rows, heir preview, recovery sheet) are
drawn fragments in `src/components/mock/`, sized to the app's tokens. When the
app's look changes, change them with it.
