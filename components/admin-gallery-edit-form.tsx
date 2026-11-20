"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  galleryStatuses,
  type GalleryStatus,
} from "@/lib/galleries/gallery-settings";

type Props = {
  gallery: {
    id: string;
    name: string;
    status: GalleryStatus;
    expiresOn: string;
    downloadsEnabled: boolean;
  };
};

export function AdminGalleryEditForm({ gallery }: Props) {
  const router = useRouter();
  const [name, setName] = useState(gallery.name);
  const [status, setStatus] = useState<GalleryStatus>(gallery.status);
  const [expiresOn, setExpiresOn] = useState(gallery.expiresOn);
  const [downloadsEnabled, setDownloadsEnabled] = useState(gallery.downloadsEnabled);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/galleries/${gallery.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          status,
          expiresOn: expiresOn || null,
          downloadsEnabled,
        }),
      });
      const result = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        setError(result?.error ?? "Unable to save gallery settings.");
        return;
      }

      setMessage("Gallery settings saved.");
      router.refresh();
    } catch {
      setError("Unable to save gallery settings.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="admin-panel admin-gallery-edit-form" onSubmit={handleSubmit}>
      <label>
        Gallery name
        <input
          type="text"
          value={name}
          maxLength={120}
          required
          disabled={submitting}
          onChange={(event) => setName(event.target.value)}
        />
      </label>

      <label>
        Gallery status
        <select
          value={status}
          disabled={submitting}
          onChange={(event) => setStatus(event.target.value as GalleryStatus)}
        >
          {galleryStatuses.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>

      <label>
        Expiration date
        <input
          type="date"
          value={expiresOn}
          disabled={submitting}
          onChange={(event) => setExpiresOn(event.target.value)}
        />
        <small>Leave this blank to keep the gallery available without an expiration date.</small>
      </label>

      <label className="admin-gallery-edit-form__checkbox">
        <input
          type="checkbox"
          checked={downloadsEnabled}
          disabled={submitting}
          onChange={(event) => setDownloadsEnabled(event.target.checked)}
        />
        <span>Allow client downloads</span>
      </label>

      {error ? <p className="admin-gallery-edit-form__message admin-gallery-edit-form__message--error" role="alert">{error}</p> : null}
      {submitting || message ? <p className="admin-gallery-edit-form__message admin-gallery-edit-form__message--success" role="status">{submitting ? "Saving gallery settings…" : message}</p> : null}

      <button className="admin-button" type="submit" disabled={submitting}>
        {submitting ? "Saving…" : "Save gallery settings"}
      </button>
    </form>
  );
}
