"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type Log = {
  step: string;
  status: "success" | "error";
  message: string;
};

export function InstallProgress({
  templateId,
  destinationPageId,
}: {
  templateId: string;
  destinationPageId: string;
}) {
  const [status, setStatus] = useState<"installing" | "success" | "error">("installing");
  const [logs, setLogs] = useState<Log[]>([]);
  const [dashboardId, setDashboardId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function install() {
      try {
        const response = await fetch("/api/notion/create-template", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ templateId, destinationPageId }),
        });
        const data = await response.json();
        if (cancelled) return;
        setLogs(data.logs ?? []);
        if (!response.ok) throw new Error(data.error ?? "Installation failed.");
        setDashboardId(data.dashboardId);
        setStatus("success");
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Installation failed.");
        setStatus("error");
      }
    }

    install();
    return () => {
      cancelled = true;
    };
  }, [templateId, destinationPageId]);

  const progress =
    status === "success" ? 100 : status === "error" ? 100 : Math.min(90, 20 + logs.length * 8);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {status === "installing" ? <Loader2 className="size-5 animate-spin" /> : null}
          {status === "success" ? <CheckCircle2 className="size-5 text-emerald-500" /> : null}
          {status === "error" ? <XCircle className="size-5 text-destructive" /> : null}
          Installing into Notion
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-5">
        <Progress value={progress} />
        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Installation stopped</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <div className="grid gap-2">
          {logs.map((log, index) => (
            <div className="flex items-start gap-3 rounded-md border p-3 text-sm" key={`${log.step}-${index}`}>
              {log.status === "success" ? (
                <CheckCircle2 className="mt-0.5 size-4 text-emerald-500" />
              ) : (
                <XCircle className="mt-0.5 size-4 text-destructive" />
              )}
              <div>
                <p className="font-medium">{log.step}</p>
                <p className="text-muted-foreground">{log.message}</p>
              </div>
            </div>
          ))}
        </div>
        {status === "success" ? (
          <Link
            href={`/success?dashboard=${dashboardId}`}
            className={buttonVariants({ className: "w-full sm:w-fit" })}
          >
            View success page
          </Link>
        ) : null}
      </CardContent>
    </Card>
  );
}
