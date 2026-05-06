import type { Metadata } from "next"
import { Fraunces, DM_Sans, JetBrains_Mono, Noto_Serif_SC } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

// Display serif with strong character: variable optical sizing, italic for emphasis.
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
})

// Geometric warm sans for UI body. Distinct from generic Inter / system stack.
const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-dm-sans",
  display: "swap",
})

// Typewriter-feel mono for content, IDs, dates, small-caps labels.
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
  display: "swap",
})

// Chinese serif companion to Fraunces for display moments.
const notoSerifSC = Noto_Serif_SC({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-noto-serif-sc",
  display: "swap",
})

export const metadata: Metadata = {
  title: "纸片剪贴板 · A Quiet Archive",
  description: "一个私人的临时文本中转站",
  generator: "v0.app",
  icons: {
    icon: [
      { url: "/icon-light-32x32.png", media: "(prefers-color-scheme: light)" },
      { url: "/icon-dark-32x32.png", media: "(prefers-color-scheme: dark)" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="zh-CN"
      suppressHydrationWarning
      className={`${fraunces.variable} ${dmSans.variable} ${jetbrainsMono.variable} ${notoSerifSC.variable} bg-background`}
    >
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          {children}
          <Toaster richColors position="top-center" />
        </ThemeProvider>
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}
