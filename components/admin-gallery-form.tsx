
"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  shootId: string;
  clientId: string;
};

export function AdminGalleryForm({
  shootId,
  clientId,
}: Props) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [expiresOn, setExpiresOn] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/galleries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          shootId,
          name,
          expiresOn,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error ?? "Unable to create gallery.");
        return;
      }

      router.push(`/admin/clients/${clientId}`);
      router.refresh();
    } catch {
      setError("Unable to create gallery.");
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
      <h2>Gallery information</h2>
      <p>Enter the details for this client gallery.</p>
    </div>

    <div className="admin-form__fields">
      <label htmlFor="gallery-name">Gallery name</label>
      <input
        id="gallery-name"
        type="text"
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="e.g. Abigail Graduation Gallery"
        required
      />

      <label htmlFor="gallery-expiration">Expiration date</label>
      <input
        id="gallery-expiration"
        type="date"
        value={expiresOn}
        onChange={(event) => setExpiresOn(event.target.value)}
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
        {submitting ? "Creating…" : "Create gallery"}
      </button>
    </div>
  </form>
);

}
