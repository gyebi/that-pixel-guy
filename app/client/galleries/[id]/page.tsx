import { notFound } from "next/navigation";
import { requireDemoClient } from "@/lib/demo-auth";
import { demoRepository } from "@/lib/demo-repository";

type Props = { params: Promise<{ id: string }> };

export default async function ClientGalleryPage({ params }: Props) {
  const [client, { id }] = await Promise.all([requireDemoClient(), params]);
  const gallery = (await demoRepository.getGalleries()).find((item) => item.id === id);
  if (!gallery) notFound();
  if (gallery.clientId !== client.id) return <section className="client-denied"><p className="client-kicker">Private gallery</p><h1>This gallery isn&apos;t yours.</h1><p>For your privacy, you can only view galleries assigned to your current demo session.</p></section>;
  return <section className="client-gallery"><header><p className="client-kicker">Private gallery · {gallery.photoCount} photographs</p><h1>{gallery.name}</h1><p>Downloads {gallery.downloadsEnabled ? "are enabled" : "are not available"} for this gallery. Your full image selection will appear here after the approved Pixel Guy asset export is imported.</p></header><div className="client-gallery-placeholder" style={{ backgroundImage: `linear-gradient(rgba(22, 27, 23, .16), rgba(22, 27, 23, .46)), url(${gallery.coverImage})` }}><div><span>Gallery access verified</span><strong>Authorized images pending import</strong><p>No stock images have been added to this private gallery.</p></div></div></section>;
}
