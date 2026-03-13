import { cookies } from "next/headers";
import { NextRequest } from "next/server";

export const AUTH_COOKIE = "careerlab_auth";

export function isAuthenticated(request: NextRequest): boolean {
  return request.cookies.get(AUTH_COOKIE)?.value === "1";
}

export async function getAuthCookie(): Promise<boolean> {
  const cookieStore = cookies();
  return cookieStore.get(AUTH_COOKIE)?.value === "1";
}
