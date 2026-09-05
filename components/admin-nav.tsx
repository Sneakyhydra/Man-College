import Link from "next/link";
import { AdminLogoutButton } from "@/components/admin-logout-button";

export function AdminNav() {
  return (
    <header className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
      <nav className="flex flex-wrap gap-4 text-sm font-medium">
        <Link href="/admin" className="hover:text-accent">
          Roster
        </Link>
        <Link href="/admin/slots" className="hover:text-accent">
          Slots & settings
        </Link>
        <Link href="/admin/patients" className="hover:text-accent">
          Patients
        </Link>
      </nav>
      <AdminLogoutButton />
    </header>
  );
}
