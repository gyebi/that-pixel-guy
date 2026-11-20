import { clientRepository } from "@/lib/repositories/client-repository";
import { shootRepository } from "@/lib/repositories/shoot-repository";
import { getAdminSession } from "@/lib/auth/require-admin";
import { createShootCreateHandler } from "@/lib/admin/admin-create-handlers";

const createShoot = createShootCreateHandler({
  getAdminSession,
  getClientById: clientRepository.getById,
  create: shootRepository.create,
});

export async function POST(request: Request) {
  return createShoot(request);
}
