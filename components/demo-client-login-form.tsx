"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ClientOption = { id: string; name: string; shoot: string };

export function DemoClientLoginForm({ clients }: { clients: ClientOption[] }) {
  const router = useRouter();
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function signIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);
    const response = await fetch("/api/demo-auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clientId }) });
    if (!response.ok) {
      const body = await response.json().catch(() => null) as { error?: string } | null;
      setMessage(body?.error ?? "We could not start the demo gallery session.");
      setIsSubmitting(false);
      return;
    }
    router.replace("/client");
    router.refresh();
  }

  return <form className="demo-login-form" onSubmit={signIn}><label>Choose a demonstration client<select value={clientId} onChange={(event) => setClientId(event.target.value)}>{clients.map((client) => <option value={client.id} key={client.id}>{client.name} — {client.shoot}</option>)}</select></label><button type="submit" disabled={isSubmitting}>{isSubmitting ? "Opening gallery…" : "Enter demo gallery"}</button><p aria-live="polite">{message || "This simulated login uses an HttpOnly demo-session cookie; production authentication remains deferred."}</p></form>;
}
