import { redirect } from "next/navigation";

// Generate the redirect per request so the server includes its Location header.
export const dynamic = "force-dynamic";

export default function RootPage() {
  redirect("/dashboard");
}
