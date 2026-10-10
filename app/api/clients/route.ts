import { NextResponse } from "next/server";
import { clientRepository } from "@/lib/repositories/client-repository";
import { getAdminSession } from "@/lib/auth/require-admin";



export async function POST(request: Request) {

  const admin = await getAdminSession();

  if (!admin) {
    return Response.json(
      { error: "Unauthorized. Photographer login required." },
      { status: 401 }
    );
  }

  const body = await request.json();

  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();

  if (!name || !email) {
    return NextResponse.json(
      { error: "Name and email are required." },
      { status: 400 },
    );
  }

  const existingClient = await clientRepository.getByEmail(email);

  if (existingClient) {
    return NextResponse.json(
      { error: "A client with this email already exists." },
      { status: 409 },
    );
  }

  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  const client = await clientRepository.create({
    name,
    email,
    initials,
  });

  return NextResponse.json(client, { status: 201 });
}
