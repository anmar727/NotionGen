import { redirect } from "next/navigation";
import { InstallProgress } from "@/components/InstallProgress";
import { getCurrentUser } from "@/lib/supabase";

export default async function InstallPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string; page?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { template, page } = await searchParams;
  if (!template || !page) redirect("/dashboard");

  return (
    <main className="mx-auto grid w-full max-w-3xl gap-6 px-6 py-10">
      <div>
        <h1 className="text-3xl font-semibold">Installation progress</h1>
        <p className="mt-2 text-muted-foreground">
          The backend is creating pages, databases, blocks, and sample entries in Notion.
        </p>
      </div>
      <InstallProgress templateId={template} destinationPageId={page} />
    </main>
  );
}
