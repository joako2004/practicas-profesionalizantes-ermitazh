import { requireAdminApi } from "@/lib/auth/perfil";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  return NextResponse.json({ user: auth.user, isAdmin: true });
}