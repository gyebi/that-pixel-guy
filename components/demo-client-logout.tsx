"use client";

import { useRouter } from "next/navigation";

export function DemoClientLogout() {
  const router = useRouter();
  async function signOut() { await fetch("/api/demo-auth", { method: "DELETE" }); router.replace("/client-login"); router.refresh(); }
  return <button className="client-signout" type="button" onClick={signOut}>Exit demo</button>;
}
