import { Inter } from "next/font/google"
import "./globals.css"
import ClientLayout from "@/components/client-layout"
import { AuthProvider } from "@/contexts/auth-context"
import { UserProvider } from "@/hooks/use-user" // Add this import
import { Toaster } from "@/components/ui/toaster"
import BadgeTracker from "@/components/badge-tracker"

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  generator: "v0.dev"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          <UserProvider> {/* Add this wrapper */}
            <BadgeTracker />
            <ClientLayout>
              {children}
            </ClientLayout>
            <Toaster />
          </UserProvider>
        </AuthProvider>
      </body>
    </html>
  );
}