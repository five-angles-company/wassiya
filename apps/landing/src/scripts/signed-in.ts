/**
 * The header's account button reads "تسجيل الدخول" by default and "بلاغاتي"
 * once the visitor is signed in to the web app. Both lead to the web app's
 * front page, which asks for sign-in when there is no session.
 *
 * This site has no session, so it reads Clerk's `__client_uat` marker: "0" when
 * signed out, a timestamp when a session exists. Clerk sets it on the root
 * domain (`localhost` locally), so it reaches here only while the web app lives
 * on wassiya.app or a subdomain of it. A stale marker only changes the label.
 */
export {}

const MARKER = /(?:^|;\s*)__client_uat(?:_[\w-]+)?=([^;]*)/g

const signedIn = [...document.cookie.matchAll(MARKER)].some(([, value]) => value !== "" && value !== "0")
if (signedIn) {
  for (const label of document.querySelectorAll<HTMLElement>("[data-account-label]")) {
    label.hidden = label.dataset.accountLabel !== "signed-in"
  }
}
