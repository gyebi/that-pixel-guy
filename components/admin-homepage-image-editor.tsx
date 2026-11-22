"use client";
/* eslint-disable @next/next/no-img-element -- local object-URL previews and arbitrary authenticated Cloudinary URLs cannot use the optimizer. */

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { HOMEPAGE_IMAGE_SLOTS, type HomepageImageSlot } from "@/lib/homepage/homepage-image-types";
import { getHomepageImage } from "@/lib/homepage/homepage-images";
import type { HomepageContentRecord } from "@/lib/homepage/homepage-content-types";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const acceptedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const slotNames = Object.keys(HOMEPAGE_IMAGE_SLOTS) as HomepageImageSlot[];

type ImageState = {
  currentUrl: string;
  altText: string;
  file: File | null;
  previewUrl: string | null;
  error: string;
  message: string;
  saving: boolean;
};

function initialState(content: HomepageContentRecord) {
  return Object.fromEntries(slotNames.map((slot) => {
    const image = getHomepageImage(content, slot);
    return [slot, {
      currentUrl: image.url,
      altText: image.alt,
      file: null,
      previewUrl: null,
      error: "",
      message: "",
      saving: false,
    } satisfies ImageState];
  })) as Record<HomepageImageSlot, ImageState>;
}

function fileError(file: File) {
  if (!acceptedTypes.has(file.type)) return "Choose a JPEG, PNG, or WebP photograph.";
  if (file.size > MAX_FILE_SIZE) return "Choose a photograph smaller than 10 MB.";
  return "";
}

export function AdminHomepageImageEditor({ content }: { content: HomepageContentRecord }) {
  const [images, setImages] = useState(() => initialState(content));
  const [revision, setRevision] = useState(content.revision);
  const previewUrls = useRef(new Set<string>());

  useEffect(() => () => {
    previewUrls.current.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  function update(slot: HomepageImageSlot, change: Partial<ImageState>) {
    setImages((current) => ({ ...current, [slot]: { ...current[slot], ...change } }));
  }

  function selectFile(slot: HomepageImageSlot, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    const current = images[slot];
    if (current.previewUrl) {
      URL.revokeObjectURL(current.previewUrl);
      previewUrls.current.delete(current.previewUrl);
    }
    if (!file) {
      update(slot, { file: null, previewUrl: null, error: "", message: "" });
      return;
    }
    const error = fileError(file);
    if (error) {
      event.target.value = "";
      update(slot, { file: null, previewUrl: null, error, message: "" });
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    previewUrls.current.add(previewUrl);
    update(slot, { file, previewUrl, error: "", message: "" });
  }

  async function save(slot: HomepageImageSlot) {
    const image = images[slot];
    if (!image.file || image.saving) return;
    const altText = image.altText.trim();
    if (altText.length < 3 || altText.length > 300) {
      update(slot, { error: "Add meaningful alt text between 3 and 300 characters.", message: "" });
      return;
    }

    update(slot, { saving: true, error: "", message: "" });
    const formData = new FormData();
    formData.set("slot", slot);
    formData.set("altText", altText);
    formData.set("revision", String(revision));
    formData.set("file", image.file);
    try {
      const response = await fetch("/api/admin/homepage-images", { method: "POST", body: formData });
      const body = await response.json().catch(() => null) as {
        error?: string;
        image?: { url: string; altText: string; revision: number };
      } | null;
      if (!response.ok || !body?.image) {
        update(slot, { saving: false, error: body?.error ?? "Unable to replace this photograph.", message: "" });
        return;
      }
      if (image.previewUrl) {
        URL.revokeObjectURL(image.previewUrl);
        previewUrls.current.delete(image.previewUrl);
      }
      setRevision(body.image.revision);
      update(slot, {
        currentUrl: body.image.url,
        altText: body.image.altText,
        file: null,
        previewUrl: null,
        saving: false,
        error: "",
        message: "Photograph saved and published. The previous asset was retained.",
      });
    } catch {
      update(slot, { saving: false, error: "Unable to replace this photograph. Check your connection and try again.", message: "" });
    }
  }

  return (
    <section className="admin-form admin-homepage-images" aria-labelledby="homepage-images-heading">
      <div className="admin-form__heading">
        <div>
          <p className="admin-eyebrow">Published homepage content</p>
          <h2 id="homepage-images-heading">Homepage photographs</h2>
          <p>Replace only the existing image positions. JPEG, PNG, and WebP up to 10 MB. The displayed photograph remains in place until its replacement is stored and published.</p>
        </div>
      </div>
      <div className="admin-homepage-images__grid">
        {slotNames.map((slot) => {
          const definition = HOMEPAGE_IMAGE_SLOTS[slot];
          const image = images[slot];
          return <article className="admin-homepage-images__card" key={slot}>
            <h3>{definition.label}</h3>
            <div className="admin-homepage-images__previews">
              <figure><img src={image.currentUrl} alt={image.altText} /><figcaption>Currently displayed</figcaption></figure>
              <figure>{image.previewUrl ? <img src={image.previewUrl} alt="Preview of the selected replacement" /> : <div className="admin-homepage-images__empty">Select a replacement to preview it.</div>}<figcaption>Replacement preview</figcaption></figure>
            </div>
            <label>Replacement photograph<input type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" disabled={image.saving} onChange={(event) => selectFile(slot, event)} /></label>
            <label>Alt text<input maxLength={300} value={image.altText} disabled={image.saving} onChange={(event) => update(slot, { altText: event.target.value, error: "", message: "" })} /></label>
            <p className="admin-homepage-images__help">Describe the photograph for people who cannot see it.</p>
            {image.error ? <p className="admin-form__error" role="alert">{image.error}</p> : null}
            {image.message ? <p className="admin-form__success" role="status">{image.message}</p> : null}
            <button className="admin-button" type="button" disabled={!image.file || image.saving} onClick={() => save(slot)}>{image.saving ? "Saving…" : "Save replacement"}</button>
          </article>;
        })}
      </div>
    </section>
  );
}
