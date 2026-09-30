import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { demoRepository } from "@/lib/demo-repository";

export const demoClientCookie = "tpg-demo-client";

export async function getDemoClient() {
  const clientId = (await cookies()).get(demoClientCookie)?.value;
  return clientId ? demoRepository.getClient(clientId) : undefined;
}

export async function requireDemoClient() {
  const client = await getDemoClient();
  if (!client) redirect("/client-login");
  return client;
}
