import Link from "next/link";
import { ArrowRight, Database, LockKeyhole, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background">
      <section className="mx-auto grid min-h-[92vh] w-full max-w-6xl content-center gap-10 px-6 py-12">
        <div className="max-w-3xl">
          <Badge className="mb-5" variant="secondary">
            Notion OS Generator
          </Badge>
          <h1 className="text-4xl font-semibold tracking-normal text-foreground sm:text-6xl">
            Generate and install a complete Notion workspace from one questionnaire.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            Turn business context into a validated JSON blueprint, preview it, connect Notion
            through public OAuth, and build the workspace directly under a selected page.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/login" className={buttonVariants({ size: "lg" })}>
                Start generating
                <ArrowRight className="size-4" />
            </Link>
            <Link href="/dashboard" className={buttonVariants({ variant: "outline", size: "lg" })}>
              Open dashboard
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              icon: Sparkles,
              title: "JSON only AI",
              body: "OpenAI returns a structured blueprint that is validated before anything touches Notion.",
            },
            {
              icon: LockKeyhole,
              title: "Server-side OAuth",
              body: "Notion tokens are encrypted at rest and never shipped to browser code.",
            },
            {
              icon: Database,
              title: "Template engine",
              body: "The backend converts approved blueprints into pages, databases, blocks, and sample data.",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.title}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Icon className="size-4" />
                    {item.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">{item.body}</CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </main>
  );
}
