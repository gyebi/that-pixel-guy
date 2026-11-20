import { clientRepository } from "@/lib/repositories/client-repository";
import { getAdminSession } from "@/lib/auth/require-admin";
import { createClientCreateHandler } from "@/lib/admin/admin-create-handlers";

const createClient = createClientCreateHandler({
  getAdminSession,
  getByEmail: clientRepository.getByEmail,
  create: clientRepository.create,
});

export async function POST(request: Request) {
  return createClient(request);
}
