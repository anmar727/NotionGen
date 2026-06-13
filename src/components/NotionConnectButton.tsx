"use client";

import Link from "next/link";
import { PlugZap } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export function NotionConnectButton({ templateId }: { templateId: string }) {
  return (
    <Link
      href={`/api/notion/oauth/start?template=${templateId}`}
      className={buttonVariants()}
    >
      <PlugZap className="size-4" />
      Connect Notion workspace
    </Link>
  );
}
