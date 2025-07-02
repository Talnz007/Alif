import { headers } from "next/headers";
import { redirect } from "next/navigation";
import LandingPage from "@/components/marketing/landing-page";

export default async function Home() {
  // Check for authentication
  const headersList = await headers();
  const hasAuthCookie = headersList.get("cookie")?.includes("auth-token");

  // Redirect authenticated users to app
  if (hasAuthCookie) {
    redirect("/app");
  }

  // Show landing page for non-authenticated users
  return <LandingPage />;
}