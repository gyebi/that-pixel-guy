
"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  clientId: string;
};

export function AdminShootForm({ clientId }: Props) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/shoots", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientId,
          name,
          date,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error ?? "Unable to create shoot.");
        return;
      }

      router.push(`/admin/clients/${clientId}`);
      router.refresh();
    } catch {
      setError("Unable to create shoot.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="admin-panel" onSubmit={handleSubmit}>
      <label>
        Shoot name
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Abigail's Graduation"
          required
        />
      </label>

      <label>
        Shoot date
        <input
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          required
        />
      </label>

      {error ? <p role="alert">{error}</p> : null}

      <button
        className="admin-button"
        type="submit"
        disabled={submitting}
      >
        {submitting ? "Creating…" : "Create shoot"}
      </button>
    </form>
  );
}

