import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home() {
  // ✅ Await the headers() call
  const headersList = await headers();
  const hasAuthCookie = headersList.get("cookie")?.includes("auth-token");

  if (hasAuthCookie) {
    redirect("/app");
  }

  return <h1>Welcome to Home Page</h1>;
}
