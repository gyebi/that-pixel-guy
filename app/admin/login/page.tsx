import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin-login-form";
import { getAdminSession } from "@/lib/auth/require-admin";
import Image from "next/image";

export default async function AdminLoginPage() {
  const admin = await getAdminSession();

  if (admin) {
    redirect("/admin");
  }

  return (
    <main className="studio-login">
      <div className="studio-login__glow" aria-hidden="true" />

      <div className="studio-login__container">
      <div className="studio-login__brand">
        <Image
          src="/icon.png"
          alt="The Pixel Guy logo"
          width={52}
          height={52}
          className="studio-login__brand-logo"
          priority
        />
        <span>THE PIXEL GUY</span>
      </div>

      <AdminLoginForm />

      <p className="studio-login__footer">
        © {new Date().getFullYear()} The Pixel Guy.
        All rights reserved.
      </p>
    </div>
  </main>
  );
}