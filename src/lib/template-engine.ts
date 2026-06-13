import "server-only";
import { createNotionTemplate } from "@/lib/notion";
import type { TemplateBlueprint } from "@/lib/blueprint-schema";

export async function installBlueprintIntoNotion({
  accessToken,
  destinationPageId,
  blueprint,
}: {
  accessToken: string;
  destinationPageId: string;
  blueprint: TemplateBlueprint;
}) {
  return createNotionTemplate({ accessToken, destinationPageId, blueprint });
}
