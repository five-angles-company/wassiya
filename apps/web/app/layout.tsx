import { Geist_Mono, Inter } from "next/font/google"
import { ClerkProvider } from "@clerk/nextjs"

import "@workspace/ui/globals.css"
import { ConvexClientProvider } from "@/components/convex-client-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@workspace/ui/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", inter.variable)}
    >
      <body>
        {/* ClerkProvider must wrap ConvexClientProvider — Convex reads Clerk's
            context to get its access token. */}
        <ClerkProvider>
          <ThemeProvider>
            <ConvexClientProvider>{children}</ConvexClientProvider>
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  )
}
