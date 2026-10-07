
import { NextResponse } from "next/server";
import { clientRepository } from "@/lib/repositories/client-repository";

export async function GET() {
  const clients = await clientRepository.getAll();

  return NextResponse.json({
    database: "connected",
    clientCount: clients.length,
    clients,
  });
}
