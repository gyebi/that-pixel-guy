
import { NextResponse } from "next/server";
import { galleryRepository } from "@/lib/repositories/gallery-repository";
import { shootRepository } from "@/lib/repositories/shoot-repository";
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

  const shootId = String(body.shootId ?? "").trim();
  const name = String(body.name ?? "").trim();
  const expiresOnValue = String(body.expiresOn ?? "").trim();

  if (!shootId || !name) {
    return NextResponse.json(
      { error: "Shoot and gallery name are required." },
      { status: 400 },
    );
  }

  const shoot = await shootRepository.getById(shootId);

  if (!shoot) {
    return NextResponse.json(
      { error: "Shoot not found." },
      { status: 404 },
    );
  }

  let expiresOn: Date | null = null;

  if (expiresOnValue) {
    expiresOn = new Date(`${expiresOnValue}T12:00:00`);

    if (Number.isNaN(expiresOn.getTime())) {
      return NextResponse.json(
        { error: "Invalid expiration date." },
        { status: 400 },
      );
    }
  }

  const gallery = await galleryRepository.create({
    shootId,
    name,
    expiresOn,
    downloadsEnabled: false,
  });

  return NextResponse.json(gallery, { status: 201 });
}



