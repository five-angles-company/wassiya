import { Redirect } from "expo-router"

// startSSOFlow() captures its own redirect (convexstarter://sso-callback) in
// the in-app browser session. If the OS also hands the deep link to the router,
// land here and bounce home instead of showing "Unmatched route".
export default function SSOCallback() {
  return <Redirect href="/" />
}
