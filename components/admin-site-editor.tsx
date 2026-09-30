"use client";

import { useState } from "react";
import type { DemoSiteContent } from "@/lib/domain";

export function AdminSiteEditor({ initialContent }: { initialContent: DemoSiteContent }) {
  const [content, setContent] = useState(initialContent);
  const [saved, setSaved] = useState(false);
  const update = (field: keyof DemoSiteContent, value: string) => { setSaved(false); setContent((current) => ({ ...current, [field]: value })); };
  return <div className="site-editor"><section className="editor-preview"><p className="admin-eyebrow">Live homepage preview</p><div className="editor-preview__hero"><p>Accra · Ghana · Available worldwide</p><h2>{content.heroHeading}</h2><span>{content.heroSubheading}</span><b>{content.primaryCta} →</b></div></section><form className="editor-form" onSubmit={(event) => { event.preventDefault(); setSaved(true); }}><div className="editor-form__heading"><div><p className="admin-eyebrow">Homepage hero</p><h2>Make it yours.</h2></div>{saved && <span className="editor-saved">Saved for this demo</span>}</div><label>Hero heading<input value={content.heroHeading} onChange={(event) => update("heroHeading", event.target.value)} /></label><label>Hero subheading<textarea rows={3} value={content.heroSubheading} onChange={(event) => update("heroSubheading", event.target.value)} /></label><label>Primary button label<input value={content.primaryCta} onChange={(event) => update("primaryCta", event.target.value)} /></label><fieldset><legend>Business contact</legend><label>Email address<input type="email" value={content.contactEmail} onChange={(event) => update("contactEmail", event.target.value)} /></label><label>WhatsApp number<input value={content.whatsappNumber} onChange={(event) => update("whatsappNumber", event.target.value)} /></label></fieldset><button type="submit">Save changes</button><p>Changes are held in the current demo session. Production persistence is intentionally deferred.</p></form></div>;
}
