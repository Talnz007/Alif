import type { AppProps } from 'next/app';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/auth-context';
import { UserProvider } from '@/hooks/use-user';
import '@/app/globals.css';  // Make sure this path is correct

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <UserProvider>
          <Component {...pageProps} />
          <Toaster />
        </UserProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}