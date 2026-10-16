import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
export const instant = false;
export default async function AdminPage() {
  await requireAdmin();
  redirect("/admin/members");
}
