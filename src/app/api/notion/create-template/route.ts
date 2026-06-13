import { z } from "zod";
import { NextResponse } from "next/server";
import { templateBlueprintSchema } from "@/lib/blueprint-schema";
import { decryptSecret } from "@/lib/encryption";
import { NotionInstallationError } from "@/lib/notion";
import {
  assertRateLimit,
  assertUser,
  getSupabaseAdminClient,
  recordUsage,
} from "@/lib/supabase";
import { installBlueprintIntoNotion } from "@/lib/template-engine";

const installSchema = z.object({
  templateId: z.string().uuid(),
  destinationPageId: z.string().min(8),
});

export async function POST(request: Request) {
  const supabase = getSupabaseAdminClient();
  let templateId = "";
  let userId = "";

  try {
    const user = await assertUser();
    userId = user.id;
    await assertRateLimit(user.id, "install_template", 3, 60);

    const body = installSchema.parse(await request.json());
    templateId = body.templateId;

    const [{ data: template, error: templateError }, { data: connection, error: connectionError }] =
      await Promise.all([
        supabase
          .from("generated_templates")
          .select("id, blueprint")
          .eq("id", body.templateId)
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("notion_connections")
          .select("id, access_token_encrypted")
          .eq("user_id", user.id)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

    if (templateError) throw new Error(templateError.message);
    if (connectionError) throw new Error(connectionError.message);
    if (!template) throw new Error("Generated template not found.");
    if (!connection) throw new Error("Connect Notion before installing.");

    const blueprint = templateBlueprintSchema.parse(template.blueprint);

    const install = await installBlueprintIntoNotion({
      accessToken: decryptSecret(connection.access_token_encrypted),
      destinationPageId: body.destinationPageId,
      blueprint,
    });

    await supabase.from("installation_logs").insert({
      user_id: user.id,
      generated_template_id: body.templateId,
      notion_connection_id: connection.id,
      destination_page_id: body.destinationPageId,
      status: "success",
      logs: install.logs,
      dashboard_page_id: install.dashboardId,
    });

    await supabase
      .from("generated_templates")
      .update({ status: "installed", installed_at: new Date().toISOString() })
      .eq("id", body.templateId)
      .eq("user_id", user.id);

    await recordUsage(user.id, "install_template", { templateId: body.templateId });

    return NextResponse.json({
      dashboardId: install.dashboardId,
      logs: install.logs,
    });
  } catch (error) {
    const logs = error instanceof NotionInstallationError ? error.logs : [];
    if (templateId && userId) {
      await supabase.from("installation_logs").insert({
        user_id: userId,
        generated_template_id: templateId,
        status: logs.length ? "partial" : "failed",
        logs,
        error_message: error instanceof Error ? error.message : "Installation failed.",
      });
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to install template.",
        logs,
      },
      { status: 400 },
    );
  }
}
