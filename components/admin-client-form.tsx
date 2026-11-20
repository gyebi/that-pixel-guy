
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
  <form
    className="admin-panel admin-form"
    onSubmit={handleSubmit}
  >
    <div className="admin-form__heading">
      <h2>Client information</h2>
      <p>Enter the client&apos;s details to create their profile.</p>
    </div>

    <div className="admin-form__fields">
      <label htmlFor="client-name">Client name</label>
      <input
        id="client-name"
        type="text"
        autoComplete="name"
        maxLength={120}
        value={name}
        onChange={(event) => setName(event.target.value)}
        required
      />

      <label htmlFor="client-email">Email address</label>
      <input
        id="client-email"
        type="email"
        autoComplete="email"
        maxLength={254}
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
      />
    </div>

    {error ? (
      <p className="admin-form__error" role="alert">
        {error}
      </p>
    ) : null}

    <div className="admin-form__actions">
      <button
        className="admin-button"
        type="submit"
        disabled={submitting}
      >
        {submitting ? "Creating…" : "Create client"}
      </button>
    </div>
  </form>
);

}
