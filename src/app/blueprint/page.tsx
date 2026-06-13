import { redirect } from "next/navigation";
import { BlueprintPreview } from "@/components/BlueprintPreview";
import { getCurrentUser, getSupabaseAdminClient } from "@/lib/supabase";
import { templateBlueprintSchema } from "@/lib/blueprint-schema";

export default async function BlueprintPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { template } = await searchParams;
  if (!template) redirect("/dashboard");

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("generated_templates")
    .select("id, blueprint")
    .eq("id", template)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) redirect("/dashboard");

  const blueprint = templateBlueprintSchema.parse(data.blueprint);

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-6 px-6 py-10">
      <div>
        <h1 className="text-3xl font-semibold">Blueprint preview</h1>
        <p className="mt-2 text-muted-foreground">
          Review the validated structure before connecting Notion.
        </p>
      </div>
      <BlueprintPreview blueprint={blueprint} templateId={data.id} />
    </main>
  );
}
