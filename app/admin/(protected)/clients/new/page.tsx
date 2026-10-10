
import { AdminPageHeader } from "@/components/admin-shell";
import { AdminClientForm } from "@/components/admin-client-form";

export const metadata = {
  title: "New Client",
};

export default function NewClientPage() {
  return (
    <>
      <AdminPageHeader
        eyebrow="Clients"
        title="Add a new client"
      />

      <AdminClientForm />
    </>
  );
}
