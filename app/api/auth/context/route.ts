import { NextResponse } from "next/server";
import { resolveAuthContext } from "@/lib/auth-context";

export async function GET(request: Request) {
  const ctx = await resolveAuthContext(request);
  if (!ctx) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json(ctx);
}
