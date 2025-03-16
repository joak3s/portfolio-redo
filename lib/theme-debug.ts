"use client"

import { useTheme } from "next-themes"
import { useEffect } from "react"

export function useThemeDebug() {
  const { theme, resolvedTheme, setTheme, themes } = useTheme()

  useEffect(() => {
    console.log({
      theme,
      resolvedTheme,
      availableThemes: themes,
      htmlClassList: document.documentElement.classList,
      mediaQuery: window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
    })
  }, [theme, resolvedTheme, themes])

  return { theme, resolvedTheme, setTheme, themes }
}

