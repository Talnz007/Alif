"use client";

import { usePathname } from "next/navigation";
import { ThemeProvider } from "@/components/theme-provider";
import Sidebar from "@/components/sidebar";
import { Navbar } from "@/components/navbar";
import { useState, useEffect } from "react";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLandingPage = pathname === "/";
  // Add register and login to excluded routes
  const isAuthPage = pathname === "/register" || pathname === "/login" || pathname === "/signup";
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // Prevents hydration mismatch
  }

  // For landing page and auth pages, don't show sidebar
  if (isLandingPage || isAuthPage) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        {isLandingPage && <Navbar />}
        <main className={isLandingPage ? "min-h-screen pt-16" : "min-h-screen"}>{children}</main>
      </ThemeProvider>
    );
  }

  // App layout with Sidebar for all other routes
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </ThemeProvider>
  );
}