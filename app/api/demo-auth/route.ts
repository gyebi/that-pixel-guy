import { NextResponse } from "next/server";
import { demoClientCookie } from "@/lib/demo-auth";
import { demoRepository } from "@/lib/demo-repository";

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const clientId = typeof body === "object" && body !== null && "clientId" in body && typeof body.clientId === "string" ? body.clientId : undefined;
  const client = clientId ? await demoRepository.getClient(clientId) : undefined;
  if (!client) return NextResponse.json({ error: "Select one of the available demo clients." }, { status: 400 });

  const response = NextResponse.json({ clientId: client.id });
  response.cookies.set(demoClientCookie, client.id, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 4 });
  return response;
}

export function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(demoClientCookie, "", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 });
  return response;
}
