import { NextResponse } from "next/server";
import { clientRepository } from "@/lib/repositories/client-repository";
import { shootRepository } from "@/lib/repositories/shoot-repository";

export async function POST(request: Request) {
  const body = await request.json();

  const clientId = String(body.clientId ?? "").trim();
  const name = String(body.name ?? "").trim();
  const dateValue = String(body.date ?? "").trim();

  if (!clientId || !name || !dateValue) {
    return NextResponse.json(
      { error: "Client, shoot name, and date are required." },
      { status: 400 },
    );
  }

  const client = await clientRepository.getById(clientId);

  if (!client) {
    return NextResponse.json(
      { error: "Client not found." },
      { status: 404 },
    );
  }

  const date = new Date(`${dateValue}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return NextResponse.json(
      { error: "Invalid shoot date." },
      { status: 400 },
    );
  }

  const shoot = await shootRepository.create({
    clientId,
    name,
    date,
  });

  return NextResponse.json(shoot, { status: 201 });
}

