
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
    <form
      className="admin-panel admin-form"
      onSubmit={handleSubmit}
    >
      <div className="admin-form__heading">
        <h2>Shoot information</h2>
        <p>Enter the details for this photography session.</p>
      </div>

      <div className="admin-form__fields">
        <label htmlFor="shoot-name">Shoot name</label>
        <input
          id="shoot-name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Abigail's Graduation"
          required
        />

        <label htmlFor="shoot-date">Shoot date</label>
        <input
          id="shoot-date"
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
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
          {submitting ? "Creating…" : "Create shoot"}
        </button>
      </div>
    </form>
  );

}
