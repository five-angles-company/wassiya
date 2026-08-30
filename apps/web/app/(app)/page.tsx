import { HomeBoard } from "@/features/overview/components/home-board"

/**
 * `/` — the app's front door.
 *
 * A thin route. Everything on this screen depends on who is looking, and that
 * is four Convex subscriptions, so the whole board is a Client Component and
 * this file only names it.
 */
export default function HomePage() {
  return <HomeBoard />
}
