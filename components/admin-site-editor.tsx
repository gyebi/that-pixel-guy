"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { SiteSettingsInput, SiteSettingsRecord } from "@/lib/site-settings/site-settings-types";

type SaveError = "" | "validation" | "conflict" | "request";

const socialFields: Array<{
  field: keyof Pick<SiteSettingsInput, "instagramUrl" | "facebookUrl" | "pinterestUrl" | "tikTokUrl" | "youTubeUrl">;
  label: string;
  hint: string;
}> = [
  { field: "instagramUrl", label: "Instagram URL", hint: "https://instagram.com/..." },
  { field: "facebookUrl", label: "Facebook URL", hint: "https://facebook.com/..." },
  { field: "pinterestUrl", label: "Pinterest URL", hint: "https://pinterest.com/..." },
  { field: "tikTokUrl", label: "TikTok URL", hint: "https://tiktok.com/..." },
  { field: "youTubeUrl", label: "YouTube URL", hint: "https://youtube.com/..." },
];

export function AdminSiteEditor({ settings }: { settings: SiteSettingsRecord }) {
  const router = useRouter();
  const [values, setValues] = useState<SiteSettingsRecord>(settings);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorKind, setErrorKind] = useState<SaveError>("");

  function update<K extends keyof SiteSettingsInput>(field: K, value: SiteSettingsInput[K]) {
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
      businessName: values.businessName,
      publicEmail: values.publicEmail,
      phoneNumber: values.phoneNumber,
      whatsAppNumber: values.whatsAppNumber,
      location: values.location,
      instagramUrl: values.instagramUrl,
      facebookUrl: values.facebookUrl,
      pinterestUrl: values.pinterestUrl,
      tikTokUrl: values.tikTokUrl,
      youTubeUrl: values.youTubeUrl,
      revision: values.revision,
    };

    try {
      const response = await fetch("/api/admin/site-settings", {
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
        setMessage("Settings saved and published.");
        return;
      }

      if (response.status === 409) {
        setErrorKind("conflict");
        setMessage("These settings changed in another session. Reload before saving again.");
        return;
      }

      setErrorKind(response.status === 400 ? "validation" : "request");
      setMessage(body?.error ?? "Unable to save settings. Please try again.");
    } catch {
      setErrorKind("request");
      setMessage("Unable to save settings. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="admin-form" onSubmit={save} noValidate>
      <div className="admin-form__heading">
        <div>
          <p className="admin-eyebrow">Published website settings</p>
          <h2>Business details</h2>
          <p>Changes are published to the website as soon as they are saved.</p>
        </div>
      </div>

      {message ? <p className={errorKind ? "admin-form__error" : "admin-form__success"} role={errorKind ? "alert" : "status"}>{message}</p> : null}

      <div className="admin-form__fields">
        <label>Business name<input required maxLength={120} value={values.businessName} onChange={(event) => update("businessName", event.target.value)} /></label>
        <label>Public email address<input type="email" required maxLength={254} autoComplete="email" value={values.publicEmail} onChange={(event) => update("publicEmail", event.target.value)} /></label>
        <label>Phone number <span className="admin-form__optional">Optional</span><input type="tel" maxLength={32} autoComplete="tel" value={values.phoneNumber ?? ""} onChange={(event) => update("phoneNumber", event.target.value || null)} /></label>
        <label>WhatsApp number <span className="admin-form__optional">Optional</span><input type="tel" maxLength={32} value={values.whatsAppNumber ?? ""} onChange={(event) => update("whatsAppNumber", event.target.value || null)} /></label>
        <label>Location or display address <span className="admin-form__optional">Optional</span><input maxLength={160} autoComplete="street-address" value={values.location ?? ""} onChange={(event) => update("location", event.target.value || null)} /></label>
      </div>

      <fieldset className="admin-form__fieldset">
        <legend>Social profiles</legend>
        <p>Use the full HTTPS address for each profile. Leave a field empty to hide it.</p>
        <div className="admin-form__fields">
          {socialFields.map(({ field, label, hint }) => <label key={field}>{label}<input type="url" inputMode="url" maxLength={2048} placeholder={hint} value={values[field] ?? ""} onChange={(event) => update(field, event.target.value || null)} /></label>)}
        </div>
      </fieldset>

      <div className="admin-form__actions">
        <button className="admin-button" type="submit" disabled={saving}>{saving ? "Saving…" : "Save and publish"}</button>
        {errorKind === "conflict" ? <button className="admin-button admin-button--secondary" type="button" onClick={() => router.refresh()}>Reload latest settings</button> : null}
      </div>
    </form>
  );
}
