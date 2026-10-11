import { redirect } from "next/navigation";
import { listContracts } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function GlobalDashboardPage() {
  const contractsList = await listContracts();

  if (contractsList.length > 0) {
    redirect(`/contracts/${contractsList[0].id}/dashboard`);
  }

  // If no contracts exist yet, redirect to home with prompt
  redirect("/");
}
