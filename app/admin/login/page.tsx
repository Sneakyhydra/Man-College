import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { AdminLoginForm } from "@/components/admin-login-form";
import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionToken,
} from "@/lib/admin-auth";

export default async function AdminLoginPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (verifyAdminSessionToken(token)) {
    redirect("/admin");
  }

  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.15em] text-accent">Admin</p>
        <h1 className="font-serif-display mt-2 text-3xl font-semibold text-foreground">
          Sign in
        </h1>
        <p className="mt-2 text-sm text-muted">
          Use your admin credentials to access patient queue operations.
        </p>
        <AdminLoginForm />
      </div>
    </div>
  );
}
