"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type PageOption = {
  id: string;
  title: string;
  lastEditedTime: string;
};

export function DestinationPageSelector({ templateId }: { templateId: string }) {
  const router = useRouter();
  const [pages, setPages] = useState<PageOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadPages() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/notion/search-pages");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not load pages.");
      setPages(data.pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load pages.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadInitialPages() {
      try {
        const response = await fetch("/api/notion/search-pages");
        const data = await response.json();
        if (cancelled) return;
        if (!response.ok) throw new Error(data.error ?? "Could not load pages.");
        setPages(data.pages);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load pages.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadInitialPages();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Select destination page</CardTitle>
        <Button variant="outline" size="sm" onClick={loadPages}>
          <RefreshCw className="size-4" />
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="grid gap-3">
        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Notion connection issue</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        {loading ? (
          <>
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </>
        ) : null}
        {!loading && pages.length === 0 ? (
          <Alert>
            <AlertTitle>No pages found</AlertTitle>
            <AlertDescription>
              Share a Notion page with the integration, then refresh this list.
            </AlertDescription>
          </Alert>
        ) : null}
        {pages.map((page) => (
          <button
            key={page.id}
            className="flex items-start justify-between gap-4 rounded-md border p-4 text-left transition hover:bg-accent"
            onClick={() => router.push(`/install?template=${templateId}&page=${page.id}`)}
          >
            <span className="flex items-start gap-3">
              <FileText className="mt-0.5 size-4" />
              <span>
                <span className="block font-medium">{page.title}</span>
                <span className="text-xs text-muted-foreground">
                  Last edited {new Date(page.lastEditedTime).toLocaleDateString()}
                </span>
              </span>
            </span>
          </button>
        ))}
      </CardContent>
    </Card>
  );
}
