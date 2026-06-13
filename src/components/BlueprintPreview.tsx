"use client";

import Link from "next/link";
import { Database, FileText, LayoutDashboard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { TemplateBlueprint } from "@/lib/blueprint-schema";

export function BlueprintPreview({
  blueprint,
  templateId,
}: {
  blueprint: TemplateBlueprint;
  templateId: string;
}) {
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <LayoutDashboard className="size-5" />
              {blueprint.templateName}
            </CardTitle>
            <p className="mt-2 text-sm text-muted-foreground">{blueprint.summary}</p>
          </div>
          <Badge variant="secondary">{blueprint.style}</Badge>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {blueprint.dashboard.sections.map((section) => (
              <div className="rounded-md border p-3 text-sm" key={section}>
                {section}
              </div>
            ))}
          </div>
          <Link
            href={`/connect-notion?template=${templateId}`}
            className={buttonVariants({ className: "w-full sm:w-fit" })}
          >
            Connect Notion
          </Link>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {blueprint.databases.map((database) => (
          <Card key={database.key}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Database className="size-4" />
                {database.name}
              </CardTitle>
              <p className="text-sm text-muted-foreground">{database.description}</p>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="flex flex-wrap gap-2">
                {database.properties.map((property) => (
                  <Badge variant="outline" key={`${database.key}-${property.name}`}>
                    {property.name}
                  </Badge>
                ))}
              </div>
              <Separator />
              <p className="text-xs text-muted-foreground">
                {database.sampleEntries.length} sample entries included
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {blueprint.pages.map((page) => (
          <Card key={page.key}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="size-4" />
                {page.title}
              </CardTitle>
              <p className="text-sm text-muted-foreground">{page.purpose}</p>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
