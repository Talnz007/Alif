import { Inter } from "next/font/google"
import "./globals.css"
import Sidebar from "@/components/sidebar"
import ClientLayout from "@/components/client-layout"
import { AuthProvider } from "@/contexts/auth-context"
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
          <BadgeTracker /> {/* Add this line to show badge notifications */}
          <ClientLayout>
            {/* Use flex to align sidebar and content side by side */}
            <div className="flex h-screen">
              <Sidebar />
              <div className="flex-1 overflow-y-auto">
                {children}
              </div>
            </div>
          </ClientLayout>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}