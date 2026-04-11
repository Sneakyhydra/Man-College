"use client";

export function AdminLogoutButton() {
  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-background"
    >
      Logout
    </button>
  );
}
