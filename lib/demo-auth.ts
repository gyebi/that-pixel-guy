import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { isDemoAccessEnabled } from "@/lib/demo-access";
import { demoRepository } from "@/lib/demo-repository";

export const demoClientCookie = "tpg-demo-client";

export async function getDemoClient() {
  if (!isDemoAccessEnabled()) {
    return undefined;
  }

  const clientId = (await cookies()).get(demoClientCookie)?.value;
  return clientId ? demoRepository.getClient(clientId) : undefined;
}

export async function requireDemoClient() {
  if (!isDemoAccessEnabled()) {
    notFound();
  }

  const client = await getDemoClient();
  if (!client) redirect("/client-login");
  return client;
}
