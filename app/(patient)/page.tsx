import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("profile_completed_at")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.profile_completed_at) redirect("/onboarding");
  redirect("/book");
}
