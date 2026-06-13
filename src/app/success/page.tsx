import Link from "next/link";
import { CheckCircle2, ExternalLink } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ dashboard?: string }>;
}) {
  const { dashboard } = await searchParams;
  const notionUrl = dashboard ? `https://www.notion.so/${dashboard.replaceAll("-", "")}` : "";

  return (
    <main className="grid min-h-screen place-items-center px-6 py-12">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="size-5 text-emerald-500" />
            Notion OS installed
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm text-muted-foreground">
          <p>Your generated workspace has been created under the selected Notion page.</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            {notionUrl ? (
              <Link href={notionUrl} target="_blank" className={buttonVariants()}>
                Open in Notion
                <ExternalLink className="size-4" />
              </Link>
            ) : null}
            <Link href="/dashboard" className={buttonVariants({ variant: "outline" })}>
              Back to dashboard
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
