import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext({ isDark: false, toggleTheme: () => {} })

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false
    const stored = localStorage.getItem('ts_theme')
    if (stored) return stored === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    const root = document.documentElement
    if (isDark) {
      root.classList.add('dark')
      localStorage.setItem('ts_theme', 'dark')
    } else {
      root.classList.remove('dark')
      localStorage.setItem('ts_theme', 'light')
    }
  }, [isDark])

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme: () => setIsDark((v) => !v) }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
