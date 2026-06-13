import { redirect } from "next/navigation";
import { QuestionnaireForm } from "@/components/QuestionnaireForm";
import { getCurrentUser } from "@/lib/supabase";

export default async function GeneratorPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <main className="mx-auto grid w-full max-w-4xl gap-6 px-6 py-10">
      <div>
        <h1 className="text-3xl font-semibold">Business OS Generator</h1>
        <p className="mt-2 text-muted-foreground">
          The AI creates JSON only. The backend validates it before preview or installation.
        </p>
      </div>
      <QuestionnaireForm />
    </main>
  );
}
