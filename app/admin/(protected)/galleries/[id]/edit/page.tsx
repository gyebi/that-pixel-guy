import { notFound } from "next/navigation";
import { AdminGalleryEditForm } from "@/components/admin-gallery-edit-form";
import { AdminPageHeader } from "@/components/admin-shell";
import { isGalleryStatus } from "@/lib/galleries/gallery-settings";
import { galleryRepository } from "@/lib/repositories/gallery-repository";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditGalleryPage({ params }: Props) {
  const { id } = await params;
  const gallery = await galleryRepository.getById(id);

  if (!gallery) notFound();
  if (!isGalleryStatus(gallery.status)) notFound();

  return (
    <>
      <AdminPageHeader eyebrow="Private gallery" title={`Edit ${gallery.name}`} />
      <AdminGalleryEditForm
        gallery={{
          id: gallery.id,
          name: gallery.name,
          status: gallery.status,
          expiresOn: gallery.expiresOn?.toISOString().slice(0, 10) ?? "",
          downloadsEnabled: gallery.downloadsEnabled,
        }}
      />
    </>
  );
}
