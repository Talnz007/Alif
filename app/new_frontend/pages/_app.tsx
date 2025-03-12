import type { AppProps } from 'next/app';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { UserProvider } from '@/hooks/use-user';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <UserProvider>
        <Component {...pageProps} />
        <Toaster />
      </UserProvider>
    </ThemeProvider>
  );
}