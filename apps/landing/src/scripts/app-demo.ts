/**
 * The hero's phone: three working tabs and the check-in.
 *
 * ⚠️ "أنا بخير" opens the fingerprint prompt and only the prompt confirms, as in
 * the app (`use-confirm-alive`). A demo where a tap alone checked in would
 * teach the one thing the product is built to prevent.
 *
 * Nothing here is saved anywhere. Without this script the phone shows the Home
 * screen and nothing more.
 */
export {}

const root = document.querySelector<HTMLElement>("[data-demo]")
if (root !== null) {
  wire(root)
}

function wire(root: HTMLElement): void {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  const hint = document.querySelector<HTMLElement>("[data-demo-hint]")
  const checkin = root.querySelector<HTMLElement>("[data-demo-checkin]")
  const confirm = root.querySelector<HTMLButtonElement>("[data-demo-confirm]")
  const sheet = root.querySelector<HTMLElement>("[data-demo-sheet]")
  const sensor = root.querySelector<HTMLButtonElement>("[data-demo-touch]")

  if (hint !== null) hint.hidden = false
  const used = () => {
    if (hint !== null) hint.hidden = true
  }

  for (const tab of root.querySelectorAll<HTMLButtonElement>("[data-demo-tab]")) {
    tab.addEventListener("click", () => {
      used()
      const key = tab.dataset.demoTab
      for (const other of root.querySelectorAll<HTMLElement>("[data-demo-tab]")) {
        other.dataset.active = String(other === tab)
      }
      for (const screen of root.querySelectorAll<HTMLElement>("[data-demo-screen]")) {
        screen.hidden = screen.dataset.demoScreen !== key
      }
    })
  }

  if (checkin === null || confirm === null || sheet === null || sensor === null) return

  const close = () => {
    sheet.hidden = true
    confirm.focus()
  }

  confirm.addEventListener("click", () => {
    used()
    sensor.dataset.state = "idle"
    sheet.hidden = false
    sensor.focus()
  })

  for (const cancel of sheet.querySelectorAll<HTMLButtonElement>("[data-demo-cancel]")) {
    cancel.addEventListener("click", close)
  }
  sheet.addEventListener("keydown", (event) => {
    if (event.key === "Escape") close()
  })

  sensor.addEventListener("click", () => {
    if (sensor.dataset.state === "ok") return
    sensor.dataset.state = "ok"
    window.setTimeout(
      () => {
        checkin.dataset.state = "confirmed"
        close()
      },
      reduced ? 0 : 650
    )
  })
}
