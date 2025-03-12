'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import type { ThemeProviderProps as NextThemeProviderProps } from 'next-themes/dist/types'

export function ThemeProvider({ children, ...props }: React.PropsWithChildren<NextThemeProviderProps>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}