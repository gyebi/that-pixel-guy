"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  shootId: string;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const acceptedFileTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const acceptedFileExtensions = /\.(jpe?g|png|webp)$/i;

function validateFile(file: File) {
  const hasSupportedType = acceptedFileTypes.has(file.type);
  const hasSupportedExtension = acceptedFileExtensions.test(file.name);

  if (!hasSupportedType && !hasSupportedExtension) {
    return "Choose a JPEG, PNG, or WebP photograph.";
  }

  if (file.size > MAX_FILE_SIZE) {
    return "Choose a photograph smaller than 10 MB.";
  }

  return "";
}

export function AdminPhotoUploadForm({ shootId }: Props) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleFileChange() {
    const file = fileInput.current?.files?.[0];

    setMessage("");
    if (!file) {
      setSelectedFileName("");
      setError("");
      return;
    }

    const validationError = validateFile(file);
    if (validationError) {
      fileInput.current!.value = "";
      setSelectedFileName("");
      setError(validationError);
      return;
    }

    setSelectedFileName(file.name);
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const file = fileInput.current?.files?.[0];
    if (!file) {
      setError("Choose a JPEG, PNG, or WebP photograph first.");
      return;
    }

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      const formData = new FormData();
      formData.set("file", file);
      const response = await fetch(`/api/shoots/${shootId}/photos`, {
        method: "POST",
        body: formData,
      });
      const result = (await response.json().catch(() => null)) as {
        error?: string;
        photo?: { width: number; height: number; format: string };
      } | null;

      if (!response.ok || !result?.photo) {
        setError(result?.error ?? "Unable to upload the photograph.");
        return;
      }

      setMessage(
        `Photograph uploaded (${result.photo.width} × ${result.photo.height}, ${result.photo.format.toUpperCase()}).`,
      );
      if (fileInput.current) {
        fileInput.current.value = "";
      }
      setSelectedFileName("");
      router.refresh();
    } catch {
      setError("Unable to upload the photograph.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="admin-panel admin-upload-form" onSubmit={handleSubmit}>
      <p className="admin-eyebrow">Photographs</p>
      <h2>Upload to this shoot</h2>
      <div className="admin-upload-form__field">
        <label className="admin-upload-form__label" htmlFor="upload-photograph">
          Photograph
        </label>
        <input
          id="upload-photograph"
          ref={fileInput}
          className="admin-upload-form__input"
          type="file"
          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
          disabled={submitting}
          aria-describedby="upload-photograph-help upload-photograph-selection"
          onChange={handleFileChange}
        />
        <label className="admin-upload-form__choose" htmlFor="upload-photograph">
          <span>Choose Photograph</span>
          <span aria-hidden="true">Browse files</span>
        </label>
        <p className="admin-upload-form__help" id="upload-photograph-help">
          JPEG, PNG, or WebP · maximum upload size: 10 MB
        </p>
        <output
          className="admin-upload-form__selection"
          id="upload-photograph-selection"
          aria-live="polite"
        >
          {selectedFileName ? `Selected: ${selectedFileName}` : "No photograph selected"}
        </output>
      </div>
      {error ? (
        <p className="admin-upload-form__message admin-upload-form__message--error" role="alert">
          {error}
        </p>
      ) : null}
      {submitting || message ? (
        <p className="admin-upload-form__message admin-upload-form__message--success" role="status">
          {submitting ? "Uploading photograph…" : message}
        </p>
      ) : null}
      <button
        className="admin-button admin-upload-form__submit"
        type="submit"
        disabled={submitting || !selectedFileName}
      >
        {submitting ? "Uploading…" : "Upload Photograph"}
      </button>
    </form>
  );
}
