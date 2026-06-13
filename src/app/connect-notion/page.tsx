import { redirect } from "next/navigation";
import { DestinationPageSelector } from "@/components/DestinationPageSelector";
import { NotionConnectButton } from "@/components/NotionConnectButton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getCurrentUser, getSupabaseAdminClient } from "@/lib/supabase";

export default async function ConnectNotionPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { template } = await searchParams;
  if (!template) redirect("/dashboard");

  const supabase = getSupabaseAdminClient();
  const { data: connection } = await supabase
    .from("notion_connections")
    .select("id, workspace_name")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <main className="mx-auto grid w-full max-w-4xl gap-6 px-6 py-10">
      <div>
        <h1 className="text-3xl font-semibold">Connect Notion</h1>
        <p className="mt-2 text-muted-foreground">
          Authorize the public Notion integration, then choose the parent page.
        </p>
      </div>
      {connection ? (
        <>
          <Alert>
            <AlertTitle>Connected to {connection.workspace_name ?? "Notion"}</AlertTitle>
            <AlertDescription>Choose a page where the new OS dashboard should be created.</AlertDescription>
          </Alert>
          <DestinationPageSelector templateId={template} />
        </>
      ) : (
        <NotionConnectButton templateId={template} />
      )}
    </main>
  );
}
