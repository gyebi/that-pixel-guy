
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin-shell";
import { AdminShootForm } from "@/components/admin-shoot-form";
import { clientRepository } from "@/lib/repositories/client-repository";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function NewShootPage({ params }: Props) {
  const { id } = await params;

  const client = await clientRepository.getById(id);

  if (!client) {
    notFound();
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Shoots"
        title={`New shoot for ${client.name}`}
      />

      <AdminShootForm clientId={client.id} />
    </>
  );
}

