import { NextResponse } from "next/server";
import { generateTemplateBlueprint } from "@/lib/openai";
import {
  assertRateLimit,
  assertUser,
  getSupabaseAdminClient,
  recordUsage,
} from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const user = await assertUser();
    await assertRateLimit(user.id, "generate_template", 5, 60);

    const body = await request.json();
    const blueprint = await generateTemplateBlueprint(body);
    const supabase = getSupabaseAdminClient();

    await supabase.from("users").upsert({
      id: user.id,
      email: user.email,
    });

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert({
        user_id: user.id,
        name: blueprint.templateName,
        type: "business_os",
        questionnaire: body,
      })
      .select("id")
      .single();

    if (projectError) throw new Error(projectError.message);

    const { data: template, error: templateError } = await supabase
      .from("generated_templates")
      .insert({
        user_id: user.id,
        project_id: project.id,
        template_name: blueprint.templateName,
        blueprint,
        status: "generated",
      })
      .select("id")
      .single();

    if (templateError) throw new Error(templateError.message);

    await recordUsage(user.id, "generate_template", { templateId: template.id });

    return NextResponse.json({ templateId: template.id, blueprint });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate template." },
      { status: 400 },
    );
  }
}
