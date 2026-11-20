"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type {
  HomepageContentInput,
  HomepageContentRecord,
} from "@/lib/homepage/homepage-content-types";

type SaveError = "" | "validation" | "conflict" | "request";
type Field = keyof HomepageContentInput;

const fieldMaximums: Record<Field, number> = {
  heroEyebrow: 120,
  heroHeading: 180,
  heroIntro: 600,
  heroCtaLabel: 80,
  introEyebrow: 120,
  introHeading: 180,
  introBody: 800,
  introCtaLabel: 80,
  workEyebrow: 120,
  workHeading: 180,
  workCtaLabel: 80,
  servicesEyebrow: 120,
  servicesHeading: 180,
  servicesBody: 800,
  contactEyebrow: 120,
  contactHeading: 180,
  contactCtaLabel: 80,
};

const groups: Array<{
  title: string;
  fields: Array<{ field: Field; label: string; multiline?: boolean; rows?: number; hint?: string }>;
}> = [
  {
    title: "Hero",
    fields: [
      { field: "heroEyebrow", label: "Eyebrow" },
      { field: "heroHeading", label: "Heading", multiline: true, rows: 2, hint: "Use Enter for a deliberate line break." },
      { field: "heroIntro", label: "Introduction", multiline: true, rows: 3 },
      { field: "heroCtaLabel", label: "CTA label" },
    ],
  },
  {
    title: "Introduction",
    fields: [
      { field: "introEyebrow", label: "Eyebrow" },
      { field: "introHeading", label: "Heading", multiline: true, rows: 2, hint: "Use Enter for a deliberate line break." },
      { field: "introBody", label: "Body", multiline: true, rows: 4 },
      { field: "introCtaLabel", label: "CTA label" },
    ],
  },
  {
    title: "Selected Work",
    fields: [
      { field: "workEyebrow", label: "Eyebrow" },
      { field: "workHeading", label: "Heading", multiline: true, rows: 2, hint: "Use Enter for a deliberate line break." },
      { field: "workCtaLabel", label: "CTA label" },
    ],
  },
  {
    title: "Services",
    fields: [
      { field: "servicesEyebrow", label: "Eyebrow" },
      { field: "servicesHeading", label: "Heading", multiline: true, rows: 2, hint: "Use Enter for a deliberate line break." },
      { field: "servicesBody", label: "Body", multiline: true, rows: 4 },
    ],
  },
  {
    title: "Contact CTA",
    fields: [
      { field: "contactEyebrow", label: "Eyebrow" },
      { field: "contactHeading", label: "Heading", multiline: true, rows: 2, hint: "Use Enter for a deliberate line break." },
      { field: "contactCtaLabel", label: "CTA label" },
    ],
  },
];

export function AdminHomepageEditor({ content }: { content: HomepageContentRecord }) {
  const router = useRouter();
  const [values, setValues] = useState(content);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorKind, setErrorKind] = useState<SaveError>("");

  function update(field: Field, value: string) {
    setMessage("");
    setErrorKind("");
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    setMessage("");
    setErrorKind("");
    const payload = {
      heroEyebrow: values.heroEyebrow,
      heroHeading: values.heroHeading,
      heroIntro: values.heroIntro,
      heroCtaLabel: values.heroCtaLabel,
      introEyebrow: values.introEyebrow,
      introHeading: values.introHeading,
      introBody: values.introBody,
      introCtaLabel: values.introCtaLabel,
      workEyebrow: values.workEyebrow,
      workHeading: values.workHeading,
      workCtaLabel: values.workCtaLabel,
      servicesEyebrow: values.servicesEyebrow,
      servicesHeading: values.servicesHeading,
      servicesBody: values.servicesBody,
      contactEyebrow: values.contactEyebrow,
      contactHeading: values.contactHeading,
      contactCtaLabel: values.contactCtaLabel,
      revision: values.revision,
    };

    try {
      const response = await fetch("/api/admin/homepage-content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => null) as {
        error?: string;
        settings?: { revision?: number };
      } | null;

      if (response.ok && typeof body?.settings?.revision === "number") {
        setValues((current) => ({ ...current, revision: body.settings!.revision! }));
        setMessage("Homepage content saved and published.");
        return;
      }
      if (response.status === 409) {
        setErrorKind("conflict");
        setMessage("Homepage content changed in another session. Reload before saving again.");
        return;
      }

      setErrorKind(response.status === 400 ? "validation" : "request");
      setMessage(body?.error ?? "Unable to save homepage content. Please try again.");
    } catch {
      setErrorKind("request");
      setMessage("Unable to save homepage content. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="admin-form admin-homepage-editor" onSubmit={save} noValidate>
      <div className="admin-form__heading">
        <div>
          <p className="admin-eyebrow">Published homepage content</p>
          <h2>Homepage copy</h2>
          <p>CTA destinations, imagery, portfolio cards, journal entries, testimonials, and services remain unchanged.</p>
        </div>
      </div>

      {message ? <p className={errorKind ? "admin-form__error" : "admin-form__success"} role={errorKind ? "alert" : "status"}>{message}</p> : null}

      {groups.map((group) => (
        <fieldset className="admin-form__fieldset" key={group.title}>
          <legend>{group.title}</legend>
          <div className="admin-form__fields">
            {group.fields.map(({ field, label, multiline, rows, hint }) => (
              <label key={field}>
                {label}
                {multiline ? (
                  <textarea rows={rows} maxLength={fieldMaximums[field]} value={values[field]} onChange={(event) => update(field, event.target.value)} />
                ) : (
                  <input maxLength={fieldMaximums[field]} value={values[field]} onChange={(event) => update(field, event.target.value)} />
                )}
                {hint ? <small>{hint}</small> : null}
              </label>
            ))}
          </div>
        </fieldset>
      ))}

      <div className="admin-form__actions">
        <button className="admin-button" type="submit" disabled={saving}>{saving ? "Saving…" : "Save and publish homepage"}</button>
        {errorKind === "conflict" ? <button className="admin-button admin-button--secondary" type="button" onClick={() => router.refresh()}>Reload latest homepage</button> : null}
      </div>
    </form>
  );
}
