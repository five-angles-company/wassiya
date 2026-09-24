/**
 * The browser's support identity when nobody is signed in.
 *
 * It is a bearer secret: whoever holds it reads this browser's guest threads.
 * It never leaves the browser except as an argument to the support functions,
 * which store only its hash. Losing it (cleared storage, another browser) is
 * recovered by the single-use link in the next reply email.
 */
const KEY = "wassiya.support.guest"

let memory: string | null = null

function mint(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")
}

export function guestToken(): string {
  try {
    const stored = window.localStorage.getItem(KEY)
    if (stored !== null && stored.length >= 32) return stored
    const fresh = memory ?? mint()
    window.localStorage.setItem(KEY, fresh)
    memory = fresh
    return fresh
  } catch {
    memory ??= mint()
    return memory
  }
}
