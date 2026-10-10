
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin-shell";
import { AdminGalleryForm } from "@/components/admin-gallery-form";
import { shootRepository } from "@/lib/repositories/shoot-repository";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function NewGalleryPage({ params }: Props) {
  const { id } = await params;

  const shoot = await shootRepository.getById(id);

  if (!shoot) {
    notFound();
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Galleries"
        title={`New gallery for ${shoot.name}`}
      />

      <AdminGalleryForm
        shootId={shoot.id}
        clientId={shoot.clientId}
      />
    </>
  );
}


