"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

/**
 * Direct theme toggle (Prompt 05K §8).
 *
 * One button, no dropdown/menu. Clicking immediately switches between light and
 * dark. Uses `resolvedTheme` (which resolves a `system` preference to the
 * actually-applied theme) so the icon always reflects the current state and the
 * first click produces the opposite theme. On first visit with no explicit
 * choice, next-themes defaults to `system` (per theme-provider.tsx
 * `defaultTheme="light" enableSystem`) so the system preference is respected
 * until the user clicks. The explicit choice persists via next-themes
 * localStorage, gated by functional-cookie consent in theme-provider.tsx.
 *
 * `mounted` guards against SSR/CSR hydration mismatch (next-themes reads
 * localStorage on the client only); until mounted the button renders a stable
 * placeholder with the same dimensions.
 */
export function ThemeToggleButton() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => setMounted(true), [])

  const isDark = resolvedTheme === "dark"
  const nextLabel = isDark ? "light" : "dark"

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label={`Switch to ${nextLabel} theme`}
      title={`Switch to ${nextLabel} theme`}
      aria-pressed={isDark}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="rounded-full border-2 border-transparent hover:border-primary transition-colors duration-300"
    >
      {/* Render both icons but toggle visibility by resolved theme; before mount
          show the Sun so SSR + first paint match the light default. */}
      <Sun
        className={`h-[1.2rem] w-[1.2rem] transition-all neon-icon ${
          mounted && isDark ? "rotate-90 scale-0" : "rotate-0 scale-100"
        }`}
      />
      <Moon
        className={`absolute h-[1.2rem] w-[1.2rem] transition-all neon-icon ${
          mounted && isDark ? "rotate-0 scale-100" : "rotate-90 scale-0"
        }`}
      />
      <span className="sr-only">
        {mounted
          ? `Current theme: ${isDark ? "dark" : "light"}. Switch to ${nextLabel}.`
          : "Toggle theme"}
      </span>
    </Button>
  )
}
