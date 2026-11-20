"use client";

/* eslint-disable @next/next/no-img-element -- Next image optimization cannot forward the required private admin session cookies. */

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type ShootPhoto = {
  id: string;
  originalFilename: string;
  width: number;
  height: number;
  status: string;
};

type GalleryMembership = {
  photoId: string;
  position: number;
};

type Props = {
  galleryId: string;
  photos: ShootPhoto[];
  memberships: GalleryMembership[];
};

type MutationResponse = {
  memberships?: GalleryMembership[];
  error?: string;
};

function orderedMemberships(memberships: GalleryMembership[]) {
  return [...memberships].sort((first, second) => first.position - second.position);
}

async function readResponse(response: Response) {
  const result = (await response.json().catch(() => null)) as MutationResponse | null;
  if (!response.ok || !result?.memberships) {
    throw new Error(result?.error ?? "Unable to update gallery photographs.");
  }
  return result.memberships;
}

export function AdminGalleryPhotoManager({ galleryId, photos, memberships }: Props) {
  const router = useRouter();
  const [assigned, setAssigned] = useState(() => orderedMemberships(memberships));
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);
  const [busy, setBusy] = useState<"assign" | "reorder" | "">("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [unavailableThumbnails, setUnavailableThumbnails] = useState<Set<string>>(
    () => new Set(),
  );

  const photosById = useMemo(
    () => new Map(photos.map((photo) => [photo.id, photo])),
    [photos],
  );
  const assignedPhotoIds = useMemo(
    () => new Set(assigned.map((membership) => membership.photoId)),
    [assigned],
  );
  const availablePhotos = photos.filter(
    (photo) => !assignedPhotoIds.has(photo.id),
  );

  function togglePhoto(photoId: string) {
    setSelectedPhotoIds((current) =>
      current.includes(photoId)
        ? current.filter((id) => id !== photoId)
        : [...current, photoId],
    );
  }

  function markThumbnailUnavailable(photoId: string) {
    setUnavailableThumbnails((current) => {
      const next = new Set(current);
      next.add(photoId);
      return next;
    });
  }

  function thumbnail(photo: ShootPhoto) {
    if (unavailableThumbnails.has(photo.id)) {
      return (
        <span
          className="admin-gallery-photos__thumbnail admin-gallery-photos__thumbnail--unavailable"
          role="img"
          aria-label={`Thumbnail unavailable for ${photo.originalFilename}`}
        >
          Thumbnail unavailable
        </span>
      );
    }

    return (
      <img
        className="admin-gallery-photos__thumbnail"
        src={`/api/admin/photos/${photo.id}/thumbnail`}
        alt={`Thumbnail for ${photo.originalFilename}`}
        width={64}
        height={64}
        loading="lazy"
        onError={() => markThumbnailUnavailable(photo.id)}
      />
    );
  }

  async function addSelectedPhotos() {
    if (selectedPhotoIds.length === 0) return;

    const highestPosition = assigned.reduce(
      (highest, membership) => Math.max(highest, membership.position),
      -1,
    );

    setBusy("assign");
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/galleries/${galleryId}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignments: selectedPhotoIds.map((photoId, index) => ({
            photoId,
            position: highestPosition + index + 1,
          })),
        }),
      });
      const added = await readResponse(response);
      setAssigned((current) => orderedMemberships([...current, ...added]));
      setSelectedPhotoIds([]);
      setMessage(
        `${added.length} ${added.length === 1 ? "photograph was" : "photographs were"} added to this gallery.`,
      );
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to add photographs to this gallery.",
      );
    } finally {
      setBusy("");
    }
  }

  async function movePhoto(fromIndex: number, toIndex: number) {
    if (toIndex < 0 || toIndex >= assigned.length || busy) return;

    const next = [...assigned];
    const [moved] = next.splice(fromIndex, 1);
    if (!moved) return;
    next.splice(toIndex, 0, moved);

    setBusy("reorder");
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/galleries/${galleryId}/photos`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoIds: next.map((membership) => membership.photoId) }),
      });
      const reordered = await readResponse(response);
      setAssigned(orderedMemberships(reordered));
      setMessage("Gallery photograph order saved.");
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to reorder gallery photographs.",
      );
    } finally {
      setBusy("");
    }
  }

  return (
    <section className="admin-gallery-photos" aria-labelledby="gallery-photos-heading">
      <div className="admin-gallery-photos__heading">
        <div>
          <p className="admin-eyebrow">Gallery photographs</p>
          <h2 id="gallery-photos-heading">{assigned.length} assigned</h2>
        </div>
        <p>Only visible photographs from this shoot can be assigned.</p>
      </div>

      <div className="admin-gallery-photos__columns">
        <form
          className="admin-gallery-photos__picker"
          onSubmit={(event) => {
            event.preventDefault();
            void addSelectedPhotos();
          }}
        >
          <fieldset disabled={Boolean(busy)}>
            <legend>Photographs from this shoot</legend>
            {availablePhotos.length ? (
              <div className="admin-gallery-photos__options">
                {availablePhotos.map((photo) => {
                  const eligible = photo.status === "Visible";
                  return (
                    <label
                      className="admin-gallery-photos__option"
                      data-ineligible={!eligible || undefined}
                      key={photo.id}
                    >
                      <input
                        type="checkbox"
                        checked={selectedPhotoIds.includes(photo.id)}
                        disabled={!eligible}
                        onChange={() => togglePhoto(photo.id)}
                      />
                      {thumbnail(photo)}
                      <span>
                        <b>{photo.originalFilename}</b>
                        <small>
                          {photo.width} × {photo.height} · {photo.status}
                        </small>
                      </span>
                    </label>
                  );
                })}
              </div>
            ) : (
              <p className="admin-gallery-photos__empty">Every photograph from this shoot is already assigned.</p>
            )}
          </fieldset>
          <button
            className="admin-button"
            type="submit"
            disabled={busy === "assign" || selectedPhotoIds.length === 0}
          >
            {busy === "assign" ? "Adding…" : "Add selected photographs"}
          </button>
        </form>

        <div className="admin-gallery-photos__order" aria-live="polite">
          <h3>Display order</h3>
          {assigned.length ? (
            <ol>
              {assigned.map((membership, index) => {
                const photo = photosById.get(membership.photoId);
                if (!photo) return null;

                return (
                  <li key={membership.photoId}>
                    {thumbnail(photo)}
                    <span>
                      <b>{photo.originalFilename}</b>
                      <small>{photo.width} × {photo.height}</small>
                    </span>
                    <span className="admin-gallery-photos__moves">
                      <button
                        type="button"
                        aria-label={`Move ${photo.originalFilename} earlier`}
                        disabled={Boolean(busy) || index === 0}
                        onClick={() => void movePhoto(index, index - 1)}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        aria-label={`Move ${photo.originalFilename} later`}
                        disabled={Boolean(busy) || index === assigned.length - 1}
                        onClick={() => void movePhoto(index, index + 1)}
                      >
                        ↓
                      </button>
                    </span>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="admin-gallery-photos__empty">No photographs are assigned yet.</p>
          )}
        </div>
      </div>

      {error ? <p className="admin-gallery-photos__message admin-gallery-photos__message--error" role="alert">{error}</p> : null}
      {busy === "reorder" || message ? <p className="admin-gallery-photos__message admin-gallery-photos__message--success" role="status">{busy === "reorder" ? "Saving display order…" : message}</p> : null}
    </section>
  );
}
