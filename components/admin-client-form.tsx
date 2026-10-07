
"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function AdminClientForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error ?? "Unable to create client.");
        return;
      }

      router.push(`/admin/clients/${result.id}`);
      router.refresh();
    } catch {
      setError("Unable to create client.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="admin-panel" onSubmit={handleSubmit}>
      <label>
        Client name
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
      </label>

      <label>
        Email address
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </label>

      {error ? <p role="alert">{error}</p> : null}

      <button
        className="admin-button"
        type="submit"
        disabled={submitting}
      >
        {submitting ? "Creating…" : "Create client"}
      </button>
    </form>
  );
}


