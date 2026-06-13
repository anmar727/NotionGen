import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Blocks, CheckCircle2, PlugZap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser, getSupabaseAdminClient } from "@/lib/supabase";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = getSupabaseAdminClient();
  const [{ data: templates }, { data: connection }] = await Promise.all([
    supabase
      .from("generated_templates")
      .select("id, template_name, status, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("notion_connections")
      .select("workspace_name, created_at")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-10">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <Badge variant="secondary">Dashboard</Badge>
          <h1 className="mt-3 text-3xl font-semibold">Workspace generators</h1>
          <p className="mt-2 text-muted-foreground">
            Start with Business OS Generator, then install the approved blueprint into Notion.
          </p>
        </div>
        <Link href="/generator" className={buttonVariants()}>
          Business OS Generator
          <ArrowRight className="size-4" />
        </Link>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Blocks className="size-4" />
              Business OS
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            CRM, projects, tasks, SOPs, content, finance, team wiki, and samples.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <PlugZap className="size-4" />
              Notion connection
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {connection?.workspace_name ?? "No active workspace connected yet."}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="size-4" />
              Recent templates
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {templates?.length ?? 0} blueprint records in this account.
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent blueprints</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {templates?.length ? (
            templates.map((template) => (
              <Link
                href={`/blueprint?template=${template.id}`}
                key={template.id}
                className="flex items-center justify-between rounded-md border p-4 transition hover:bg-accent"
              >
                <span>{template.template_name}</span>
                <Badge variant="outline">{template.status}</Badge>
              </Link>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No blueprints generated yet.</p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
