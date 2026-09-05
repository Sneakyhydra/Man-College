import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminPatientsClient } from "@/components/admin-patients-client";
import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionToken,
} from "@/lib/admin-auth";

type Props = { searchParams?: Promise<{ q?: string }> };

export default async function AdminPatientsPage({ searchParams }: Props) {
  const cookieStore = await cookies();
  if (!verifyAdminSessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value)) {
    redirect("/admin/login");
  }
  const params = (await searchParams) ?? {};
  return <AdminPatientsClient initialQuery={params.q ?? ""} />;
}
