import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminSlotsClient } from "@/components/admin-slots-client";
import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionToken,
} from "@/lib/admin-auth";

export default async function AdminSlotsPage() {
  const cookieStore = await cookies();
  if (!verifyAdminSessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value)) {
    redirect("/admin/login");
  }
  return <AdminSlotsClient />;
}
